import React from "react";
import { Card } from "@/components/page-ui";
import { ShieldAlert, User, Users } from "lucide-react";
import type { DetailedClassInfo } from "@/types/class-detail";

interface MembersTabProps {
  classInfo: DetailedClassInfo;
}

export function MembersTab({ classInfo }: MembersTabProps) {
  return (
    <div className="space-y-6">
      {/* Teacher Section */}
      <Card className="p-5 space-y-4">
        <h3 className="font-display font-bold text-base text-foreground dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
          <User className="w-4.5 h-4.5 text-primary" />
          Teachers
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center font-black text-sm">
            {classInfo.teacherAvatarInitials}
          </div>
          <div>
            <div className="font-bold text-sm text-foreground dark:text-white">{classInfo.teacher}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              Class Instructor
            </div>
          </div>
        </div>
      </Card>

      {/* Students Section */}
      <Card className="p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2">
          <h3 className="font-display font-bold text-base text-foreground dark:text-white flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-primary" />
            Classmates
          </h3>
          <span className="text-xs text-muted-foreground font-semibold">
            {classInfo.members} students
          </span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {classInfo.classmates.map((student, idx) => (
            <div key={idx} className="flex items-center gap-3 py-3 hover:bg-slate-50/50 dark:hover:bg-white/[0.005] px-2 rounded-xl transition">
              <div className="w-8 h-8 rounded-full bg-sakura/20 dark:bg-sakura/10 text-jp-red grid place-items-center font-bold text-xs">
                {student.avatar}
              </div>
              <span className="text-xs font-semibold text-foreground dark:text-slate-200">
                {student.name}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Read-Only Banner */}
      <div className="flex items-center gap-2 p-4 bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-2xl text-xs text-muted-foreground">
        <ShieldAlert className="w-4 h-4 text-muted-foreground" />
        <span>You have read-only access to this class roster. Adding or removing members is restricted.</span>
      </div>
    </div>
  );
}
