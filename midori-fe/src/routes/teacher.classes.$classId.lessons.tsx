import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLessonsByClass, type Lesson } from "@/data/teacher-data";
import { StatusBadge } from "@/components/teacher/badges";
import { PreviewSheet, ConfirmDialog } from "@/components/teacher/dialogs";
import {
  BookOpen,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Copy,
  Archive,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { LessonEditDialog } from "@/components/teacher/lesson-edit-dialog";

export const Route = createFileRoute("/teacher/classes/$classId/lessons")({
  component: ClassLessons,
});

function ClassLessons() {
  const { classId } = Route.useParams();
  const lessons = getLessonsByClass(classId);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [editLesson, setEditLesson] = useState<string | null>(null);

  const filtered = lessons.filter((l) => l.title.toLowerCase().includes(q.toLowerCase()));
  const sel = lessons.find((l) => l.id === open);

  const handleLessonSave = (updated: Lesson) => {
    toast.success("Lesson updated");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search lessons…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild className="ml-auto">
          <Link to={`/teacher/lessons/create?classId=${classId}`}>
            <Plus className="mr-2 h-4 w-4" />
            New lesson
          </Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No lessons yet for this class.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((l) => (
            <Card key={l.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <StatusBadge status={l.status} />
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {l.skill}
                      </span>
                    </div>
                    <button
                      onClick={() => setOpen(l.id)}
                      className="block truncate text-left font-semibold hover:text-primary"
                    >
                      {l.title}
                    </button>
                    <div className="font-jp text-xs text-muted-foreground">{l.jpTitle}</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setOpen(l.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setEditLesson(l.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => toast.success("Lesson duplicated")}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      {l.status === "Published" ? (
                        <DropdownMenuItem onSelect={() => toast.success("Unpublished")}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Unpublish
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => toast.success("Published")}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => setArchiving(l.id)}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{l.objective}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>⏱ {l.duration} min</span>
                  <span>·</span>
                  <span>{l.source === "data-bank" ? "From Data Bank" : "Manual"}</span>
                  <span>·</span>
                  <span>Updated {l.updatedAt}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PreviewSheet
        open={!!sel}
        onOpenChange={(o) => !o && setOpen(null)}
        title={sel?.title ?? ""}
        description={sel?.jpTitle}
      >
        {sel && (
          <div className="space-y-3 text-sm">
            <p>
              <b>Objective:</b> {sel.objective}
            </p>
            <p>
              <b>Skill:</b> {sel.skill} · <b>Level:</b> {sel.level} · <b>Duration:</b>{" "}
              {sel.duration} min
            </p>
            <p>
              <b>Status:</b> {sel.status}
            </p>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-jp text-base">{sel.jpTitle}</p>
              <p className="mt-2 text-muted-foreground">
                Lesson content preview — opens full editor for edits.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => setEditLesson(sel.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit lesson
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  toast.success("Duplicated");
                  setOpen(null);
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </PreviewSheet>

      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(o) => !o && setArchiving(null)}
        title="Archive lesson?"
        description="Archived lessons are hidden from students but remain in your library."
        confirmLabel="Archive"
        onConfirm={() => toast.success("Lesson archived")}
      />

      <LessonEditDialog
        open={!!editLesson}
        onOpenChange={(o) => !o && setEditLesson(null)}
        lesson={editLesson ? (lessons.find((l) => l.id === editLesson) ?? null) : null}
        onSave={handleLessonSave}
      />
    </div>
  );
}
