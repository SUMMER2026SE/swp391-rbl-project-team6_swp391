import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJlptExamSets } from "@/data/teacher-data";
import { LevelBadge, DifficultyBadge } from "@/components/teacher/badges";
import { PreviewSheet } from "@/components/teacher/dialogs";
import { Search, Eye, FileBadge, Sparkles } from "lucide-react";

export const Route = createFileRoute("/teacher/jlpt-bank")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({ meta: [{ title: "JLPT Exam Bank — MIDORI Teacher" }] }),
  component: JlptBank,
});

function JlptBank() {
  const sets = getJlptExamSets();
  const { q: urlQ } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [level, setLevel] = useState("All");
  const [open, setOpen] = useState<string | null>(null);
  const sel = sets.find((s) => s.id === open);

  const filtered = sets.filter(
    (s) =>
      (level === "All" || s.level === level) &&
      (urlQ === "" || s.title.toLowerCase().includes(urlQ.toLowerCase())),
  );

  const handlePageSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    navigate({ search: { q: e.target.value || undefined } });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Center library"
        title="JLPT Exam Bank"
        subtitle="Complete JLPT-style exam sets prepared by the Center. Use them as-is for mock exams."
        actions={
          <Button asChild>
            <Link to="/teacher/exams/create?source=jlpt-bank">
              <Sparkles className="mr-2 h-4 w-4" />
              Create from JLPT bank
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sets…"
            value={urlQ}
            onChange={handlePageSearchChange}
            className="pl-9"
          />
        </div>
        {["All", "N5", "N4", "N3", "N2", "N1"].map((l) => (
          <Button
            key={l}
            size="sm"
            variant={level === l ? "default" : "outline"}
            onClick={() => setLevel(l)}
          >
            {l}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((s) => (
          <Card
            key={s.id}
            className="border-border/60 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <CardContent className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <LevelBadge level={s.level} />
                <span className="text-xs text-muted-foreground">{s.year}</span>
              </div>
              <button
                onClick={() => setOpen(s.id)}
                className="block text-left font-display text-lg font-semibold hover:text-primary"
              >
                {s.title}
              </button>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px]">
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-muted-foreground">Duration</div>
                  <div className="text-sm font-bold">{s.duration}m</div>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-muted-foreground">Questions</div>
                  <div className="text-sm font-bold">{s.totalQuestions}</div>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-muted-foreground">Sections</div>
                  <div className="text-sm font-bold">{s.sections.length}</div>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-muted-foreground">E/M/H</div>
                  <div className="text-sm font-bold">
                    {s.mix.easy}/{s.mix.medium}/{s.mix.hard}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setOpen(s.id)} className="flex-1">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button asChild className="flex-1">
                  <Link to={`/teacher/exams/create?source=jlpt-bank&jlptSetId=${s.id}`}>
                    <FileBadge className="mr-2 h-4 w-4" />
                    Use set
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="py-12 text-center text-muted-foreground">
          No exam sets match your search.
        </Card>
      )}

      <PreviewSheet
        open={!!sel}
        onOpenChange={(o) => !o && setOpen(null)}
        title={sel?.title ?? ""}
        description={sel ? `${sel.duration} min · ${sel.totalQuestions} questions` : ""}
      >
        {sel && (
          <div className="space-y-3 text-sm">
            <p>{sel.description}</p>
            <div>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">Sections</div>
              <ul className="space-y-1">
                {sel.sections.map((sec, i) => (
                  <li key={i} className="flex justify-between rounded-md border p-2">
                    <span>{sec.name}</span>
                    <span className="text-muted-foreground">{sec.questions} questions</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">Difficulty mix</div>
              <div className="flex flex-wrap gap-2">
                <span>
                  <DifficultyBadge d="Easy" /> {sel.mix.easy}%
                </span>
                <span>
                  <DifficultyBadge d="Medium" /> {sel.mix.medium}%
                </span>
                <span>
                  <DifficultyBadge d="Hard" /> {sel.mix.hard}%
                </span>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link to={`/teacher/exams/create?source=jlpt-bank&jlptSetId=${sel.id}`}>
                Use this set
              </Link>
            </Button>
          </div>
        )}
      </PreviewSheet>
    </div>
  );
}
