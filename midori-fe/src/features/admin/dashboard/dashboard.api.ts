// Data fetching + aggregation layer for the Admin Dashboard.
// Every piece of data here comes from the EXISTING backend API. We never
// invent numbers locally. Anything we cannot compute is left as `null`
// and rendered as "—" in the UI.

import { adminApi, type AdminClassResponse, type AdminRecentActivity } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

export type RecentActivityKind = AdminRecentActivity["type"];

export interface RecentActivityItem {
  id: string;
  kind: RecentActivityKind;
  /** Pre-formatted ISO timestamp — comes straight from the API. */
  timestamp: string;
  /** A short title shown in the activity row. */
  title: string;
  /** A short subtitle / context line below the title. */
  detail: string;
}

export interface DashboardData {
  /** Total Students from /admin/dashboard/summary */
  totalStudents: number;
  /** Total Teachers from /admin/dashboard/summary */
  totalTeachers: number;
  /** All classes count from /admin/classes (regardless of status) */
  totalClasses: number;
  /** ACTIVE classes count from /admin/classes (subset of totalClasses) */
  activeClasses: number;
  /** Completion rate (%), or null if cannot be derived yet */
  completionRate: number | null;
  /** Distribution built from real class.level values */
  jlptDistribution: {
    level: "N5" | "N4" | "N3" | "N2" | "N1";
    count: number;
    color: string;
  }[];
  /** Recent events merged + sorted by createdAt desc, then trimmed to limit */
  recentActivities: RecentActivityItem[];
}

export interface DashboardLoadResult {
  ok: true;
  data: DashboardData;
}

export interface DashboardError {
  ok: false;
  error: string;
}

export type DashboardOutcome = DashboardLoadResult | DashboardError;

/**
 * Load every dashboard-related piece of data from real endpoints, in parallel.
 * If the summary endpoint fails, we fail the whole call so the UI can render
 * the error state (instead of misleading partial data).
 *
 * The classes endpoint and users endpoints are best-effort: when they fail,
 * we degrade gracefully by returning empty distributions / empty activity
 * lists rather than throwing. The page will still show the KPI cards from
 * the summary.
 */
export async function loadDashboardData(): Promise<DashboardOutcome> {
  try {
  // Recent Activities card surfaces at most the 6 newest events. The BE
  // already caps the response at `limit`, but we also clamp on the FE so the
  // card never grows taller than 6 rows even if a future caller forgets the
  // query parameter. The slice is applied AFTER sort (newest first) which
  // the BE already does; re-sorting here would be wasteful for the common
  // case but cheap enough to keep as a belt-and-braces measure.
  const RECENT_ACTIVITIES_LIMIT = 6;
  const [summary, classes, activitiesResult] = await Promise.all([
    adminApi.getDashboardSummary(),
    adminApi.getAdminClasses().catch(() => [] as AdminClassResponse[]),
    adminApi.getRecentActivities(RECENT_ACTIVITIES_LIMIT).catch(() => ({ activities: [] })),
  ]);

  const totalClasses = classes.length;
  const activeClasses = classes.filter((c) => c.status === "ACTIVE").length;

  // Group classes by JLPT level for the bar chart.
  const distributionMap = new Map<string, number>();
  for (const c of classes) {
    if (!c.level) continue;
    distributionMap.set(c.level, (distributionMap.get(c.level) ?? 0) + 1);
  }
  const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
  const JLPT_COLORS: Record<string, string> = {
    N5: "oklch(0.62 0.18 270)",
    N4: "oklch(0.72 0.15 230)",
    N3: "oklch(0.72 0.18 340)",
    N2: "oklch(0.72 0.17 80)",
    N1: "oklch(0.6 0.22 25)",
  };
  const jlptDistribution = JLPT_LEVELS.map((level) => ({
    level,
    count: distributionMap.get(level) ?? 0,
    color: JLPT_COLORS[level] ?? "oklch(0.7 0.05 270)",
  }));

  // Map real backend activities to the UI format.
  // Uses type coercion to maintain compatibility with the existing UI component.
  // The list is bounded to RECENT_ACTIVITIES_LIMIT newest entries so the card
  // never scrolls internally and the JLPT card on the same row keeps its
  // natural height.
  const recentActivities: RecentActivityItem[] = (activitiesResult.activities ?? [])
    .slice(0, RECENT_ACTIVITIES_LIMIT)
    .map((a) => ({
      id: a.id,
      kind: a.type,
      timestamp: a.timestamp,
      title: a.title,
      detail: a.detail,
    }));

    // Completion rate — derived from real counters, may be null early on.
    const publishedContent =
      summary.publishedVocabularyLessons +
      summary.approvedGrammar +
      summary.approvedFlashcardSets +
      summary.approvedListeningLessons;
    let completionRate: number | null = null;
    if (summary.totalActiveUsers > 0 && publishedContent > 0) {
      const ratio = summary.totalProgressRecords / (summary.totalActiveUsers * publishedContent);
      completionRate = Math.max(0, Math.min(100, Math.round(ratio * 1000) / 10));
    }

    return {
      ok: true,
      data: {
        totalStudents: summary.totalStudents,
        totalTeachers: summary.totalTeachers,
        totalClasses,
        activeClasses,
        completionRate,
        jlptDistribution,
        recentActivities,
      },
    };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, error: err.message };
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to load dashboard data",
    };
  }
}
