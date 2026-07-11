import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { homeworkApi } from "@/lib/api/homework";
import { classesApi } from "@/lib/api/classes";
import { LevelBadge, StatusBadge } from "@/components/teacher/badges";
import { Plus, Search, Loader2 } from "lucide-react";

export const Route = createFileRoute("/teacher/homework")({
  head: () => ({ meta: [{ title: "Homework — MIDORI Teacher" }] }),
  component: HomeworkPage,
});

function HomeworkPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/teacher/homework") {
    return <Outlet />;
  }

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("All");

  const { data: rawHw = [], isLoading: isLoadingHw } = useQuery({
    queryKey: ["teacherAllHomeworks"],
    queryFn: () => homeworkApi.getTeacherHomeworks(),
  });

  const { data: rawClasses = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getAllClasses(),
  });

  const isLoading = isLoadingHw || isLoadingClasses;

  const classMap = useMemo(() => {
    const map: Record<string, { id: string; name: string; level: string }> = {};
    rawClasses.forEach((c) => {
      map[c.id] = { id: c.id, name: c.name, level: c.level || "N5" };
    });
    return map;
  }, [rawClasses]);

  const filtered = useMemo(() => {
    return rawHw.filter(
      (h) =>
        (status === "All" || h.status === status.toUpperCase()) &&
        h.title.toLowerCase().includes(q.toLowerCase()),
    );
  }, [rawHw, status, q]);

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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No homework assignments found.
              </CardContent>
            </Card>
          )}
          {filtered.map((h) => {
            const cls = classMap[h.classId] ?? { id: h.classId, name: "Unknown Class", level: "N5" };
            return (
              <Card key={h.id}>
                <CardContent className="grid items-center gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <LevelBadge level={cls.level} />
                      <StatusBadge status={h.status} />
                    </div>
                    <Link
                      to="/teacher/classes/$classId/homework"
                      params={{ classId: cls.id }}
                      className="block truncate font-semibold hover:text-primary"
                    >
                      {h.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {cls.name} · Due {h.dueDate ? h.dueDate.slice(0, 10) : "—"}
                    </div>
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
      )}
    </div>
  );
}
