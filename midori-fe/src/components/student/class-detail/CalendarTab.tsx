import React from "react";
import { Card } from "@/components/page-ui";
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { DetailedClassInfo } from "@/types/class-detail";

interface CalendarTabProps {
  classInfo: DetailedClassInfo;
}

export function CalendarTab({ classInfo }: CalendarTabProps) {
  // Sort calendarEvents by date
  const events = [...classInfo.calendarEvents].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const getEventBadge = (type: string) => {
    switch (type) {
      case "overdue":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "deadline":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "event":
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="font-display font-bold text-base text-foreground dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 text-primary" />
          Class Calendar Schedule
        </h3>

        <div className="space-y-3">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.005] hover:bg-slate-100/30 dark:hover:bg-white/[0.01] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                  {evt.type === "overdue" ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-foreground dark:text-white leading-tight">
                    {evt.title}
                  </h4>
                  {evt.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{evt.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-xs font-semibold text-muted-foreground mr-2">{evt.date}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${getEventBadge(evt.type)}`}>
                  {evt.type}
                </span>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No calendar events scheduled yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
