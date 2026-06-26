import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Clock,
  Calendar,
  Trophy,
  Target,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  Filter,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import {
  readingProgressStore,
  readingStatsStore,
  type ReadingProgress,
} from "@/mock/reading/progress";
import { allMockReading } from "@/mock/reading";

export const Route = createFileRoute("/student/learning/reading/history")({
  component: ReadingHistoryPage,
});

const levelColors: Record<string, string> = {
  N5: "bg-blue-500/20 text-blue-400 border-blue-400/30",
  N4: "bg-green-500/20 text-green-400 border-green-400/30",
  N3: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  N2: "bg-orange-500/20 text-orange-400 border-orange-400/30",
  N1: "bg-red-500/20 text-red-400 border-red-400/30",
};

type FilterType = "all" | "completed" | "in-progress";

export function ReadingHistoryPage() {
  const [history, setHistory] = useState<ReadingProgress[]>([]);
  const [stats, setStats] = useState(readingStatsStore.getDefaultStats());
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<"recent" | "score" | "time">("recent");

  // Load history from localStorage
  useEffect(() => {
    const allProgress = readingProgressStore.getAllProgress();
    const progressList = Object.values(allProgress);

    // Sort by last accessed
    progressList.sort(
      (a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime(),
    );

    setHistory(progressList);
    setStats(readingStatsStore.getStats());
  }, []);

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    if (filter === "completed") {
      filtered = filtered.filter((h) => h.status === "completed");
    } else if (filter === "in-progress") {
      filtered = filtered.filter((h) => h.status === "in-progress");
    }

    if (sortBy === "score") {
      filtered.sort((a, b) => {
        const scoreA = a.score && a.maxScore ? (a.score / a.maxScore) * 100 : 0;
        const scoreB = b.score && b.maxScore ? (b.score / b.maxScore) * 100 : 0;
        return scoreB - scoreA;
      });
    } else if (sortBy === "time") {
      filtered.sort((a, b) => (b.timeSpent || 0) - (a.timeSpent || 0));
    }

    return filtered;
  }, [history, filter, sortBy]);

  // Stats calculations
  const totalLessons = history.length;
  const completedLessons = history.filter((h) => h.status === "completed").length;
  const totalTime = history.reduce((sum, h) => sum + (h.timeSpent || 0), 0);
  const averageScore = stats.averageScore;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getReadingTitle = (lessonId: string) => {
    const reading = allMockReading.find((r) => r.id === lessonId);
    return reading?.title || lessonId;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case "in-progress":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs font-semibold">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs font-semibold">
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen relative">
      <SakuraBg count={14} />
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Link
                to="/student/learning/reading"
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/20 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-display font-black text-slate-800 dark:text-white">
                  Reading History
                </h1>
                <p className="text-xs text-muted-foreground">
                  Track your reading progress and performance
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-muted-foreground font-medium">Total Lessons</span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-white">
                {totalLessons}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-xs text-muted-foreground font-medium">Completed</span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-white">
                {completedLessons}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-purple-500" />
                <span className="text-xs text-muted-foreground font-medium">Avg Score</span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-white">
                {averageScore}%
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-xs text-muted-foreground font-medium">Total Time</span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-white">
                {formatTime(totalTime)}
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-white/80 dark:bg-slate-800/50 rounded-xl p-1 border border-slate-200 dark:border-white/10">
              {(["all", "completed", "in-progress"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filter === f
                      ? "bg-gradient-hero text-white shadow"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f === "all" ? "All" : f === "completed" ? "Completed" : "In Progress"}
                </button>
              ))}
            </div>

            <div className="flex gap-1 bg-white/80 dark:bg-slate-800/50 rounded-xl p-1 border border-slate-200 dark:border-white/10">
              {[
                { id: "recent" as const, label: "Recent" },
                { id: "score" as const, label: "Score" },
                { id: "time" as const, label: "Time" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    sortBy === s.id
                      ? "bg-gradient-hero text-white shadow"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s.id === "recent" && <Clock className="w-3 h-3" />}
                  {s.id === "score" && <Target className="w-3 h-3" />}
                  {s.id === "time" && <TrendingUp className="w-3 h-3" />}
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* History List */}
          {filteredHistory.length > 0 ? (
            <div className="space-y-3">
              {filteredHistory.map((item, index) => {
                const reading = allMockReading.find((r) => r.id === item.lessonId);
                const scorePercent =
                  item.score && item.maxScore
                    ? Math.round((item.score / item.maxScore) * 100)
                    : null;

                return (
                  <motion.div
                    key={item.lessonId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to="/student/learning/reading/$readingId"
                      params={{ readingId: item.lessonId }}
                      className="block bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 dark:border-white/10 hover:shadow-lg hover:border-primary/30 transition group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {reading && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-sm ${levelColors[reading.jlptLevel]}`}
                              >
                                {reading.jlptLevel}
                              </span>
                            )}
                            {getStatusBadge(item.status)}
                          </div>
                          <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-primary transition truncate">
                            {getReadingTitle(item.lessonId)}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.lastAccessedAt)}
                            </span>
                            {item.timeSpent && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(item.timeSpent)}
                              </span>
                            )}
                          </div>
                        </div>

                        {scorePercent !== null && (
                          <div className="text-right">
                            <div
                              className={`text-2xl font-black ${
                                scorePercent >= 80
                                  ? "text-green-500"
                                  : scorePercent >= 60
                                    ? "text-yellow-500"
                                    : "text-red-500"
                              }`}
                            >
                              {scorePercent}%
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {item.score}/{item.maxScore} correct
                            </div>
                          </div>
                        )}
                      </div>

                      {item.answers && item.answers.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {item.answers.map((answer, i) => (
                                <div
                                  key={i}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    answer.isCorrect
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-600"
                                  }`}
                                >
                                  {answer.isCorrect ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                </div>
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {item.answers.filter((a) => a.isCorrect).length}/{item.answers.length}{" "}
                              answers
                            </span>
                          </div>
                        </div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 dark:border-white/10 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                No reading history yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start reading lessons to track your progress here.
              </p>
              <Link
                to="/student/learning/reading"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-hero text-white font-semibold text-sm hover:opacity-90 transition"
              >
                <BookOpen className="w-4 h-4" />
                Browse Readings
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
