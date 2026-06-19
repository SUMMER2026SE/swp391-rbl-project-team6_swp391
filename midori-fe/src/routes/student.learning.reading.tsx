import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, CheckCircle2, BookmarkCheck,
  Search, ChevronLeft, ChevronRight, Clock, X, BookText, History
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { allMockReading } from "@/mock/reading";
import { readingProgressStore } from "@/mock/reading/progress";
import type { JLPTLevel } from "@/types/content-library";

export const Route = createFileRoute("/student/learning/reading")({
  component: ReadingListPage,
});

const PAGE_SIZE = 8;

// Student level - this would come from auth/user data in production
const STUDENT_LEVEL: JLPTLevel = "N5";

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

function getLevelBoxStyle(level: string, isSelected: boolean) {
  if (isSelected) return "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-md";
  return levelColors[level] ?? "bg-slate-100 text-slate-600";
}

// Pagination Component
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
        {" readings"}
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

// Skeleton Row
function SkeletonRow() {
  return (
    <div className="grid grid-cols-[2fr_80px_1fr_120px_110px_100px_80px] gap-3 px-6 py-4 items-center animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-1.5">
          <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-2 w-20 bg-slate-100 dark:bg-slate-600 rounded" />
        </div>
      </div>
      <div className="h-5 w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
      <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-5 w-10 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />
      <div className="h-3 w-16 bg-slate-100 dark:bg-slate-600 rounded mx-auto" />
      <div className="flex justify-center gap-1">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-600 rounded-lg" />
      </div>
    </div>
  );
}

export function ReadingListPage() {
  const navigate = useNavigate();

  // Load progress from localStorage
  const [completedReadings, setCompletedReadings] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const progress = readingProgressStore.getAllProgress();
    const completed = Object.values(progress)
      .filter(p => p.status === "completed")
      .map(p => p.lessonId);
    setCompletedReadings(new Set(completed));
  }, []);

  // Filters
  const [levelFilter, setLevelFilter] = useState<string>(STUDENT_LEVEL);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "completed">("all");
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter readings
  const filteredReadings = useMemo(() => {
    let readings = allMockReading;

    // Filter by level
    if (levelFilter !== "All") {
      readings = readings.filter(r => r.jlptLevel === levelFilter);
    } else {
      // Show only student level
      readings = readings.filter(r => r.jlptLevel === STUDENT_LEVEL);
    }

    // Filter by search
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      readings = readings.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Filter by status
    if (statusFilter === "completed") {
      readings = readings.filter(r => completedReadings.has(r.id));
    }

    return readings;
  }, [levelFilter, debouncedSearch, statusFilter, completedReadings]);

  // Pagination
  const totalPages = Math.ceil(filteredReadings.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages || 1));
  const paginatedReadings = filteredReadings.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Stats
  const completedCount = filteredReadings.filter(r => completedReadings.has(r.id)).length;

  return (
    <div>
      <SakuraBg count={14} />
      <div className="relative z-10 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h1 className="text-2xl font-display font-black">Reading Lessons</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Practice reading comprehension with Japanese texts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/student/learning/reading/history"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 text-slate-700 dark:text-white text-sm font-medium hover:bg-white/80 transition"
            >
              <History className="w-4 h-4" />
              History
            </Link>
          </div>
        </div>

        {/* Level Info */}
        <div className="px-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
            <BookText className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Showing readings for your level: <span className="font-bold">{STUDENT_LEVEL}</span>
            </span>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3 px-6">
          <div className="flex-1 max-w-80">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search readings..."
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
            {([STUDENT_LEVEL] as string[]).map(l => (
              <button
                key={l}
                onClick={() => { setLevelFilter(l); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  levelFilter === l ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            {([
              { id: "all" as const, label: "All" },
              { id: "completed" as const, label: "Completed" },
            ]).map(s => (
              <button
                key={s.id}
                onClick={() => { setStatusFilter(s.id); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === s.id ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="px-6 pb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="overflow-x-auto min-w-[700px]">
              {/* Table Header */}
              <div className="grid grid-cols-[2fr_80px_1fr_120px_110px_100px_80px] gap-3 px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                <div>Title</div>
                <div>Level</div>
                <div>Duration</div>
                <div className="text-center">Words</div>
                <div className="text-center">Status</div>
                <div className="text-center">Tags</div>
                <div className="text-center">Start</div>
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

                {/* Empty State */}
                {!isLoading && filteredReadings.length === 0 && (
                  <div className="py-16 text-center">
                    <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No readings found.
                    </p>
                    {(debouncedSearch || statusFilter !== "all" || levelFilter !== "All") && (
                      <button
                        onClick={() => { setSearch(""); setStatusFilter("all"); setLevelFilter(STUDENT_LEVEL); }}
                        className="mt-2 text-xs text-primary hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}

                {/* Data Rows */}
                {!isLoading && paginatedReadings.map((reading, i) => {
                  const isCompleted = completedReadings.has(reading.id);
                  const wordCount = reading.passageText.split(/[\s\n]+/).filter(Boolean).length;
                  
                  return (
                    <motion.div
                      key={reading.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div
                        onClick={() => navigate({ to: "/student/learning/reading/$readingId", params: { readingId: reading.id } })}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/20 transition select-none"
                      >
                        <div className="grid grid-cols-[2fr_80px_1fr_120px_110px_100px_80px] gap-3 px-6 py-4 items-center">
                          {/* Title */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br ${levelGradients[reading.jlptLevel]}/20`}>
                              <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm text-foreground dark:text-white truncate">
                                {reading.title}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                {reading.jlptLevel}
                              </p>
                            </div>
                          </div>

                          {/* Level Badge */}
                          <div className="text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getLevelBoxStyle(reading.jlptLevel, false)}`}>
                              {reading.jlptLevel}
                            </span>
                          </div>

                          {/* Duration */}
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>~{reading.estimatedTime} min</span>
                          </div>

                          {/* Word Count */}
                          <div className="text-center">
                            <span className="text-sm font-medium text-foreground dark:text-white">
                              {wordCount}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">words</span>
                          </div>

                          {/* Status */}
                          <div className="flex justify-center">
                            {isCompleted ? (
                              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Done
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-600" />
                            )}
                          </div>

                          {/* Tags */}
                          <div className="flex justify-center gap-1">
                            <span className="px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-500 text-[10px] font-medium">
                              {reading.tags[0] || "General"}
                            </span>
                          </div>

                          {/* Start Button */}
                          <div className="flex justify-center">
                            <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="px-6 pb-4">
                <Pagination
                  current={safePage}
                  total={filteredReadings.length}
                  onPage={setPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
