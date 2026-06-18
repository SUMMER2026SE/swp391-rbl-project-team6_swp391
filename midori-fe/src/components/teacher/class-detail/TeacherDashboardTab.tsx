import React from "react";
import { Card } from "@/components/page-ui";
import {
  Users, ClipboardList, CheckSquare, Clock, Award, LineChart,
  AlertTriangle, ArrowRight, Play, BookOpen, PlusCircle, MessageSquare
} from "lucide-react";
import type { TeacherClassInfo } from "@/types/teacher-class";

interface TeacherDashboardTabProps {
  classInfo: TeacherClassInfo;
  onSelectTab: (tabId: string) => void;
}

export function TeacherDashboardTab({ classInfo, onSelectTab }: TeacherDashboardTabProps) {
  // Count stats
  const needGradingCount = classInfo.assignments.filter(a => a.status === "Active" && a.totalSubmissions > 0).length;
  const overdueCount = classInfo.students.reduce((acc, s) => acc + (s.overdueCount || 0), 0);
  const lowScoreCount = classInfo.students.filter(s => s.avgScore < 7).length;

  const stats = [
    { label: "Students", value: classInfo.members, icon: Users, color: "text-blue-500 bg-blue-500/10" },
    { label: "Assignments", value: classInfo.assignmentCount, icon: ClipboardList, color: "text-purple-500 bg-purple-500/10" },
    { label: "Need Grading", value: needGradingCount, icon: CheckSquare, color: "text-amber-500 bg-amber-500/10" },
    { label: "Overdue", value: overdueCount, icon: Clock, color: "text-red-500 bg-red-500/10" },
    { label: "Average Score", value: `${classInfo.avgScore}/10`, icon: Award, color: "text-green-500 bg-green-500/10" },
    { label: "Completion Rate", value: `${classInfo.analytics.submissionRate}%`, icon: LineChart, color: "text-cyan-500 bg-cyan-500/10" }
  ];

  // Need Attention students list
  const needyStudents = classInfo.students.filter(s => s.needSupport).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Today's Overview Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-4 flex flex-col justify-between min-h-[100px] shadow-sm hover:scale-[1.01] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider leading-none">
                  {stat.label}
                </span>
                <div className={`p-1.5 rounded-lg ${stat.color} shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="font-display font-black text-xl text-foreground dark:text-white mt-3 leading-none">
                {stat.value}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activities Timeline & Need Attention */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activities Timeline */}
          <Card className="p-5 space-y-4">
            <h3 className="font-display font-black text-base text-foreground dark:text-white flex items-center justify-between">
              <span>Recent Activities</span>
              <span className="text-[10px] text-muted-foreground font-semibold">Real-time Feed</span>
            </h3>
            
            <div className="space-y-4 pl-3 relative border-l border-slate-100 dark:border-white/5">
              {classInfo.activities.map((act) => (
                <div key={act.id} className="relative pl-4">
                  <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-white dark:ring-slate-950" />
                  <div className="text-xs">
                    <span className="font-bold text-foreground dark:text-white mr-1">
                      {act.studentName}
                    </span>
                    <span className="text-muted-foreground">{act.actionText}</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground/85 mt-0.5">{act.timeAgo}</div>
                </div>
              ))}
              {classInfo.activities.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No recent classroom actions.</p>
              )}
            </div>
          </Card>

          {/* Need Attention Alerts */}
          <Card className="p-5 space-y-3 border-red-500/20 bg-red-500/[0.005]">
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-red-500 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Need Attention
            </h3>
            <div className="space-y-2.5">
              {needyStudents.map((s) => (
                <div key={s.id} className="p-3 rounded-xl border border-red-500/10 bg-white dark:bg-slate-900/50 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 grid place-items-center font-bold text-[10px]">
                      {s.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-foreground dark:text-white">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground">Avg Score: {s.avgScore} · Completion: {s.completionRate}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {s.overdueCount && s.overdueCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/10 text-red-500 border border-red-500/20">
                        {s.overdueCount} Overdue
                      </span>
                    )}
                    {s.lowScoreCount && s.lowScoreCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500/10 text-orange-500 border border-orange-500/20">
                        {s.lowScoreCount} Low Score
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {needyStudents.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">All students are in good standing.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Quick Actions & Tab shortcuts */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <Card className="p-5 space-y-4 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/20">
            <h3 className="font-display font-black text-sm text-foreground dark:text-white">Quick Classroom Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "Create Assignment", icon: PlusCircle, onClick: () => onSelectTab("assignments") },
                { label: "Create Vocabulary", icon: BookOpen, onClick: () => onSelectTab("materials") },
                { label: "Create Grammar", icon: PlusCircle, onClick: () => onSelectTab("materials") },
                { label: "Post Announcement", icon: MessageSquare, onClick: () => onSelectTab("announcements") }
              ].map((act, idx) => (
                <button
                  key={idx}
                  onClick={act.onClick}
                  className="w-full p-2.5 rounded-xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/50 hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs font-bold transition flex items-center justify-between text-left group"
                >
                  <span className="flex items-center gap-2">
                    <act.icon className="w-4 h-4 text-muted-foreground group-hover:text-inherit" />
                    {act.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </Card>

          {/* Quick class diagnostics */}
          <Card className="p-5 space-y-3">
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-primary">Class Diagnostics</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                <span>Difficult assignments</span>
                <span className="font-bold text-foreground dark:text-white truncate max-w-[140px] text-right">
                  {classInfo.analytics.mostDifficultAssignments[0]}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                <span>Weakest areas</span>
                <span className="font-bold text-red-500 dark:text-red-400">
                  {classInfo.analytics.weakestTopics[0]}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
