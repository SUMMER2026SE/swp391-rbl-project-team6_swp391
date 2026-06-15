import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, GraduationCap, Eye, CheckCircle2, Bookmark, BookmarkCheck,
  ChevronLeft, ChevronRight, BookOpen, X,
  Clock, Volume2, Target, Loader2, AlertCircle
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

// ─── Mock example data for display (backend examples are strings) ─────────────────

function buildMockExamples(
  examples: string[],
  exampleMeanings?: string[],
): { japanese: string; romaji: string; translation: string }[] {
  return examples.map((ex, i) => ({
    japanese: ex,
    romaji: `Romaji ${i + 1}`,
    translation: exampleMeanings?.[i] ?? `Translation ${i + 1}`,
  }));
}

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

// ─── Grammar Detail Modal ──────────────────────────────────────────────────────

function speakJapanese(text: string) {
  if (!text?.trim()) return;
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

function ExampleCard({
  ex, index,
}: {
  ex: { japanese: string; romaji: string; translation: string };
  index: number;
}) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30">
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-sm">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed"
          style={{ fontFamily: "var(--font-japanese, serif)" }}
        >
          {ex.japanese}
        </div>
        <div className="text-xs text-sky-500 dark:text-sky-400 italic mt-0.5">{ex.romaji}</div>
        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{ex.translation}</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); speakJapanese(ex.japanese); }}
        title="Play pronunciation"
        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition self-start flex-shrink-0"
      >
        <Volume2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function GrammarDetailModal({
  item,
  isCompleted,
  isBookmarked,
  onClose,
  onToggleComplete,
  onToggleBookmark,
}: {
  item: GrammarResponse;
  isCompleted: boolean;
  isBookmarked: boolean;
  onClose: () => void;
  onToggleComplete: () => void;
  onToggleBookmark: () => void;
}) {
  const examples = buildMockExamples(item.examples ?? [], item.exampleMeanings);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`bg-gradient-to-br ${levelGradients[item.level]} px-6 py-5 sticky top-0 z-10`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <span className="px-2.5 py-0.5 rounded-full bg-white/25 backdrop-blur-sm text-white text-xs font-black">
                JLPT {item.level}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isBookmarked && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 backdrop-blur-sm text-white text-xs font-bold">
                  <BookmarkCheck className="w-3.5 h-3.5 fill-yellow-300" />
                  Bookmarked
                </div>
              )}
              {isCompleted && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 backdrop-blur-sm text-white text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-green-300" />
                  Mastered
                </div>
              )}
            </div>
          </div>

          <h2 className="font-display font-black text-2xl text-white leading-tight">{item.title}</h2>
          <p className="text-white/90 text-sm font-medium mt-1">{item.meaning}</p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onToggleComplete}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isCompleted
                  ? "bg-green-500 text-white shadow-lg shadow-green-300/30"
                  : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isCompleted ? "fill-white" : ""}`} />
              {isCompleted ? "Completed" : "Mark Complete"}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onToggleBookmark}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isBookmarked
                  ? "bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-300/30"
                  : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
              }`}
            >
              {isBookmarked
                ? <BookmarkCheck className="w-4 h-4 fill-slate-900" />
                : <Bookmark className="w-4 h-4" />}
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </motion.button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Formation */}
          {item.structure && (
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
              <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1.5">Formation / Structure</div>
              <div className="font-display font-black text-purple-700 dark:text-purple-300 text-base">{item.structure}</div>
            </div>
          )}

          {/* Explanation */}
          {item.usage && (
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Usage / Explanation</div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.usage}</p>
            </div>
          )}

          {/* Notes / Pattern */}
          {item.pattern && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5">Pattern</div>
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300 whitespace-pre-line">{item.pattern}</p>
            </div>
          )}

          {/* Examples */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                <h3 className="font-display font-bold text-sm">Example Sentences</h3>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                {examples.length} examples
              </span>
            </div>
            <div className="space-y-2">
              {examples.map((ex, i) => (
                <ExampleCard key={i} ex={ex} index={i} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
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
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-600 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/grammar")({ component: GrammarPage });

function GrammarPage() {
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedGrammar, setSelectedGrammar] = useState<GrammarResponse | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "bookmarked">("all");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when status filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

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

  // Load progress into state after grammar list loads
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressList, grammars.length]);

  // Apply status filter
  const filteredGrammars = grammars.filter(g => {
    if (statusFilter === "completed") return completed.has(g.id);
    if (statusFilter === "bookmarked") return bookmarked.has(g.id);
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredGrammars.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filteredGrammars.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleLevelFilter = (level: string) => {
    setLevelFilter(level);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    setSelectedGrammar(null);
  };

  const toggleComplete = async (id: string) => {
    const isCurrentlyCompleted = completed.has(id);
    // Optimistic update
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    console.log("[GrammarProgress] toggleComplete clicked", id, "currentlyCompleted:", isCurrentlyCompleted);
    try {
      if (isCurrentlyCompleted) {
        await studentProgressApi.unmarkAsCompleted("GRAMMAR", id);
        console.log("[GrammarProgress] unmarkAsCompleted success");
      } else {
        await studentProgressApi.markAsCompleted("GRAMMAR", id);
        console.log("[GrammarProgress] markAsCompleted success");
      }
      await refetchProgress();
    } catch (err) {
      console.error("[GrammarProgress] toggleComplete error:", err);
      // Revert on error
      setCompleted(prev => {
        const next = new Set(prev);
        if (isCurrentlyCompleted) next.add(id);
        else next.delete(id);
        return next;
      });
    }
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

  const totalCompleted = [...completed].length;
  const totalBookmarked = bookmarked.size;
  const completedCount = grammars.filter(g => completed.has(g.id)).length;
  const progressPct = grammars.length > 0 ? Math.round((completedCount / grammars.length) * 100) : 0;

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
              {([
                { label: "Total", value: grammars.length, color: "text-blue-500", icon: <BookOpen className="w-4 h-4" />, filter: "all" as const },
                { label: "Completed", value: totalCompleted, color: "text-green-500", icon: <CheckCircle2 className="w-4 h-4" />, filter: "completed" as const },
                { label: "Bookmarked", value: totalBookmarked, color: "text-yellow-500", icon: <BookmarkCheck className="w-4 h-4" />, filter: "bookmarked" as const },
              ]).map(stat => (
                <div
                  key={stat.label}
                  onClick={() => setStatusFilter(stat.filter)}
                  className={`text-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 backdrop-blur-sm border transition-all cursor-pointer select-none ${
                    statusFilter === stat.filter
                      ? "border-primary/50 shadow-md ring-2 ring-primary/20"
                      : "border-slate-100 dark:border-slate-700 shadow-sm hover:border-slate-200 dark:hover:border-slate-600"
                  }`}
                >
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
            <div className="overflow-x-auto min-w-[700px]">
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
                  <p className="text-sm text-muted-foreground">
                    {statusFilter === "bookmarked" ? "No bookmarked grammar found." :
                     statusFilter === "completed" ? "No completed grammar found." :
                     "Không có ngữ pháp phù hợp"}
                  </p>
                  {(debouncedSearch || statusFilter !== "all") && (
                    <button
                      onClick={() => { setSearch(""); setStatusFilter("all"); }}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}

              {/* Filtered empty state */}
              {!isLoading && !isError && grammars.length > 0 && filteredGrammars.length === 0 && (
                <div className="py-16 text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {statusFilter === "bookmarked" ? "No bookmarked grammar found." :
                     statusFilter === "completed" ? "No completed grammar found." :
                     "Không có ngữ pháp phù hợp"}
                  </p>
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="mt-2 text-xs text-primary hover:underline"
                  >
                    Show all grammars
                  </button>
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
                    className="grid grid-cols-[2fr_80px_1.5fr_120px_110px_120px_80px] gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition cursor-pointer items-center"
                    onClick={() => setSelectedGrammar(g)}
                  >
                    {/* Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${levelGradients[g.level]}`}>
                        <GraduationCap className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display font-black text-sm text-slate-800 dark:text-white truncate">{g.title}</div>
                        <div className="text-[10px] text-muted-foreground">{g.level} JLPT</div>
                      </div>
                    </div>

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
                      <span className="text-xs text-muted-foreground">—</span>
                    </div>

                    {/* View Action */}
                    <div className="text-center flex justify-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedGrammar(g)}
                        title="View detail"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleComplete(g.id)}
                        title={isComp ? "Mark incomplete" : "Mark complete"}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                          isComp
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                            : "hover:bg-green-50 dark:hover:bg-green-900/20 text-slate-300 hover:text-green-500"
                        }`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isComp ? "fill-green-400" : ""}`} />
                      </button>
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
            </div>

            {/* Pagination */}
            {!isLoading && !isError && totalPages > 1 && (
              <div className="px-6 pb-5">
                <Pagination current={safePage} total={filteredGrammars.length} onPage={handlePageChange} />
              </div>
            )}
          </div>
        </div>

        {/* Overall Progress Summary — hidden when status filter is active */}
        {!isLoading && !isError && statusFilter === "all" && (
          <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Progress</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {completedCount} / {grammars.length} patterns mastered
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

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedGrammar && (
          <GrammarDetailModal
            item={selectedGrammar}
            isCompleted={completed.has(selectedGrammar.id)}
            isBookmarked={bookmarked.has(selectedGrammar.id)}
            onClose={() => setSelectedGrammar(null)}
            onToggleComplete={() => toggleComplete(selectedGrammar.id)}
            onToggleBookmark={() => toggleBookmark(selectedGrammar.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
