import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  BookOpen,
  Globe,
  FileText,
  MessageSquare,
  Clock,
  MoreVertical,
  Play,
  Calendar,
  Eye,
  Trash2,
  Copy,
  Archive,
  FileVideo,
} from "lucide-react";
import { ShadowingItem } from "@/lib/api/adminShadowing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShadowingLibraryRedesignProps {
  level: string;
  lessons: ShadowingItem[];
  loading: boolean;
  error: string | null;
  onEdit: (item: ShadowingItem) => void;
  onDelete: (item: ShadowingItem) => void;
  onCreate: () => void;
  onDuplicate: (item: ShadowingItem) => void;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string; icon: React.ElementType }
> = {
  active: {
    label: "Published",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/25",
    dot: "bg-emerald-500",
    icon: Globe,
  },
  published: {
    label: "Published",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/25",
    dot: "bg-emerald-500",
    icon: Globe,
  },
  draft: {
    label: "Draft",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/25",
    dot: "bg-amber-500",
    icon: FileText,
  },
  archived: {
    label: "Archived",
    bg: "bg-slate-500/10 dark:bg-slate-500/15",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/25",
    dot: "bg-slate-500",
    icon: Archive,
  },
};

export default function ShadowingLibraryRedesign({
  level,
  lessons,
  loading,
  error,
  onEdit,
  onDelete,
  onCreate,
  onDuplicate,
}: ShadowingLibraryRedesignProps) {
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("Tất cả");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ctrl + K keyboard shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute topics list dynamically
  const topics = useMemo(() => {
    const uniqueTopics = new Set<string>();
    lessons.forEach((l) => {
      if (l.topic) uniqueTopics.add(l.topic);
    });
    return ["Tất cả", ...Array.from(uniqueTopics)];
  }, [lessons]);

  // Compute lesson statistics
  const stats = useMemo(() => {
    const total = lessons.length;
    const published = lessons.filter(
      (l) => !(l as any).status || (l as any).status === "active" || (l as any).status === "published"
    ).length;
    const draft = lessons.filter((l) => (l as any).status === "draft").length;
    
    let totalSentences = 0;
    let totalDuration = 0;
    
    lessons.forEach((l) => {
      totalSentences += l.segments ? l.segments.length : 0;
      totalDuration += l.duration || 0;
    });

    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

    return { total, published, draft, totalSentences, avgDuration };
  }, [lessons]);

  // Filter lessons based on search query and selected topic
  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      const matchesTopic = selectedTopic === "Tất cả" || l.topic === selectedTopic;
      const matchesSearch =
        !search.trim() || l.title?.toLowerCase().includes(search.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [lessons, selectedTopic, search]);

  const formatDuration = (sec: number) => {
    if (!sec) return "0s";
    const mins = Math.floor(sec / 60);
    const secs = Math.round(sec % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getStatus = (item: ShadowingItem): string => {
    return (item as any).status || "active";
  };

  return (
    <div className="space-y-6">
      {/* 1. Compact Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-[var(--border)] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-display font-black text-primary-col tracking-tight">
              Shadowing Library
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-linear-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400">
              {level.toUpperCase()} Level
            </span>
          </div>
          <p className="text-sm text-secondary-col">
            Manage and organize all shadowing lessons efficiently.
          </p>
        </div>

        <button
          onClick={onCreate}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Lesson
        </button>
      </div>

      {/* 2. Statistics Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Lessons",
            value: stats.total,
            desc: "Active & draft lessons",
            icon: BookOpen,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
          },
          {
            label: "Published Lessons",
            value: stats.published,
            desc: "Visible to students",
            icon: Globe,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Draft Lessons",
            value: stats.draft,
            desc: "Under construction",
            icon: FileText,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            label: "Total Sentences",
            value: stats.totalSentences,
            desc: "Interactive phrases",
            icon: MessageSquare,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
          },
          {
            label: "Avg Duration",
            value: formatDuration(stats.avgDuration),
            desc: "Average lesson length",
            icon: Clock,
            color: "text-pink-500",
            bg: "bg-pink-500/10",
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -4 }}
            className="p-5 rounded-2xl glass-card border border-[var(--border)] shadow-xs transition-all duration-200 flex flex-col justify-between min-h-[120px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-col">
                {item.label}
              </span>
              <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-display font-black text-primary-col block">
                {item.value}
              </span>
              <span className="text-[10px] text-muted-col font-medium mt-0.5 block">
                {item.desc}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="space-y-4">
        {/* Search Experience */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col transition-colors group-focus-within:text-pink-500" />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shadowing lessons..."
            className="w-full pl-11 pr-20 py-3 text-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] text-primary-col placeholder:text-muted-col focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/60 shadow-xs focus:shadow-md transition-all duration-200"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/10 dark:bg-black/20 border border-[var(--border)] px-2 py-0.5 rounded-lg select-none pointer-events-none text-[10px] font-mono font-bold text-muted-col">
            Ctrl + K
          </div>
        </div>

        {/* Dynamic Category Chips */}
        {topics.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
            {topics.map((topicName) => {
              const isActive = selectedTopic === topicName;
              const count = lessons.filter(
                (l) => topicName === "Tất cả" || l.topic === topicName
              ).length;

              return (
                <button
                  key={topicName}
                  onClick={() => setSelectedTopic(topicName)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border flex items-center gap-2 shrink-0 cursor-pointer shadow-xs ${
                    isActive
                      ? "bg-linear-to-r from-pink-500 to-purple-500 text-white border-transparent scale-[1.02] shadow-sm shadow-pink-500/25"
                      : "bg-[var(--card)] text-secondary-col border-[var(--border)] hover:bg-pink-500/5 hover:text-pink-500 hover:border-pink-500/30"
                  }`}
                >
                  {topicName}
                  <span
                    className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[var(--border)] text-secondary-col group-hover:bg-pink-500/20"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Lesson List Grid / Cards */}
      <AnimatePresence mode="popLayout">
        {loading ? (
          // Skeleton Loader
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xs animate-pulse flex flex-col h-[280px]"
              >
                <div className="w-full aspect-video bg-black/5 dark:bg-white/5 border-b border-[var(--border)]" />
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-16 h-4 bg-black/10 dark:bg-white/10 rounded" />
                    <div className="w-3/4 h-5 bg-black/10 dark:bg-white/10 rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="w-24 h-4 bg-black/10 dark:bg-white/10 rounded" />
                    <div className="w-16 h-8 bg-black/10 dark:bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 border border-red-500/25 rounded-2xl bg-red-500/5">
            <span className="font-semibold">{error}</span>
          </div>
        ) : filteredLessons.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[var(--border)] rounded-3xl bg-[var(--card)]/40 text-center min-h-[350px]"
          >
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 mb-4 shadow-inner">
              <FileVideo className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-display font-bold text-primary-col">
              No Shadowing Lessons Found
            </h3>
            <p className="text-sm text-secondary-col mt-1.5 max-w-sm">
              {search
                ? `No lessons match "${search}". Try checking your spelling or clearing the query.`
                : "Create a new shadowing lesson manually to start adding interactive content."}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-[var(--border)] text-secondary-col hover:bg-[var(--accent)] transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={onCreate}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-hero text-white shadow-md hover:scale-[1.02] transition-all cursor-pointer"
              >
                + Create Lesson
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredLessons.map((item, idx) => {
              const status = getStatus(item);
              const statusCfg = statusConfig[status] || statusConfig.active;
              const StatusIcon = statusCfg.icon;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: idx * 0.02 }}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xs hover:shadow-xl hover:border-pink-500/20 overflow-hidden flex flex-col justify-between h-[340px] transition-all duration-300 relative"
                >
                  {/* Thumbnail area with duration overlay */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black border-b border-[var(--border)] select-none">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-pink-500/10 via-purple-600/10 to-indigo-700/10 flex flex-col items-center justify-center relative">
                        <FileVideo className="w-8 h-8 text-pink-500/40 animate-pulse" />
                        <span className="text-[10px] font-bold text-muted-col mt-2">
                          NO PREVIEW
                        </span>
                      </div>
                    )}
                    
                    {/* Dark gradient overlay for title contrast on image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        onClick={() => onEdit(item)}
                        className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-lg cursor-pointer transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
                      >
                        <Play className="w-5 h-5 text-pink-500 fill-pink-500 translate-x-0.5" />
                      </motion.div>
                    </div>

                    {/* Top status & category badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-md shadow-xs border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {statusCfg.label}
                      </span>

                      {item.topic && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase tracking-wider">
                          {item.topic}
                        </span>
                      )}
                    </div>

                    {/* Bottom duration indicator */}
                    {item.duration && (
                      <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-white font-mono text-[9px] font-bold tracking-wider pointer-events-none border border-white/5 shadow-xs">
                        {formatDuration(item.duration)}
                      </span>
                    )}
                  </div>

                  {/* Card Content info */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-primary-col line-clamp-2 leading-snug group-hover:text-pink-500 transition-colors duration-200">
                        {item.title}
                      </h3>
                      
                      {/* Secondary meta info row */}
                      <div className="flex items-center gap-4 text-muted-col text-xs pt-1.5 select-none">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {item.segments ? `${item.segments.length} sentences` : "0 sentences"}
                        </span>
                        {item.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "short",
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] mt-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white transition-all duration-200 cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Lesson
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-xl hover:bg-[var(--accent)] text-secondary-col hover:text-primary-col transition duration-200 cursor-pointer">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-modal rounded-xl min-w-[130px] p-1 border-[var(--border)] shadow-xl z-20">
                          <DropdownMenuItem
                            onSelect={() => onEdit(item)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-primary-col hover:bg-[var(--accent)] cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
                            Edit Lesson
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onSelect={() => onDuplicate(item)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-primary-col hover:bg-[var(--accent)] cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-indigo-500" />
                            Duplicate
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onSelect={() => onDelete(item)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
