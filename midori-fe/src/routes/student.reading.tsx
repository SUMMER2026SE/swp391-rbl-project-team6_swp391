import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Volume2,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { allMockReading } from "@/mock/reading";
import { studentAccessibleLevels } from "./student.classes";
import type { JLPTLevel } from "@/types/content-library";

// ─── Constants ─────────────────────────────────────────────────────────────────

// Only show accessible levels
const LEVEL_FILTERS = ["All", ...studentAccessibleLevels] as const;
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

// ─── Helper Functions ───────────────────────────────────────────────────────────

function getLevelBoxStyle(level: string, isSelected: boolean) {
  if (isSelected) return "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-md";
  return levelColors[level] ?? "bg-slate-100 text-slate-600";
}

// Mock completed readings
const completedReadings = new Set(["read-001"]);

// ─── Pagination Component ───────────────────────────────────────────────────────

function Pagination({
  current,
  total,
  onPage,
}: {
  current: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  const pageNums = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {Math.min((current - 1) * PAGE_SIZE + 1, total)}
        </span>
        {" – "}
        <span className="font-semibold text-foreground">
          {Math.min(current * PAGE_SIZE, total)}
        </span>
        {" of "}
        <span className="font-semibold text-foreground">{total}</span>
        {" reading exercises"}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pageNums.map((p) => (
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/reading")({
  component: ReadingPage,
});

function ReadingPage() {
  const navigate = useNavigate();

  // Use accessible levels (mock - later from API)
  const studentLevels = studentAccessibleLevels;

  // Default to first accessible level
  const defaultLevel = studentLevels.length > 0 ? studentLevels[0] : "N5";

  const [levelFilter, setLevelFilter] = useState<string>(defaultLevel);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "bookmarked">("all");
  const [isLoading, setIsLoading] = useState(false);

  const handleRowClick = (readingId: string) => {
    console.log("[ReadingList] Row clicked:", readingId);
    navigate({ to: "/student/reading/$readingId", params: { readingId } });
  };

  // Debug: Log filter state
  useEffect(() => {
    console.log("[ReadingList] Filter state:", {
      studentLevels,
      defaultLevel,
      levelFilter,
      statusFilter,
      debouncedSearch,
      totalReadings: filteredReadings.length,
      paginatedReadings: paginatedReadings.length,
    });
  }, [levelFilter, statusFilter, debouncedSearch]);

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

  // Filter readings
  const filteredReadings = useMemo(() => {
    let readings = allMockReading;

    // Filter by level
    if (levelFilter !== "All") {
      readings = readings.filter((r) => r.jlptLevel === levelFilter);
    } else {
      // Show only user level and lower
      const visibleLevels = studentLevels.length > 0 ? studentLevels : ["N5"];
      readings = readings.filter((r) => visibleLevels.includes(r.jlptLevel));
    }

    // Filter by search
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      readings = readings.filter(
        (r) =>
          r.title.toLowerCase().includes(searchLower) ||
          r.tags.some((t) => t.toLowerCase().includes(searchLower)),
      );
    }

    // Filter by status
    if (statusFilter === "completed") {
      readings = readings.filter((r) => completedReadings.has(r.id));
    } else if (statusFilter === "bookmarked") {
      // Mock bookmarked - none for now
      readings = [];
    }

    return readings;
  }, [levelFilter, debouncedSearch, statusFilter, studentLevels]);

  // Pagination
  const totalPages = Math.ceil(filteredReadings.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages || 1));
  const paginatedReadings = filteredReadings.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // Stats
  const totalReadings = allMockReading.length;
  const completedCount = filteredReadings.filter((r) => completedReadings.has(r.id)).length;
  const bookmarkedCount = 0; // Mock for now

  const handleLevelFilter = (level: string) => {
    setLevelFilter(level);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  return (
    <div>
      <SakuraBg count={14} />
      <div className="relative z-10 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h1 className="text-2xl font-display font-black">Reading Lessons</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Practice reading comprehension with authentic Japanese texts from N5 to N1.
            </p>
          </div>
          {!isLoading && (
            <div className="hidden md:flex items-center gap-3">
              {[
                {
                  label: "Total",
                  value: filteredReadings.length,
                  color: "text-blue-500",
                  icon: <BookOpen className="w-4 h-4" />,
                  filter: "all" as const,
                },
                {
                  label: "Completed",
                  value: completedCount,
                  color: "text-green-500",
                  icon: <CheckCircle2 className="w-4 h-4" />,
                  filter: "completed" as const,
                },
                {
                  label: "Bookmarked",
                  value: bookmarkedCount,
                  color: "text-yellow-500",
                  icon: <BookmarkCheck className="w-4 h-4" />,
                  filter: "bookmarked" as const,
                },
              ].map((stat) => (
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reading exercises..."
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
            {/* "All" only shown when student is in multiple levels */}
            {studentLevels.length > 1 && (
              <button
                onClick={() => handleLevelFilter("All")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  levelFilter === "All"
                    ? "bg-gradient-hero text-white shadow"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                All
              </button>
            )}
            {studentLevels.map((l) => (
              <button
                key={l}
                onClick={() => handleLevelFilter(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  levelFilter === l
                    ? "bg-gradient-hero text-white shadow"
                    : "text-muted-foreground hover:bg-muted"
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
              <div className="grid grid-cols-[2fr_80px_1fr_120px_110px_100px_80px] gap-3 px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                <div>Title</div>
                <div>Level</div>
                <div>Duration</div>
                <div className="text-center">Words</div>
                <div className="text-center">Completed</div>
                <div className="text-center">Tags</div>
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
                {!isLoading &&
                  false && ( // Mock error state
                    <div className="py-16 text-center">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-1">Failed to load readings</p>
                      <p className="text-xs text-red-400">Please try again later</p>
                    </div>
                  )}

                {/* Empty State */}
                {!isLoading && filteredReadings.length === 0 && (
                  <div className="py-16 text-center">
                    <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {statusFilter === "bookmarked"
                        ? "No bookmarked readings found."
                        : statusFilter === "completed"
                          ? "No completed readings found."
                          : "Không có bài đọc phù hợp"}
                    </p>
                    {(debouncedSearch || statusFilter !== "all" || levelFilter !== "All") && (
                      <button
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("all");
                          setLevelFilter("All");
                        }}
                        className="mt-2 text-xs text-primary hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}

                {/* Data Rows */}
                {!isLoading &&
                  paginatedReadings.map((reading, i) => {
                    const isCompleted = completedReadings.has(reading.id);
                    const wordCount = reading.passageText.split(/[\s\n]+/).filter(Boolean).length;

                    return (
                      <div
                        key={reading.id}
                        data-reading-id={reading.id}
                        onClick={(e) => {
                          e.preventDefault();
                          console.log("[ReadingList] Row clicked:", reading.id);
                          navigate({
                            to: "/student/reading/$readingId",
                            params: { readingId: reading.id },
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            console.log("[ReadingList] Row keydown:", reading.id);
                            navigate({
                              to: "/student/reading/$readingId",
                              params: { readingId: reading.id },
                            });
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="block relative cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/20 transition select-none"
                      >
                        <div className="grid grid-cols-[2fr_80px_1fr_120px_110px_100px_80px] gap-3 px-6 py-4 items-center">
                          {/* Title */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br ${levelGradients[reading.jlptLevel]}/20`}
                            >
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
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getLevelBoxStyle(reading.jlptLevel, false)}`}
                            >
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

                          {/* Completed */}
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
                            {reading.tags.length > 1 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-muted-foreground text-[10px]">
                                +{reading.tags.length - 1}
                              </span>
                            )}
                          </div>

                          {/* View Button */}
                          <div className="flex justify-center">
                            <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
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
                  onPage={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
