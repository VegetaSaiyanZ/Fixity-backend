/**
 * Utility for calculating dynamic prioritization scores across the application.
 * Formula: BasePriority + (HoursPassed * 2)
 */
export class PriorityUtils {
  private static readonly AGING_WEIGHT = 2;

  /**
   * Calculates the aging bonus based on the creation date.
   */
  static calculateAgingScore(createdAt: Date): number {
    const now = new Date();
    const hoursPassed = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    );
    return hoursPassed * this.AGING_WEIGHT;
  }

  /**
   * Adds the aging bonus to a base priority score.
   */
  static getDynamicScore(baseScore: number | string | null, createdAt: Date): number {
    const base = Number(baseScore || 0);
    const aging = this.calculateAgingScore(createdAt);
    return base + aging;
  }
}
