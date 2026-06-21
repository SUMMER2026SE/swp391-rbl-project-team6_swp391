import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, LayoutDashboard, ClipboardList, Users, BookOpen, Megaphone, Calendar as CalendarIcon, Award, ShieldAlert } from "lucide-react";
import { mockTeacherClasses } from "@/mock/teacherClasses";
import { Card } from "@/components/page-ui";

// Tab Sub-Components
import { TeacherDashboardTab } from "@/components/teacher/class-detail/TeacherDashboardTab";
import { TeacherAssignmentsTab } from "@/components/teacher/class-detail/TeacherAssignmentsTab";
import { TeacherStudentsTab } from "@/components/teacher/class-detail/TeacherStudentsTab";
import { TeacherMaterialsTab } from "@/components/teacher/class-detail/TeacherMaterialsTab";
import { TeacherAnnouncementsTab } from "@/components/teacher/class-detail/TeacherAnnouncementsTab";
import { TeacherCalendarTab } from "@/components/teacher/class-detail/TeacherCalendarTab";
import { TeacherAnalyticsTab } from "@/components/teacher/class-detail/TeacherAnalyticsTab";

export const Route = createFileRoute("/teacher/classes/$classId")({
  component: TeacherClassDetailPage,
});

function TeacherClassDetailPage() {
  const { classId } = Route.useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const classInfo = mockTeacherClasses.find((c) => c.id === classId);

  if (!classInfo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/teacher/classes"
            className="p-2 rounded-xl border border-slate-200/70 bg-white/70 shadow-sm text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-extrabold font-display">Class Not Found</h1>
        </div>
        <Card className="p-8 text-center max-w-lg mx-auto">
          <p className="text-sm text-muted-foreground">The requested class could not be found.</p>
          <Link
            to="/teacher/classes"
            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
          >
            Back to Classes
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Large Class Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/teacher/classes"
            className="p-2 rounded-xl border border-slate-200/70 bg-white/70 shadow-sm text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-white/10 transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black font-display text-foreground dark:text-white leading-tight">
                {classInfo.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/20 text-primary border border-primary/30">
                Level {classInfo.level}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-[10px]">
                {classInfo.teacherAvatarInitials}
              </div>
              <span>Teacher: {classInfo.teacher}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          {[
            { label: "Students", value: classInfo.members },
            { label: "Assignments", value: classInfo.assignmentCount },
            { label: "Avg Score", value: `${classInfo.avgScore}/10` },
            { label: "Next Deadline", value: classInfo.nextDeadline },
            { label: "Created Date", value: classInfo.createdDate },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-white/5 p-2 rounded-xl min-w-[90px]">
              <div className="text-xs font-black text-foreground dark:text-white">{stat.value}</div>
              <div className="text-[9px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Tab Navigation Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
        {[
          { id: "overview", label: "Dashboard", icon: LayoutDashboard },
          { id: "assignments", label: "Assignments", icon: ClipboardList },
          { id: "students", label: "Students", icon: Users },
          { id: "materials", label: "Learning Materials", icon: BookOpen },
          { id: "announcements", label: "Announcements", icon: Megaphone },
          { id: "calendar", label: "Calendar", icon: CalendarIcon },
          { id: "analytics", label: "Analytics", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-white/5 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Render Active Tab Component */}
      <div className="mt-4">
        {activeTab === "overview" && (
          <TeacherDashboardTab classInfo={classInfo} onSelectTab={setActiveTab} />
        )}
        {activeTab === "assignments" && (
          <TeacherAssignmentsTab classInfo={classInfo} />
        )}
        {activeTab === "students" && (
          <TeacherStudentsTab classInfo={classInfo} />
        )}
        {activeTab === "materials" && (
          <TeacherMaterialsTab classInfo={classInfo} />
        )}
        {activeTab === "announcements" && (
          <TeacherAnnouncementsTab classInfo={classInfo} />
        )}
        {activeTab === "calendar" && (
          <TeacherCalendarTab classInfo={classInfo} />
        )}
        {activeTab === "analytics" && (
          <TeacherAnalyticsTab classInfo={classInfo} />
        )}
      </div>
    </div>
  );
}

// ─── Summary card
