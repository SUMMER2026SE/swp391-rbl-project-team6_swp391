import { useMemo, createContext, useContext } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList, Users, Award, Loader2, Archive, TrendingUp, Copy, Check } from "lucide-react";
import { Card } from "@/components/page-ui";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import { toast } from "sonner";
import { useState } from "react";

export const ClassDetailContext = createContext<{ classDetail: any } | null>(null);

export function useClassDetailContext() {
  const ctx = useContext(ClassDetailContext);
  if (!ctx) throw new Error("useClassDetailContext must be used within ClassDetailProvider");
  return ctx;
}

export const Route = createFileRoute("/teacher/classes/$classId")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: TeacherClassDetailPage,
});

function TeacherClassDetailPage() {
  const { classId } = Route.useParams();
  const [copied, setCopied] = useState(false);

  const { data: classDetail, isLoading } = useQuery({
    queryKey: ["teacherClassDetail", classId],
    queryFn: () => classesApi.getClassById(classId),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000, // 5 min — shared by all child tabs via ClassDetailContext
  });

  const classInfo = useMemo(() => {
    if (!classDetail) return null;

    return {
      id: classDetail.id,
      name: classDetail.name,
      level: classDetail.level,
      classCode: classDetail.classCode,
      studentCount: classDetail.studentCount || 0,
      assignmentCount: classDetail.homeworkCount || 0,
      createdAt: classDetail.createdAt,
      status: classDetail.status,
    };
  }, [classDetail]);

  const handleCopyClassCode = async () => {
    if (!classDetail?.classCode) return;
    try {
      await navigator.clipboard.writeText(classDetail.classCode);
      setCopied(true);
      toast.success("Class Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy Class Code");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  const isArchived = classInfo.status === "ARCHIVED";

  return (
    <ClassDetailContext.Provider value={{ classDetail }}>
      <div className="space-y-6">
        {/* Archived Banner */}
        {isArchived && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-50/80 dark:bg-amber-900/20 px-5 py-3.5 text-amber-700 dark:text-amber-300">
            <Archive className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">This class has been archived.</p>
              <p className="text-xs opacity-80">
                All actions are disabled. Go back to your classes to restore it.
              </p>
            </div>
          </div>
        )}
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
              {classDetail?.teacherName && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-[10px]">
                    {classDetail.teacherName.substring(0, 2).toUpperCase()}
                  </div>
                  <span>Teacher: {classDetail.teacherName}</span>
                </div>
              )}
              {classDetail?.classCode && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">Class Code:</span>
                  <code className="px-2.5 py-1 rounded-lg bg-muted/80 border border-border/40 text-sm font-mono font-bold text-foreground">
                    {classDetail.classCode}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={handleCopyClassCode}
                    title="Copy Class Code"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Class Code", value: classInfo.classCode || "—" },
              { label: "Students", value: classInfo.studentCount },
              { label: "Assignments", value: classInfo.assignmentCount },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-white/5 p-2 rounded-xl min-w-[90px]"
              >
                <div className="text-xs font-black text-foreground dark:text-white truncate">{stat.value}</div>
                <div className="text-[9px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Tab Navigation Switcher */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
          {[
            { to: "/teacher/classes/$classId/progress", label: "Progress", icon: TrendingUp },
            { to: "/teacher/classes/$classId/students", label: "Students", icon: Users },
            { to: "/teacher/classes/$classId/homework", label: "Homework", icon: ClipboardList },
            { to: "/teacher/classes/$classId/exams", label: "Exams", icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                params={{ classId }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border"
                activeProps={{
                  className: "bg-primary text-primary-foreground border-primary shadow-sm",
                }}
                inactiveProps={{
                  className:
                    "bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-white/5 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10",
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Render Active Tab Component via Outlet */}
        <div className="mt-4">
          <Outlet context={{ classDetail }} />
        </div>
      </div>
    </ClassDetailContext.Provider>
  );
}
