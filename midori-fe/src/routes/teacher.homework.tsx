import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getHomework, getClasses } from "@/data/teacher-data";
import { LevelBadge, StatusBadge } from "@/components/teacher/badges";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/teacher/homework")({
  head: () => ({ meta: [{ title: "Homework — MIDORI Teacher" }] }),
  component: HomeworkPage,
});

function HomeworkPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/teacher/homework") {
    return <Outlet />;
  }

  const hw = getHomework();
  const classes = getClasses();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("All");

  const filtered = hw.filter(
    (h) =>
      (status === "All" || h.status === status) && h.title.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Library"
        title="Homework"
        subtitle="All homework assignments across your classes."
        actions={
          <Button asChild>
            <Link to="/teacher/homework/create">
              <Plus className="mr-2 h-4 w-4" />
              Assign homework
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search homework..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        {(["All", "Draft", "Assigned", "Closed"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={status === f ? "default" : "outline"}
            onClick={() => setStatus(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map((h) => {
          const cls = classes.find((c) => c.id === h.classId)!;
          return (
            <Card key={h.id}>
              <CardContent className="grid items-center gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <LevelBadge level={cls.level} />
                    <StatusBadge status={h.status} />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {h.source.replace("-", " ")}
                    </span>
                  </div>
                  <Link
                    to="/teacher/classes/$classId/homework"
                    params={{ classId: cls.id }}
                    className="block truncate font-semibold hover:text-primary"
                  >
                    {h.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {cls.name} · Due {h.dueDate}
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>Submissions</span>
                    <span>
                      {h.submissions}/{h.totalStudents}
                    </span>
                  </div>
                  <Progress value={(h.submissions / h.totalStudents) * 100} className="h-1.5" />
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/teacher/classes/$classId/homework" params={{ classId: cls.id }}>
                    Open
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
