import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDataBankResources } from "@/data/teacher-data";
import { LevelBadge } from "@/components/teacher/badges";
import { PreviewSheet } from "@/components/teacher/dialogs";
import { Search, Eye, BookOpen, ClipboardList, Star } from "lucide-react";

export const Route = createFileRoute("/teacher/data-bank")({
  head: () => ({ meta: [{ title: "Data Bank — MIDORI Teacher" }] }),
  component: DataBank,
});

function DataBank() {
  const resources = getDataBankResources();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("All");
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<string | null>(null);
  const sel = resources.find((r) => r.id === open);

  const categories = ["All", ...Array.from(new Set(resources.map((r) => r.category)))];
  const filtered = resources.filter(
    (r) =>
      (level === "All" || r.level === level) &&
      (cat === "All" || r.category === cat) &&
      (r.title + r.jpTitle + r.type).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Center library"
        title="Data Bank"
        subtitle="Center-managed learning resources you can attach to lessons or homework."
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
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
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={cat === c ? "default" : "outline"}
              onClick={() => setCat(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((r) => (
          <Card
            key={r.id}
            className="border-border/60 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <LevelBadge level={r.level} />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {r.type}
                </span>
              </div>
              <button
                onClick={() => setOpen(r.id)}
                className="block w-full truncate text-left font-semibold hover:text-primary"
              >
                {r.title}
              </button>
              <div className="font-jp text-xs text-muted-foreground">{r.jpTitle}</div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3 text-warning" />
                  {r.rating} · used {r.usage}×
                </span>
                <Button size="sm" variant="ghost" onClick={() => setOpen(r.id)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to={`/teacher/lessons/create?source=data-bank&resourceId=${r.id}`}>
                    <BookOpen className="mr-1 h-3.5 w-3.5" />
                    Use in lesson
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to={`/teacher/homework/create?source=data-bank&resourceId=${r.id}`}>
                    <ClipboardList className="mr-1 h-3.5 w-3.5" />
                    Add to HW
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PreviewSheet
        open={!!sel}
        onOpenChange={(o) => !o && setOpen(null)}
        title={sel?.title ?? ""}
        description={sel?.jpTitle}
      >
        {sel && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <LevelBadge level={sel.level} />
              <span className="text-xs text-muted-foreground">
                {sel.type} · {sel.category}
              </span>
            </div>
            <p>{sel.description}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-muted/40 p-2">
                <div className="text-xs text-muted-foreground">Duration</div>
                <div className="font-bold">{sel.duration}m</div>
              </div>
              <div className="rounded-md bg-muted/40 p-2">
                <div className="text-xs text-muted-foreground">Rating</div>
                <div className="font-bold">{sel.rating}★</div>
              </div>
              <div className="rounded-md bg-muted/40 p-2">
                <div className="text-xs text-muted-foreground">Usage</div>
                <div className="font-bold">{sel.usage}</div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button asChild className="flex-1">
                <Link to={`/teacher/lessons/create?source=data-bank&resourceId=${sel.id}`}>
                  Use in lesson
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to={`/teacher/homework/create?source=data-bank&resourceId=${sel.id}`}>
                  Add to homework
                </Link>
              </Button>
            </div>
          </div>
        )}
      </PreviewSheet>
    </div>
  );
}
