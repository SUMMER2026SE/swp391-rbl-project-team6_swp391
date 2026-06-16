import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, GraduationCap, CheckCircle2, Bookmark, BookmarkCheck,
  ChevronLeft, ChevronRight, BookOpen, X, ArrowRight,
  Clock, Target, Loader2, AlertCircle
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import {
  studentGrammarApi,
  type GrammarResponse,
  type GrammarLevel,
} from "@/lib/api/studentGrammar";
import { studentProgressApi } from "@/lib/api/studentProgress";

// ─── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_FILTERS = ["All", "N5", "N4", "N3", "N2", "N1"] as const;
const PAGE_SIZE = 8;

const levelColors: Record<string, string> = {
  N5: "bg-blue-50 text-blue-500 dark:bg-blue-950/30",
  N4: "bg-green-50 text-green-500 dark:bg-green-950/30",
  N3: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30",
  N2: "bg-orange-50 text-orange-500 dark:bg-orange-950/30",
  N1: "bg-red-50 text-red-500 dark:bg-red-950/30",
};

const levelGradients: Record<string, string> = {
  N5: "from-blue-400 to-cyan-400",
  N4: "from-green-400 to-emerald-400",
  N3: "from-yellow-400 to-orange-400",
  N2: "from-orange-400 to-red-400",
  N1: "from-red-400 to-pink-400",
};

// ─── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  current, total, onPage,
}: { current: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  const pageNums = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{Math.min((current - 1) * PAGE_SIZE + 1, total)}</span>
        {" – "}
        <span className="font-semibold text-foreground">{Math.min(current * PAGE_SIZE, total)}</span>
        {" of "}
        <span className="font-semibold text-foreground">{total}</span>
        {" grammar patterns"}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pageNums.map(p => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
              p === current
                ? "bg-gradient-hero text-white shadow"
                : "border border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(current + 1)}
          disabled={current === pages}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[2fr_80px_1.5fr_120px_110px_120px_80px] gap-3 px-6 py-4 items-center animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-2 w-16 bg-slate-100 dark:bg-slate-600 rounded" />
        </div>
      </div>
      <div className="h-5 w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
      <div className="h-3 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-600 rounded-full" />
      <div className="h-5 w-10 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />
      <div className="h-3 w-16 bg-slate-100 dark:bg-slate-600 rounded mx-auto" />
      <div className="flex justify-center gap-1">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-600 rounded-lg" />
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-600 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/grammar/_index")({ component: GrammarListPage });

function GrammarListPage() {
  const [levelFilter, setLevelFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [localLastStudiedMap, setLocalLastStudiedMap] = useState<Record<string, string>>({});

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ── API Query ─────────────────────────────────────────────────────────────
  const { data: grammars = [], isLoading, isError, error } = useQuery({
    queryKey: ["student-grammars", levelFilter, debouncedSearch],
    queryFn: () =>
      studentGrammarApi.getGrammars({
        level: levelFilter === "All" ? undefined : (levelFilter as GrammarLevel),
        search: debouncedSearch || undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });

  // ── Progress Query ───────────────────────────────────────────────────────
  const { data: progressList = [], refetch: refetchProgress } = useQuery({
    queryKey: ["grammar-progress"],
    queryFn: () => studentProgressApi.getProgress({ contentType: "GRAMMAR" }),
    staleTime: 30 * 1000,
  });

  // ── Derived state: completed, bookmarked, lastStudied ───────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (grammars.length === 0) return;
    const completedSet = new Set<string>();
    const bookmarkedSet = new Set<string>();
    progressList.forEach(p => {
      if (p.contentType === "GRAMMAR") {
        if (p.completed) completedSet.add(p.contentId);
        if (p.favorite) bookmarkedSet.add(p.contentId);
      }
    });
    setCompleted(completedSet);
    setBookmarked(bookmarkedSet);
  }, [progressList, grammars.length]);

  // Map contentId -> lastStudiedAt for grammar items
  // localLastStudiedMap overrides API values to show "Just now" immediately after viewing
  const lastStudiedMap = new Map<string, string>();
  progressList.forEach(p => {
    if (p.contentType === "GRAMMAR" && p.lastStudiedAt) {
      lastStudiedMap.set(p.contentId, p.lastStudiedAt);
    }
  });
  // Local overrides take priority over API data
  Object.entries(localLastStudiedMap).forEach(([id, ts]) => {
    lastStudiedMap.set(id, ts);
  });

  // Format last studied date (e.g. "2h ago", "3d ago", "Jan 5")
  function formatLastStudied(isoDate: string | undefined): string {
    if (!isoDate) return "—";
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "—";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const totalPages = Math.ceil(grammars.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = grammars.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleLevelFilter = (level: string) => {
    setLevelFilter(level);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  const toggleBookmark = async (id: string) => {
    const isCurrentlyBookmarked = bookmarked.has(id);
    // Optimistic update
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    console.log("[GrammarProgress] toggleBookmark clicked", id);
    try {
      await studentProgressApi.toggleFavorite("GRAMMAR", id);
      await refetchProgress();
      console.log("[GrammarProgress] toggleFavorite success");
    } catch (err) {
      console.error("[GrammarProgress] toggleFavorite error:", err);
      // Revert on error
      setBookmarked(prev => {
        const next = new Set(prev);
        if (isCurrentlyBookmarked) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  // Count completed/bookmarked within the visible grammar list (respects level+search filter)
  const completedCount = grammars.filter(g => completed.has(g.id)).length;
  const bookmarkedCount = grammars.filter(g => bookmarked.has(g.id)).length;
  const totalCompleted = completedCount;
  const totalBookmarked = bookmarkedCount;
  const totalGrammar = grammars.length;
  const progressPct = totalGrammar > 0 ? Math.round((completedCount / totalGrammar) * 100) : 0;

  const errorMessage =
    error instanceof Error ? error.message : "Failed to load grammars. Please try again.";

  return (
    <div>
      <SakuraBg count={14} />
      <div className="relative z-10 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h1 className="text-2xl font-display font-black">Grammar Lessons</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Master JLPT grammar patterns from N5 to N1 with clear examples and explanations.
            </p>
          </div>
          {!isLoading && (
            <div className="hidden md:flex items-center gap-3">
              {[
                { label: "Total", value: grammars.length, color: "text-blue-500", icon: <BookOpen className="w-4 h-4" /> },
                { label: "Completed", value: totalCompleted, color: "text-green-500", icon: <CheckCircle2 className="w-4 h-4" /> },
                { label: "Bookmarked", value: totalBookmarked, color: "text-yellow-500", icon: <BookmarkCheck className="w-4 h-4" /> },
              ].map(stat => (
                <div key={stat.label} className="text-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 backdrop-blur-sm border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1 mt-0.5">
                    {stat.icon} {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3 px-6">
          <div className="flex-1 max-w-80">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search grammar patterns..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            {LEVEL_FILTERS.map(l => (
              <button
                key={l}
                onClick={() => handleLevelFilter(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  levelFilter === l ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="px-6 pb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_80px_1.5fr_120px_110px_120px_80px] gap-3 px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              <div>Pattern</div>
              <div>Level</div>
              <div>Meaning</div>
              <div className="text-center">Progress</div>
              <div className="text-center">Completed</div>
              <div className="text-center">Last Studied</div>
              <div className="text-center">View</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {/* Loading Skeletons */}
              {isLoading && (
                <>
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <div key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                      <SkeletonRow />
                    </div>
                  ))}
                </>
              )}

              {/* Error State */}
              {!isLoading && isError && (
                <div className="py-16 text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">Failed to load grammars</p>
                  <p className="text-xs text-red-400">{errorMessage}</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !isError && grammars.length === 0 && (
                <div className="py-16 text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Không có ngữ pháp phù hợp</p>
                  {debouncedSearch && (
                    <button
                      onClick={() => setSearch("")}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}

              {/* Data Rows */}
              {!isLoading && !isError && paginated.map((g, i) => {
                const isComp = completed.has(g.id);
                const isBook = bookmarked.has(g.id);
                return (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="grid grid-cols-[2fr_80px_1.5fr_120px_110px_120px_80px] gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition items-center"
                  >
                    {/* Title */}
                    <Link
                      to="/student/grammar/$grammarId"
                      params={{ grammarId: g.id }}
                      className="flex items-center gap-3 min-w-0 hover:opacity-80 transition"
                      onClick={() => {
                        if (!localLastStudiedMap[g.id]) {
                          const nowIso = new Date().toISOString();
                          setLocalLastStudiedMap(prev => ({ ...prev, [g.id]: nowIso }));
                          studentProgressApi.recordView("GRAMMAR", g.id)
                            .then(() => refetchProgress())
                            .catch(err => {
                              console.error("[GrammarProgress] recordView error:", err);
                              setLocalLastStudiedMap(prev => {
                                const next = { ...prev };
                                delete next[g.id];
                                return next;
                              });
                            });
                        }
                      }}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${levelGradients[g.level]}`}>
                        <GraduationCap className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display font-black text-sm text-slate-800 dark:text-white truncate">{g.title}</div>
                        <div className="text-[10px] text-muted-foreground">{g.level} JLPT</div>
                      </div>
                    </Link>

                    {/* Level */}
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${levelColors[g.level]}`}>
                        {g.level}
                      </span>
                    </div>

                    {/* Meaning */}
                    <div className="text-sm text-muted-foreground truncate pr-2">{g.meaning}</div>

                    {/* Progress */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: isComp ? "100%" : "0%" }}
                          className={`h-full rounded-full transition-all ${isComp ? "bg-green-400" : "bg-gradient-to-r from-blue-400 to-pink-400"}`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground w-7 text-right">
                        {isComp ? "100%" : "0%"}
                      </span>
                    </div>

                    {/* Completed Status */}
                    <div className="text-center">
                      {isComp ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-muted-foreground text-[10px] font-bold">
                          <Clock className="w-3 h-3" /> No
                        </span>
                      )}
                    </div>

                    {/* Last Studied */}
                    <div className="text-center">
                      {lastStudiedMap.has(g.id) ? (
                        <span className="text-xs text-muted-foreground" title={lastStudiedMap.get(g.id)}>
                          {formatLastStudied(lastStudiedMap.get(g.id))}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </div>

                    {/* View Action */}
                    <div className="text-center flex justify-center gap-1">
                      <Link
                        to="/student/grammar/$grammarId"
                        params={{ grammarId: g.id }}
                        title="View structures"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => toggleBookmark(g.id)}
                        title={isBook ? "Remove bookmark" : "Bookmark"}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                          isBook
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500"
                            : "hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-slate-300 hover:text-yellow-500"
                        }`}
                      >
                        {isBook
                          ? <BookmarkCheck className="w-3.5 h-3.5 fill-yellow-400" />
                          : <Bookmark className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {!isLoading && !isError && totalPages > 1 && (
              <div className="px-6 pb-5">
                <Pagination current={safePage} total={grammars.length} onPage={handlePageChange} />
              </div>
            )}
          </div>

          {/* Overall Progress Summary */}
          {!isLoading && !isError && (
            <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Progress</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  {completedCount} / {totalGrammar} patterns mastered
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  className="h-full bg-gradient-to-r from-blue-400 to-pink-400 rounded-full"
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-muted-foreground">0%</span>
                <span className="text-[10px] font-bold text-primary">{progressPct}%</span>
                <span className="text-[10px] text-muted-foreground">100%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
