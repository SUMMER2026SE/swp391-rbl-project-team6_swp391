// Pure helpers for the Admin Dashboard.
// No I/O, no React — fully unit-testable.

import type { AdminClassResponse } from "@/lib/api/admin";

export const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
export type JlptLevel = (typeof JLPT_LEVELS)[number];

// Friendly colors for JLPT chart bars (used as fallbacks in addition to recharts palette).
export const JLPT_COLORS: Record<JlptLevel, string> = {
  N5: "oklch(0.62 0.18 270)", // violet
  N4: "oklch(0.72 0.15 230)", // sky
  N3: "oklch(0.72 0.18 340)", // pink
  N2: "oklch(0.72 0.17 80)",  // amber
  N1: "oklch(0.6 0.22 25)",   // red
};

export interface JlptBucket {
  level: JlptLevel;
  count: number;
  color: string;
}

// Build an N5..N1 distribution from a flat list of classes. Levels not present
// in the input are still emitted with `count: 0` so the chart always renders
// the full band (the user explicitly asked for N5 → N1).
export function buildJlptDistribution(
  classes: ReadonlyArray<Pick<AdminClassResponse, "level">>,
): JlptBucket[] {
  const counts = new Map<string, number>();
  for (const c of classes) {
    if (!c.level) continue;
    counts.set(c.level, (counts.get(c.level) ?? 0) + 1);
  }
  return JLPT_LEVELS.map((level) => ({
    level,
    count: counts.get(level) ?? 0,
    color: JLPT_COLORS[level],
  }));
}

/**
 * Compute a Completion Rate (%) from real backend counters.
 *
 * Backend does not expose a dedicated completion endpoint, so we derive it
 * from data we DO have: the number of progress records each active student
 * produces relative to the total approved/published content corpus.
 *
 * Numerator   = totalProgressRecords (real)
 * Denominator = totalActiveUsers × publishedVocabularyLessons + approvedGrammar
 *               + approvedFlashcardSets + approvedListeningLessons (real)
 *
 * Bounded to [0, 100]. Returns null when we cannot compute meaningfully
 * (e.g. no users or no published content yet) so the UI can show "—".
 */
export function computeCompletionRate(args: {
  totalProgressRecords: number;
  totalActiveUsers: number;
  publishedContent: number;
}): number | null {
  const { totalProgressRecords, totalActiveUsers, publishedContent } = args;
  if (totalActiveUsers <= 0 || publishedContent <= 0) return null;
  const denominator = totalActiveUsers * publishedContent;
  if (denominator <= 0) return null;
  const ratio = totalProgressRecords / denominator;
  return Math.max(0, Math.min(100, Math.round(ratio * 1000) / 10));
}

export function sumPublishedContent(args: {
  publishedVocabularyLessons: number;
  approvedGrammar: number;
  approvedFlashcardSets: number;
  approvedListeningLessons: number;
}): number {
  return (
    args.publishedVocabularyLessons +
    args.approvedGrammar +
    args.approvedFlashcardSets +
    args.approvedListeningLessons
  );
}

// "How long ago" formatter for activity timestamps.
// Returns a short, user-friendly phrase suitable for activity feeds.
export function formatTimeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function formatCount(n: number): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "0";
  return n.toLocaleString("en-US");
}
