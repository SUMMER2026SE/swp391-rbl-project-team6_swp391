import React from "react";
import { Card } from "@/components/page-ui";
import { Award, CheckCircle, Trophy, Sparkles, TrendingUp, BookOpen } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { TeacherClassInfo } from "@/types/teacher-class";

interface TeacherAnalyticsTabProps {
  classInfo: TeacherClassInfo;
}

export function TeacherAnalyticsTab({ classInfo }: TeacherAnalyticsTabProps) {
  const analytics = classInfo.analytics;

  // Map Recharts module progress
  const chartData = [
    { name: "Vocab", progress: analytics.progressByModule.vocabulary },
    { name: "Grammar", progress: analytics.progressByModule.grammar },
    { name: "Listening", progress: analytics.progressByModule.listening },
    { name: "Reading", progress: analytics.progressByModule.reading },
    { name: "Shadowing", progress: analytics.progressByModule.shadowing },
    { name: "Writing", progress: analytics.progressByModule.writing },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4 border-emerald-500/20 bg-emerald-500/[0.005]">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 grid place-items-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
              Average Class Score
            </div>
            <div className="font-display font-black text-xl text-foreground mt-0.5">
              {analytics.avgScore} / 10
            </div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-blue-500/20 bg-blue-500/[0.005]">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 grid place-items-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
              Submission Rate
            </div>
            <div className="font-display font-black text-xl text-foreground mt-0.5">
              {analytics.submissionRate}%
            </div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-amber-500/20 bg-amber-500/[0.005] sm:col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 grid place-items-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
              Top Student
            </div>
            <div className="font-display font-black text-xl text-foreground mt-0.5">
              {analytics.topStudents[0]}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Recharts graph + Diagnostic list widgets */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Module Completion Bar Chart */}
        <Card className="p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Progress by Module (%)
          </h3>
          <p className="text-[10px] text-muted-foreground mb-4">
            Average syllabus completion per language skill module.
          </p>

          <div className="h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="40%">
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
                <Bar dataKey="progress" fill="oklch(0.62 0.18 270)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Diagnostic Widgets */}
        <div className="space-y-4">
          {/* Weakest Topics List */}
          <Card className="p-5 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Weakest Classroom Topics
            </h4>
            <div className="space-y-2">
              {analytics.weakestTopics.map((topic, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-slate-100 dark:border-white/5 rounded-xl bg-slate-50/20 dark:bg-white/[0.002] text-xs font-semibold text-foreground dark:text-slate-200"
                >
                  {topic}
                </div>
              ))}
            </div>
          </Card>

          {/* Difficult Assignments List */}
          <Card className="p-5 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Most Difficult Assignments
            </h4>
            <div className="space-y-2">
              {analytics.mostDifficultAssignments.map((ass, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-slate-100 dark:border-white/5 rounded-xl bg-slate-50/20 dark:bg-white/[0.002] text-xs font-semibold text-foreground dark:text-slate-200"
                >
                  {ass}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
