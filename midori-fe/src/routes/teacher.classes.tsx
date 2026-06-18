import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Card, LevelBadge } from "@/components/page-ui";
import { School, Users, ClipboardList, Calendar, Award } from "lucide-react";
import { mockTeacherClasses } from "@/mock/teacherClasses";

export const Route = createFileRoute("/teacher/classes")({
  component: TeacherClassesPage,
});

function TeacherClassesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes (Teacher View)"
        subtitle="Overview and workspace for all your active school cohorts."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTeacherClasses.map((cls) => (
          <Card key={cls.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <School className="w-5 h-5" />
                </div>
                <LevelBadge level={cls.level} />
              </div>

              <h3 className="font-display font-bold text-base text-foreground mb-1">{cls.name}</h3>
              <div className="text-xs text-muted-foreground mb-4">
                Level {cls.level} · Created on {cls.createdDate}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-border/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[9px] uppercase font-bold tracking-wider mb-0.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    Students
                  </div>
                  <div className="font-black text-xs text-foreground">{cls.members}</div>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-border/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[9px] uppercase font-bold tracking-wider mb-0.5">
                    <ClipboardList className="w-3.5 h-3.5 text-primary" />
                    Tasks
                  </div>
                  <div className="font-black text-xs text-foreground">{cls.assignmentCount}</div>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-border/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[9px] uppercase font-bold tracking-wider mb-0.5">
                    <Award className="w-3.5 h-3.5 text-primary" />
                    Avg Score
                  </div>
                  <div className="font-black text-xs text-foreground">{cls.avgScore}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground mb-6">
                <div className="flex justify-between">
                  <span>Next Deadline</span>
                  <span className="font-semibold text-foreground dark:text-white">{cls.nextDeadline}</span>
                </div>
              </div>
            </div>

            <Link
              to="/teacher/classes/$classId"
              params={{ classId: cls.id }}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5"
            >
              Enter Class
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
