import React from "react";
import { Card } from "@/components/page-ui";
import { Megaphone, CheckCircle, Circle } from "lucide-react";
import type { Announcement } from "@/types/class-detail";

interface AnnouncementsTabProps {
  announcements: Announcement[];
  filter: string;
  onFilterChange: (filter: string) => void;
  onMarkAsRead: (annId: string) => void;
}

export function AnnouncementsTab({
  announcements,
  filter,
  onFilterChange,
  onMarkAsRead,
}: AnnouncementsTabProps) {
  return (
    <div className="space-y-4">
      {/* Filters control */}
      <div className="flex gap-2 p-1 bg-white/85 dark:bg-indigo-950/40 rounded-2xl border border-slate-200/50 dark:border-white/5 w-fit shadow-sm">
        {["all", "unread"].map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === f
                ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground dark:text-indigo-300"
            }`}
          >
            {f} Announcements
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.map((ann) => (
          <Card
            key={ann.id}
            className={`p-5 relative border transition-all ${
              !ann.read
                ? "border-primary/30 dark:border-cyan-400/30 bg-primary/[0.01]"
                : "border-border/50"
            }`}
          >
            <div className="flex justify-between items-start mb-2 gap-4">
              <div>
                <h4 className="font-display font-bold text-base text-foreground dark:text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary shrink-0" />
                  {ann.title}
                </h4>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Posted by {ann.teacherName} on {ann.date}
                </div>
              </div>

              {!ann.read ? (
                <button
                  onClick={() => onMarkAsRead(ann.id)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-[10px] font-bold transition whitespace-nowrap"
                >
                  <Circle className="w-2.5 h-2.5 fill-primary text-primary" /> Mark as Read
                </button>
              ) : (
                <span className="flex items-center gap-1.5 text-green-500 text-[10px] font-bold whitespace-nowrap">
                  <CheckCircle className="w-3 h-3" /> Read
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pl-6">{ann.content}</p>
          </Card>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-12 bg-white/50 dark:bg-indigo-950/10 border border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
            <Megaphone className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground font-semibold">No announcements found</p>
          </div>
        )}
      </div>
    </div>
  );
}
