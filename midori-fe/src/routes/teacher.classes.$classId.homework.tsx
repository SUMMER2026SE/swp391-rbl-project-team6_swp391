import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getHomeworkByClass, type Homework } from "@/data/teacher-data";
import { StatusBadge } from "@/components/teacher/badges";
import { PreviewSheet, ConfirmDialog } from "@/components/teacher/dialogs";
import { Plus, MoreVertical, Edit, Archive, Send, Bell } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { HomeworkEditDialog } from "@/components/teacher/homework-edit-dialog";
import { HomeworkSubmissionsDrawer } from "@/components/teacher/homework-submissions-drawer";

export const Route = createFileRoute("/teacher/classes/$classId/homework")({
  component: ClassHomework,
});

function ClassHomework() {
  const { classId } = Route.useParams();
  const list = getHomeworkByClass(classId);
  const [open, setOpen] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [editHw, setEditHw] = useState<string | null>(null);
  const [submissionsHw, setSubmissionsHw] = useState<string | null>(null);
  const sel = list.find((h) => h.id === open);

  const handleHwSave = (updated: Homework) => {
    toast.success("Homework updated");
  };
  const handleGradeHw = () => {
    toast.success("Grade saved");
  };
  const handleRemindHw = () => {
    toast.success("Reminder sent to students");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{list.length} homework assignments</h2>
        <Button asChild><Link to={`/teacher/homework/create?classId=${classId}`}><Plus className="mr-2 h-4 w-4" />Assign homework</Link></Button>
      </div>

      <div className="grid gap-3">
        {list.map((h) => (
          <Card key={h.id}>
            <CardContent className="p-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2"><StatusBadge status={h.status} /><span className="text-[10px] uppercase tracking-widest text-muted-foreground">{h.source.replace("-", " ")}</span></div>
                  <button onClick={() => setOpen(h.id)} className="block truncate text-left font-semibold hover:text-primary">{h.title}</button>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{h.instructions}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Due {h.dueDate}</span><span>·</span><span>Max {h.maxScore} pts</span><span>·</span><span>{h.attempts} attempts</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-40">
                    <div className="mb-1 flex justify-between text-[10px] text-muted-foreground"><span>Submissions</span><span>{h.submissions}/{h.totalStudents}</span></div>
                    <Progress value={(h.submissions / h.totalStudents) * 100} className="h-1.5" />
                    {h.pendingGrading > 0 && <div className="mt-1 text-[10px] text-warning">{h.pendingGrading} to grade</div>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setSubmissionsHw(h.id)}>View submissions</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setSubmissionsHw(h.id)}>Grade</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setEditHw(h.id)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem onSelect={handleRemindHw}><Bell className="mr-2 h-4 w-4" />Send reminder</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => toast.success("Homework closed")}>Close</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setArchiving(h.id)}><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PreviewSheet open={!!sel} onOpenChange={(o) => !o && setOpen(null)} title={sel?.title ?? ""}>
        {sel && (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">Instructions</div>
              <p className="mt-1">{sel.instructions}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border p-2"><div className="text-xs text-muted-foreground">Submitted</div><div className="text-lg font-bold">{sel.submissions}/{sel.totalStudents}</div></div>
              <div className="rounded-lg border p-2"><div className="text-xs text-muted-foreground">Pending</div><div className="text-lg font-bold">{sel.pendingGrading}</div></div>
              <div className="rounded-lg border p-2"><div className="text-xs text-muted-foreground">Max score</div><div className="text-lg font-bold">{sel.maxScore}</div></div>
            </div>
            <Button className="w-full" onClick={() => toast.success("Reminder sent to missing students")}><Bell className="mr-2 h-4 w-4" />Send reminder to missing students</Button>
          </div>
        )}
      </PreviewSheet>

      <ConfirmDialog open={!!archiving} onOpenChange={(o) => !o && setArchiving(null)} title="Archive homework?" description="Students can no longer access this homework." confirmLabel="Archive" onConfirm={() => toast.success("Homework archived")} />

      <HomeworkEditDialog
        open={!!editHw}
        onOpenChange={(o) => !o && setEditHw(null)}
        homework={editHw ? list.find((h) => h.id === editHw) ?? null : null}
        onSave={handleHwSave}
      />

      <HomeworkSubmissionsDrawer
        open={!!submissionsHw}
        onOpenChange={(o) => !o && setSubmissionsHw(null)}
        homework={submissionsHw ? list.find((h) => h.id === submissionsHw) ?? null : null}
        onGrade={handleGradeHw}
        onRemind={handleRemindHw}
      />
    </div>
  );
}
