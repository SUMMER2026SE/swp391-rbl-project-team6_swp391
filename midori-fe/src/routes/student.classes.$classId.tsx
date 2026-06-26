import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { useClassDetail } from "@/hooks/useClassDetail";
import { Card } from "@/components/page-ui";

import { AssignmentsTab } from "@/components/student/class-detail/AssignmentsTab";

export const Route = createFileRoute("/student/classes/$classId")({
  component: ClassDetailPage,
});

function ClassDetailPage() {
  const { classId } = Route.useParams();
  const { classInfo } = useClassDetail(classId);

  if (!classInfo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/student/classes"
            className="p-2 rounded-xl border border-slate-200/70 bg-white/70 shadow-sm text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-extrabold font-display">Class Not Found</h1>
        </div>
        <Card className="p-8 text-center max-w-lg mx-auto">
          <p className="text-sm text-muted-foreground">The requested class could not be found.</p>
          <Link
            to="/student/classes"
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
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/student/classes"
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: "Students", value: classInfo.members },
            { label: "Assignments", value: classInfo.assignments.length },
            { label: "Next Deadline", value: classInfo.nextDeadline },
            { label: "Join Date", value: classInfo.joinDate },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-white/5 p-2 rounded-xl min-w-[90px]"
            >
              <div className="text-xs font-black text-foreground dark:text-white">{stat.value}</div>
              <div className="text-[9px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Render Subcomponents */}
      <div className="mt-4">
        <AssignmentsTab classInfo={classInfo} />
      </div>
    </div>
  );
}
