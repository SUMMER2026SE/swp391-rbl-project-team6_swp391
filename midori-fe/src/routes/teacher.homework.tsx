import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { homeworkApi } from "@/lib/api/homework";
import { classesApi } from "@/lib/api/classes";
import { LevelBadge, StatusBadge } from "@/components/teacher/badges";
import { Plus, Search, Loader2, Copy, Trash, Calendar, Send } from "lucide-react";
import { toast } from "sonner";

// Shared Manual Homework service hooks
import {
  useManualHomeworks,
  useDeleteManualHomework,
  usePublishManualHomework,
  useDraftManualHomework,
  useDuplicateManualHomework,
  useAssignManualHomework,
} from "@/services/manualHomeworkService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/teacher/homework")({
  head: () => ({ meta: [{ title: "Homework — MIDORI Teacher" }] }),
  component: HomeworkPage,
});

function HomeworkPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/teacher/homework") {
    return <Outlet />;
  }

  const [activeTab, setActiveTab] = useState("assignments");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("All");

  // Dialog assign states
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null);
  const [assignClassId, setAssignClassId] = useState<string>("");
  const [assignDueDate, setAssignDueDate] = useState<string>("");
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Queries & Mutations
  const { data: rawHw = [], isLoading: isLoadingHw } = useQuery({
    queryKey: ["teacherAllHomeworks"],
    queryFn: () => homeworkApi.getTeacherHomeworks(),
  });

  const { data: rawClasses = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getAllClasses(),
  });

  const { data: templates = [], isLoading: isLoadingTemplates } = useManualHomeworks();
  
  const deleteMutation = useDeleteManualHomework();
  const publishMutation = usePublishManualHomework();
  const draftMutation = useDraftManualHomework();
  const duplicateMutation = useDuplicateManualHomework();
  const assignMutation = useAssignManualHomework();

  const isLoading = isLoadingHw || isLoadingClasses || isLoadingTemplates;

  const classMap = useMemo(() => {
    const map: Record<string, { id: string; name: string; level: string }> = {};
    rawClasses.forEach((c) => {
      map[c.id] = { id: c.id, name: c.name, level: c.level || "N5" };
    });
    return map;
  }, [rawClasses]);

  const filteredHw = useMemo(() => {
    return rawHw.filter(
      (h) =>
        (status === "All" || h.status === status.toUpperCase()) &&
        h.title.toLowerCase().includes(q.toLowerCase()),
    );
  }, [rawHw, status, q]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => t.title.toLowerCase().includes(q.toLowerCase()));
  }, [templates, q]);

  const handlePublish = async (id: string) => {
    try {
      await publishMutation.mutateAsync(id);
      toast.success("Homework template published successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish template.");
    }
  };

  const handleDraft = async (id: string) => {
    try {
      await draftMutation.mutateAsync(id);
      toast.success("Homework template set to draft.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to draft template.");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateMutation.mutateAsync(id);
      toast.success("Homework template duplicated!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to duplicate template.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Homework template deleted.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete template.");
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignTargetId) return;
    if (!assignClassId) {
      toast.error("Please select a target class.");
      return;
    }
    if (!assignDueDate) {
      toast.error("Please select a due date.");
      return;
    }

    try {
      await assignMutation.mutateAsync({
        id: assignTargetId,
        req: {
          classId: assignClassId,
          dueDate: new Date(assignDueDate).toISOString(),
        },
      });
      toast.success("Homework template assigned to class successfully!");
      setIsAssignOpen(false);
      setAssignTargetId(null);
      setAssignClassId("");
      setAssignDueDate("");
      setActiveTab("assignments");
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign homework.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Library"
        title="Homework"
        subtitle="Manage assigned homeworks and manual homework templates."
        actions={
          <Button asChild>
            <Link to="/teacher/homework/create">
              <Plus className="mr-2 h-4 w-4" />
              Create manual homework
            </Link>
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="assignments">Class Assignments</TabsTrigger>
          <TabsTrigger value="templates">Templates Library</TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          {activeTab === "assignments" && (
            <>
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
                {filteredHw.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                      No homework assignments found.
                    </CardContent>
                  </Card>
                )}
                {filteredHw.map((h) => {
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
            </TabsContent>

            <TabsContent value="templates" className="mt-0">
              <div className="grid gap-3">
                {filteredTemplates.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                      No homework templates found.
                    </CardContent>
                  </Card>
                )}
                {filteredTemplates.map((t) => (
                  <Card key={t.id}>
                    <CardContent className="grid items-center gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <LevelBadge level={t.level} />
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.status === "PUBLISHED" ? "bg-[var(--status-approved)]/15 text-[var(--status-approved)]" : "bg-[var(--status-pending)]/15 text-[var(--status-pending)]"
                          }`}>
                            {t.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground bg-[var(--accent)] px-2 py-0.5 rounded font-mono">
                            {t.type}
                          </span>
                        </div>
                        <h4 className="font-semibold text-primary-col truncate">{t.title}</h4>
                        <div className="text-xs text-muted-col flex items-center gap-2">
                          <span>{t.questionCount} Questions</span>
                          <span>•</span>
                          <span>{t.duration} Mins</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {t.status === "PUBLISHED" ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setAssignTargetId(t.id);
                              setIsAssignOpen(true);
                            }}
                          >
                            <Calendar className="mr-1.5 h-3.5 w-3.5" />
                            Assign
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePublish(t.id)}
                            disabled={publishMutation.isPending}
                          >
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            Publish
                          </Button>
                        )}
                        {t.status === "PUBLISHED" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDraft(t.id)}
                            disabled={draftMutation.isPending}
                          >
                            Set to Draft
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicate(t.id)}
                          disabled={duplicateMutation.isPending}
                          title="Duplicate"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/10"
                          onClick={() => handleDelete(t.id)}
                          disabled={deleteMutation.isPending}
                          title="Delete"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Assign Class Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Homework Template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="class">Select Target Class *</Label>
              <Select value={assignClassId} onValueChange={setAssignClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose active class..." />
                </SelectTrigger>
                <SelectContent>
                  {rawClasses.filter((c: any) => c.status === "ACTIVE").map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Select Due Date *</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={assignDueDate}
                onChange={(e) => setAssignDueDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignSubmit}
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Assign Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
