import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-ui";
import { motion } from "framer-motion";
import {
  Sparkles, Flame, Clock, Target, ArrowUpRight,
  BarChart3
} from "lucide-react";
import {
  BarChart, Bar, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { studentProgressApi } from "@/lib/api/studentProgress";

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

  // ── Query: Progress Stats ────────────────────────────────────────────────
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ["progress-stats"],
    queryFn: () => studentProgressApi.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Transform weeklyStudyData from API to chart format
  const chartData = stats?.weeklyStudyData?.map((d) => ({
    day: d.dayOfWeek.substring(0, 3),
    vocab: d.count,
    grammar: 0,
    listening: 0,
    shadow: 0,
  })) ?? [];

  if (isError) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Learning Progress"
          subtitle="Track your Japanese learning journey"
        />
        <div className="text-center py-16 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <p className="text-red-500 font-semibold mb-2">Failed to load progress data</p>
          <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? "Something went wrong"}</p>
        </div>
      </div>
    );
  }

  // Stats derived from API
  const totalLearned = stats?.learnedCount ?? 0;
  const totalMastered = stats?.masteredCount ?? 0;
  const totalCompleted = stats?.completedCount ?? 0;
  const totalFavorites = stats?.favoritesCount ?? 0;
  const totalItems = stats?.totalItems ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Learning Progress"
        subtitle="Track your Japanese learning journey"
      />

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Items",
            value: isLoading ? "..." : totalItems.toLocaleString(),
            delta: null,
            up: true,
            icon: Sparkles,
            color: "primary",
            bgLight: "bg-primary/10 dark:bg-primary/20",
            textLight: "text-primary dark:text-primary/90",
          },
          {
            label: "Learned",
            value: isLoading ? "..." : totalLearned.toLocaleString(),
            delta: null,
            up: true,
            icon: Flame,
            color: "orange",
            bgLight: "bg-orange-50 dark:bg-orange-950/50",
            textLight: "text-orange-500 dark:text-orange-300",
          },
          {
            label: "Mastered",
            value: isLoading ? "..." : totalMastered.toLocaleString(),
            delta: null,
            up: true,
            icon: Clock,
            color: "sky",
            bgLight: "bg-sky-blue/10 dark:bg-sky-blue/15",
            textLight: "text-sky-blue dark:text-sky-blue/90",
          },
          {
            label: "Completed",
            value: isLoading ? "..." : totalCompleted.toLocaleString(),
            delta: null,
            up: true,
            icon: Target,
            color: "green",
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
                {isLoading ? (
                  <span className="opacity-50">—</span>
                ) : (
                  kpi.value
                )}
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
          {isLoading && (
            <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-4">Study activity by day</p>
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
                formatter={(value, name) => {
                  const itemColors: Record<string, string> = {
                    vocab: chartColors.barVocab,
                    grammar: chartColors.barGrammar,
                    listening: chartColors.barListening,
                    shadow: chartColors.barShadow,
                  };
                  const labels: Record<string, string> = {
                    vocab: "Study Activity",
                    grammar: "Grammar",
                    listening: "Listening",
                    shadow: "Shadow",
                  };
                  return [
                    <span key="val" style={{ color: itemColors[name as string] ?? chartColors.tooltipText, fontWeight: 600 }}>
                      {String(value ?? 0)}
                    </span>,
                    labels[name as string] ?? name,
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
    </div>
  );
}
