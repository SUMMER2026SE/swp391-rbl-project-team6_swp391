import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { PageHeader, Card, LevelBadge } from "@/components/page-ui";
import { School, User, Users, ClipboardList, Calendar, Clock } from "lucide-react";
import { mockClasses } from "@/mock/classes";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/student/classes")({
  component: StudentClassesPage,
});

function StudentClassesPage() {
  const { user } = useAuth();
  const location = useLocation();

  const isIndex = location.pathname === "/student/classes" || location.pathname === "/student/classes/";

  if (!isIndex) {
    return <Outlet />;
  }

  // Load and sort classes associated with the student.
  // Newest classes first (recently added at the top)
  const sortedClasses = [...mockClasses].sort((a, b) => {
    return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes"
        subtitle="Manage and enter your active school courses."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedClasses.map((cls) => (
          <Card key={cls.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative">
            {cls.isNew && (
              <div className="absolute top-4 right-4 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-jp-red text-white shadow-sm">
                NEW
              </div>
            )}
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <School className="w-5 h-5" />
                </div>
                <div className="flex gap-2 items-center">
                  <LevelBadge level={cls.level} />
                </div>
              </div>
              <h3 className="font-display font-bold text-base text-foreground mb-1">{cls.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-[10px]">
                  {cls.teacherAvatarInitials}
                </div>
                Teacher: {cls.teacher}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-border/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    Students
                  </div>
                  <div className="font-black text-sm text-foreground">{cls.members}</div>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-border/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">
                    <ClipboardList className="w-3.5 h-3.5 text-primary" />
                    Assignments
                  </div>
                  <div className="font-black text-sm text-foreground">{cls.assignmentCount}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground mb-6">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5 text-red-500" />
                    Unfinished Tasks
                  </span>
                  <span className="font-semibold text-red-500">{cls.unfinishedCount} tasks</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Next Deadline
                  </span>
                  <span className="font-semibold text-foreground">{cls.nextDeadline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Created Date
                  </span>
                  <span className="font-semibold text-foreground">{cls.createdDate}</span>
                </div>
              </div>
            </div>

            <Link
              to="/student/classes/$classId"
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
