import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getQuestionTopics, getQuestionsByTopic } from "@/data/teacher-data";
import { LevelBadge, DifficultyBadge } from "@/components/teacher/badges";
import { PreviewSheet } from "@/components/teacher/dialogs";
import { Search, Eye, ClipboardList, FileText, Shuffle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/teacher/question-bank")({
  head: () => ({ meta: [{ title: "Question Bank — MIDORI Teacher" }] }),
  component: QuestionBank,
});

function QuestionBank() {
  const topics = getQuestionTopics();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("All");
  const [skill, setSkill] = useState("All");
  const [open, setOpen] = useState<string | null>(null);
  const sel = topics.find((t) => t.id === open);
  const selQs = sel ? getQuestionsByTopic(sel.id).slice(0, 6) : [];

  const filtered = topics.filter((t) =>
    (level === "All" || t.level === level) &&
    (skill === "All" || t.skill === skill) &&
    (t.name + t.jpName).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Center library"
        title="Question Bank"
        subtitle="Center-managed individual questions, organized by level, skill and topic."
        actions={
          <Button asChild>
            <Link to="/teacher/exams/create?source=question-bank">
              <Sparkles className="mr-2 h-4 w-4" />Create random exam
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search topics…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          {["All", "N5", "N4", "N3", "N2", "N1"].map((l) => (
            <Button key={l} size="sm" variant={level === l ? "default" : "outline"} onClick={() => setLevel(l)}>{l}</Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {["All", "Vocabulary", "Grammar", "Kanji", "Reading", "Listening"].map((s) => (
            <Button key={s} size="sm" variant={skill === s ? "default" : "outline"} onClick={() => setSkill(s)}>{s}</Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((t) => (
          <Card key={t.id} className="border-border/60 transition-all hover:border-primary/40 hover:shadow-md">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <LevelBadge level={t.level} />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.skill}</span>
              </div>
              <button onClick={() => setOpen(t.id)} className="block w-full truncate text-left font-semibold hover:text-primary">{t.name}</button>
              <div className="font-jp text-xs text-muted-foreground">{t.jpName}</div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="font-semibold">{t.totalQuestions}</span>
                <span className="text-muted-foreground">questions</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                <DifficultyBadge d="Easy" />
                <span>{t.easy}</span>
                <DifficultyBadge d="Medium" />
                <span>{t.medium}</span>
                <DifficultyBadge d="Hard" />
                <span>{t.hard}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <Button asChild size="sm" variant="outline">
                  <Link to={`/teacher/homework/create?source=question-bank&topicId=${t.id}`}>
                    <ClipboardList className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/teacher/exams/create?source=question-bank&topicId=${t.id}`}>
                    <FileText className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to={`/teacher/exams/create?source=question-bank&topicId=${t.id}&mode=random`}>
                    <Shuffle className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center text-[9px] uppercase tracking-wider text-muted-foreground">
                <span>HW</span><span>Exam</span><span>Random</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PreviewSheet open={!!sel} onOpenChange={(o) => !o && setOpen(null)} title={sel?.name ?? ""} description={sel?.jpName}>
        {sel && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <LevelBadge level={sel.level} />
              <span className="text-xs text-muted-foreground">{sel.skill}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-md bg-muted/40 p-2"><div className="text-xs text-muted-foreground">Total</div><div className="font-bold">{sel.totalQuestions}</div></div>
              <div className="rounded-md bg-success/10 p-2"><div className="text-xs text-success">Easy</div><div className="font-bold">{sel.easy}</div></div>
              <div className="rounded-md bg-warning/15 p-2"><div className="text-xs">Medium</div><div className="font-bold">{sel.medium}</div></div>
              <div className="rounded-md bg-destructive/10 p-2"><div className="text-xs text-destructive">Hard</div><div className="font-bold">{sel.hard}</div></div>
            </div>
            <div className="mt-2 text-xs font-semibold text-muted-foreground">Sample questions</div>
            <ul className="space-y-2">
              {selQs.map((q) => (
                <li key={q.id} className="rounded-lg border p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <DifficultyBadge d={q.difficulty} />
                    <span className="text-xs text-muted-foreground">{q.points} pts</span>
                  </div>
                  <div className="font-medium">{q.prompt}</div>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button asChild>
                <Link to={`/teacher/exams/create?source=question-bank&topicId=${sel.id}&mode=random`}>Random exam from this</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/teacher/homework/create?source=question-bank&topicId=${sel.id}`}>Add to homework</Link>
              </Button>
            </div>
          </div>
        )}
      </PreviewSheet>
    </div>
  );
}
