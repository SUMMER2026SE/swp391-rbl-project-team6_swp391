import React, { useState } from "react";
import { Card } from "@/components/page-ui";
import { Calendar, Clock, FileText, Sparkles, Award } from "lucide-react";
import type { Assignment } from "@/types/class-detail";

interface HomeworkTimelineProps {
  assignments: Assignment[];
  onViewResult?: (assignmentId: string) => void;
}

export function HomeworkTimeline({ assignments, onViewResult }: HomeworkTimelineProps) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Homework", "Upcoming", "Submitted", "Graded", "Overdue"];

  const processedTimeline = React.useMemo(() => {
    let list = [...assignments];

    // Filter mapping
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

    // Sort by assignedDate descending (newest first)
    list.sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());

    // Grouping by Today, This Week, Earlier
    const todayStr = "2026-06-18"; // System context mock current date
    const today = new Date(todayStr);

    const todayList: Assignment[] = [];
    const thisWeekList: Assignment[] = [];
    const earlierList: Assignment[] = [];

    list.forEach((item) => {
      const assDate = new Date(item.assignedDate);
      const diffTime = today.getTime() - assDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        todayList.push(item);
      } else if (diffDays > 0 && diffDays <= 7) {
        thisWeekList.push(item);
      } else {
        earlierList.push(item);
      }
    });

    return [
      { title: "Today", items: todayList },
      { title: "This Week", items: thisWeekList },
      { title: "Earlier", items: earlierList },
    ].filter((g) => g.items.length > 0);
  }, [assignments, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Graded":
        return "bg-green-500/10 text-green-500 dark:bg-green-500/25";
      case "Submitted":
        return "bg-blue-500/10 text-blue-500 dark:bg-blue-500/25";
      case "In Progress":
        return "bg-amber-500/10 text-amber-500 dark:bg-amber-500/25";
      case "Overdue":
        return "bg-red-500/10 text-red-500 dark:bg-red-500/25";
      default:
        return "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300";
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
        <h3 className="font-display font-black text-base text-foreground dark:text-white flex items-center gap-2">
          <FileText className="w-4.5 h-4.5 text-primary" />
          Homework Timeline
        </h3>
      </div>

      {/* Filters */}
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

      {/* Timeline flow */}
      <div className="space-y-6 relative pl-4 border-l border-slate-100 dark:border-white/5 mt-3">
        {processedTimeline.map((group) => (
          <div key={group.title} className="space-y-3 relative">
            {/* Timeline Dot & Label */}
            <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white dark:ring-slate-950" />
            <h4 className="text-xs font-black uppercase tracking-widest text-primary pl-2">
              {group.title}
            </h4>

            <div className="space-y-3 pl-2">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/10 dark:bg-white/[0.002] hover:bg-slate-100/20 dark:hover:bg-white/[0.005] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black uppercase text-primary">
                        {item.moduleType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <h5 className="font-bold text-xs sm:text-sm text-foreground dark:text-white leading-tight">
                      {item.title}
                    </h5>
                    <div className="text-[10px] text-muted-foreground">
                      Deadline: {item.deadline}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    {item.status === "Graded" && (
                      <span className="text-xs font-bold text-green-500 mr-1.5">
                        {item.score} / {item.maxScore}
                      </span>
                    )}
                    {item.status === "Not Started" && (
                      <button className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:opacity-90 transition">
                        Start
                      </button>
                    )}
                    {item.status === "In Progress" && (
                      <button className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-sm hover:bg-amber-600 transition">
                        Resume
                      </button>
                    )}
                    {item.status === "Graded" && onViewResult && (
                      <button
                        onClick={() => onViewResult(item.id)}
                        className="px-3 py-1.5 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20 text-xs font-bold border border-green-500/20 transition flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Result
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {processedTimeline.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No homework items to display.
          </p>
        )}
      </div>
    </Card>
  );
}
