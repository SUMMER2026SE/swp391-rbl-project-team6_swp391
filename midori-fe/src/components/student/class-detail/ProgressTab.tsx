import React, { useMemo } from "react";
import { Card, Progress } from "@/components/page-ui";
import { Award, Flame, LineChart, TrendingUp, CheckCircle } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { DetailedClassInfo } from "@/types/class-detail";

interface ProgressTabProps {
  classInfo: DetailedClassInfo;
}

const MODULE_ORDER = [
  { key: "Vocabulary", label: "Vocab" },
  { key: "Grammar", label: "Grammar" },
  { key: "Listening", label: "Listening" },
  { key: "Reading", label: "Reading" },
  { key: "Shadowing", label: "Shadowing" },
  { key: "Writing", label: "Writing" },
] as const;

const moduleCounts = (classInfo: DetailedClassInfo) => {
  const counts: Record<string, { completed: number; total: number }> = {};
  for (const m of MODULE_ORDER) counts[m.key] = { completed: 0, total: 0 };

  for (const a of classInfo.assignments) {
    const key = a.moduleType as string;
    if (!counts[key]) continue;
    counts[key].total += 1;
    if (a.status === "Submitted" || a.status === "Graded") {
      counts[key].completed += 1;
    }
  }
  return counts;
};

const computeProgress = (classInfo: DetailedClassInfo) => {
  const total = classInfo.assignments.length;
  if (total === 0) {
    return { percent: 0, completed: 0, total: 0 };
  }
  const completed = classInfo.assignments.filter(
    (a) => a.status === "Submitted" || a.status === "Graded",
  ).length;
  return {
    percent: Math.round((completed / total) * 100),
    completed,
    total,
  };
};

// Average Score = mean of (score / maxScore * 100) across all Graded assignments.
// Falls back to "--" when there is no graded work yet.
const computeAverageScore = (classInfo: DetailedClassInfo): number | null => {
  const graded = classInfo.assignments.filter(
    (a) => a.status === "Graded" && typeof a.score === "number" && a.maxScore > 0,
  );
  if (graded.length === 0) return null;
  const sum = graded.reduce((s, a) => s + (a.score! / a.maxScore) * 100, 0);
  return sum / graded.length;
};

const formatAverageScore = (avg: number | null) => {
  if (avg === null) return "--";
  return `${avg.toFixed(1)}`;
};

export function ProgressTab({ classInfo }: ProgressTabProps) {
  const { percent, completed, total } = useMemo(() => computeProgress(classInfo), [classInfo]);
  const avgScore = useMemo(() => computeAverageScore(classInfo), [classInfo]);
  const counts = useMemo(() => moduleCounts(classInfo), [classInfo]);

  const skillData = MODULE_ORDER.map((m) => {
    const c = counts[m.key];
    const val = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
    return { name: m.label, val };
  });

  const modules = MODULE_ORDER.map((m) => {
    const c = counts[m.key];
    const val = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
    return {
      name: m.key,
      val,
      completed: c.total > 0 ? `${c.completed}/${c.total} lessons` : "0/0 lessons",
    };
  });

  const syllabusLabel = total > 0 ? `${percent}% Completed` : "No assignments yet";
  const avgScoreLabel = formatAverageScore(avgScore);

  return (
    <div className="space-y-6">
      {/* KPI stats row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3.5 border-blue-500/20 bg-blue-500/[0.005]">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 grid place-items-center shrink-0">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
              Syllabus Completion
            </div>
            <div className="font-display font-black text-lg text-foreground mt-0.5">
              {syllabusLabel}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {completed} of {total} assignments
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-green-500/20 bg-green-500/[0.005]">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 grid place-items-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                Average Score
              </div>
              <div className="font-display font-black text-lg text-foreground mt-0.5">
                {avgScore !== null ? `${avgScoreLabel}%` : avgScoreLabel}
              </div>
            </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-orange-500/20 bg-orange-500/[0.005]">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 grid place-items-center shrink-0">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
              Completion Rate
            </div>
            <div className="font-display font-black text-lg text-foreground mt-0.5">
              {percent}%
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Submitted or graded
            </div>
          </div>
        </Card>
      </div>

      {/* Recharts graph */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Skill Progress Chart (%)
          </h3>
          <p className="text-[10px] text-muted-foreground mb-4">
            Completion percentage per language skill module.
          </p>

          <div className="h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillData} barCategoryGap="40%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.9 0.02 300)"
                  opacity={0.25}
                  vertical={false}
                />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                    backgroundColor: "var(--card)",
                  }}
                />
                <Bar dataKey="val" fill="oklch(0.62 0.18 270)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Modules completion checklist */}
        <Card className="p-5 space-y-4">
          <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
            <CheckCircle className="w-4 h-4 text-green-500" /> Syllabus Modules
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {modules.map((m, idx) => (
              <div
                key={idx}
                className="p-3 border border-slate-200/40 dark:border-white/5 bg-slate-50/10 dark:bg-white/[0.002] rounded-2xl flex flex-col justify-between min-h-[90px]"
              >
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-foreground dark:text-slate-300">
                    <span>{m.name}</span>
                    <span className="text-primary font-black">{m.val}%</span>
                  </div>
                  <div className="mt-2">
                    <Progress value={m.val} />
                  </div>
                </div>
                <div className="text-[9px] text-muted-foreground mt-2 border-t border-slate-100 dark:border-white/5 pt-1.5">
                  {m.completed}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
