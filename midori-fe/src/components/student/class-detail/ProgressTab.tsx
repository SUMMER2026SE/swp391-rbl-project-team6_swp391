import React from "react";
import { Card, Progress } from "@/components/page-ui";
import { Award, Flame, LineChart, TrendingUp, CheckCircle } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { DetailedClassInfo } from "@/types/class-detail";

interface ProgressTabProps {
  classInfo: DetailedClassInfo;
}

export function ProgressTab({ classInfo }: ProgressTabProps) {
  // Stats
  const avgScore = 8.5; // system context mock
  const currentStreak = 32; // system context mock

  const skillData = [
    { name: "Vocab", val: classInfo.progress.vocabulary },
    { name: "Grammar", val: classInfo.progress.grammar },
    { name: "Listening", val: classInfo.progress.listening },
    { name: "Reading", val: classInfo.progress.reading },
    { name: "Shadowing", val: classInfo.progress.shadowing },
    { name: "Writing", val: classInfo.progress.writing }
  ];

  const modules = [
    { name: "Vocabulary", val: classInfo.progress.vocabulary, completed: "12/15 lessons" },
    { name: "Grammar", val: classInfo.progress.grammar, completed: "6/10 lessons" },
    { name: "Listening", val: classInfo.progress.listening, completed: "3/8 lessons" },
    { name: "Reading", val: classInfo.progress.reading, completed: "3/6 lessons" },
    { name: "Shadowing", val: classInfo.progress.shadowing, completed: "4/12 lessons" },
    { name: "Writing", val: classInfo.progress.writing, completed: "1/5 lessons" }
  ];

  return (
    <div className="space-y-6">
      {/* KPI stats row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3.5 border-orange-500/20 bg-orange-500/[0.005]">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 grid place-items-center shrink-0">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Learning Streak</div>
            <div className="font-display font-black text-lg text-foreground mt-0.5">{currentStreak} Days</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-green-500/20 bg-green-500/[0.005]">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 grid place-items-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Average Score</div>
            <div className="font-display font-black text-lg text-foreground mt-0.5">{avgScore} / 10</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-blue-500/20 bg-blue-500/[0.005]">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 grid place-items-center shrink-0">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Syllabus Completion</div>
            <div className="font-display font-black text-lg text-foreground mt-0.5">54% Completed</div>
          </div>
        </Card>
      </div>

      {/* Recharts graph */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Skill Progress Chart (%)
          </h3>
          <p className="text-[10px] text-muted-foreground mb-4">Completion percentage per language skill module.</p>
          
          <div className="h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 300)" opacity={0.25} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", backgroundColor: "var(--card)" }} />
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
              <div key={idx} className="p-3 border border-slate-200/40 dark:border-white/5 bg-slate-50/10 dark:bg-white/[0.002] rounded-2xl flex flex-col justify-between min-h-[90px]">
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-foreground dark:text-slate-300">
                    <span>{m.name}</span>
                    <span className="text-primary font-black">{m.val}%</span>
                  </div>
                  <div className="mt-2">
                    <Progress value={m.val} />
                  </div>
                </div>
                <div className="text-[9px] text-muted-foreground mt-2 border-t border-slate-100 dark:border-white/5 pt-1.5">{m.completed}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
