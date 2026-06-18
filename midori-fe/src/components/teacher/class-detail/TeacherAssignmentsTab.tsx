import React, { useState, useMemo } from "react";
import { Card } from "@/components/page-ui";
import { ClipboardList, Calendar, Users, Award, Eye, Edit, Trash2, CheckSquare } from "lucide-react";
import type { TeacherClassInfo, TeacherAssignment } from "@/types/teacher-class";

interface TeacherAssignmentsTabProps {
  classInfo: TeacherClassInfo;
}

export function TeacherAssignmentsTab({ classInfo }: TeacherAssignmentsTabProps) {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("deadline");

  const filters = ["All", "Active", "Need Grading", "Completed", "Overdue"];
  const sortOptions = [
    { value: "deadline", label: "Nearest Deadline" },
    { value: "created", label: "Latest Created" },
    { value: "completion", label: "Lowest Completion Rate" }
  ];

  const processedAssignments = useMemo(() => {
    let list = [...classInfo.assignments];

    // Filter status mapping
    if (filter !== "All") {
      list = list.filter((a) => {
        if (filter === "Active") return a.status === "Active";
        if (filter === "Need Grading") return a.status === "Active" && a.totalSubmissions > 0;
        if (filter === "Completed") return a.status === "Closed" && a.notSubmittedCount === 0;
        if (filter === "Overdue") return a.status === "Active" && a.notSubmittedCount > 0;
        return true;
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sort === "deadline") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sort === "created") {
        return new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime();
      }
      if (sort === "completion") {
        const rateA = a.totalSubmissions / (a.totalSubmissions + a.notSubmittedCount || 1);
        const rateB = b.totalSubmissions / (b.totalSubmissions + b.notSubmittedCount || 1);
        return rateA - rateB;
      }
      return 0;
    });

    return list;
  }, [classInfo, filter, sort]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-500 dark:bg-green-500/25 border-green-500/20";
      case "Closed":
        return "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border-border/40";
      case "Upcoming":
      default:
        return "bg-blue-500/10 text-blue-500 dark:bg-blue-500/25 border-blue-500/20";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters & Sorting Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/50 dark:bg-indigo-950/20 rounded-2xl border border-slate-200/50 dark:border-white/5 backdrop-blur-sm shadow-sm">
        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === f
                  ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-sm"
                  : "bg-card/50 dark:bg-white/4.5 border border-border/40 text-muted-foreground hover:text-foreground dark:hover:bg-white/8"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-muted-foreground font-semibold">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none cursor-pointer focus:ring-1 focus:ring-primary"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignment Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {processedAssignments.map((assignment) => {
          const totalStudents = assignment.totalSubmissions + assignment.notSubmittedCount;
          const compRate = Math.round((assignment.totalSubmissions / (totalStudents || 1)) * 100);

          return (
            <Card
              key={assignment.id}
              className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] uppercase font-black tracking-widest text-primary">
                    {assignment.moduleType}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(
                      assignment.status
                    )}`}
                  >
                    {assignment.status}
                  </span>
                </div>

                <h4 className="font-display font-bold text-base text-foreground dark:text-white mb-2 leading-tight">
                  {assignment.title}
                </h4>

                <div className="space-y-2 text-xs text-muted-foreground mb-6">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Assigned</span>
                    <span className="font-semibold text-foreground dark:text-white">{assignment.assignedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-red-500" /> Deadline</span>
                    <span className="font-semibold text-foreground dark:text-white">{assignment.deadline}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-border/50 pt-2 mt-2">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Submissions</span>
                    <span className="font-semibold text-foreground dark:text-white">
                      {assignment.totalSubmissions} / {totalStudents} ({compRate}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5 text-amber-500" /> Needs Grading</span>
                    <span className="font-semibold text-amber-500">
                      {assignment.status === "Active" ? assignment.totalSubmissions : 0} tasks
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-green-500" /> Avg Score</span>
                    <span className="font-semibold text-green-500">{assignment.avgScore ? `${assignment.avgScore}/10` : "—"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-slate-100 dark:border-white/5 pt-3">
                <button className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[10px] font-bold transition flex items-center justify-center gap-1">
                  <Eye className="w-3 h-3" /> View
                </button>
                <button className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[10px] font-bold transition flex items-center justify-center gap-1">
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button className="flex-1 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold transition flex items-center justify-center gap-1">
                  <CheckSquare className="w-3 h-3" /> Grade
                </button>
                <button className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          );
        })}

        {processedAssignments.length === 0 && (
          <div className="sm:col-span-2 text-center py-12 bg-white/50 dark:bg-indigo-950/10 border border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
            <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground font-semibold">No assignments match the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
