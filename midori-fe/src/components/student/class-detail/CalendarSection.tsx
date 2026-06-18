import React from "react";
import { Card } from "@/components/page-ui";
import { Calendar, Clock } from "lucide-react";
import type { CalendarEvent } from "@/types/class-detail";

interface CalendarSectionProps {
  events: CalendarEvent[];
}

export function CalendarSection({ events }: CalendarSectionProps) {
  const upcomingDeadlines = React.useMemo(() => {
    const todayStr = "2026-06-18"; // System context mock current date
    const today = new Date(todayStr);

    return events
      .filter((e) => e.type === "deadline" && new Date(e.date).getTime() >= today.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [events]);

  return (
    <Card className="p-4 space-y-3">
      <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-2">
        <Calendar className="w-4 h-4" /> Upcoming Deadlines
      </h4>

      <div className="space-y-2">
        {upcomingDeadlines.map((evt) => (
          <div
            key={evt.id}
            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/40 dark:border-white/[0.03] bg-slate-50/20 dark:bg-white/[0.002]"
          >
            <span className="text-xs font-semibold text-foreground dark:text-slate-200 truncate mr-2">
              {evt.title}
            </span>
            <span className="text-[10px] font-black text-amber-500 whitespace-nowrap">
              {evt.date}
            </span>
          </div>
        ))}

        {upcomingDeadlines.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No upcoming deadlines.</p>
        )}
      </div>
    </Card>
  );
}
