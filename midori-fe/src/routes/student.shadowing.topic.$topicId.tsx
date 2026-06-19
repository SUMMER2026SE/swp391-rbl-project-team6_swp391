import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft, Play, Clock, BookOpen, FileText, Mic, XCircle
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { getTopicById, type JLPTLevel } from "@/mock/shadowing-student";

const levelColors: Record<JLPTLevel, string> = {
  N5: "bg-blue-500/20 text-blue-400 border-blue-400/30",
  N4: "bg-green-500/20 text-green-400 border-green-400/30",
  N3: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
};

const difficultyColors = {
  Beginner: "bg-green-500/20 text-green-400",
  Intermediate: "bg-yellow-500/20 text-yellow-400",
  Advanced: "bg-red-500/20 text-red-400",
};

export const Route = createFileRoute("/student/shadowing/topic/$topicId")({
  component: TopicDetailPage,
});

function TopicDetailPage() {
  const params = Route.useParams();
  const topicId = params.topicId;

  const topic = useMemo(() => getTopicById(topicId), [topicId]);

  if (!topic) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <div className="relative z-10 text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Topic not found</h3>
          <p className="text-sm text-white/60 mb-4">The topic you're looking for doesn't exist.</p>
          <Link
            to="/student/shadowing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-semibold hover:bg-white/25 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Shadowing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <SakuraBg count={14} />
      <div className="relative z-10 bg-white dark:bg-slate-900 flex-1">
        {/* Header */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                to="/student/shadowing"
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/20 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </Link>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-sm ${levelColors[topic.jlptLevel]}`}>
                    JLPT {topic.jlptLevel}
                  </span>
                  <h1 className="font-display font-bold text-lg text-slate-800 dark:text-white">
                    {topic.title}
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  {topic.titleVn}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Topic Info */}
          <div className="mb-8">
            <div className="relative rounded-2xl overflow-hidden mb-6">
              <img
                src={topic.thumbnail}
                alt={topic.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white text-sm">
                  {topic.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-white/80 text-xs">
                  <span className="flex items-center gap-1">
                    <Play className="w-3.5 h-3.5" />
                    {topic.videoCount} videos
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {topic.totalDuration}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Video List */}
          <div className="space-y-4">
            <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pink-500" />
              Videos
            </h2>

            <div className="space-y-3">
              {topic.videos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to="/student/shadowing/video/$videoId"
                    params={{ videoId: video.id }}
                    className="block group"
                  >
                    <div className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:shadow-md hover:border-pink-500/30 transition-all">
                      {/* Thumbnail */}
                      <div className="relative w-40 h-24 rounded-xl overflow-hidden shrink-0">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-4 h-4 text-pink-500 ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium">
                          {video.duration}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-pink-500 transition-colors">
                              {video.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {video.titleVn}
                            </p>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${difficultyColors[video.difficulty]}`}>
                            {video.difficulty}
                          </span>
                          {video.transcriptAvailable && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Transcript
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center">
                        <ChevronLeft className="w-5 h-5 text-pink-500 transform rotate-180 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
