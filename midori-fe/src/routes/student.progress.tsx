import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { motion } from "framer-motion";
import {
  Sparkles, Flame, Clock, Target, ArrowUpRight,
  BarChart3, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { studentProgressApi } from "@/lib/api/studentProgress";
import { ApiError } from "@/lib/api/client";
import { useMemo } from "react";

// ─── Chart colors ────────────────────────────────────────────────────────────

function getChartColors() {
  const isDark =
    document.documentElement.classList.contains("dark") ||
    document.body.classList.contains("dark");
  return {
    axis: isDark ? "rgba(203,213,225,0.82)" : "rgba(71,85,105,0.85)",
    grid: isDark ? "rgba(148,163,184,0.22)" : "rgba(148,163,184,0.28)",
    legendText: isDark ? "rgba(226,232,240,0.78)" : "rgba(51,65,85,0.88)",
    barVocab: isDark ? "#8EA7FF" : "#4F7DF3",
    barGrammar: isDark ? "#67E8F9" : "#38BDF8",
    barListening: isDark ? "#C4B5FD" : "#A78BFA",
    barShadow: isDark ? "#FDA4AF" : "#F9A8D4",
    tooltipBg: isDark ? "rgba(14,20,40,0.97)" : "rgba(255,255,255,0.97)",
    tooltipBorder: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    tooltipText: isDark ? "#F1F5F9" : "#0F172A",
    tooltipLabel: isDark ? "rgba(203,213,225,0.75)" : "#64748B",
    legendColors: isDark
      ? ["#8EA7FF", "#67E8F9", "#C4B5FD", "#FDA4AF"]
      : ["#4F7DF3", "#38BDF8", "#A78BFA", "#F9A8D4"],
  };
}

// ─── Main Component ─────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const chartColors = getChartColors();

  // ── Fetch progress stats from API ────────────────────────────────────────
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["progress-stats"],
    queryFn: () => studentProgressApi.getProgressStats(),
    staleTime: 60 * 1000, // 1 minute
  });

  const errorMessage = error instanceof ApiError ? error.message : "Failed to load progress statistics.";

  // Convert weeklyStudyData from API to chart format
  const weeklyStudyData = (stats?.weeklyStudyData ?? []).map((item) => ({
    day: item.day,
    vocab: item.vocabCount ?? 0,
    grammar: item.grammarCount ?? 0,
    listening: 0,
    shadow: 0,
  }));

  // Ensure we have 7 days for the chart
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chartData = useMemo(() => {
    if (weeklyStudyData.length === 0) {
      return dayOrder.map((day) => ({ day, vocab: 0, grammar: 0, listening: 0, shadow: 0 }));
    }
    return dayOrder.map((day) => {
      const found = weeklyStudyData.find((d) => d.day === day);
      return found ?? { day, vocab: 0, grammar: 0, listening: 0, shadow: 0 };
    });
  }, [weeklyStudyData]);

  const statsData = {
    totalXp: stats?.progressPercent ? Math.round(stats.progressPercent * 100) : 0,
    studyStreak: stats?.learningStreak ?? 0,
    learnedWords: stats?.learnedWords ?? 0,
    masteredWords: stats?.masteredWords ?? 0,
    completedLessons: stats?.completedLessons ?? 0,
    favoriteWords: stats?.favoriteWords ?? 0,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Learning Progress"
        subtitle="Track your Japanese learning journey"
      />

      {/* ─── Loading State ─── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-sm font-semibold text-muted-foreground">Loading progress...</span>
        </div>
      )}

      {/* ─── Error State ─── */}
      {!isLoading && error && (
        <div className="text-center py-12 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <Sparkles className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-500 mb-2 font-semibold">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* ─── Stats Row ─── */}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Learned Words",
                value: statsData.learnedWords.toLocaleString(),
                delta: "+18%",
                up: true,
                icon: Sparkles,
                bgLight: "bg-primary/10 dark:bg-primary/20",
                textLight: "text-primary dark:text-primary/90",
              },
              {
                label: "Study Streak",
                value: `${statsData.studyStreak} days`,
                delta: "+4",
                up: true,
                icon: Flame,
                bgLight: "bg-orange-50 dark:bg-orange-950/50",
                textLight: "text-orange-500 dark:text-orange-300",
              },
              {
                label: "Completed Lessons",
                value: statsData.completedLessons.toString(),
                delta: "+12%",
                up: true,
                icon: Clock,
                bgLight: "bg-sky-blue/10 dark:bg-sky-blue/15",
                textLight: "text-sky-blue dark:text-sky-blue/90",
              },
              {
                label: "Mastered Words",
                value: statsData.masteredWords.toLocaleString(),
                delta: "+3%",
                up: true,
                icon: Target,
                bgLight: "bg-green-50 dark:bg-green-950/50",
                textLight: "text-green-600 dark:text-green-300",
              },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass rounded-2xl p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${kpi.bgLight} ${kpi.textLight}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <div className="font-display font-bold text-2xl text-foreground">
                    {kpi.value}
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${kpi.up ? "text-green-500 dark:text-green-400" : "text-red-400"}`}>
                    <ArrowUpRight className="w-3 h-3" />
                    {kpi.delta}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ─── Weekly Study Breakdown ─── */}
          <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Weekly Study Breakdown
          </h3>
          <div className="flex gap-4 text-xs">
            {[
              { l: "Vocab" },
              { l: "Grammar" },
              { l: "Listening" },
              { l: "Shadow" },
            ].map((c, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs" style={{ color: chartColors.legendText }}>
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: chartColors.legendColors[i] }}
                />
                {c.l}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Study time distribution by skill</p>
        <div style={{ height: 235 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              barCategoryGap="28%"
              barGap={3}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={1} vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: chartColors.axis }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: chartColors.axis }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  backgroundColor: chartColors.tooltipBg,
                  color: chartColors.tooltipText,
                }}
                labelStyle={{ color: chartColors.tooltipLabel, fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: chartColors.tooltipText, paddingTop: 2 }}
                formatter={(value: number, name: string) => {
                  const itemColors: Record<string, string> = {
                    vocab: chartColors.barVocab,
                    grammar: chartColors.barGrammar,
                    listening: chartColors.barListening,
                    shadow: chartColors.barShadow,
                  };
                  const labels: Record<string, string> = {
                    vocab: "Vocab",
                    grammar: "Grammar",
                    listening: "Listening",
                    shadow: "Shadow",
                  };
                  return [
                    <span key="val" style={{ color: itemColors[name] ?? chartColors.tooltipText, fontWeight: 600 }}>
                      {value} min
                    </span>,
                    labels[name] ?? name,
                  ];
                }}
              />
              <Bar dataKey="vocab" fill={chartColors.barVocab} radius={[5, 5, 0, 0]} barSize={12} />
              <Bar dataKey="grammar" fill={chartColors.barGrammar} radius={[5, 5, 0, 0]} barSize={12} />
              <Bar dataKey="listening" fill={chartColors.barListening} radius={[5, 5, 0, 0]} barSize={12} />
              <Bar dataKey="shadow" fill={chartColors.barShadow} radius={[5, 5, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
        </>
      )}
    </div>
  );
}
