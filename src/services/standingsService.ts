import { createProvider } from "../providers/index.js";
import type { Standing, FootballProvider } from "../providers/index.js";

export class StandingsService {
  private provider: FootballProvider | null = null;
  private cache = new Map<string, { data: Standing[]; expiresAt: number }>();

  private readonly STANDINGS_TTL = 10 * 60 * 1000; // 10 minutes

  private async getProvider(): Promise<FootballProvider> {
    if (!this.provider) this.provider = await createProvider();
    return this.provider;
  }

  async getStandings(leagueId: string, season: string): Promise<Standing[]> {
    const key = `${leagueId}:${season}`;
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiresAt) return entry.data;

    const provider = await this.getProvider();
    const standings = await provider.getStandings(leagueId, season);
    this.cache.set(key, {
      data: standings,
      expiresAt: Date.now() + this.STANDINGS_TTL,
    });
    return standings;
  }

  getTeamRank(standings: Standing[], teamId: string): Standing | null {
    return standings.find((s) => s.team.id === teamId) ?? null;
  }

  getTopN(standings: Standing[], n: number): Standing[] {
    return standings.slice(0, n);
  }

  getRelegationZone(standings: Standing[], n: number): Standing[] {
    return standings.slice(-n);
  }
}

export const standingsService = new StandingsService();
