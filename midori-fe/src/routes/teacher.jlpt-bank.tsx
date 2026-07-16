import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LevelBadge, DifficultyBadge } from "@/components/teacher/badges";
import { PreviewSheet } from "@/components/teacher/dialogs";
import { Search, Eye, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { examsApi, type ExamResponse } from "@/lib/api/exams";

export const Route = createFileRoute("/teacher/jlpt-bank")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({ meta: [{ title: "JLPT Exam Bank — MIDORI Teacher" }] }),
  component: JlptBank,
});

function mapSectionFromPrompt(prompt: string): { cleanPrompt: string; section: "Vocabulary" | "Grammar" | "Reading" | "Listening" } {
  if (prompt.startsWith("[Vocabulary] ")) {
    return { cleanPrompt: prompt.substring(13), section: "Vocabulary" };
  }
  if (prompt.startsWith("[Grammar] ")) {
    return { cleanPrompt: prompt.substring(10), section: "Grammar" };
  }
  if (prompt.startsWith("[Reading] ")) {
    return { cleanPrompt: prompt.substring(10), section: "Reading" };
  }
  if (prompt.startsWith("[Listening] ")) {
    return { cleanPrompt: prompt.substring(12), section: "Listening" };
  }
  return { cleanPrompt: prompt, section: "Vocabulary" };
}

function JlptBank() {
  const { q: urlQ } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [level, setLevel] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: rawExams = [], isLoading } = useQuery({
    queryKey: ["exam-bank"],
    queryFn: () => examsApi.getAllExams(),
  });

  const { data: sel } = useQuery({
    queryKey: ["exam", openId],
    queryFn: () => examsApi.getExamById(openId!),
    enabled: !!openId,
  });

  // Filter exams that are in category JLPT and PUBLISHED
  const sets = rawExams.filter(
    (e) => e.category === "JLPT" && e.status === "PUBLISHED"
  );

  const filtered = sets.filter(
    (s) =>
      (level === "All" || s.level === level) &&
      (urlQ === "" || s.title.toLowerCase().includes(urlQ.toLowerCase())),
  );

  const handlePageSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    navigate({ search: { q: e.target.value || undefined } });
  };

  // Helper to compute stats for a single exam response
  const getExamStats = (exam: ExamResponse) => {
    const qs = exam.questions || [];
    const vocab = qs.filter(q => mapSectionFromPrompt(q.prompt).section === "Vocabulary").length;
    const grammar = qs.filter(q => mapSectionFromPrompt(q.prompt).section === "Grammar").length;
    const reading = qs.filter(q => mapSectionFromPrompt(q.prompt).section === "Reading").length;
    const listening = qs.filter(q => mapSectionFromPrompt(q.prompt).section === "Listening").length;
    
    const sections = [
      { name: "Vocabulary", questions: vocab },
      { name: "Grammar", questions: grammar },
      { name: "Reading", questions: reading },
      { name: "Listening", questions: listening }
    ].filter(sec => sec.questions > 0);

    const easyCount = exam.difficultyEasy ?? 0;
    const mediumCount = exam.difficultyMedium ?? 0;
    const hardCount = exam.difficultyHard ?? 0;
    const tot = easyCount + mediumCount + hardCount;
    // Only compute percentages when the backend provides at least one non-zero value.
    // Never fabricate difficulty data.
    const mix =
      tot > 0
        ? {
            easy: Math.round((easyCount / tot) * 100),
            medium: Math.round((mediumCount / tot) * 100),
            hard: Math.round((hardCount / tot) * 100),
          }
        : null;

    return {
      sections,
      mix,
      year: exam.createdAt ? new Date(exam.createdAt).getFullYear() : new Date().getFullYear(),
      description: exam.category === "JLPT" ? `Official JLPT-style exam prepared by the Admin.` : ""
    };
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Center library"
        title="JLPT Exam Bank"
        subtitle="Complete JLPT-style exam sets prepared by the Center. Use them as-is for mock exams."

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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((s) => {
            const stats = getExamStats(s);
            return (
              <Card
                key={s.id}
                className="border-border/60 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <LevelBadge level={s.level} />
                    <span className="text-xs text-muted-foreground">{stats.year}</span>
                  </div>
                  <button
                    onClick={() => setOpenId(s.id)}
                    className="block text-left font-display text-lg font-semibold hover:text-primary"
                  >
                    {s.title}
                  </button>
                  <p className="mt-1 text-sm text-muted-foreground">{stats.description}</p>
                  <div className={`mt-3 grid gap-2 text-center text-[10px] ${stats.mix ? "grid-cols-4" : "grid-cols-3"}`}>
                    <div className="rounded-md bg-muted/40 p-2">
                      <div className="text-muted-foreground">Duration</div>
                      <div className="text-sm font-bold">{s.timeLimit}m</div>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      <div className="text-muted-foreground">Questions</div>
                      <div className="text-sm font-bold">{s.totalQuestions ?? s.questions?.length ?? 0}</div>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      <div className="text-muted-foreground">Sections</div>
                      <div className="text-sm font-bold">{stats.sections.length}</div>
                    </div>
                    {stats.mix && (
                      <div className="rounded-md bg-muted/40 p-2">
                        <div className="text-muted-foreground">E/M/H</div>
                        <div className="text-sm font-bold">
                          {stats.mix.easy}/{stats.mix.medium}/{stats.mix.hard}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => setOpenId(s.id)} className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <Card className="py-12 text-center text-muted-foreground">
          No exam sets match your search.
        </Card>
      )}

      <PreviewSheet
        open={!!sel}
        onOpenChange={(o) => !o && setOpenId(null)}
        title={sel?.title ?? ""}
        description={sel ? `${sel.timeLimit} min · ${sel.totalQuestions ?? sel.questions?.length ?? 0} questions` : ""}
      >
        {sel && (() => {
          const stats = getExamStats(sel);
          return (
            <div className="space-y-3 text-sm">
              <p>{stats.description}</p>
              <div>
                <div className="mb-1 text-xs font-semibold text-muted-foreground">Sections</div>
                <ul className="space-y-1">
                  {stats.sections.map((sec, i) => (
                    <li key={i} className="flex justify-between rounded-md border p-2">
                      <span>{sec.name}</span>
                      <span className="text-muted-foreground">{sec.questions} questions</span>
                    </li>
                  ))}
                </ul>
              </div>
              {stats.mix && (
                <div>
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">Difficulty mix</div>
                  <div className="flex flex-wrap gap-2">
                    <span>
                      <DifficultyBadge d="Easy" /> {stats.mix.easy}%
                    </span>
                    <span>
                      <DifficultyBadge d="Medium" /> {stats.mix.medium}%
                    </span>
                    <span>
                      <DifficultyBadge d="Hard" /> {stats.mix.hard}%
                    </span>
                  </div>
                </div>
              )}

            </div>
          );
        })()}
      </PreviewSheet>
    </div>
  );
}
