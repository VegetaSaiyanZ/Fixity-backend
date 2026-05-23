import { Report } from '@prisma/client';

// Time constants
export const MS_PER_DAY = 1000 * 60 * 60 * 24;
export const ONE_DAY_MS = MS_PER_DAY;
export const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;
export const FOURTEEN_DAYS_MS = 14 * ONE_DAY_MS;

// Distance constant (kilometers) for clustering (~300 m)
export const DIST_THRESHOLD_KM = 0.3;

// SLA thresholds (days) based on severity
export const SLA_DAYS = {
  default: 5,
  high: 1, // severity >= 7
  medium: 3, // severity >= 4 && <7
  low: 7, // severity < 4
};

// Satisfaction thresholds (days) – values are inclusive upper bounds
export const SATISFACTION_CLOSED = [
  { maxDays: 2, score: 95 },
  { maxDays: 5, score: 80 },
  { maxDays: 10, score: 65 },
  { maxDays: Infinity, score: 45 },
];

export const SATISFACTION_OPEN = [
  { maxDays: 2, score: 85 },
  { maxDays: 5, score: 70 },
  { maxDays: 10, score: 55 },
  { maxDays: Infinity, score: 30 },
];


export function calculatePercentDelta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const delta = ((current - previous) / previous) * 100;
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
}

/**
 * Returns SLA days based on base severity.
 */
export function getSlaDays(baseSeverity: number | null | undefined): number {
  if (baseSeverity === null || baseSeverity === undefined) return SLA_DAYS.default;
  if (baseSeverity >= 7) return SLA_DAYS.high;
  if (baseSeverity >= 4) return SLA_DAYS.medium;
  return SLA_DAYS.low;
}

/**
 * Calculates a satisfaction score (0‑100) for a report.
 */
export function getReportSatisfactionScore(
  createdAt: Date,
  resolvedAt: Date | null,
  status: string,
  now: Date,
): number {
  const days = (date: Date) => Math.round((date.getTime() - createdAt.getTime()) / MS_PER_DAY);

  if (status === "Closed" && resolvedAt) {
    const resDays = days(resolvedAt);
    for (const rule of SATISFACTION_CLOSED) {
      if (resDays <= rule.maxDays) return rule.score;
    }
  } else {
    const ageDays = days(now);
    for (const rule of SATISFACTION_OPEN) {
      if (ageDays <= rule.maxDays) return rule.score;
    }
  }
  return 0; // fallback (should never happen)
}

/** Formats a percentage delta string. */
export function formatPercentDelta(current: number, previous: number): string {
  if (previous === 0) {
    if (current === 0) return "+0%";
    return `+${(current * 100).toFixed(0)}%`;
  }
  const pct = ((current - previous) / previous) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

/** Calculates average resolution time (days) from a list of reports. */
export function averageResolutionTime(reports: Report[]): number {
  if (reports.length === 0) return 0;
  const sumMs = reports.reduce((acc, r) => {
    const resolvedAt = r.incident?.resolvedAt;
    if (!resolvedAt) return acc;
    return acc + (resolvedAt.getTime() - r.createdAt.getTime());
  }, 0);
  return sumMs / reports.length / MS_PER_DAY;
}

/** Haversine distance in kilometers between two lat/lng points. */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Executes an async function and catches any errors, logging them and returning undefined.
 * Useful for service methods to prevent crashes.
 */
export async function safeAsync<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    console.error('Error in async operation:', error);
    return undefined;
  }
}
