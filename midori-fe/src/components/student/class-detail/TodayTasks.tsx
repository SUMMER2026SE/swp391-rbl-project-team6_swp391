import React from "react";
import { Card } from "@/components/page-ui";
import { Clock, Play, AlertTriangle } from "lucide-react";
import type { Assignment } from "@/types/class-detail";

interface TodayTasksProps {
  assignments: Assignment[];
}

export function TodayTasks({ assignments }: TodayTasksProps) {
  const urgentTasks = React.useMemo(() => {
    const todayStr = "2026-06-18"; // System context mock current date
    const today = new Date(todayStr);

    return assignments
      .filter((a) => a.status === "Not Started" || a.status === "In Progress" || a.status === "Overdue")
      .map((a) => {
        const dlDate = new Date(a.deadline);
        const diffTime = dlDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let status: "Due Today" | "Upcoming" | "Overdue" = "Upcoming";
        let label = "";

        if (a.status === "Overdue" || diffDays < 0) {
          status = "Overdue";
          label = "Overdue";
        } else if (diffDays === 0) {
          status = "Due Today";
          label = "Due Today";
        } else if (diffDays === 1) {
          status = "Due Today"; // treating tomorrow as urgent
          label = "Due Tomorrow";
        } else if (diffDays === 2) {
          status = "Upcoming";
          label = "2 days left";
        } else {
          return null; // Don't show non-urgent tasks here
        }

        return {
          ...a,
          label,
          statusType: status,
          diffDays,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.diffDays - b!.diffDays) as Array<Assignment & { label: string; statusType: string }>;
  }, [assignments]);

  const getStyle = (type: string) => {
    switch (type) {
      case "Overdue":
        return "border-red-500/30 bg-red-500/[0.02] text-red-500";
      case "Due Today":
        return "border-orange-500/30 bg-orange-500/[0.02] text-orange-500";
      default:
        return "border-amber-500/30 bg-amber-500/[0.01] text-amber-500";
    }
  };

  if (urgentTasks.length === 0) return null;

  return (
    <Card className="p-4 space-y-3 border-orange-500/20 bg-orange-500/[0.005]">
      <h4 className="text-xs font-black uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
        <Clock className="w-4 h-4" /> Today's Focus
      </h4>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {urgentTasks.map((task) => (
          <div
            key={task.id}
            className={`p-3 rounded-2xl border ${getStyle(task.statusType)} flex flex-col justify-between min-h-[90px]`}
          >
            <div>
              <div className="flex justify-between items-center text-[9px] font-black uppercase opacity-75">
                <span>{task.moduleType}</span>
                <span>{task.label}</span>
              </div>
              <h5 className="font-bold text-xs text-foreground dark:text-white leading-tight mt-1 truncate">
                {task.title}
              </h5>
            </div>

            <button className="mt-2 w-full py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-[10px] shadow-sm hover:opacity-95 transition flex items-center justify-center gap-1">
              {task.status === "In Progress" ? "Resume" : "Start"}
              <Play className="w-2.5 h-2.5 fill-current" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
