import React, { useState } from "react";
import { Card } from "@/components/page-ui";
import { Calendar, Clock, FileText, ChevronDown, Award, Sparkles } from "lucide-react";
import type { Assignment } from "@/types/class-detail";

interface HomeworkSectionProps {
  assignments: Assignment[];
  onViewResult?: (assignmentId: string) => void;
}

export function HomeworkSection({ assignments, onViewResult }: HomeworkSectionProps) {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("deadline");

  const filters = ["All", "Homework", "Upcoming", "Submitted", "Graded", "Overdue"];
  const sortOptions = [
    { value: "deadline", label: "Nearest Deadline" },
    { value: "assigned", label: "Latest Assigned" },
  ];

  const processedAssignments = React.useMemo(() => {
    let list = [...assignments];

    // Filter status mapping
    if (filter !== "All") {
      list = list.filter((a) => {
        if (filter === "Homework") return a.status !== "Overdue" && a.status !== "Graded";
        if (filter === "Upcoming") return a.status === "Not Started" || a.status === "In Progress";
        if (filter === "Submitted") return a.status === "Submitted";
        if (filter === "Graded") return a.status === "Graded";
        if (filter === "Overdue") return a.status === "Overdue";
        return true;
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sort === "deadline") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sort === "assigned") {
        return new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime();
      }
      return 0;
    });

    return list;
  }, [assignments, filter, sort]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Graded":
        return "bg-green-500/10 text-green-500 dark:bg-green-500/25";
      case "Submitted":
        return "bg-blue-500/10 text-blue-500 dark:bg-blue-500/25";
      case "In Progress":
        return "bg-amber-500/10 text-amber-500 dark:bg-amber-500/25";
      case "Overdue":
        return "bg-red-500/10 text-red-500 dark:bg-red-500/25";
      case "Not Started":
      default:
        return "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300";
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
        <h3 className="font-display font-black text-base text-foreground dark:text-white flex items-center gap-2">
          <FileText className="w-4.5 h-4.5 text-primary" />
          Homework Assigned by Teacher
        </h3>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-muted-foreground font-semibold">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none cursor-pointer focus:ring-1 focus:ring-primary text-foreground dark:text-white"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              filter === f
                ? "bg-linear-to-r from-blue-400 to-pink-400 text-white shadow-sm"
                : "bg-card/50 dark:bg-white/4.5 border border-border/40 text-muted-foreground hover:text-foreground dark:hover:bg-white/8"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid of assignments */}
      <div className="grid sm:grid-cols-2 gap-4">
        {processedAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.005] flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase text-primary">
                  {assignment.moduleType}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusStyle(
                    assignment.status
                  )}`}
                >
                  {assignment.status}
                </span>
              </div>

              <h4 className="font-bold text-xs sm:text-sm text-foreground dark:text-white leading-tight mb-2">
                {assignment.title}
              </h4>

              <div className="space-y-1 text-[11px] text-muted-foreground mb-4">
                <div className="flex justify-between">
                  <span>Assigned</span>
                  <span className="font-semibold">{assignment.assignedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deadline</span>
                  <span className="font-semibold">{assignment.deadline}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Limit</span>
                  <span className="font-semibold">
                    {assignment.timeLimit > 0 ? `${assignment.timeLimit} mins` : "No limit"}
                  </span>
                </div>
                {assignment.status === "Graded" && (
                  <div className="flex justify-between text-green-500 font-bold border-t border-dashed border-border/50 pt-1 mt-1">
                    <span>Score</span>
                    <span>
                      {assignment.score} / {assignment.maxScore}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-white/10 text-foreground dark:text-white transition">
                View Detail
              </button>
              {assignment.status === "Not Started" && (
                <button className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold hover:opacity-90 shadow-sm transition">
                  Start
                </button>
              )}
              {assignment.status === "In Progress" && (
                <button className="flex-1 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 shadow-sm transition">
                  Resume
                </button>
              )}
              {assignment.status === "Graded" && onViewResult && (
                <button
                  onClick={() => onViewResult(assignment.id)}
                  className="flex-1 py-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 text-[10px] font-bold border border-green-500/20 transition flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Result
                </button>
              )}
            </div>
          </div>
        ))}

        {processedAssignments.length === 0 && (
          <div className="sm:col-span-2 text-center py-10 bg-white/50 dark:bg-indigo-950/10 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
            <p className="text-xs text-muted-foreground font-semibold">No homework matches the filter</p>
          </div>
        )}
      </div>
    </Card>
  );
}
