import React, { useState, useMemo } from "react";
import { Card } from "@/components/page-ui";
import { Users, Award, LineChart, Flame, AlertTriangle, Eye, UserPlus, Trash2 } from "lucide-react";
import type { TeacherClassInfo } from "@/types/teacher-class";
import { useNavigate } from "@tanstack/react-router";
import { InviteStudentsDialog, ConfirmDialog } from "@/components/teacher/dialogs";
import { useQueryClient } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import { toast } from "sonner";

interface TeacherStudentsTabProps {
  classInfo: TeacherClassInfo;
  onSelectTab?: (tab: string) => void;
  urlQ?: string;
  isArchived?: boolean;
}

export function TeacherStudentsTab({
  classInfo,
  onSelectTab,
  urlQ,
  isArchived,
}: TeacherStudentsTabProps) {
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);
  const queryClient = useQueryClient();
  const [removing, setRemoving] = useState<any | null>(null);

  const handleRemoveStudent = async (studentId: string) => {
    try {
      await classesApi.removeStudentFromClass(classInfo.id, studentId);
      toast.success("Student removed successfully!");
      void queryClient.invalidateQueries({ queryKey: ["classStudents", classInfo.id] });
      void queryClient.invalidateQueries({ queryKey: ["teacherClassDetail", classInfo.id] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove student.");
    } finally {
      setRemoving(null);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!urlQ) return classInfo.students;
    const q = urlQ.toLowerCase();
    return classInfo.students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }, [classInfo.students, urlQ]);

  return (
    <div className="space-y-4">
      {/* Student stats banner */}
      <div className="flex justify-between items-center px-1">
        <h3 className="font-display font-black text-base text-foreground dark:text-white flex items-center gap-2">
          <Users className="w-4.5 h-4.5 text-primary" />
          Class Roster ({filteredStudents.length} {urlQ ? `of ${classInfo.students.length}` : ""}{" "}
          Students)
        </h3>
        {!isArchived && (
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 text-[11px] font-bold transition shadow-sm font-display uppercase tracking-wider"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite Student
          </button>
        )}
      </div>

      {/* Roster Cards Grid */}
      {filteredStudents.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No students found matching "{urlQ}".</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className={`p-5 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden ${
                student.needSupport ? "border-red-500/20 bg-red-500/[0.003]" : ""
              }`}
            >
              {student.needSupport && (
                <span className="absolute top-4 right-4 z-10 px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white flex items-center gap-1 shadow-sm">
                  <AlertTriangle className="w-2.5 h-2.5" /> SUPPORT NEEDED
                </span>
              )}

              <div>
                {/* Header profile */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-full font-black text-xs grid place-items-center overflow-hidden ${
                      student.needSupport
                        ? "bg-red-500/10 text-red-500"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {student.avatar &&
                    (student.avatar.startsWith("http") || student.avatar.includes("/")) ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      student.avatar || student.name[0]
                    )}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-foreground dark:text-white leading-tight">
                      {student.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[170px]">
                      {student.email}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4 pt-1.5 border-t border-slate-100 dark:border-white/5">
                  <div className="text-center">
                    <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">
                      Avg Score
                    </div>
                    <div className="text-xs font-black text-foreground dark:text-white flex items-center justify-center gap-0.5">
                      <Award className="w-3.5 h-3.5 text-emerald-500" />
                      {student.avgScore}/10
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">
                      Completion
                    </div>
                    <div className="text-xs font-black text-foreground dark:text-white flex items-center justify-center gap-0.5">
                      <LineChart className="w-3.5 h-3.5 text-primary" />
                      {student.completionRate}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">
                      Streak
                    </div>
                    <div className="text-xs font-black text-foreground dark:text-white flex items-center justify-center gap-0.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      {student.currentStreak}d
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground mb-4">
                  Last active:{" "}
                  <span className="font-semibold text-foreground dark:text-slate-200">
                    {student.lastActivity}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 border-t border-slate-100 dark:border-white/5 pt-3">
                <button
                  onClick={() =>
                    navigate({
                      to: "/teacher/classes/$classId/students/$studentId/progress",
                      params: { classId: classInfo.id, studentId: student.id },
                    })
                  }
                  className="flex-1 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold transition flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View in Progress
                </button>
                {!isArchived && (
                  <button
                    onClick={() => setRemoving(student)}
                    className="py-1.5 px-3 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[10px] font-bold transition flex items-center justify-center gap-1 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <InviteStudentsDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        classId={classInfo.id}
        className={classInfo.name}
        classLevel={classInfo.level}
        teacherName={classInfo.teacher}
      />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remove Student"
        description={`Are you sure you want to remove this student from this class?\n\nStudent: ${removing?.name ?? ""}`}
        confirmLabel="Remove"
        destructive
        onConfirm={() => handleRemoveStudent(removing.id)}
      />
    </div>
  );
}
