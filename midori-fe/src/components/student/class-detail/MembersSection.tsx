import React from "react";
import { Card } from "@/components/page-ui";
import { User, Users } from "lucide-react";
import type { DetailedClassInfo } from "@/types/class-detail";

interface MembersSectionProps {
  classInfo: DetailedClassInfo;
}

export function MembersSection({ classInfo }: MembersSectionProps) {
  return (
    <Card className="p-5 space-y-4">
      <h3 className="font-display font-black text-base text-foreground dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
        <Users className="w-4.5 h-4.5 text-primary" />
        Class Members
      </h3>

      <div className="space-y-4">
        {/* Teacher */}
        <div>
          <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Teacher</h4>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-xs">
              {classInfo.teacherAvatarInitials}
            </div>
            <span className="text-xs font-bold text-foreground dark:text-white">{classInfo.teacher}</span>
          </div>
        </div>

        {/* Students */}
        <div className="border-t border-slate-100 dark:border-white/5 pt-3">
          <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">
            Classmates ({classInfo.classmates.length})
          </h4>
          <div className="space-y-2">
            {classInfo.classmates.map((student, idx) => (
              <div key={idx} className="flex items-center gap-3 py-1">
                <div className="w-7 h-7 rounded-full bg-sakura/20 dark:bg-sakura/10 text-jp-red grid place-items-center font-bold text-[10px]">
                  {student.avatar}
                </div>
                <span className="text-xs font-semibold text-foreground dark:text-slate-200">
                  {student.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
