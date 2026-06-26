import React, { useState } from "react";
import { Card } from "@/components/page-ui";
import { Megaphone, Pin, Edit, Trash2, PlusCircle, Check } from "lucide-react";
import type { TeacherClassInfo, TeacherAnnouncement } from "@/types/teacher-class";

interface TeacherAnnouncementsTabProps {
  classInfo: TeacherClassInfo;
}

export function TeacherAnnouncementsTab({ classInfo }: TeacherAnnouncementsTabProps) {
  const [announcements, setAnnouncements] = useState<TeacherAnnouncement[]>(
    classInfo.announcements || [],
  );
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newAnn: TeacherAnnouncement = {
      id: `ann-${Date.now()}`,
      title: newTitle,
      content: newContent,
      date: new Date().toISOString().split("T")[0],
    };

    setAnnouncements([newAnn, ...announcements]);
    setNewTitle("");
    setNewContent("");
    setIsAdding(false);
  };

  const handlePin = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((ann) => (ann.id === id ? { ...ann, isPinned: !ann.isPinned } : ann)),
    );
  };

  const handleDelete = (id: string) => {
    setAnnouncements((prev) => prev.filter((ann) => ann.id !== id));
  };

  // Sort: Pinned announcements first, then by date descending
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="space-y-5">
      {/* Create Announcement Button/Form */}
      <Card className="p-4">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-white/10 hover:border-primary/50 text-xs font-bold text-muted-foreground hover:text-primary transition flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Post New Announcement
          </button>
        ) : (
          <form onSubmit={handlePost} className="space-y-3">
            <h4 className="text-xs font-black uppercase text-primary tracking-wider">
              New Announcement
            </h4>
            <input
              type="text"
              placeholder="Announcement Title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-white/10 text-xs outline-none focus:ring-1 focus:ring-primary"
              required
            />
            <textarea
              placeholder="Write your announcement content here..."
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-white/10 text-xs outline-none focus:ring-1 focus:ring-primary resize-none"
              required
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold shadow hover:opacity-95 transition flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Publish
              </button>
            </div>
          </form>
        )}
      </Card>

      {/* Announcements List */}
      <div className="space-y-3">
        {sortedAnnouncements.map((ann) => (
          <Card
            key={ann.id}
            className={`p-5 relative border transition-all ${
              ann.isPinned ? "border-amber-500/20 bg-amber-500/[0.005]" : "border-border/50"
            }`}
          >
            {ann.isPinned && (
              <span className="absolute top-4 right-4 z-10 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white flex items-center gap-0.5 shadow-sm">
                <Pin className="w-2.5 h-2.5 fill-current" /> PINNED
              </span>
            )}

            <div className="flex justify-between items-start mb-2 gap-4">
              <div>
                <h4 className="font-display font-bold text-base text-foreground dark:text-white flex items-center gap-2">
                  <Megaphone className="w-4.5 h-4.5 text-primary shrink-0" />
                  {ann.title}
                </h4>
                <div className="text-[10px] text-muted-foreground mt-0.5">Posted on {ann.date}</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pl-6.5 pr-12">
              {ann.content}
            </p>

            {/* Actions */}
            <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-white/5 pt-3 mt-4">
              <button
                onClick={() => handlePin(ann.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                  ann.isPinned
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                    : "bg-slate-100 dark:bg-white/5 text-muted-foreground border-border/40 hover:bg-slate-200"
                }`}
              >
                <Pin className="w-3 h-3" /> {ann.isPinned ? "Unpin" : "Pin"}
              </button>
              <button className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-muted-foreground border border-border/40 transition">
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(ann.id)}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/25 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}

        {sortedAnnouncements.length === 0 && (
          <div className="text-center py-12 bg-white/50 dark:bg-indigo-950/10 border border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
            <Megaphone className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground font-semibold">
              No announcements posted yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
