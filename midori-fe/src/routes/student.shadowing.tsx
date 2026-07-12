import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/page-ui";
import { cn } from "@/lib/utils";
import { Mic, Play, Clock, ChevronRight, Loader2 } from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { studentShadowingApi, type ShadowingVideoSummaryResponse } from "@/lib/api/shadowing";

type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";

const levelGradients: Record<JLPTLevel, string> = {
  N5: "from-blue-400 to-cyan-400",
  N4: "from-green-400 to-emerald-400",
  N3: "from-yellow-400 to-orange-400",
  N2: "from-purple-400 to-indigo-400",
  N1: "from-red-400 to-pink-400",
};

const getTopicVn = (topic: string): string => {
  const mapping: Record<string, string> = {
    "Daily Conversation": "Tự giới thiệu",
    "Self Introduction": "Tự giới thiệu",
    "School Life": "Đời sống học đường",
    "Shopping": "Mua sắm",
    "Restaurant": "Nhà hàng",
    "Travel": "Du lịch",
    "Business": "Kinh doanh",
    "Academic": "Học thuật",
  };
  return mapping[topic] || topic;
};

export { getTopicVn };

export const Route = createFileRoute("/student/shadowing")({
  component: ShadowingLayout,
});

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ShadowingLayout() {
  const location = useLocation();
  const isIndex =
    location.pathname === "/student/shadowing" || location.pathname === "/student/shadowing/";

  if (isIndex) {
    return <ShadowingListPage />;
  }

  return <Outlet />;
}

function ShadowingListPage() {
  const [realVideos, setRealVideos] = useState<ShadowingVideoSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    const loadVideos = async () => {
      setIsLoading(true);
      try {
        const list = await studentShadowingApi.getVideos();
        setRealVideos(list);
      } catch (err) {
        console.error("Error loading student shadowing videos:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadVideos();
  }, []);

  const topics = useMemo(() => {
    const map = new Map<string, { title: string; count: number }>();
    realVideos.forEach((v) => {
      const name = (v.topic || "General").trim();
      const current = map.get(name) || { title: name, count: 0 };
      current.count += 1;
      map.set(name, current);
    });
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [realVideos]);

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = realVideos.filter((v) => {
      const matchTopic = q ? (v.topic || "General").toLowerCase().includes(q) : true;
      const matchLevel = selectedLevel ? (v.jlptLevel || "N5") === selectedLevel : true;
      return matchTopic && matchLevel;
    });
    return base
      .map((v) => ({
        id: v.id,
        title: v.title,
        description: v.description || "",
        videoUrl: v.videoUrl,
        thumbnail: v.thumbnailUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=225&fit=crop",
        duration: v.duration ? formatDuration(v.duration) : "0:00",
        jlptLevel: v.jlptLevel || "N5",
        topic: v.topic || "General",
      }))
      .sort((a, b) => a.topic.localeCompare(b.topic));
  }, [realVideos, searchQuery, selectedLevel]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs text-muted-foreground mt-2">Đang tải danh sách bài học...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SakuraBg count={14} />
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <PageHeader title="Shadowing" subtitle="Luyện phát âm với AI Shadowing" />

          {/* Topic Search */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tìm theo chủ đề</label>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ví dụ: Daily Conversation, Shopping..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div className="mt-5">
                <span className="text-sm text-muted-foreground">{filteredVideos.length} bài học</span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic.title}
                  onClick={() => setSearchQuery(topic.title)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    searchQuery.trim().toLowerCase() === topic.title.toLowerCase()
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-primary/40"
                  }`}
                >
                  {topic.title}
                  <span className="ml-1 text-[10px] text-muted-foreground">({topic.count})</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Lọc theo level:</span>
              <button
                onClick={() => setSelectedLevel(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                  selectedLevel === null ? "bg-primary/10 border-primary text-primary" : "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-primary/40"
                }`}
              >
                Tất cả
              </button>
              {(["N5", "N4", "N3", "N2", "N1"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    selectedLevel === level ? "bg-primary/10 border-primary text-primary" : "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-primary/40"
                  }`}
                >
                  JLPT {level}
                </button>
              ))}
            </div>
          </div>

          {/* Video List */}
          {filteredVideos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground">Không có bài học nào</p>
              <p className="text-sm text-muted-foreground mt-1">Thử chủ đề khác hoặc xóa từ khóa tìm kiếm</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to="/student/shadowing/video/$videoId"
                    params={{ videoId: video.id }}
                    className="block group"
                  >
                    <div
                      className={cn(
                        "rounded-2xl overflow-hidden transition-all duration-200",
                        "bg-white/50 dark:bg-white/5",
                        "border border-slate-200/40 dark:border-white/10",
                        "hover:shadow-lg hover:-translate-y-1",
                        "hover:border-primary/50",
                      )}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div
                            className={cn(
                              "w-14 h-14 rounded-full bg-linear-to-br flex items-center justify-center text-white shadow-lg",
                              levelGradients[video.jlptLevel as JLPTLevel] || "from-blue-400 to-cyan-400",
                            )}
                          >
                            <Play className="w-6 h-6 ml-1" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium">
                          {video.duration}
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors">
                          {video.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {video.description || video.topic}
                        </p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {video.duration}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                            JLPT {video.jlptLevel}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-end">
                          <ChevronRight
                            className={cn(
                              "w-4 h-4 text-muted-foreground",
                              "group-hover:text-primary group-hover:translate-x-0.5 transition-all",
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
