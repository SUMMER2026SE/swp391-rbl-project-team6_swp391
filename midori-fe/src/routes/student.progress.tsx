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
  { day: "Mon", vocabulary: 45, grammar: 30, listening: 25, shadowing: 20 },
  { day: "Tue", vocabulary: 30, grammar: 45, listening: 15, shadowing: 30 },
  { day: "Wed", vocabulary: 60, grammar: 20, listening: 40, shadowing: 15 },
  { day: "Thu", vocabulary: 25, grammar: 55, listening: 20, shadowing: 35 },
  { day: "Fri", vocabulary: 50, grammar: 25, listening: 30, shadowing: 25 },
  { day: "Sat", vocabulary: 70, grammar: 40, listening: 50, shadowing: 40 },
  { day: "Sun", vocabulary: 40, grammar: 35, listening: 25, shadowing: 30 },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Learning Progress"
        subtitle="Track your Japanese learning journey"
      />

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total XP", value: "9,840", delta: "+18%", up: true, icon: Sparkles, color: "primary" },
          { label: "Study Streak", value: "32 days", delta: "+4", up: true, icon: Flame, color: "orange" },
          { label: "This Month", value: "48.2h", delta: "+12%", up: true, icon: Clock, color: "sky" },
          { label: "Accuracy", value: "83%", delta: "+3%", up: true, icon: Target, color: "green" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  kpi.color === "primary" ? "bg-primary/10 text-primary" :
                  kpi.color === "orange" ? "bg-orange-100 text-orange-500 dark:bg-orange-950/30" :
                  kpi.color === "sky" ? "bg-sky-blue/10 text-sky-blue" :
                  "bg-green-100 text-green-500 dark:bg-green-950/30"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <div className="font-display font-black text-2xl">{kpi.value}</div>
              <div className={`flex items-center gap-1 text-[10px] font-semibold mt-1 ${kpi.up ? "text-green-500" : "text-red-400"}`}>
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
          <div className="flex gap-3 text-[10px]">
            {[{ c: "oklch(0.62 0.18 270)", l: "Vocab" }, { c: "oklch(0.72 0.15 230)", l: "Grammar" }, { c: "oklch(0.75 0.18 340)", l: "Listening" }, { c: "oklch(0.6 0.22 25)", l: "Shadow" }].map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.c }} /> {c.l}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Study time distribution by skill</p>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyStudyData} barCategoryGap="30%" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" opacity={0.5} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'oklch(0.5 0.02 300)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'oklch(0.5 0.02 300)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", backgroundColor: 'oklch(0.99 0 0)' }} labelStyle={{ color: 'oklch(0.2 0 0)', fontWeight: 600 }} />
              <Bar dataKey="vocabulary" fill="oklch(0.62 0.18 270)" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="grammar" fill="oklch(0.72 0.15 230)" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="listening" fill="oklch(0.75 0.18 340)" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="shadowing" fill="oklch(0.6 0.22 25)" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
