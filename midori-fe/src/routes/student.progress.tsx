import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { motion } from "framer-motion";
import {
  Sparkles,
  Flame,
  Clock,
  Target,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Headphones,
  Mic2,
  FileText,
  GraduationCap,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { BarChart, Bar, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";

// ─── Mock Progress Data Structure ───────────────────────────────────────────

const mockProgressData = {
  vocabulary: 80,
  grammar: 65,
  reading: 70,
  listening: 60,
  shadowing: 75,
};

// Calculate overall progress (average of all skills)
const calculateOverallProgress = () => {
  const skills = Object.values(mockProgressData);
  return Math.round(skills.reduce((sum, val) => sum + val, 0) / skills.length);
};

// Mock learning trend data (Week 1 → Week 2 → Week 3)
const mockLearningTrend = {
  vocabulary: [60, 70, 80],
  grammar: [50, 58, 65],
  reading: [55, 62, 70],
  listening: [45, 52, 60],
  shadowing: [65, 70, 75],
};

// Static badges
const mockBadges = [
  {
    id: 1,
    name: "Consistent Learner",
    icon: Award,
    earned: true,
    description: "Studied for 7 consecutive days",
  },
  {
    id: 2,
    name: "Vocabulary Builder",
    icon: BookOpen,
    earned: true,
    description: "Learned 100+ words",
  },
  {
    id: 3,
    name: "Listening Improver",
    icon: Headphones,
    earned: mockProgressData.listening >= 70,
    description: "Listening score above 70%",
  },
  {
    id: 4,
    name: "Grammar Master",
    icon: GraduationCap,
    earned: false,
    description: "Grammar score above 90%",
  },
  { id: 5, name: "Reading Pro", icon: FileText, earned: false, description: "Read 50+ passages" },
  {
    id: 6,
    name: "Shadowing Expert",
    icon: Mic2,
    earned: false,
    description: "Shadowing score above 90%",
  },
];

// Performance insights based on scores
const getPerformanceInsights = () => {
  const insights = [];

  if (mockProgressData.vocabulary < 70) {
    insights.push({ type: "warning", message: "Bạn cần cải thiện từ vựng", icon: AlertCircle });
  }
  if (mockProgressData.listening < 70) {
    insights.push({ type: "warning", message: "Kỹ năng nghe còn yếu", icon: AlertCircle });
  }
  if (mockProgressData.shadowing < 70) {
    insights.push({
      type: "warning",
      message: "Phát âm và độ trôi chảy cần cải thiện",
      icon: AlertCircle,
    });
  }
  if (mockProgressData.grammar >= 70 && mockProgressData.vocabulary >= 70) {
    insights.push({
      type: "success",
      message: "Nền tảng ngữ pháp và từ vựng tốt!",
      icon: CheckCircle2,
    });
  }

  return insights;
};

// Skill labels and colors
const skillConfig = {
  vocabulary: { label: "Vocabulary", color: "#4F7DF3", bgColor: "bg-blue-500" },
  grammar: { label: "Grammar", color: "#38BDF8", bgColor: "bg-sky-400" },
  reading: { label: "Reading", color: "#A78BFA", bgColor: "bg-purple-400" },
  listening: { label: "Listening", color: "#F9A8D4", bgColor: "bg-pink-400" },
  shadowing: { label: "Shadowing", color: "#FDA4AF", bgColor: "bg-rose-400" },
};

// Trend chart data
const trendChartData = [
  { week: "Week 1", vocabulary: 60, grammar: 50, reading: 55, listening: 45, shadowing: 65 },
  { week: "Week 2", vocabulary: 70, grammar: 58, reading: 62, listening: 52, shadowing: 70 },
  { week: "Week 3", vocabulary: 80, grammar: 65, reading: 70, listening: 60, shadowing: 75 },
];

// ─── Chart colors ────────────────────────────────────────────────────────────

function getChartColors() {
  const isDark =
    document.documentElement.classList.contains("dark") || document.body.classList.contains("dark");
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
  const overallProgress = calculateOverallProgress();
  const insights = getPerformanceInsights();

  return (
    <div className="space-y-5">
      <PageHeader title="Learning Progress" subtitle="Track your Japanese learning journey" />

      {/* ─── Stats Row ─── */}
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Learned Words",
              value: "245",
              delta: "+18%",
              up: true,
              icon: Sparkles,
              bgLight: "bg-primary/10 dark:bg-primary/20",
              textLight: "text-primary dark:text-primary/90",
            },
            {
              label: "Study Streak",
              value: "7 days",
              delta: "+4",
              up: true,
              icon: Flame,
              bgLight: "bg-orange-50 dark:bg-orange-950/50",
              textLight: "text-orange-500 dark:text-orange-300",
            },
            {
              label: "Completed Lessons",
              value: "32",
              delta: "+12%",
              up: true,
              icon: Clock,
              bgLight: "bg-sky-blue/10 dark:bg-sky-blue/15",
              textLight: "text-sky-blue dark:text-sky-blue/90",
            },
            {
              label: "Mastered Words",
              value: "89",
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
                className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${kpi.bgLight} ${kpi.textLight}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <div className="font-display font-bold text-2xl text-foreground">{kpi.value}</div>
                <div
                  className={`flex items-center gap-1 text-xs font-semibold mt-1 ${kpi.up ? "text-green-500 dark:text-green-400" : "text-red-400"}`}
                >
                  <ArrowUpRight className="w-3 h-3" />
                  {kpi.delta}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ─── Overall Progress & Skill Breakdown ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overall Progress */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700"
          >
            <h3 className="font-display font-bold text-base flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-primary" />
              Overall Progress
            </h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#progressGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(overallProgress / 100) * 352} 352`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4F7DF3" />
                      <stop offset="100%" stopColor="#A78BFA" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">{overallProgress}%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">Average across all skills</p>
          </motion.div>

          {/* Skill Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700"
          >
            <h3 className="font-display font-bold text-base flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              Skill Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(mockProgressData).map(([skill, value]) => {
                const config = skillConfig[skill as keyof typeof skillConfig];
                return (
                  <div key={skill} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{config.label}</span>
                      <span className="font-semibold" style={{ color: config.color }}>
                        {value}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${config.bgColor}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ─── Learning Trend ─── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Learning Trend
            </h3>
            <div className="flex flex-wrap gap-3 text-xs">
              {Object.entries(skillConfig).map(([key, config]) => (
                <span key={key} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                  {config.label}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Progress over the last 3 weeks</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendChartData}
                barCategoryGap="35%"
                barGap={4}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.grid}
                  opacity={1}
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: chartColors.axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: chartColors.axis }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
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
                />
                <Bar dataKey="vocabulary" fill="#4F7DF3" radius={[5, 5, 0, 0]} barSize={18} />
                <Bar dataKey="grammar" fill="#38BDF8" radius={[5, 5, 0, 0]} barSize={18} />
                <Bar dataKey="reading" fill="#A78BFA" radius={[5, 5, 0, 0]} barSize={18} />
                <Bar dataKey="listening" fill="#F9A8D4" radius={[5, 5, 0, 0]} barSize={18} />
                <Bar dataKey="shadowing" fill="#FDA4AF" radius={[5, 5, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </>
    </div>
  );
}
