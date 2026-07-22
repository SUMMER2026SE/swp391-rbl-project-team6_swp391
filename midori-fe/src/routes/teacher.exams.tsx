import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { examsApi, mapExamUiStatus, type ExamResponse } from "@/lib/api/exams";
import { classesApi } from "@/lib/api/classes";
import { LevelBadge, StatusBadge } from "@/components/teacher/badges";
import { Plus, Search, Loader2, Sparkles, HelpCircle, Edit, Trash2, Send, Eye, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExamEditDialog } from "@/components/teacher/exam-edit-dialog";
import { ExamAssignDialog } from "@/components/teacher/exam-assign-dialog";
import { ConfirmDialog, PreviewSheet } from "@/components/teacher/dialogs";
import type { TeacherExamView, JLPTLevel } from "@/types/teacher-exam";

export const Route = createFileRoute("/teacher/exams")({
  head: () => ({ meta: [{ title: "Exams — MIDORI Teacher" }] }),
  component: ExamsPage,
});

function mapApiExamToView(e: ExamResponse): TeacherExamView {
  const uiStatus = mapExamUiStatus(e.status);
  const source = e.category || "question-bank";

  return {
    id: e.id,
    classId: e.classId || e.assignedClassId || "",
    title: e.title,
    level: (e.level as JLPTLevel) || "N5",
    status: uiStatus === "published" ? "Scheduled" : uiStatus === "pending" ? "Archived" : "Draft",
    totalQuestions: e.totalQuestions || (e.questions ? e.questions.length : 0),
    duration: e.timeLimit || 60,
    scheduledAt: e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "—",
    source,
    attempts: 1,
  };
}

function ExamsPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();

  if (pathname !== "/teacher/exams") {
    return <Outlet />;
  }

  const [activeTab, setActiveTab] = useState("assignments");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("All");

  // Dialog & drawer states
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [assignExamView, setAssignExamView] = useState<TeacherExamView | null>(null);
  const [previewExamId, setPreviewExamId] = useState<string | null>(null);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);

  // Queries
  const { data: rawExams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ["teacherAllExams"],
    queryFn: () => examsApi.getAllExams(),
  });

  const { data: rawClasses = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getAllClasses(),
  });

  const isLoading = isLoadingExams || isLoadingClasses;

  const classMap = useMemo(() => {
    const map: Record<string, { id: string; name: string; level: string }> = {};
    rawClasses.forEach((c) => {
      map[c.id] = { id: c.id, name: c.name, level: c.level || "N5" };
    });
    return map;
  }, [rawClasses]);

  const examViews = useMemo(() => {
    return rawExams.map(mapApiExamToView);
  }, [rawExams]);

  const filteredExams = useMemo(() => {
    return examViews.filter((e) => {
      const matchStatus =
        status === "All" ||
        (status === "Draft" && e.status === "Draft") ||
        (status === "Scheduled" && e.status === "Scheduled") ||
        (status === "Archived" && e.status === "Archived");
      const matchSearch = e.title.toLowerCase().includes(q.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [examViews, status, q]);

  const previewExam = useMemo(() => {
    return examViews.find((e) => e.id === previewExamId) || null;
  }, [examViews, previewExamId]);

  const editingExamView = useMemo(() => {
    return examViews.find((e) => e.id === editingExamId) || null;
  }, [examViews, editingExamId]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["teacherAllExams"] });
  };

  const handleDelete = async (id: string) => {
    try {
      await examsApi.deleteExam(id);
      toast.success("Exam deleted successfully.");
      setDeletingExamId(null);
      await handleRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete exam.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Assessment"
        title="Exams & Tests"
        subtitle="Manage assigned exams and create new exams across your classes."
        actions={
          <Button asChild>
            <Link to="/teacher/exams/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Link>
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="assignments">Class Exams</TabsTrigger>
          <TabsTrigger value="creation-methods">Creation Methods</TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search exams..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          {activeTab === "assignments" && (
            <>
              {(["All", "Draft", "Scheduled", "Archived"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={status === f ? "default" : "outline"}
                  onClick={() => setStatus(f)}
                >
                  {f}
                </Button>
              ))}
            </>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <TabsContent value="assignments" className="mt-0">
              <div className="grid gap-3">
                {filteredExams.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                      No exams found matching your filter.
                    </CardContent>
                  </Card>
                )}
                {filteredExams.map((e) => {
                  const cls = classMap[e.classId];
                  return (
                    <Card key={e.id} className="hover:border-primary/40 transition-colors">
                      <CardContent className="grid items-center gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <LevelBadge level={e.level} />
                            <StatusBadge status={e.status} />
                            {cls && (
                              <span className="text-xs font-semibold text-muted-foreground truncate">
                                · {cls.name}
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-foreground truncate">{e.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {e.totalQuestions} Questions · {e.duration} mins · Created {e.scheduledAt}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssignExamView(e)}
                          >
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            Assign
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingExamId(e.id)}
                          >
                            <Edit className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => setPreviewExamId(e.id)}>
                                <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => setDeletingExamId(e.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="creation-methods" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2">
                <MethodCard
                  icon={Sparkles}
                  title="AI Exam Generator"
                  desc="Upload a PDF or choose a lesson to let AI generate exam questions automatically."
                  badge="AI Generator"
                  to="/teacher/exams/create?source=ai-pdf"
                />
                <MethodCard
                  icon={HelpCircle}
                  title="From Question Bank"
                  desc="Pick questions from your question library by topic, level, and difficulty."
                  badge="Generator"
                  to="/teacher/exams/create?source=question-bank"
                />
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Edit Dialog */}
      <ExamEditDialog
        open={!!editingExamId}
        onOpenChange={(o) => !o && setEditingExamId(null)}
        exam={editingExamView}
        onSave={() => {
          setEditingExamId(null);
          handleRefresh();
        }}
      />

      {/* Assign Dialog */}
      <ExamAssignDialog
        open={!!assignExamView}
        onOpenChange={(o) => !o && setAssignExamView(null)}
        exam={assignExamView}
        onSuccess={() => {
          setAssignExamView(null);
          handleRefresh();
        }}
      />

      {/* Preview Sheet */}
      <PreviewSheet
        open={!!previewExamId}
        onOpenChange={(o) => !o && setPreviewExamId(null)}
        title={previewExam?.title ?? "Exam Preview"}
      >
        {previewExam && (
          <div className="space-y-4 pt-4 text-sm">
            <div className="flex items-center gap-2">
              <LevelBadge level={previewExam.level} />
              <StatusBadge status={previewExam.status} />
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/40 border">
              <div>
                <span className="text-xs text-muted-foreground">Total Questions</span>
                <p className="font-bold text-base">{previewExam.totalQuestions}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Duration</span>
                <p className="font-bold text-base">{previewExam.duration} mins</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Source: <span className="font-semibold text-foreground uppercase">{previewExam.source}</span>
            </p>
          </div>
        )}
      </PreviewSheet>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deletingExamId}
        onOpenChange={(o) => !o && setDeletingExamId(null)}
        title="Delete Exam"
        description="Are you sure you want to delete this exam? Students will no longer be able to take it."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deletingExamId && handleDelete(deletingExamId)}
      />
    </div>
  );
}

function MethodCard({
  icon: Icon,
  title,
  desc,
  badge,
  to,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  badge: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-md block"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon className="h-6 w-6" />
        </div>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {badge}
        </span>
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </Link>
  );
}
