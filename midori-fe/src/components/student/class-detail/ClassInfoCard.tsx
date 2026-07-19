import React from "react";
import { Card, LevelBadge } from "@/components/page-ui";
import { School, User, Users, ClipboardList, Calendar, ShieldAlert } from "lucide-react";
import type { DetailedClassInfo } from "@/types/class-detail";

interface ClassInfoCardProps {
  classInfo: DetailedClassInfo;
}

export function ClassInfoCard({ classInfo }: ClassInfoCardProps) {
  return (
    <Card className="p-5 space-y-4 relative overflow-hidden">
      {classInfo.isNew && (
        <span className="absolute top-4 right-4 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-jp-red text-white shadow-sm">
          NEW
        </span>
      )}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <School className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display font-black text-lg text-foreground dark:text-white leading-tight">
            {classInfo.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5">
            <LevelBadge level={classInfo.level} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 dark:border-white/5 pt-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-xs">
          {classInfo.teacherAvatarInitials}
        </div>
        <div>
          <div className="font-bold text-xs text-foreground dark:text-white">
            {classInfo.teacher}
          </div>
          <div className="text-[10px] text-muted-foreground">Class Instructor</div>
        </div>
      </div>

      <div className="space-y-2 text-xs text-muted-foreground border-t border-slate-100 dark:border-white/5 pt-3">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Students
          </span>
          <span className="font-semibold text-foreground dark:text-white">{classInfo.members}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" /> Total Assignments
          </span>
          <span className="font-semibold text-foreground dark:text-white">
            {classInfo.assignments.length} tasks
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Join Date
          </span>
          <span className="font-semibold text-foreground dark:text-white">
            {classInfo.joinDate}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 p-3 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] text-muted-foreground border border-slate-200/40 dark:border-white/5">
        <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Read-only access. Actions like editing/deleting class are restricted.</span>
      </div>
    </Card>
  );
}
