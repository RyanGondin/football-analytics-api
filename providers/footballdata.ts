// src/providers/footballdata.ts
import type {
  FootballProvider, Match, PlayerStats, Standing, Team,
} from "./index";

const BASE_URL = "https://api.football-data.org/v4";

// football-data.org raw shapes (only fields we use)
interface RawMatch {
  id:           number;
  utcDate:      string;
  status:       string;
  minute?:      number;
  competition:  { id: number };
  homeTeam:     { id: number; name: string; shortName: string; crest: string };
  awayTeam:     { id: number; name: string; shortName: string; crest: string };
  score:        { fullTime: { home: number | null; away: number | null } };
}

interface RawStanding {
  position:     number;
  team:         { id: number; name: string; shortName: string; crest: string };
  playedGames:  number;
  won:          number;
  draw:         number;
  lost:         number;
  goalsFor:     number;
  goalsAgainst: number;
  points:       number;
}

function normalizeStatus(s: string): Match["status"] {
  if (s === "SCHEDULED" || s === "TIMED" || s === "POSTPONED") return "scheduled";
  if (s === "FINISHED" || s === "AWARDED")                       return "finished";
  return "live";
}

function normalizeTeam(raw: RawMatch["homeTeam"]): Team {
  return {
    id:        String(raw.id),
    name:      raw.name,
    shortName: raw.shortName,
    logoUrl:   raw.crest,
  };
}

export class FootballDataProvider implements FootballProvider {
  private readonly headers: Record<string, string>;

  constructor() {
    const key = process.env.FOOTBALL_DATA_KEY;
    if (!key) throw new Error("Missing env var: FOOTBALL_DATA_KEY");
    this.headers = { "X-Auth-Token": key };
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) throw new Error(`football-data.org error ${res.status}: ${path}`);

    return res.json() as Promise<T>;
  }

  async getFixtures(leagueId: string, season: string): Promise<Match[]> {
    const data = await this.get<{ matches: RawMatch[] }>(
      `/competitions/${leagueId}/matches`,
      { season }
    );

    return data.matches.map((m) => ({
      id:        String(m.id),
      homeTeam:  normalizeTeam(m.homeTeam),
      awayTeam:  normalizeTeam(m.awayTeam),
      homeScore: m.score.fullTime.home,
      awayScore: m.score.fullTime.away,
      status:    normalizeStatus(m.status),
      minute:    m.minute ?? null,
      date:      m.utcDate,
      leagueId:  String(m.competition.id),
    }));
  }

  async getLiveMatches(leagueId: string): Promise<Match[]> {
    const data = await this.get<{ matches: RawMatch[] }>(
      `/competitions/${leagueId}/matches`,
      { status: "IN_PLAY,PAUSED" }
    );

    return data.matches.map((m) => ({
      id:        String(m.id),
      homeTeam:  normalizeTeam(m.homeTeam),
      awayTeam:  normalizeTeam(m.awayTeam),
      homeScore: m.score.fullTime.home,
      awayScore: m.score.fullTime.away,
      status:    "live" as const,
      minute:    m.minute ?? null,
      date:      m.utcDate,
      leagueId:  String(m.competition.id),
    }));
  }

  async getMatchById(matchId: string): Promise<Match | null> {
    try {
      const m = await this.get<RawMatch>(`/matches/${matchId}`);
      return {
        id:        String(m.id),
        homeTeam:  normalizeTeam(m.homeTeam),
        awayTeam:  normalizeTeam(m.awayTeam),
        homeScore: m.score.fullTime.home,
        awayScore: m.score.fullTime.away,
        status:    normalizeStatus(m.status),
        minute:    m.minute ?? null,
        date:      m.utcDate,
        leagueId:  String(m.competition.id),
      };
    } catch {
      return null;
    }
  }

  async getPlayerStats(_playerId: string, _season: string): Promise<PlayerStats | null> {
    // football-data.org free tier does not expose player stats.
    // Swap to APIFootballProvider or a paid plan for this feature.
    console.warn("FootballDataProvider: getPlayerStats() is not available on the free tier.");
    return null;
  }

  async getStandings(leagueId: string, season: string): Promise<Standing[]> {
    const data = await this.get<{
      standings: Array<{ table: RawStanding[] }>;
    }>(`/competitions/${leagueId}/standings`, { season });

    const table = data.standings[0]?.table ?? [];

    return table.map((s) => ({
      rank:          s.position,
      team: {
        id:        String(s.team.id),
        name:      s.team.name,
        shortName: s.team.shortName,
        logoUrl:   s.team.crest,
      },
      played:        s.playedGames,
      won:           s.won,
      drawn:         s.draw,
      lost:          s.lost,
      goalsFor:      s.goalsFor,
      goalsAgainst:  s.goalsAgainst,
      points:        s.points,
    }));
  }
}