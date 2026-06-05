import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { motion } from "framer-motion";
import {
  Sparkles, Flame, Clock, Target, ArrowUpRight,
  BarChart3
} from "lucide-react";
import {
  BarChart, Bar, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
} from "recharts";

// ─── Mock Data ─────────────────────────────────────────────────────────────

const weeklyStudyData = [
  { day: "Mon", vocab: 45, grammar: 30, listening: 25, shadow: 20 },
  { day: "Tue", vocab: 30, grammar: 45, listening: 15, shadow: 30 },
  { day: "Wed", vocab: 60, grammar: 20, listening: 40, shadow: 15 },
  { day: "Thu", vocab: 25, grammar: 55, listening: 20, shadow: 35 },
  { day: "Fri", vocab: 50, grammar: 25, listening: 30, shadow: 25 },
  { day: "Sat", vocab: 70, grammar: 40, listening: 50, shadow: 40 },
  { day: "Sun", vocab: 40, grammar: 35, listening: 25, shadow: 30 },
];

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
            label: "Total XP",
            value: "9,840",
            delta: "+18%",
            up: true,
            icon: Sparkles,
            color: "primary",
            bgLight: "bg-primary/10 dark:bg-primary/20",
            textLight: "text-primary dark:text-primary/90",
          },
          {
            label: "Study Streak",
            value: "32 days",
            delta: "+4",
            up: true,
            icon: Flame,
            color: "orange",
            bgLight: "bg-orange-50 dark:bg-orange-950/50",
            textLight: "text-orange-500 dark:text-orange-300",
          },
          {
            label: "This Month",
            value: "48.2h",
            delta: "+12%",
            up: true,
            icon: Clock,
            color: "sky",
            bgLight: "bg-sky-blue/10 dark:bg-sky-blue/15",
            textLight: "text-sky-blue dark:text-sky-blue/90",
          },
          {
            label: "Accuracy",
            value: "83%",
            delta: "+3%",
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
              data={weeklyStudyData}
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
    </div>
  );
}
