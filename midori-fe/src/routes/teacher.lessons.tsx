import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLessons, getClasses } from "@/data/teacher-data";
import { LevelBadge, StatusBadge } from "@/components/teacher/badges";
import { Plus, Search, BookOpen, Eye, Edit, Copy } from "lucide-react";
import { PreviewSheet } from "@/components/teacher/dialogs";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/lessons")({
  head: () => ({ meta: [{ title: "Lessons — MIDORI Teacher" }] }),
  component: LessonsPage,
});

function LessonsPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/teacher/lessons") {
    return <Outlet />;
  }

  const lessons = getLessons();
  const classes = getClasses();
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState<string>("All");
  const [open, setOpen] = useState<string | null>(null);
  const sel = lessons.find((l) => l.id === open);

  const filtered = lessons.filter(
    (l) =>
      (skill === "All" || l.skill === skill) &&
      (l.title + l.jpTitle).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Library"
        title="Lessons"
        subtitle="All lessons across your classes."
        actions={
          <Button asChild>
            <Link to="/teacher/lessons/create">
              <Plus className="mr-2 h-4 w-4" />
              New lesson
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        {["All", "Vocabulary", "Grammar", "Kanji", "Reading", "Listening"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={skill === s ? "default" : "outline"}
            onClick={() => setSkill(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((l) => {
          const cls = classes.find((c) => c.id === l.classId);
          return (
            <Card key={l.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="mb-1 flex items-center gap-2">
                  {cls && <LevelBadge level={cls.level} />}
                  <StatusBadge status={l.status} />
                </div>
                <button
                  onClick={() => setOpen(l.id)}
                  className="block w-full truncate text-left font-semibold hover:text-primary"
                >
                  {l.title}
                </button>
                <div className="font-jp text-xs text-muted-foreground">{l.jpTitle}</div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{l.objective}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {cls?.name ?? "Unassigned"} · {l.skill}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setOpen(l.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <PreviewSheet
        open={!!sel}
        onOpenChange={(o) => !o && setOpen(null)}
        title={sel?.title ?? ""}
        description={sel?.jpTitle}
      >
        {sel && (
          <div className="space-y-3 text-sm">
            <p>
              <b>Skill:</b> {sel.skill} · <b>Duration:</b> {sel.duration} min
            </p>
            <p>{sel.objective}</p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  toast.info("Edit");
                  setOpen(null);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  toast.success("Duplicated");
                  setOpen(null);
                }}
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
            </div>
          </div>
        )}
      </PreviewSheet>
    </div>
  );
}
