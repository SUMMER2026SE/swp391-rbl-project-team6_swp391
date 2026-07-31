import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/page-ui";
import {
  Search,
  List,
  Grid,
  Calendar,
  Clock,
  Award,
  Play,
  ChevronRight,
  CheckCircle,
  HelpCircle,
  FileText,
} from "lucide-react";
import { ScoreDetailDialog } from "./dialogs/ScoreDetailDialog";
import { DoingAssignmentWorkspace } from "./DoingAssignmentWorkspace";
import type { DetailedClassInfo, Assignment, ScoreBreakdown } from "@/types/class-detail";

interface AssignmentsTabProps {
  classInfo: DetailedClassInfo;
}

export function AssignmentsTab({ classInfo }: AssignmentsTabProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOption, setSortOption] = useState("deadline");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedScore, setSelectedScore] = useState<ScoreBreakdown | null>(null);
  const [doingAssignment, setDoingAssignment] = useState<Assignment | null>(null);
  const [reviewingAssignment, setReviewingAssignment] = useState<Assignment | null>(null);

  const formatDate = (date: string | undefined | null): string => {
    if (!date || date === "-" || date === "None") return "No deadline";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "No deadline";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Helper: map assignment to status groups
  const getAssignmentStatus = (item: Assignment) => {
    if (item.status === "Submitted" || item.status === "Graded") return "Completed";
    if (item.status === "Not Started" || item.status === "In Progress") return "Pending";
    return item.status; // Overdue
  };

  // Status lists count mapping
  const counts = useMemo(() => {
    const list = classInfo.assignments;
    return {
      All: list.length,
      Pending: list.filter((a) => a.status === "Not Started" || a.status === "In Progress").length,
      Overdue: list.filter((a) => a.status === "Overdue").length,
      Completed: list.filter((a) => a.status === "Submitted" || a.status === "Graded").length,
    };
  }, [classInfo.assignments]);

  const sortedAndFiltered = useMemo(() => {
    let list = [...classInfo.assignments];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) => a.title.toLowerCase().includes(q) || a.moduleType.toLowerCase().includes(q),
      );
    }

    // 2. Status Filter
    if (statusFilter !== "All") {
      list = list.filter((a) => {
        const status = getAssignmentStatus(a);
        return status === statusFilter;
      });
    }

    // 3. Sorting Options
    list.sort((a, b) => {
      if (sortOption === "deadline") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortOption === "newest") {
        return new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime();
      }
      if (sortOption === "oldest") {
        return new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime();
      }
      if (sortOption === "highest_score") {
        return (b.score || 0) - (a.score || 0);
      }
      if (sortOption === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }, [classInfo.assignments, searchQuery, statusFilter, sortOption]);

  const handleAction = (item: Assignment) => {
    if (item.status === "Overdue") return;
    if (item.status === "Graded" || item.status === "Submitted") {
      // Open review workspace directly
      setReviewingAssignment(item);
    } else if (classInfo.status !== "archived") {
      setDoingAssignment(item);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Graded":
      case "Completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Submitted":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "In Progress":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Overdue":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border-border/40";
    }
  };

  if (doingAssignment || reviewingAssignment) {
    const activeAssignment = doingAssignment || reviewingAssignment!;
    const isReview = !!reviewingAssignment;
    return (
      <DoingAssignmentWorkspace
        assignment={{
          id: activeAssignment.id,
          title: activeAssignment.title,
          timeLimit: activeAssignment.timeLimit,
          maxScore: activeAssignment.maxScore,
          type: activeAssignment.type ?? "Homework",
        }}
        reviewMode={isReview}
        onClose={() => {
          setDoingAssignment(null);
          setReviewingAssignment(null);
        }}
        onSubmit={(id) => {
          const submitted = doingAssignment;
          if (doingAssignment) doingAssignment.status = "Submitted";
          setDoingAssignment(null);
          if (submitted) setReviewingAssignment(submitted);
          void queryClient.invalidateQueries({ queryKey: ["student-class-exams", classInfo.id] });
          void queryClient.invalidateQueries({ queryKey: ["student-class-homeworks", classInfo.id] });
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* High-density, professional SaaS control bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white/60 dark:bg-[#0d1020]/45 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
        {/* Left Side: Search & Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          {/* Search box */}
          <div className="relative w-full sm:w-48 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search assignment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs outline-none focus:ring-1 focus:ring-primary shadow-inner"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-1 items-center h-fit">
            {Object.entries(counts).map(([name, count]) => {
              const isActive = statusFilter === name;
              return (
                <button
                  key={name}
                  onClick={() => setStatusFilter(name)}
                  className={`h-8 px-3 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border hover:scale-[1.03] duration-150 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white border-transparent shadow-sm"
                      : "bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-white/5 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10"
                  }`}
                >
                  <span>{name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-white/10 text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: View Toggles & Sorting */}
        <div className="flex items-center gap-3 justify-end shrink-0">
          {/* View mode toggle */}
          <div className="flex items-center border border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 rounded-xl p-0.5 h-8">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid/Card View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-1.5 h-8">
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
              Sort:
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="h-full px-2.5 rounded-xl text-xs font-semibold bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none cursor-pointer focus:ring-1 focus:ring-primary"
            >
              <option value="deadline">Nearest Deadline</option>
              <option value="newest">Newest Assigned</option>
              <option value="oldest">Oldest Assigned</option>
              <option value="highest_score">Highest Score</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Render assignments in List or Grid view */}
      {viewMode === "list" ? (
        <Card className="p-2 overflow-hidden border border-slate-200/50 dark:border-white/5">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {sortedAndFiltered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.status !== "Overdue") {
                    handleAction(item);
                  }
                }}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-slate-50/50 dark:hover:bg-white/[0.005] transition gap-3 ${
                  item.status === "Overdue" ? "cursor-not-allowed opacity-75" : "cursor-pointer"
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shrink-0 ${getStatusStyle(item.status)}`}
                  >
                    {item.status}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs sm:text-sm text-foreground dark:text-white truncate">
                      {item.title}
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
                      <span className="font-bold text-primary">{item.moduleType}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" /> Due: {formatDate(item.deadline)}
                      </span>
                      <span>•</span>
                      <span>Time: {item.timeLimit > 0 ? `${item.timeLimit}m` : "Unlimited"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <button
                    disabled={
                      item.status === "Overdue" ||
                      (classInfo.status === "archived" &&
                        item.status !== "Graded" &&
                        item.status !== "Submitted")
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(item);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase transition shadow-sm border ${
                      item.status === "Graded" || item.status === "Submitted"
                        ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                        : item.status === "Overdue" ||
                            (classInfo.status === "archived" &&
                              item.status !== "Graded" &&
                              item.status !== "Submitted")
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-white/5 dark:text-slate-500 dark:border-white/5 shadow-none"
                          : "bg-primary text-primary-foreground border-transparent hover:opacity-95"
                    }`}
                  >
                    {item.status === "Graded" || item.status === "Submitted"
                      ? "View Result"
                      : item.status === "Overdue" ||
                          (classInfo.status === "archived" &&
                            item.status !== "Graded" &&
                            item.status !== "Submitted")
                        ? "Locked"
                        : "Start"}
                  </button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                </div>
              </div>
            ))}
          </div>

          {sortedAndFiltered.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/55 mb-3" />
              <p className="text-sm text-muted-foreground font-semibold">
                No assignments match your search or filter.
              </p>
            </div>
          )}
        </Card>
      ) : (
        /* Grid / Card view */
        <div className="grid sm:grid-cols-2 gap-4">
          {sortedAndFiltered.map((item) => (
            <Card
              key={item.id}
              onClick={() => {
                if (item.status !== "Overdue") {
                  handleAction(item);
                }
              }}
              className={`p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden ${
                item.status === "Overdue" ? "cursor-not-allowed opacity-75" : "cursor-pointer"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] uppercase font-black tracking-widest text-primary">
                    {item.moduleType}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>

                <h5 className="font-display font-bold text-sm text-foreground dark:text-white mb-2 leading-tight">
                  {item.title}
                </h5>

                <div className="space-y-1.5 text-xs text-muted-foreground mb-6">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Deadline
                    </span>
                    <span className="font-semibold text-foreground dark:text-white">
                      {formatDate(item.deadline)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Limit</span>
                    <span className="font-semibold text-foreground dark:text-white">
                      {item.timeLimit > 0 ? `${item.timeLimit} mins` : "Unlimited"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-slate-100 dark:border-white/5 pt-3">
                <button
                  disabled={
                    item.status === "Overdue" ||
                    (classInfo.status === "archived" &&
                      item.status !== "Graded" &&
                      item.status !== "Submitted")
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(item);
                  }}
                  className={`w-full py-2 rounded-xl text-[10px] font-black uppercase transition shadow-sm border ${
                    item.status === "Graded" || item.status === "Submitted"
                      ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                      : item.status === "Overdue" ||
                          (classInfo.status === "archived" &&
                            item.status !== "Graded" &&
                            item.status !== "Submitted")
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-white/5 dark:text-slate-500 dark:border-white/5 shadow-none"
                        : "bg-primary text-primary-foreground border-transparent hover:opacity-95"
                  }`}
                >
                  {item.status === "Graded" || item.status === "Submitted"
                    ? "View Result"
                    : item.status === "Overdue" ||
                        (classInfo.status === "archived" &&
                          item.status !== "Graded" &&
                          item.status !== "Submitted")
                      ? "Locked"
                      : "Start"}
                </button>
              </div>
            </Card>
          ))}

          {sortedAndFiltered.length === 0 && (
            <div className="sm:col-span-2 text-center py-12 bg-white/50 dark:bg-indigo-950/10 border border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground font-semibold">
                No assignments match your search or filter.
              </p>
            </div>
          )}
        </div>
      )}

      {selectedScore && (
        <ScoreDetailDialog
          score={selectedScore}
          onClose={() => setSelectedScore(null)}
          onReview={() => {
            const item = classInfo.assignments.find((a) => a.id === selectedScore.assignmentId);
            if (item) setReviewingAssignment(item);
          }}
        />
      )}
    </div>
  );
}
