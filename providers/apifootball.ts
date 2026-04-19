// src/providers/apifootball.ts
import type {
  FootballProvider, Match, Player,
  PlayerStats, Standing, Team,
} from "./index";

const BASE_URL = "https://v3.football.api-sports.io";

// api-football returns deeply nested objects — these types
// represent only the fields we actually use
interface RawFixture {
  fixture: { id: number; status: { short: string; elapsed: number | null }; date: string };
  teams:   { home: RawTeam; away: RawTeam };
  goals:   { home: number | null; away: number | null };
  league:  { id: number };
}

interface RawTeam {
  id: number;
  name: string;
  logo: string;
}

interface RawStanding {
  rank: number;
  team: RawTeam;
  all:  { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  points: number;
}

interface RawPlayerStat {
  player: { id: number; name: string; photo: string; nationality: string };
  statistics: Array<{
    team:     { id: number };
    games:    { appearences: number; minutes: number; position: string };
    goals:    { total: number; assists: number };
    cards:    { yellow: number; red: number };
    passes:   { accuracy: number | null };
  }>;
}

function normalizeStatus(short: string): Match["status"] {
  if (["NS", "TBD", "PST"].includes(short)) return "scheduled";
  if (["FT", "AET", "PEN", "AWD", "WO"].includes(short)) return "finished";
  return "live";
}

function normalizeTeam(raw: RawTeam): Team {
  return {
    id:        String(raw.id),
    name:      raw.name,
    shortName: raw.name.split(" ").pop() ?? raw.name, // naive fallback
    logoUrl:   raw.logo,
  };
}

export class APIFootballProvider implements FootballProvider {
  private readonly headers: Record<string, string>;

  constructor() {
    const key = process.env.API_FOOTBALL_KEY;
    if (!key) throw new Error("Missing env var: API_FOOTBALL_KEY");

    this.headers = {
      "x-rapidapi-host": "v3.football.api-sports.io",
      "x-rapidapi-key":  key,
    };
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) throw new Error(`API-Football error ${res.status}: ${path}`);

    const json = await res.json();

    // api-football wraps everything in { response: [...] }
    return json.response as T;
  }

  async getFixtures(leagueId: string, season: string): Promise<Match[]> {
    const raw = await this.get<RawFixture[]>("/fixtures", { league: leagueId, season });

    return raw.map((f) => ({
      id:        String(f.fixture.id),
      homeTeam:  normalizeTeam(f.teams.home),
      awayTeam:  normalizeTeam(f.teams.away),
      homeScore: f.goals.home,
      awayScore: f.goals.away,
      status:    normalizeStatus(f.fixture.status.short),
      minute:    f.fixture.status.elapsed,
      date:      f.fixture.date,
      leagueId:  String(f.league.id),
    }));
  }

  async getLiveMatches(leagueId: string): Promise<Match[]> {
    const raw = await this.get<RawFixture[]>("/fixtures", {
      league: leagueId,
      live:   "all",
    });

    return raw.map((f) => ({
      id:        String(f.fixture.id),
      homeTeam:  normalizeTeam(f.teams.home),
      awayTeam:  normalizeTeam(f.teams.away),
      homeScore: f.goals.home,
      awayScore: f.goals.away,
      status:    "live" as const,
      minute:    f.fixture.status.elapsed,
      date:      f.fixture.date,
      leagueId:  String(f.league.id),
    }));
  }

  async getMatchById(matchId: string): Promise<Match | null> {
    const raw = await this.get<RawFixture[]>("/fixtures", { id: matchId });
    if (!raw.length) return null;
    const f = raw[0];

    return {
      id:        String(f.fixture.id),
      homeTeam:  normalizeTeam(f.teams.home),
      awayTeam:  normalizeTeam(f.teams.away),
      homeScore: f.goals.home,
      awayScore: f.goals.away,
      status:    normalizeStatus(f.fixture.status.short),
      minute:    f.fixture.status.elapsed,
      date:      f.fixture.date,
      leagueId:  String(f.league.id),
    };
  }

  async getPlayerStats(playerId: string, season: string): Promise<PlayerStats | null> {
    const raw = await this.get<RawPlayerStat[]>("/players", {
      id: playerId,
      season,
    });

    if (!raw.length) return null;
    const s = raw[0].statistics[0]; // first club's stats for that season

    return {
      playerId:       playerId,
      season,
      appearances:    s.games.appearences,
      goals:          s.goals.total,
      assists:        s.goals.assists,
      minutesPlayed:  s.games.minutes,
      yellowCards:    s.cards.yellow,
      redCards:       s.cards.red,
      passAccuracy:   s.passes.accuracy,
      xG:             null, // api-football free tier doesn't include xG
    };
  }

  async getStandings(leagueId: string, season: string): Promise<Standing[]> {
    // Response shape: [ [ [ {rank, team, all, points} ] ] ]
    const raw = await this.get<Array<Array<Array<RawStanding>>>>("/standings", {
      league: leagueId,
      season,
    });

    const table = raw[0]?.[0] ?? [];

    return table.map((s) => ({
      rank:          s.rank,
      team:          normalizeTeam(s.team),
      played:        s.all.played,
      won:           s.all.win,
      drawn:         s.all.draw,
      lost:          s.all.lose,
      goalsFor:      s.all.goals.for,
      goalsAgainst:  s.all.goals.against,
      points:        s.points,
    }));
  }
}