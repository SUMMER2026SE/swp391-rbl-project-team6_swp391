import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/page-ui";
import { cn } from "@/lib/utils";
import {
  Mic, Play, Clock, ChevronRight, Tag
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { shadowingTopics, type JLPTLevel } from "@/mock/shadowing-student";

// Mock student level
const MOCK_STUDENT_LEVEL: JLPTLevel = "N5";

const levelGradients: Record<JLPTLevel, string> = {
  N5: "from-blue-400 to-cyan-400",
  N4: "from-green-400 to-emerald-400",
  N3: "from-yellow-400 to-orange-400",
};

export const Route = createFileRoute("/student/shadowing")({
  component: ShadowingHomePage,
});

function ShadowingHomePage() {
  const routerState = useRouterState();
  const isChildRouteActive = routerState.location.pathname !== "/student/shadowing";
  // Get topics for student's level only
  const myTopics = useMemo(() => {
    return shadowingTopics.filter(topic => topic.jlptLevel === MOCK_STUDENT_LEVEL);
  }, []);

  // Get unique categories from topics
  const categories = useMemo(() => {
    const cats = new Set(myTopics.map(t => t.titleVn));
    return ["Tất cả", ...Array.from(cats)];
  }, [myTopics]);

  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");

  // Filter by category
  const filteredTopics = useMemo(() => {
    if (selectedCategory === "Tất cả") return myTopics;
    return myTopics.filter(t => t.titleVn === selectedCategory);
  }, [myTopics, selectedCategory]);

  if (isChildRouteActive) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen">
      <SakuraBg count={14} />
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <PageHeader
            title="Shadowing"
            subtitle="Luyện phát âm với AI Shadowing"
          />

          {/* Student Level Badge */}
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl mb-6",
            "bg-blue-50 dark:bg-blue-950/30",
            "border border-blue-200 dark:border-blue-800/50"
          )}>
            <div className={cn(
              "w-10 h-10 rounded-xl bg-linear-to-br flex items-center justify-center text-white font-bold",
              levelGradients[MOCK_STUDENT_LEVEL]
            )}>
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cấp độ của bạn</p>
              <p className="font-bold text-foreground">
                JLPT {MOCK_STUDENT_LEVEL}
              </p>
            </div>
            <div className="ml-auto">
              <span className="text-sm text-muted-foreground">
                {myTopics.length} chủ đề
              </span>
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-gradient-hero text-white shadow"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Topic Grid */}
          {filteredTopics.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground">
                Không có chủ đề nào
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Chọn cấp độ khác để xem thêm
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTopics.map((topic, index) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to="/student/shadowing/topic/$topicId"
                    params={{ topicId: topic.id }}
                    className="block group"
                  >
                    <div className={cn(
                      "rounded-2xl overflow-hidden transition-all duration-200",
                      "bg-white/50 dark:bg-white/5",
                      "border border-slate-200/40 dark:border-white/10",
                      "hover:shadow-lg hover:-translate-y-1",
                      "hover:border-primary/50"
                    )}>
                      {/* Thumbnail */}
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={topic.thumbnail}
                          alt={topic.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className={cn(
                            "w-14 h-14 rounded-full bg-linear-to-br flex items-center justify-center text-white shadow-lg",
                            levelGradients[topic.jlptLevel]
                          )}>
                            <Play className="w-6 h-6 ml-1" />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors">
                          {topic.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {topic.titleVn}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Play className="w-3.5 h-3.5" />
                            {topic.videoCount} videos
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {topic.totalDuration}
                          </span>
                        </div>

                        {/* Arrow */}
                        <div className="mt-2 flex items-center justify-end">
                          <ChevronRight className={cn(
                            "w-4 h-4 text-muted-foreground",
                            "group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                          )} />
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
