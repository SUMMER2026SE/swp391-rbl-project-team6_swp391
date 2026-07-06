import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/page-ui";
import { Mic, Play, Clock, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SakuraBg } from "@/components/sakura-bg";
import { studentShadowingApi, type StudentShadowingLesson } from "@/lib/api/studentShadowing";

export const Route = createFileRoute("/student/shadowing")({
  component: ShadowingHomePage,
});

const getThumbnail = (id: string, index: number) => {
  const images = [
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=640",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=640",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640",
    "https://images.unsplash.com/photo-1528164344705-47542687000d?w=640",
    "https://images.unsplash.com/photo-1524413840003-0587454c07a3?w=640",
  ];
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return images[(hash + index) % images.length];
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

function ShadowingHomePage() {
  const routerState = useRouterState();
  const isChildRouteActive = routerState.location.pathname !== "/student/shadowing";

  const [lessons, setLessons] = useState<StudentShadowingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>("Tất cả");

  const topics = useMemo(() => {
    const uniqueTopics = new Set<string>();
    lessons.forEach((l) => {
      if (l.topic) {
        uniqueTopics.add(l.topic);
      }
    });
    return ["Tất cả", ...Array.from(uniqueTopics)];
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    if (selectedTopic === "Tất cả") return lessons;
    return lessons.filter((l) => l.topic === selectedTopic);
  }, [lessons, selectedTopic]);

  useEffect(() => {
    studentShadowingApi.listShadowing()
      .then((res) => {
        setLessons(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (isChildRouteActive) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen">
      <SakuraBg count={14} />
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <PageHeader title="Shadowing" subtitle="Luyện phát âm với AI Shadowing" />

          {/* Student Level Badge */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 glass-surface border border-[var(--border)]"
          >
            <div
              className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center text-white font-bold"
            >
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cấp độ của bạn</p>
              <p className="font-bold text-foreground">JLPT N5</p>
            </div>
            <div className="ml-auto">
              <span className="text-sm text-muted-foreground">
                {selectedTopic === "Tất cả" ? `${lessons.length} bài học` : `${filteredLessons.length} / ${lessons.length} bài học`}
              </span>
            </div>
          </div>

          {/* Topic Selector */}
          {!loading && lessons.length > 0 && topics.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {topics.map((topicName) => (
                <button
                  key={topicName}
                  onClick={() => setSelectedTopic(topicName)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border select-none cursor-pointer shadow-xs",
                    selectedTopic === topicName
                      ? "bg-linear-to-r from-pink-500 to-purple-500 text-white border-transparent"
                      : "bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-pink-500/10 hover:text-pink-500 dark:hover:text-pink-400"
                  )}
                >
                  {topicName}
                </button>
              ))}
            </div>
          )}

          {/* Lessons Grid */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Đang tải bài học...</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full glass-surface flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground">Không có bài học nào</p>
              <p className="text-sm text-muted-foreground mt-1">Chưa có dữ liệu bài học nào từ hệ thống</p>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full glass-surface flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground">Không tìm thấy bài học nào</p>
              <p className="text-sm text-muted-foreground mt-1">Không có bài học nào khớp với chủ đề "{selectedTopic}"</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to="/student/shadowing/video/$videoId"
                    params={{ videoId: lesson.id }}
                    className="block group h-full"
                  >
                    <div
                      className={cn(
                        "glass-card rounded-3xl overflow-hidden transition-all duration-300 flex flex-col h-full border border-[var(--border)] bg-[var(--card)]",
                        "hover:shadow-2xl hover:-translate-y-1.5 hover:border-pink-500/30",
                      )}
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-video overflow-hidden bg-[var(--muted)]">
                        <img
                          src={getThumbnail(lesson.id, index)}
                          alt={lesson.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />

                        {/* Level and AI Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 select-none">
                          <span className="px-2.5 py-0.8 rounded-lg text-[9px] font-black bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-sm uppercase">
                            JLPT N5
                          </span>
                          {lesson.topic && (
                            <span className="px-2.5 py-0.8 rounded-lg text-[9px] font-black bg-blue-600 text-white shadow-sm uppercase">
                              {lesson.topic}
                            </span>
                          )}
                          <span className="px-2.5 py-0.8 rounded-lg text-[9px] font-black bg-pink-500 text-white shadow-sm flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> AI Shadowing
                          </span>
                        </div>

                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                          <div
                            className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300"
                          >
                            <Play className="w-5 h-5 ml-0.5 fill-current" />
                          </div>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-foreground mb-1 text-base group-hover:text-pink-500 transition-colors duration-300 line-clamp-1">
                            {lesson.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-4">Luyện nói tiếng Nhật phản xạ trôi chảy với AI</p>

                          {/* Metadata Grid */}
                          <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-[var(--muted)]/50 rounded-2xl border border-[var(--border)] text-xs text-secondary-col font-semibold">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm select-none">🎤</span>
                              <span>{lesson.segments.length} câu thoại</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm select-none">⏱️</span>
                              <span>{formatDuration(lesson.duration)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer Action */}
                        <div className="mt-4 pt-3 border-t border-[var(--border)]/40 flex items-center justify-between">
                          <span className="text-xs font-bold text-pink-500 group-hover:text-pink-400 transition-colors flex items-center gap-1">
                            Bắt đầu luyện tập
                            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                          </span>
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
