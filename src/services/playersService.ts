import { createProvider } from "../providers/index.js";
import type { PlayerStats, FootballProvider } from "../providers/index.js";

export class PlayersService {
  private provider: FootballProvider | null = null;
  private cache = new Map<
    string,
    { data: PlayerStats | null; expiresAt: number }
  >();

  private readonly STATS_TTL = 10 * 60 * 1000; // 10 minutes

  private async getProvider(): Promise<FootballProvider> {
    if (!this.provider) this.provider = await createProvider();
    return this.provider;
  }

  private isFresh(
    entry: { data: PlayerStats | null; expiresAt: number } | undefined,
  ): entry is { data: PlayerStats | null; expiresAt: number } {
    return !!entry && Date.now() < entry.expiresAt;
  }

  async getPlayerStats(
    playerId: string,
    season: string,
  ): Promise<PlayerStats | null> {
    const key = `${playerId}:${season}`;
    const cached = this.cache.get(key);
    if (this.isFresh(cached)) return cached.data;

    const provider = await this.getProvider();
    const stats = await provider.getPlayerStats(playerId, season);
    this.cache.set(key, {
      data: stats,
      expiresAt: Date.now() + this.STATS_TTL,
    });
    return stats;
  }

  computeGoalContribution(stats: PlayerStats): number {
    return stats.goals + stats.assists;
  }

  computeMinutesPerGoal(stats: PlayerStats): number | null {
    if (stats.goals === 0) return null;
    return stats.minutesPlayed / stats.goals;
  }

  computeCardsPerGame(stats: PlayerStats): number {
    if (stats.appearances === 0) return 0;
    return parseFloat(
      ((stats.yellowCards + stats.redCards) / stats.appearances).toFixed(2),
    );
  }
}

export const playersService = new PlayersService();
