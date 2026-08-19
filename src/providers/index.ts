

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "finished";
  minute: number | null;
  date: string;
  leagueId: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  nationality: string;
  teamId: string;
  photoUrl: string;
}

export interface PlayerStats {
  playerId: string;
  season: string;
  appearances: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
  yellowCards: number;
  redCards: number;
  passAccuracy: number | null;
  xG: number | null;
}

export interface Standing {
  rank: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface FootballProvider {
  getFixtures(leagueId: string, season: string): Promise<Match[]>;
  getLiveMatches(leagueId: string): Promise<Match[]>;
  getMatchById(matchId: string): Promise<Match | null>;
  getPlayerStats(playerId: string, season: string): Promise<PlayerStats | null>;
  getStandings(leagueId: string, season: string): Promise<Standing[]>;
}

export async function createProvider(): Promise<FootballProvider> {
  const name = process.env["PROVIDER"] ?? "mock";

  if (name === "apifootball") {
    const { APIFootballProvider } = await import("./apifootball.js");
    return new APIFootballProvider();
  }
  if (name === "footballdata") {
    const { FootballDataProvider } = await import("./footballdata.js");
    return new FootballDataProvider();
  }

  const { MockProvider } = await import("./mock.js");
  return new MockProvider();
}