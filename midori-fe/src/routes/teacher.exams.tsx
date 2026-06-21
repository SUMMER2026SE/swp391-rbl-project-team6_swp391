import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getExams, getClasses } from "@/data/teacher-data";
import { LevelBadge, StatusBadge } from "@/components/teacher/badges";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/teacher/exams")({
  head: () => ({ meta: [{ title: "Exams — MIDORI Teacher" }] }),
  component: ExamsPage,
});

function ExamsPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/teacher/exams") {
    return <Outlet />;
  }

  const exams = getExams();
  const classes = getClasses();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("All");

  const filtered = exams.filter((e) =>
    (status === "All" || e.status === status) &&
    e.title.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Library"
        title="Exams"
        subtitle="All exams scheduled or completed."
        actions={<Button asChild><Link to="/teacher/exams/create"><Plus className="mr-2 h-4 w-4" />Create exam</Link></Button>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search exams..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        {(["All", "Draft", "Scheduled", "Completed", "Archived"] as const).map((f) => (
          <Button key={f} size="sm" variant={status === f ? "default" : "outline"} onClick={() => setStatus(f)}>{f}</Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((e) => {
          const cls = classes.find((c) => c.id === e.classId)!;
          return (
            <Card key={e.id}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2"><LevelBadge level={e.level} /><StatusBadge status={e.status} /><span className="text-[10px] uppercase tracking-widest text-muted-foreground">{e.source.replace("-", " ")}</span></div>
                <Link to="/teacher/classes/$classId/exams" params={{ classId: cls.id }} className="block truncate font-semibold hover:text-primary">{e.title}</Link>
                <div className="text-xs text-muted-foreground">{cls.name} · {e.scheduledAt}</div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-md bg-muted/40 p-2"><div className="text-muted-foreground">Questions</div><div className="font-bold">{e.totalQuestions}</div></div>
                  <div className="rounded-md bg-muted/40 p-2"><div className="text-muted-foreground">Duration</div><div className="font-bold">{e.duration}m</div></div>
                  <div className="rounded-md bg-muted/40 p-2"><div className="text-muted-foreground">Avg</div><div className="font-bold">{e.averageScore ?? "—"}</div></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
