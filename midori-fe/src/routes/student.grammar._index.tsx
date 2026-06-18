import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, GraduationCap, CheckCircle2, Bookmark, BookmarkCheck,
  BookOpen, X, ArrowRight, Lock, Unlock, Play,
  Clock, Target, Loader2, AlertCircle, Sparkles
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

const levelColors: Record<string, { bg: string; text: string; border: string }> = {
  N5: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-500", border: "border-blue-200 dark:border-blue-800" },
  N4: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-500", border: "border-green-200 dark:border-green-800" },
  N3: { bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-600", border: "border-yellow-200 dark:border-yellow-800" },
  N2: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-500", border: "border-orange-200 dark:border-orange-800" },
  N1: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-500", border: "border-red-200 dark:border-red-800" },
};

const levelGradients: Record<string, string> = {
  N5: "from-blue-400 to-cyan-400",
  N4: "from-green-400 to-emerald-400",
  N3: "from-yellow-400 to-orange-400",
  N2: "from-orange-400 to-red-400",
  N1: "from-red-400 to-pink-400",
};

const levelBgGradients: Record<string, string> = {
  N5: "bg-linear-to-br from-blue-500/10 to-cyan-500/10",
  N4: "bg-linear-to-br from-green-500/10 to-emerald-500/10",
  N3: "bg-linear-to-br from-yellow-500/10 to-orange-500/10",
  N2: "bg-linear-to-br from-orange-500/10 to-red-500/10",
  N1: "bg-linear-to-br from-red-500/10 to-pink-500/10",
};

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="relative pl-12 animate-pulse">
      {/* Timeline skeleton */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
      <div className="absolute left-2 top-6 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 ml-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-60 bg-slate-100 dark:bg-slate-600 rounded" />
            </div>
          </div>
          <div className="w-24 h-9 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Learning Path Card ─────────────────────────────────────────────────────────

interface LearningPathCardProps {
  grammar: GrammarResponse;
  index: number;
  isCompleted: boolean;
  isBookmarked: boolean;
  isLocked: boolean;
  onBookmark: (id: string) => void;
  onRecordView: (id: string) => void;
}

function LearningPathCard({
  grammar,
  index,
  isCompleted,
  isBookmarked,
  isLocked,
  onBookmark,
  onRecordView,
}: LearningPathCardProps) {
  const colors = levelColors[grammar.level] || levelColors.N5;
  const gradient = levelGradients[grammar.level] || levelGradients.N5;
  const bgGradient = levelBgGradients[grammar.level] || levelBgGradients.N5;

  const handleClick = () => {
    if (!isLocked) {
      onRecordView(grammar.id);
    }
  };

  return (
    <div className="relative">
      {/* Timeline connector */}
      {index > 0 && (
        <div 
          className={`absolute left-5 top-0 w-0.5 -translate-y-full ${
            isCompleted 
              ? "bg-linear-to-b from-green-400 to-slate-200 dark:to-slate-700" 
              : "bg-slate-200 dark:bg-slate-700"
          }`} 
          style={{ height: "24px" }}
        />
      )}

      {/* Timeline node */}
      <div className="absolute left-2 top-6 z-10">
        <div 
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
            isCompleted
              ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
              : isLocked
              ? "bg-slate-200 dark:bg-slate-700 text-slate-400"
              : `bg-linear-to-br ${gradient} text-white shadow-lg`
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : isLocked ? (
            <Lock className="w-3 h-3" />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>
      </div>

      {/* Card content */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className={`relative ml-12 rounded-2xl border transition-all duration-300 ${
          isLocked
            ? "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 opacity-60"
            : `bg-white dark:bg-slate-800 ${colors.border} shadow-sm hover:shadow-md hover:border-primary/30`
        }`}
      >
        {/* Locked overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-linear-to-r from-slate-50/80 to-transparent dark:from-slate-800/80 rounded-2xl pointer-events-none" />
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Icon + Info */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Grammar icon/illustration */}
              <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${bgGradient} border ${colors.border}`}>
                <GraduationCap className={`w-6 h-6 ${colors.text}`} />
              </div>

              <div className="min-w-0 flex-1">
                {/* Title row */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className={`font-display font-black text-base truncate ${
                    isLocked ? "text-slate-400" : "text-slate-800 dark:text-white"
                  }`}>
                    {grammar.title}
                  </h3>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.bg} ${colors.text}`}>
                    {grammar.level}
                  </span>
                  {isCompleted && (
                    <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </span>
                  )}
                </div>

                {/* Meaning */}
                <p className={`text-sm line-clamp-2 ${isLocked ? "text-slate-400" : "text-muted-foreground"}`}>
                  {grammar.meaning}
                </p>

                {/* Example hint */}
                {grammar.structures && grammar.structures.length > 0 && !isLocked && (
                  <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-1">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    {grammar.structures.length} structure{grammar.structures.length > 1 ? "s" : ""} to master
                  </p>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Bookmark button */}
              {!isLocked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmark(grammar.id);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isBookmarked
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500"
                      : "hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-slate-300 hover:text-yellow-500"
                  }`}
                  title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 fill-yellow-400" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Main action button */}
              {isLocked ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 text-sm font-bold">
                  <Lock className="w-4 h-4" />
                  Locked
                </div>
              ) : (
                <Link
                  to="/student/grammar/$grammarId"
                  params={{ grammarId: grammar.id }}
                  onClick={handleClick}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    isCompleted
                      ? "bg-green-500/10 text-green-600 dark:text-green-300 hover:bg-green-500/20 border border-green-500/30"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <BookOpen className="w-4 h-4" />
                      Review
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start
                    </>
                  )}
                </Link>
              )}
            </div>
          </div>

          {/* Progress indicator for completed items */}
          {isCompleted && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-linear-to-r from-green-400 to-emerald-500 rounded-full" />
                </div>
                <span className="text-[10px] font-bold text-green-600 dark:text-green-300">
                  100% Mastered
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/grammar/_index")({ component: GrammarListPage });

function GrammarListPage() {
  const [levelFilter, setLevelFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [localLastStudiedMap, setLocalLastStudiedMap] = useState<Record<string, string>>({});

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
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

  // ── Derived state ────────────────────────────────────────────────────────
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

  // Determine lock state based on order
  const getLockState = (index: number, grammarId: string): boolean => {
    // First item is never locked
    if (index === 0) return false;
    // If previous grammar is not completed, this one is locked
    // Sort grammars by some order (assuming order is preserved from API)
    return false; // For now, no locking - all unlocked for flexibility
  };

  const toggleBookmark = async (id: string) => {
    const isCurrentlyBookmarked = bookmarked.has(id);
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      await studentProgressApi.toggleFavorite("GRAMMAR", id);
      await refetchProgress();
    } catch (err) {
      console.error("[GrammarProgress] toggleFavorite error:", err);
      setBookmarked(prev => {
        const next = new Set(prev);
        if (isCurrentlyBookmarked) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const handleRecordView = (id: string) => {
    if (!localLastStudiedMap[id]) {
      const nowIso = new Date().toISOString();
      setLocalLastStudiedMap(prev => ({ ...prev, [id]: nowIso }));
      studentProgressApi.recordView("GRAMMAR", id)
        .then(() => refetchProgress())
        .catch(err => {
          console.error("[GrammarProgress] recordView error:", err);
          setLocalLastStudiedMap(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        });
    }
  };

  // Stats
  const completedCount = grammars.filter(g => completed.has(g.id)).length;
  const bookmarkedCount = grammars.filter(g => bookmarked.has(g.id)).length;
  const progressPct = grammars.length > 0 ? Math.round((completedCount / grammars.length) * 100) : 0;

  const errorMessage =
    error instanceof Error ? error.message : "Failed to load grammars. Please try again.";

  return (
    <div>
      <SakuraBg count={14} />
      <div className="relative z-10 space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between px-6 pt-6">
          <div>
            <h1 className="text-2xl font-display font-black">Grammar Learning Path</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Follow your journey from N5 to N1 mastery
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        {!isLoading && (
          <div className="px-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm">Your Progress</span>
                </div>
                <span className="text-sm font-bold text-primary">{progressPct}% Complete</span>
              </div>
              
              {/* Progress bar */}
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  className="h-full bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                />
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                  <div className="text-2xl font-black text-primary">{grammars.length}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Lessons</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-950/20">
                  <div className="text-2xl font-black text-green-500">{completedCount}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Completed</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/20">
                  <div className="text-2xl font-black text-yellow-500">{grammars.length - completedCount}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Remaining</div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                onClick={() => setLevelFilter(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  levelFilter === l ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Learning Path */}
        <div className="px-6 pb-8">
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {isError && (
            <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">Failed to load grammars</p>
              <p className="text-xs text-red-400">{errorMessage}</p>
            </div>
          )}

          {!isLoading && !isError && grammars.length === 0 && (
            <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No grammar patterns found</p>
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

          {!isLoading && !isError && grammars.length > 0 && (
            <div className="space-y-4">
              {/* Section header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-linear-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {levelFilter === "All" ? "All Levels" : `JLPT ${levelFilter}`} Curriculum
                </span>
                <div className="flex-1 h-px bg-linear-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
              </div>

              {/* Learning path cards */}
              <div className="relative space-y-4">
                {grammars.map((grammar, index) => (
                  <LearningPathCard
                    key={grammar.id}
                    grammar={grammar}
                    index={index}
                    isCompleted={completed.has(grammar.id)}
                    isBookmarked={bookmarked.has(grammar.id)}
                    isLocked={getLockState(index, grammar.id)}
                    onBookmark={toggleBookmark}
                    onRecordView={handleRecordView}
                  />
                ))}
              </div>

              {/* Bookmarked section */}
              {bookmarkedCount > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-linear-to-r from-transparent via-yellow-300/50 to-transparent" />
                    <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                      <BookmarkCheck className="w-4 h-4" />
                      Bookmarked ({bookmarkedCount})
                    </span>
                    <div className="flex-1 h-px bg-linear-to-r from-transparent via-yellow-300/50 to-transparent" />
                  </div>
                  
                  <div className="space-y-3">
                    {grammars
                      .filter(g => bookmarked.has(g.id))
                      .map((grammar, index) => (
                        <LearningPathCard
                          key={`bookmark-${grammar.id}`}
                          grammar={grammar}
                          index={index}
                          isCompleted={completed.has(grammar.id)}
                          isBookmarked={true}
                          isLocked={false}
                          onBookmark={toggleBookmark}
                          onRecordView={handleRecordView}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
