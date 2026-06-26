import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  GraduationCap,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  BookOpen,
  ArrowRight,
  List,
  Target,
  BookMarked,
  AlertCircle,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { studentGrammarApi, type GrammarResponse } from "@/lib/api/studentGrammar";
import { studentProgressApi } from "@/lib/api/studentProgress";

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

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="px-6 pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="w-10 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <div className="w-48 h-6 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-36 h-4 bg-slate-100 dark:bg-slate-600 rounded" />
          </div>
        </div>
        <div className="h-16 bg-slate-100 dark:bg-slate-700 rounded-xl" />
      </div>
      <div className="px-6 pb-8">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/grammar/$grammarId")({
  component: StructureListPage,
});

function StructureListPage() {
  const { grammarId } = Route.useParams();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  // ── API Query ─────────────────────────────────────────────────────────────
  const {
    data: grammar,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["student-grammar", grammarId],
    queryFn: () => studentGrammarApi.getGrammarById(grammarId),
    enabled: !!grammarId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Progress Query ───────────────────────────────────────────────────────
  const { data: progressList = [], refetch: refetchProgress } = useQuery({
    queryKey: ["grammar-progress", grammarId],
    queryFn: () => studentProgressApi.getProgress({ contentType: "GRAMMAR" }),
    enabled: !!grammarId,
    staleTime: 30 * 1000,
  });

  // Load progress into state after grammar loads
  useEffect(() => {
    if (!grammar) return;
    const completedSet = new Set<string>();
    const bookmarkedSet = new Set<string>();
    progressList.forEach((p) => {
      if (p.contentType === "GRAMMAR" && p.contentId === grammar.id) {
        if (p.completed) completedSet.add(p.contentId);
        if (p.favorite) bookmarkedSet.add(p.contentId);
      }
    });
    setCompleted(completedSet);
    setBookmarked(bookmarkedSet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressList, grammar?.id]);

  const errorMessage =
    error instanceof Error ? error.message : "Failed to load grammar. Please try again.";

  const examples = (grammar?.examples ?? []).map((ex, i) => ({
    japanese: ex,
    romaji: `Romaji ${i + 1}`,
    translation: `Translation ${i + 1}`,
  }));

  const structureItems = grammar
    ? [
        {
          id: grammar.id,
          title: "Grammar Detail",
          description: grammar.meaning,
          formation: grammar.structure ?? grammar.pattern ?? "—",
          usage: grammar.usage ?? "",
          examplesCount: examples.length,
          examples,
        },
      ]
    : [];

  const toggleComplete = async (id: string) => {
    const isCurrentlyCompleted = completed.has(id);
    // Optimistic update
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      if (isCurrentlyCompleted) {
        await studentProgressApi.unmarkAsCompleted("GRAMMAR", id);
      } else {
        await studentProgressApi.markAsCompleted("GRAMMAR", id);
      }
      await refetchProgress();
    } catch {
      // Revert on error
      setCompleted((prev) => {
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
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      await studentProgressApi.toggleFavorite("GRAMMAR", id);
      await refetchProgress();
    } catch {
      // Revert on error
      setBookmarked((prev) => {
        const next = new Set(prev);
        if (isCurrentlyBookmarked) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const completedCount = structureItems.filter((s) => completed.has(s.id)).length;
  const progressPct =
    structureItems.length > 0 ? Math.round((completedCount / structureItems.length) * 100) : 0;

  return (
    <div>
      <SakuraBg count={12} />
      <div className="relative z-10 space-y-6">
        {/* Loading */}
        {isLoading && <PageSkeleton />}

        {/* Error */}
        {!isLoading && isError && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">Failed to load grammar</p>
              <p className="text-xs text-red-400 mb-3">{errorMessage}</p>
              <Link
                to="/student/grammar"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Grammar List
              </Link>
            </div>
          </div>
        )}

        {/* Not Found */}
        {!isLoading && !isError && !grammar && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <p className="text-muted-foreground">Grammar not found.</p>
              <Link
                to="/student/grammar"
                className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Grammar List
              </Link>
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && grammar && (
          <>
            {/* Breadcrumb + Header */}
            <div className="px-6 pt-6 space-y-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <Link
                  to="/student/grammar"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
                >
                  <GraduationCap className="w-4 h-4" />
                  Grammar
                </Link>
                <span className="text-muted-foreground">/</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${levelColors[grammar.level]}`}
                >
                  {grammar.level}
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="font-semibold text-foreground">{grammar.title}</span>
              </div>

              {/* Grammar Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${levelGradients[grammar.level]} flex-shrink-0`}
                  >
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-display font-black">{grammar.title}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{grammar.meaning}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${levelColors[grammar.level]}`}
                      >
                        JLPT {grammar.level}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <List className="w-3.5 h-3.5" />
                        {examples.length} examples
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-3">
                  <div className="text-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="text-xl font-black text-blue-500">{examples.length}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5" /> Total
                    </div>
                  </div>
                  <div className="text-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="text-xl font-black text-green-500">{completedCount}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </div>
                  </div>
                  <div className="text-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="text-xl font-black text-yellow-500">{progressPct}%</div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                      <Target className="w-3.5 h-3.5" /> Progress
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Learning Progress</span>
                  <span className="font-semibold text-foreground">
                    {completedCount} / {structureItems.length} completed
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    className="h-full bg-gradient-to-r from-blue-400 to-pink-400 rounded-full transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Grammar Detail Cards */}
            <div className="px-6 pb-8 space-y-4">
              {/* Formation */}
              {(grammar.structure || grammar.pattern) && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-2">
                    Formation / Structure
                  </div>
                  <div className="font-display font-black text-purple-700 dark:text-purple-300 text-lg">
                    {grammar.structure ?? grammar.pattern}
                  </div>
                </div>
              )}

              {/* Usage */}
              {grammar.usage && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Usage / Explanation
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {grammar.usage}
                  </p>
                </div>
              )}

              {/* Examples */}
              {examples.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <h3 className="font-display font-bold text-base">Example Sentences</h3>
                  </div>
                  <div className="space-y-3">
                    {examples.map((ex, i) => {
                      const itemId = grammar.id;
                      const isComp = completed.has(itemId);
                      const isBook = bookmarked.has(itemId);
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                                {i + 1}
                              </div>
                              <div>
                                <div
                                  className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed"
                                  style={{ fontFamily: "var(--font-japanese, serif)" }}
                                >
                                  {ex.japanese}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                  {ex.translation}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => toggleComplete(itemId)}
                                title={isComp ? "Mark incomplete" : "Mark complete"}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                                  isComp
                                    ? "bg-green-50 dark:bg-green-950/30 text-green-500"
                                    : "bg-slate-50 dark:bg-slate-700/50 text-slate-300 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30"
                                }`}
                              >
                                <CheckCircle2
                                  className={`w-4 h-4 ${isComp ? "fill-green-400" : ""}`}
                                />
                              </button>
                              <button
                                onClick={() => toggleBookmark(itemId)}
                                title={isBook ? "Remove bookmark" : "Bookmark"}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                                  isBook
                                    ? "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-500"
                                    : "bg-slate-50 dark:bg-slate-700/50 text-slate-300 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
                                }`}
                              >
                                {isBook ? (
                                  <BookmarkCheck className="w-4 h-4 fill-yellow-400" />
                                ) : (
                                  <Bookmark className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty Examples */}
              {examples.length === 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                    <BookMarked className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="font-display font-black text-lg text-slate-700 dark:text-slate-200 mb-1.5">
                    No examples available
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Examples for this grammar pattern are being prepared.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
