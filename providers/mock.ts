// src/providers/mock.ts
// Used automatically when PROVIDER env var is not set.
// Returns realistic-looking hardcoded data so you can build
// and test UI without any API key.

import type { FootballProvider, Match, PlayerStats, Standing, Team } from "./index";

const TEAMS: Team[] = [
  { id: "1",  name: "Sporting CP",        shortName: "Sporting",  logoUrl: "" },
  { id: "2",  name: "SL Benfica",          shortName: "Benfica",   logoUrl: "" },
  { id: "3",  name: "FC Porto",            shortName: "Porto",     logoUrl: "" },
  { id: "4",  name: "SC Braga",            shortName: "Braga",     logoUrl: "" },
  { id: "5",  name: "Vitória SC",          shortName: "Vitória",   logoUrl: "" },
  { id: "6",  name: "Casa Pia AC",         shortName: "Casa Pia",  logoUrl: "" },
];

const MATCHES: Match[] = [
  { id: "m1", homeTeam: TEAMS[0], awayTeam: TEAMS[1], homeScore: 2, awayScore: 1, status: "finished", minute: null,  date: "2025-04-12T20:00:00Z", leagueId: "94" },
  { id: "m2", homeTeam: TEAMS[2], awayTeam: TEAMS[3], homeScore: 1, awayScore: 1, status: "finished", minute: null,  date: "2025-04-13T17:30:00Z", leagueId: "94" },
  { id: "m3", homeTeam: TEAMS[1], awayTeam: TEAMS[2], homeScore: 0, awayScore: 1, status: "live",     minute: 67,    date: "2025-04-19T20:00:00Z", leagueId: "94" },
  { id: "m4", homeTeam: TEAMS[0], awayTeam: TEAMS[4], homeScore: null, awayScore: null, status: "scheduled", minute: null, date: "2025-04-26T20:00:00Z", leagueId: "94" },
  { id: "m5", homeTeam: TEAMS[3], awayTeam: TEAMS[5], homeScore: null, awayScore: null, status: "scheduled", minute: null, date: "2025-04-27T17:30:00Z", leagueId: "94" },
];

const STANDINGS: Standing[] = TEAMS.map((team, i) => ({
  rank:         i + 1,
  team,
  played:       30 - i,
  won:          18 - i * 2,
  drawn:        5,
  lost:         7 + i * 2,
  goalsFor:     55 - i * 5,
  goalsAgainst: 22 + i * 4,
  points:       59 - i * 7,
}));

export class MockProvider implements FootballProvider {
  async getFixtures(_leagueId: string, _season: string): Promise<Match[]> {
    return MATCHES;
  }

  async getLiveMatches(_leagueId: string): Promise<Match[]> {
    return MATCHES.filter((m) => m.status === "live");
  }

  async getMatchById(matchId: string): Promise<Match | null> {
    return MATCHES.find((m) => m.id === matchId) ?? null;
  }

  async getPlayerStats(playerId: string, season: string): Promise<PlayerStats | null> {
    return {
      playerId,
      season,
      appearances:   28,
      goals:         14,
      assists:        9,
      minutesPlayed: 2430,
      yellowCards:    3,
      redCards:       0,
      passAccuracy:  84.2,
      xG:            12.7,
    };
  }

  async getStandings(_leagueId: string, _season: string): Promise<Standing[]> {
    return STANDINGS;
  }
}