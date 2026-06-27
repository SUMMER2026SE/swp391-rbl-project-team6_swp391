import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getReports } from "@/data/teacher-data";
import { StatusBadge } from "@/components/teacher/badges";
import { PreviewSheet, SuccessBanner } from "@/components/teacher/dialogs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquare, Plus, Search, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Report } from "@/data/teacher-data";

export const Route = createFileRoute("/teacher/reports")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: TeacherReportsPage,
});

function ReportCard({ report, onPreview }: { report: Report; onPreview: (r: Report) => void }) {
  const iconColors: Record<string, string> = {
    Attendance: "text-warning bg-warning/10",
    Behavior: "text-destructive bg-destructive/10",
    Progress: "text-success bg-success/10",
    Other: "text-info bg-info/10",
  };
  const color = iconColors[report.category] ?? "text-muted-foreground bg-muted";

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onPreview(report)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg", color)}>
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{report.title}</h3>
              <StatusBadge status={report.status} />
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{report.summary}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{report.category}</span>
              <span>·</span>
              <span>{report.createdAt}</span>
              {report.classId && (
                <>
                  <span>·</span>
                  <span>Class: {report.classId}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ThreadMessage({
  author,
  time,
  message,
}: {
  author: string;
  time: string;
  message: string;
}) {
  const isTeacher = author === "Aiko Tanaka";
  return (
    <div className={cn("flex gap-3", isTeacher ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
          isTeacher ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        <div className="mb-0.5 text-xs font-semibold opacity-70">{author}</div>
        <p>{message}</p>
        <div className={cn("mt-1 text-[10px] opacity-60", isTeacher ? "text-right" : "")}>
          {time}
        </div>
      </div>
    </div>
  );
}

function ReportPreviewSheet({
  report,
  open,
  onOpenChange,
}: {
  report: Report | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [reply, setReply] = useState("");

  if (!report) return null;

  const handleSendReply = () => {
    if (!reply.trim()) return;
    toast.success("Reply sent");
    setReply("");
  };

  const handleMarkResolved = () => {
    toast.success("Report marked as resolved");
    onOpenChange(false);
  };

  return (
    <PreviewSheet
      open={open}
      onOpenChange={onOpenChange}
      title={report.title}
      description={`${report.category} · Created ${report.createdAt}`}
    >
      <div className="space-y-4">
        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Summary</p>
          <p className="mt-1 text-sm text-muted-foreground">{report.summary}</p>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium">Thread</h4>
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            {report.thread.map((msg, i) => (
              <ThreadMessage key={i} author={msg.author} time={msg.time} message={msg.message} />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reply">Your Reply</Label>
          <Textarea
            id="reply"
            rows={3}
            placeholder="Write a reply…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkResolved}
              disabled={report.status === "Resolved"}
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Mark Resolved
            </Button>
            <Button size="sm" onClick={handleSendReply} disabled={!reply.trim()}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send Reply
            </Button>
          </div>
        </div>
      </div>
    </PreviewSheet>
  );
}

function NewReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Attendance" | "Behavior" | "Progress" | "Other">(
    "Other",
  );
  const [summary, setSummary] = useState("");
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !summary.trim()) {
      toast.error("Please fill in title and summary");
      return;
    }
    toast.success("Report created successfully");
    setTitle("");
    setSummary("");
    setClassId("");
    setStudentId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-title">Title</Label>
            <Input
              id="new-title"
              placeholder="Brief title for the report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Attendance">Attendance</SelectItem>
                  <SelectItem value="Behavior">Behavior</SelectItem>
                  <SelectItem value="Progress">Progress</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-class">Class ID (optional)</Label>
              <Input
                id="new-class"
                placeholder="e.g. n5-beginner-a"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-student">Student ID (optional)</Label>
            <Input
              id="new-student"
              placeholder="e.g. n5-beginner-a-s1"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-summary">Summary</Label>
            <Textarea
              id="new-summary"
              rows={4}
              placeholder="Describe the issue or update…"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeacherReportsPage() {
  const allReports = getReports();
  const { q: urlQ } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "In review" | "Resolved">(
    "All",
  );
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [successDismissed, setSuccessDismissed] = useState(false);

  const filtered = allReports.filter((r) => {
    const matchesSearch =
      !urlQ ||
      r.title.toLowerCase().includes(urlQ.toLowerCase()) ||
      r.summary.toLowerCase().includes(urlQ.toLowerCase()) ||
      r.category.toLowerCase().includes(urlQ.toLowerCase());
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = allReports.filter((r) => r.status === "Open").length;
  const reviewCount = allReports.filter((r) => r.status === "In review").length;
  const resolvedCount = allReports.filter((r) => r.status === "Resolved").length;

  const handlePreview = (report: Report) => {
    setSelectedReport(report);
    setPreviewOpen(true);
  };

  const handlePageSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    navigate({ search: { q: e.target.value || undefined } });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Communication"
        title="Reports"
        subtitle="Track and manage student reports"
        actions={
          <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1.5 h-4 w-4" />
                New Report
              </Button>
            </DialogTrigger>
            <NewReportDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} />
          </Dialog>
        }
      />

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{openCount}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{reviewCount}</p>
            <p className="text-xs text-muted-foreground">In Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{resolvedCount}</p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports…"
            value={urlQ}
            onChange={handlePageSearchChange}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(["All", "Open", "In review", "Resolved"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Success banner */}
      {successDismissed === false && openCount > 0 && (
        <SuccessBanner
          title={`${openCount} open report${openCount > 1 ? "s" : ""} need${openCount === 1 ? "s" : ""} attention`}
          onDismiss={() => setSuccessDismissed(true)}
        >
          Click a report to preview and reply.
        </SuccessBanner>
      )}

      {/* Reports list */}
      <div className="mt-4 space-y-3">
        {filtered.map((report) => (
          <ReportCard key={report.id} report={report} onPreview={handlePreview} />
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-muted">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold">No reports found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {urlQ ? "Try adjusting your search or filters." : "All caught up!"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <ReportPreviewSheet
        report={selectedReport}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
