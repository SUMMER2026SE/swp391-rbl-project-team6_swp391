import React from "react";
import { Card } from "@/components/page-ui";
import { Megaphone, CheckCircle, Circle } from "lucide-react";
import type { Announcement } from "@/types/class-detail";

interface AnnouncementsSectionProps {
  announcements: Announcement[];
  onMarkAsRead: (annId: string) => void;
}

export function AnnouncementsSection({ announcements, onMarkAsRead }: AnnouncementsSectionProps) {
  return (
    <Card className="p-5 space-y-4">
      <h3 className="font-display font-black text-base text-foreground dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
        <Megaphone className="w-4.5 h-4.5 text-primary" />
        Recent Announcements
      </h3>

      <div className="space-y-3">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className={`p-4 rounded-2xl border transition-all ${
              !ann.read
                ? "border-primary/20 bg-primary/[0.005]"
                : "border-slate-100 dark:border-white/5"
            }`}
          >
            <div className="flex justify-between items-start gap-4 mb-2">
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-foreground dark:text-white flex items-center gap-1.5">
                  {!ann.read && <Circle className="w-2 h-2 fill-primary text-primary shrink-0" />}
                  {ann.title}
                </h4>
                <span className="text-[10px] text-muted-foreground">
                  Posted by {ann.teacherName} on {ann.date}
                </span>
              </div>

              {!ann.read && (
                <button
                  onClick={() => onMarkAsRead(ann.id)}
                  className="px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-[9px] font-black uppercase text-primary border border-primary/20 transition whitespace-nowrap"
                >
                  Mark as Read
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-3.5">{ann.content}</p>
          </div>
        ))}

        {announcements.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No announcements posted yet.
          </p>
        )}
      </div>
    </Card>
  );
}
