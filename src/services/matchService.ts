// src/services/matchService.ts
import { createProvider } from "../providers/index.js";
import type { FootballProvider, Match } from "../providers/index.js";

export class MatchesService {
  private provider: FootballProvider | null = null;
  private fixturesCache = new Map<string, { data: Match[]; expiresAt: number }>();
  private liveCache = new Map<string, { data: Match[]; expiresAt: number }>();

  private readonly FIXTURES_TTL = 5 * 60 * 1000;  // 5 minutes
  private readonly LIVE_TTL     = 60 * 1000;        // 60 seconds

  private async getProvider(): Promise<FootballProvider> {
    if (!this.provider) this.provider = await createProvider();
    return this.provider;
  }

  private isFresh<T>(entry: { data: T; expiresAt: number } | undefined): entry is { data: T; expiresAt: number } {
    return !!entry && Date.now() < entry.expiresAt;
  }

  async getFixtures(leagueId: string, season: string): Promise<Match[]> {
    const key = `${leagueId}:${season}`;
    const cached = this.fixturesCache.get(key);
    if (this.isFresh(cached)) return cached.data;

    const provider = await this.getProvider();
    const matches = await provider.getFixtures(leagueId, season);
    this.fixturesCache.set(key, { data: matches, expiresAt: Date.now() + this.FIXTURES_TTL });
    return matches;
  }

  async getLiveMatches(leagueId: string): Promise<Match[]> {
    const cached = this.liveCache.get(leagueId);
    if (this.isFresh(cached)) return cached.data;

    const provider = await this.getProvider();
    const matches = await provider.getLiveMatches(leagueId);
    this.liveCache.set(leagueId, { data: matches, expiresAt: Date.now() + this.LIVE_TTL });
    return matches;
  }

  async getMatchById(matchId: string): Promise<Match | null> {
    const provider = await this.getProvider();
    return provider.getMatchById(matchId);
  }
}

export const matchesService = new MatchesService();