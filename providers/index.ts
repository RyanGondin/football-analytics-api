// src/providers/index.ts

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

// The contract every provider adapter must satisfy
export interface FootballProvider {
  getFixtures(leagueId: string, season: string): Promise<Match[]>;
  getLiveMatches(leagueId: string): Promise<Match[]>;
  getMatchById(matchId: string): Promise<Match | null>;
  getPlayerStats(playerId: string, season: string): Promise<PlayerStats | null>;
  getStandings(leagueId: string, season: string): Promise<Standing[]>;
}

// Factory — set PROVIDER env var to switch adapters
export async function createProvider(): Promise<FootballProvider> {
  const name = process.env.PROVIDER ?? "mock";

  if (name === "apifootball") {
    const { APIFootballProvider } = await import("./apifootball");
    return new APIFootballProvider();
  }
  if (name === "footballdata") {
    const { FootballDataProvider } = await import("./footballdata");
    return new FootballDataProvider();
  }

  // Default: mock provider for local dev (no API key needed)
  const { MockProvider } = await import("./mock");
  return new MockProvider();
}