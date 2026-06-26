import { Link } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import {
  ClipboardList,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Play,
  Check,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DoingAssignmentWorkspace } from "@/components/student/class-detail/DoingAssignmentWorkspace";

export type AssignmentStatus = "Not Started" | "In Progress" | "Submitted" | "Graded" | "Overdue";

export interface Assignment {
  id: string;
  title: string;
  type: string;
  assignedDate: string;
  deadline: string;
  timeLimit: string;
  maxScore: number;
  status: AssignmentStatus;
  score?: number;
  feedback?: string;
}

export function AssignmentsDashboard({
  activeTab,
}: {
  activeTab: "all" | "homework" | "upcoming" | "overdue" | "submitted" | "graded";
}) {
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: "a-1",
      title: "JLPT N5 Kanji Practice Set 1",
      type: "Homework",
      assignedDate: "2026-06-15",
      deadline: "2026-06-20",
      timeLimit: "30 mins",
      maxScore: 100,
      status: "Not Started",
    },
    {
      id: "a-2",
      title: "N5 Listening Dictation Unit 3",
      type: "Homework",
      assignedDate: "2026-06-16",
      deadline: "2026-06-19",
      timeLimit: "20 mins",
      maxScore: 50,
      status: "In Progress",
    },
    {
      id: "a-3",
      title: "Weekly Grammar Review Particle は vs が",
      type: "Homework",
      assignedDate: "2026-06-10",
      deadline: "2026-06-14",
      timeLimit: "45 mins",
      maxScore: 100,
      status: "Overdue",
    },
    {
      id: "a-4",
      title: "Basic Conversation Shadowing Practice",
      type: "Homework",
      assignedDate: "2026-06-12",
      deadline: "2026-06-17",
      timeLimit: "15 mins",
      maxScore: 100,
      status: "Submitted",
    },
    {
      id: "a-5",
      title: "JLPT N5 Full Mock Exam #1",
      type: "Upcoming",
      assignedDate: "2026-06-18",
      deadline: "2026-06-25",
      timeLimit: "105 mins",
      maxScore: 180,
      status: "Not Started",
    },
    {
      id: "a-6",
      title: "Vocabulary Test Lesson 1-3",
      type: "Homework",
      assignedDate: "2026-06-05",
      deadline: "2026-06-08",
      timeLimit: "25 mins",
      maxScore: 100,
      status: "Graded",
      score: 95,
      feedback: "Excellent work! You mastered the particle usages perfectly.",
    },
  ]);

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [doingAssignment, setDoingAssignment] = useState<Assignment | null>(null);

  // Tabs structure
  const tabs = [
    { label: "All", to: "/student/assignments/all", key: "all" },
    { label: "Homework", to: "/student/assignments/homework", key: "homework" },
    { label: "Upcoming", to: "/student/assignments/upcoming", key: "upcoming" },
    { label: "Overdue", to: "/student/assignments/overdue", key: "overdue" },
    { label: "Submitted", to: "/student/assignments/submitted", key: "submitted" },
    { label: "Graded", to: "/student/assignments/graded", key: "graded" },
  ];

  // Filtering assignments based on the tab
  const filteredAssignments = assignments.filter((asg) => {
    if (activeTab === "all") return true;
    if (activeTab === "homework")
      return (
        asg.type === "Homework" &&
        (asg.status === "Not Started" || asg.status === "In Progress" || asg.status === "Overdue")
      );
    if (activeTab === "upcoming")
      return (
        asg.type === "Upcoming" ||
        (asg.status === "Not Started" && asg.assignedDate >= "2026-06-18")
      );
    if (activeTab === "overdue") return asg.status === "Overdue";
    if (activeTab === "submitted") return asg.status === "Submitted";
    if (activeTab === "graded") return asg.status === "Graded";
    return true;
  });

  // Action Handlers
  const handleStart = (id: string) => {
    setAssignments((prev) =>
      prev.map((asg) => (asg.id === id ? { ...asg, status: "In Progress" } : asg)),
    );
    const target = assignments.find((a) => a.id === id);
    if (target) {
      setDoingAssignment({ ...target, status: "In Progress" });
    }
  };

  const handleResume = (id: string) => {
    const target = assignments.find((a) => a.id === id);
    if (target) {
      setDoingAssignment(target);
    }
  };

  const handleSubmit = (id: string) => {
    setAssignments((prev) =>
      prev.map((asg) => (asg.id === id ? { ...asg, status: "Submitted" } : asg)),
    );
    setDoingAssignment(null);
    setSelectedAssignment(null);
  };

  const getStatusStyle = (status: AssignmentStatus) => {
    switch (status) {
      case "Not Started":
        return "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300";
      case "In Progress":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
      case "Submitted":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400";
      case "Graded":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400";
      case "Overdue":
        return "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400";
    }
  };

  if (doingAssignment) {
    return (
      <DoingAssignmentWorkspace
        assignment={{
          id: doingAssignment.id,
          title: doingAssignment.title,
          timeLimit: doingAssignment.timeLimit,
          maxScore: doingAssignment.maxScore,
        }}
        onClose={() => setDoingAssignment(null)}
        onSubmit={(id) => handleSubmit(id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        subtitle="Complete your class homework, quizzes, and view teacher feedback."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            to={tab.to}
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
              tab.key === activeTab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Cards list */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map((asg) => (
          <Card
            key={asg.id}
            className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                    getStatusStyle(asg.status),
                  )}
                >
                  {asg.status}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">{asg.type}</span>
              </div>
              <h3 className="font-display font-bold text-base text-foreground mb-3 line-clamp-2">
                {asg.title}
              </h3>

              <div className="space-y-2 mb-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Assigned: {asg.assignedDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Deadline: {asg.deadline}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-primary">
                    Limit
                  </span>
                  <span>Time Limit: {asg.timeLimit}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-primary">
                    Score
                  </span>
                  <span>Max Score: {asg.maxScore}</span>
                </div>
                {asg.status === "Graded" && (
                  <div className="flex items-center gap-1.5 mt-2 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 p-2 rounded-lg">
                    <span>
                      Score Earned: {asg.score} / {asg.maxScore}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedAssignment(asg)}
                className="flex-1 py-2 rounded-xl border border-border/50 hover:bg-slate-50 dark:hover:bg-white/[0.01] text-xs font-bold text-foreground transition flex items-center justify-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                Details
              </button>

              {asg.status === "Not Started" && (
                <button
                  onClick={() => handleStart(asg.id)}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow hover:bg-primary/95 transition flex items-center justify-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start
                </button>
              )}

              {asg.status === "In Progress" && (
                <button
                  onClick={() => handleResume(asg.id)}
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow hover:bg-amber-600 transition flex items-center justify-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" />
                  Resume
                </button>
              )}

              {asg.status === "Overdue" && (
                <button
                  onClick={() => handleStart(asg.id)}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-xs shadow hover:bg-red-600 transition flex items-center justify-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Late
                </button>
              )}

              {(asg.status === "Submitted" || asg.status === "Graded") && (
                <div className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground text-xs font-bold text-center flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Completed
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Details Modal */}
      {selectedAssignment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60"
          onClick={() => setSelectedAssignment(null)}
        >
          <Card className="max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                    getStatusStyle(selectedAssignment.status),
                  )}
                >
                  {selectedAssignment.status}
                </span>
                <h3 className="font-display font-black text-lg text-foreground mt-2">
                  {selectedAssignment.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground border-y border-border/50 py-3">
              <p>
                <strong>Type:</strong> {selectedAssignment.type}
              </p>
              <p>
                <strong>Assigned:</strong> {selectedAssignment.assignedDate}
              </p>
              <p>
                <strong>Deadline:</strong> {selectedAssignment.deadline}
              </p>
              <p>
                <strong>Time Limit:</strong> {selectedAssignment.timeLimit}
              </p>
              <p>
                <strong>Maximum Score:</strong> {selectedAssignment.maxScore}
              </p>
              {selectedAssignment.score !== undefined && (
                <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                  <strong>Score Earned:</strong> {selectedAssignment.score} /{" "}
                  {selectedAssignment.maxScore}
                </p>
              )}
            </div>

            {selectedAssignment.feedback && (
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-xs">
                <strong>Teacher's Feedback:</strong>
                <p className="mt-1">{selectedAssignment.feedback}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 rounded-xl border border-border/50 text-xs font-bold text-foreground"
              >
                Close
              </button>
              {selectedAssignment.status === "Not Started" && (
                <button
                  onClick={() => {
                    handleStart(selectedAssignment.id);
                    setSelectedAssignment(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow hover:bg-primary/95"
                >
                  Start Assignment
                </button>
              )}
              {selectedAssignment.status === "In Progress" && (
                <button
                  onClick={() => {
                    handleResume(selectedAssignment.id);
                    setSelectedAssignment(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow hover:bg-amber-600"
                >
                  Resume
                </button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
