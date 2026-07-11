import React, { useState } from "react";
import { Card } from "@/components/page-ui";
import {
  Users, ClipboardList, Clock, Award, LineChart,
  AlertTriangle, ArrowRight, UserPlus, Sparkles, BookOpenCheck, ShieldAlert
} from "lucide-react";
import type { TeacherClassInfo, TeacherStudent } from "@/types/teacher-class";
import type { ExamResponse } from "@/lib/api/exams";
import { mapExamUiStatus } from "@/lib/api/exams";
import { getHomeworkByClass } from "@/data/teacher-data";
import { useNavigate } from "@tanstack/react-router";
import { InviteStudentsDialog } from "@/components/teacher/dialogs";

interface TeacherDashboardTabProps {
  classInfo: TeacherClassInfo;
  classExams?: ExamResponse[];
  onSelectTab: (tabId: string) => void;
}

export function TeacherDashboardTab({ classInfo, classExams = [], onSelectTab }: TeacherDashboardTabProps) {
  const navigate = useNavigate();
  const classId = classInfo.id;
  const [inviteOpen, setInviteOpen] = useState(false);
  const homeworkList = getHomeworkByClass(classId);
  const examList = classExams.map((e) => ({
    id: e.id,
    title: e.title,
    scheduledAt: e.createdAt
      ? new Date(e.createdAt).toLocaleDateString()
      : "—",
    duration: e.timeLimit,
    totalQuestions: e.totalQuestions,
    status:
      mapExamUiStatus(e.status) === "published"
        ? "Scheduled"
        : mapExamUiStatus(e.status) === "pending"
          ? "Scheduled"
          : "Draft",
  }));

  // Helper for computing risk levels dynamically
  const getRiskInfo = (student: TeacherStudent) => {
    let riskLevel: "High Risk" | "Medium Risk" | "Watchlist" | "Good Standing" = "Good Standing";
    const missingHw = student.overdueCount || 0;
    const progress = student.completionRate;
    const score = student.avgScore; // 10-point scale
    
    // Parse last activity days
    let inactiveDays = 0;
    if (student.lastActivity.includes("day")) {
      const match = student.lastActivity.match(/(\d+)\s+day/);
      if (match) inactiveDays = parseInt(match[1], 10);
    } else if (student.lastActivity.includes("week")) {
      inactiveDays = 7;
    }
    
    if (progress < 50 || missingHw >= 3 || score < 6.0 || inactiveDays >= 5) {
      riskLevel = "High Risk";
    } else if ((progress >= 50 && progress < 70) || (missingHw >= 1 && missingHw <= 2) || (score >= 6.0 && score < 7.0) || inactiveDays >= 2) {
      riskLevel = "Medium Risk";
    } else if (student.needSupport || (student.lowScoreCount && student.lowScoreCount > 0)) {
      riskLevel = "Watchlist";
    }
    
    // Reasons & Suggested actions
    let reason = "";
    let suggestedAction = "";
    
    if (riskLevel === "High Risk") {
      if (progress < 50) reason = `Critically low progress (${progress}%)`;
      else if (missingHw >= 3) reason = `${missingHw} missing homework assignments`;
      else if (score < 6.0) reason = `Low exam average (${score * 10}%)`;
      else if (inactiveDays >= 5) reason = `Inactive for ${inactiveDays} days`;
      else reason = "Failing multiple criteria";
      
      suggestedAction = "Assign targeted vocabulary/grammar review and message the student.";
    } else if (riskLevel === "Medium Risk") {
      if (missingHw > 0) reason = `Overdue work (${missingHw} assignments)`;
      else if (score < 7.0) reason = `Below average test scores (${score * 10}%)`;
      else if (progress < 70) reason = `Lagging progress (${progress}%)`;
      else reason = "Slightly low engagement or performance";
      
      suggestedAction = "Message student to offer guidance or ask if they need support.";
    } else if (riskLevel === "Watchlist") {
      reason = student.lowScoreCount ? `${student.lowScoreCount} low scores recently` : "Identified for active monitoring";
      suggestedAction = "Check their next homework submission carefully.";
    }
    
    return { riskLevel, reason, suggestedAction };
  };

  const studentsWithRisk = classInfo.students.map(s => ({
    student: s,
    ...getRiskInfo(s)
  }));

  // Risk sorting priority: High Risk (1), Medium Risk (2), Watchlist (3), Good Standing (4)
  const getRiskPriority = (risk: string) => {
    switch (risk) {
      case "High Risk": return 1;
      case "Medium Risk": return 2;
      case "Watchlist": return 3;
      default: return 4;
    }
  };

  const sortedRiskList = studentsWithRisk
    .filter(item => item.riskLevel !== "Good Standing")
    .sort((a, b) => getRiskPriority(a.riskLevel) - getRiskPriority(b.riskLevel));

  // Show only top 3 at-risk students
  const topAtRiskStudents = sortedRiskList.slice(0, 3);
  
  const highRiskCount = studentsWithRisk.filter(item => item.riskLevel === "High Risk").length;
  const mediumRiskCount = studentsWithRisk.filter(item => item.riskLevel === "Medium Risk").length;
  const totalAtRisk = highRiskCount + mediumRiskCount;

  // Overview Stats
  const activeStudents = classInfo.students.filter(s => s.status !== "invited").length;
  const totalStudents = classInfo.students.length;
  const avgProgress = Math.round(classInfo.students.reduce((acc, s) => acc + s.completionRate, 0) / totalStudents) || classInfo.progress;
  const hwCompletion = classInfo.analytics.submissionRate;
  const examAvg = classInfo.avgScore;

  const stats = [
    { label: "Active Students / Total", value: `${activeStudents} / ${classInfo.members}`, icon: Users, color: "text-blue-500 bg-blue-500/10" },
    { label: "Average Progress", value: `${avgProgress}%`, icon: LineChart, color: "text-cyan-500 bg-cyan-500/10" },
    { label: "Homework Completion", value: `${hwCompletion}%`, icon: BookOpenCheck, color: "text-purple-500 bg-purple-500/10" },
    { label: "Exam Average Score", value: `${examAvg}/10`, icon: Award, color: "text-green-500 bg-green-500/10" },
    { label: "Students At Risk", value: totalAtRisk, icon: AlertTriangle, color: totalAtRisk > 0 ? "text-red-500 bg-red-500/10 border border-red-500/20" : "text-slate-500 bg-slate-500/10" }
  ];
  return (
    <div className="space-y-6">
      {/* SECTION A: Class Health Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-4 flex flex-col justify-between min-h-[100px] shadow-sm hover:scale-[1.01] transition-all duration-200">
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

      {/* Middle Grid: AI Learning Risk Insights & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Learning Risk Insights */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 space-y-4 border-indigo-500/20 bg-indigo-500/[0.005] flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-display font-black text-base text-foreground dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-500" />
                    AI Learning Risk Insights
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Early warning signals based on progress, homework completion, exam results, and recent activity.
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI-assisted insight
                </span>
              </div>

              <div className="space-y-3">
                {topAtRiskStudents.map(({ student, riskLevel, reason, suggestedAction }) => {
                  const badgeColor = 
                    riskLevel === "High Risk" 
                      ? "bg-red-500/10 text-red-500 border-red-500/20" 
                      : riskLevel === "Medium Risk"
                      ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20";
                  
                  const weakSkillText = student.weakSkill ? student.weakSkill : "General review";
                  
                  return (
                    <div key={student.id} className="p-3 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-slate-900/50 flex flex-col gap-1.5 text-xs shadow-sm">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 grid place-items-center font-bold text-[9px] overflow-hidden">
                            {student.avatar && (student.avatar.startsWith("http") || student.avatar.includes("/")) ? (
                              <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              student.avatar || student.name[0]
                            )}
                          </div>
                          <span className="font-bold text-foreground dark:text-white text-sm">{student.name}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${badgeColor}`}>
                          {riskLevel}
                        </span>
                      </div>
                      
                      <div className="text-muted-foreground grid grid-cols-3 gap-2 py-1 border-y border-slate-100/50 dark:border-white/5 mt-0.5 text-[10px]">
                        <div>Progress: <span className="font-semibold text-foreground dark:text-white">{student.completionRate}%</span></div>
                        <div>Weak Skill: <span className="font-semibold text-foreground dark:text-white">{weakSkillText}</span></div>
                        <div>Missing HW: <span className="font-semibold text-foreground dark:text-white">{student.overdueCount || 0}</span></div>
                      </div>
                      
                      <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Reason:</span> {reason}
                      </div>
                      <div className="text-indigo-600 dark:text-indigo-400 font-medium">
                        <span className="font-semibold">Suggested action:</span> {suggestedAction}
                      </div>
                    </div>
                  );
                })}
                {sortedRiskList.length === 0 && (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No students currently identified as at-risk.
                  </div>
                )}
              </div>
            </div>

            {sortedRiskList.length > 3 && (
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-end">
                <button 
                  onClick={() => navigate({ to: "/teacher/progress", search: { classId: classInfo.id, view: "homework" } })} 
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  View all at-risk students ({sortedRiskList.length}) <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/20 h-full flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <h3 className="font-display font-black text-sm text-foreground dark:text-white">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: "Invite Student", icon: UserPlus, onClick: () => setInviteOpen(true) },
                  { label: "Assign Homework", icon: ClipboardList, onClick: () => onSelectTab("homework") },
                  { label: "Create Exam", icon: Award, onClick: () => onSelectTab("exams") },
                  { label: "View Class Progress", icon: LineChart, onClick: () => navigate({ to: "/teacher/progress", search: { classId: classInfo.id } }) }
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
            </div>

            <div className="text-[10px] text-muted-foreground border-t border-slate-100/50 dark:border-white/5 pt-3">
              Perform administrative class actions instantly.
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Grid: Open Homework & Upcoming Exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Open Homework */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-sm text-foreground dark:text-white">Open Homework</h3>
            <button onClick={() => onSelectTab("homework")} className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {homeworkList.filter(h => h.status === "Assigned").slice(0, 2).map(hw => (
              <div key={hw.id} className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30 text-xs">
                <div className="font-bold text-foreground dark:text-white truncate">{hw.title}</div>
                <div className="flex justify-between text-muted-foreground mt-2">
                  <span>Due: {hw.dueDate}</span>
                  <span className="font-semibold text-foreground dark:text-white">{hw.submissions} submissions</span>
                </div>
              </div>
            ))}
            {homeworkList.filter(h => h.status === "Assigned").length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No currently active homework.</p>
            )}
          </div>
        </Card>

        {/* Upcoming Exams */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-sm text-foreground dark:text-white">Upcoming Exams</h3>
            <button onClick={() => onSelectTab("exams")} className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {examList.filter(e => e.status === "Scheduled").slice(0, 2).map(ex => (
              <div key={ex.id} className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30 text-xs">
                <div className="font-bold text-foreground dark:text-white truncate">{ex.title}</div>
                <div className="flex justify-between text-muted-foreground mt-2">
                  <span>{ex.scheduledAt}</span>
                  <span className="font-semibold text-foreground dark:text-white">{ex.duration} min · {ex.totalQuestions} Qs</span>
                </div>
              </div>
            ))}
            {examList.filter(e => e.status === "Scheduled").length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No exams scheduled.</p>
            )}
          </div>
        </Card>
      </div>

      <InviteStudentsDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        classId={classInfo.id}
        className={classInfo.name}
      />
    </div>
  );
}
