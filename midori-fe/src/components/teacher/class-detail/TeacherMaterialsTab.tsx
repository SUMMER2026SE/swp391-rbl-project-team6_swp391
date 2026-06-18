import React from "react";
import { Card } from "@/components/page-ui";
import { BookOpen, FileText, PlusCircle, Edit, Settings } from "lucide-react";
import type { TeacherClassInfo } from "@/types/teacher-class";

interface TeacherMaterialsTabProps {
  classInfo: TeacherClassInfo;
}

export function TeacherMaterialsTab({ classInfo }: TeacherMaterialsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-display font-black text-base text-foreground dark:text-white flex items-center gap-2">
          <BookOpen className="w-4.5 h-4.5 text-primary" />
          Learning Materials Modules
        </h3>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classInfo.materials.map((mat) => (
          <Card
            key={mat.id}
            className="p-5 flex flex-col justify-between hover:shadow-md hover:border-primary/20 transition-all min-h-[140px]"
          >
            <div>
              <h4 className="font-display font-bold text-base text-foreground dark:text-white leading-tight">
                {mat.moduleName}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {mat.totalLessons} Total Lessons
              </p>

              <div className="flex gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1 text-green-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {mat.publishedCount} Published
                </span>
                <span className="flex items-center gap-1 text-muted-foreground font-semibold">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  {mat.draftCount} Drafts
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 border-t border-slate-100 dark:border-white/5 pt-3 mt-4">
              <button className="flex-1 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold transition flex items-center justify-center gap-1">
                <PlusCircle className="w-3 h-3" /> Create
              </button>
              <button className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[10px] font-bold transition flex items-center justify-center gap-1 text-foreground dark:text-white">
                <Edit className="w-3 h-3" /> Edit
              </button>
              <button className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-muted-foreground transition flex items-center justify-center">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
