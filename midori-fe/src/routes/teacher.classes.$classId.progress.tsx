import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProgressByClass } from "@/data/teacher-data";
import { PreviewSheet } from "@/components/teacher/dialogs";
import { LevelBadge } from "@/components/teacher/badges";
import { Download, Send, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/classes/$classId/progress")({
  component: ClassProgress,
});

function ClassProgress() {
  const { classId } = Route.useParams();
  const data = getProgressByClass(classId)!;
  const [open, setOpen] = useState<string | null>(null);
  const sel = data.students.find((s) => s.id === open);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={() => toast.success("Progress report exported")}><Download className="mr-2 h-4 w-4" />Export</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Average progress</div><div className="mt-1 text-3xl font-bold">{data.averageProgress}%</div><Progress value={data.averageProgress} className="mt-2 h-1.5" /></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Homework completion</div><div className="mt-1 text-3xl font-bold">{data.homeworkCompletion}%</div><Progress value={data.homeworkCompletion} className="mt-2 h-1.5" /></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Exam average</div><div className="mt-1 text-3xl font-bold">{data.examAverage}%</div><Progress value={data.examAverage} className="mt-2 h-1.5" /></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">At-risk students</div><div className="mt-1 text-3xl font-bold text-destructive">{data.atRisk.length}</div><div className="mt-2 text-xs text-muted-foreground">Out of {data.students.length} students</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="space-y-3">
            {Object.entries(data.skills).map(([k, v]) => (
              <div key={k}>
                <div className="mb-1 flex justify-between text-xs"><span>{k}</span><span className="font-semibold">{v}%</span></div>
                <Progress value={v} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <ul className="divide-y">
              {[...data.students].sort((a, b) => b.averageScore - a.averageScore).slice(0, 10).map((s, i) => (
                <li key={s.id} className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-muted text-xs font-bold">{i + 1}</span>
                  <Avatar className="h-8 w-8"><AvatarImage src={s.avatar} /><AvatarFallback>{s.name[0]}</AvatarFallback></Avatar>
                  <button onClick={() => setOpen(s.id)} className="min-w-0 text-left">
                    <div className="truncate text-sm font-medium hover:text-primary">{s.name}</div>
                    <Progress value={s.progress} className="mt-1 h-1" />
                  </button>
                  <div className="text-right text-sm font-bold">{s.averageScore}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {data.atRisk.length > 0 && (
        <Card>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {data.atRisk.map((s) => (
              <button key={s.id} onClick={() => setOpen(s.id)} className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-left hover:bg-destructive/10">
                <Avatar className="h-9 w-9"><AvatarImage src={s.avatar} /><AvatarFallback>{s.name[0]}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">Progress {s.progress}% · Weak: {s.weakSkill}</div>
                </div>
                <LevelBadge level={s.level} />
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <PreviewSheet open={!!sel} onOpenChange={(o) => !o && setOpen(null)} title={sel?.name ?? ""} description="Student progress detail">
        {sel && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/40 p-2"><div className="text-xs text-muted-foreground">Progress</div><div className="text-lg font-bold">{sel.progress}%</div></div>
              <div className="rounded-lg bg-muted/40 p-2"><div className="text-xs text-muted-foreground">Avg score</div><div className="text-lg font-bold">{sel.averageScore}</div></div>
              <div className="rounded-lg bg-muted/40 p-2"><div className="text-xs text-muted-foreground">Attendance</div><div className="text-lg font-bold">{sel.attendance}%</div></div>
            </div>
            <p><b>Weak skill:</b> {sel.weakSkill}</p>
            <p><b>Last active:</b> {sel.lastActive}</p>
            <div className="rounded-lg border border-info/30 bg-info/10 p-3 text-xs">
              <b>Recommendation:</b> Assign extra {sel.weakSkill?.toLowerCase()} practice from the Question Bank.
            </div>
            <Button className="w-full" onClick={() => { toast.success(`Reminder sent to ${sel.name}`); setOpen(null); }}><Send className="mr-2 h-4 w-4" />Send reminder</Button>
          </div>
        )}
      </PreviewSheet>
    </div>
  );
}
