import { useState } from "react";
import { Link, Outlet, useRouterState, createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Trophy, Play, X, CheckCircle2, GraduationCap, Sparkles } from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HIRAGANA_LESSONS, KATAKANA_LESSONS } from "@/mock/alphabet";
import { loadLessonProgress } from "@/mock/alphabet/progress";

export const Route = createFileRoute("/student/learning/alphabet")({
  component: AlphabetOverviewPage,
});

function AlphabetOverviewPage() {
  const routerState = useRouterState();
  const isChildRouteActive = routerState.location.pathname !== "/student/learning/alphabet";

  const [videoModal, setVideoModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: "",
    title: ""
  });

  // Get progress for each lesson
  const getLessonProgress = (lessonId: string) => {
    return loadLessonProgress(lessonId);
  };

  const alphabetCards = [
    {
      to: "/student/learning/alphabet/hiragana",
      title: "Hiragana",
      subtitle: "Basic Japanese Syllabary",
      description:
        "Learn the fundamental Japanese character set used for native Japanese words and grammar.",
      icon: "あ",
      bgClass: "bg-pink-50/70 dark:bg-pink-950/10 border-pink-100 dark:border-pink-900/30",
      iconBg: "bg-pink-500 shadow-pink-500/25",
      tags: [
        { label: "46 basic characters", icon: "📖" },
        { label: "Voiced", icon: "✓" },
        { label: "Combinations", icon: "✓" }
      ],
      lessons: HIRAGANA_LESSONS,
    },
    {
      to: "/student/learning/alphabet/katakana",
      title: "Katakana",
      subtitle: "Japanese Syllabary",
      description:
        "Master the character set primarily used for foreign words, loanwords, and emphasis.",
      icon: "ア",
      bgClass: "bg-blue-50/70 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30",
      iconBg: "bg-blue-500 shadow-blue-500/25",
      tags: [
        { label: "46 basic characters", icon: "📖" },
        { label: "Voiced", icon: "✓" },
        { label: "Combinations", icon: "✓" },
        { label: "Loanwords", icon: "✓" }
      ],
      lessons: KATAKANA_LESSONS,
    },
  ];

  if (isChildRouteActive) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen pb-16">
      <SakuraBg count={14} />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-2 leading-none">
            <Sparkles className="w-7 h-7 text-primary animate-pulse" />
            Bảng Chữ Cái Nhật Ngữ
          </h1>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Bắt đầu hành trình chinh phục tiếng Nhật với hai bảng chữ cái Hiragana và Katakana
          </p>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {alphabetCards.map((card) => (
            <div key={card.title} className="space-y-6">
              
              {/* Header Card */}
              <div 
                className="relative overflow-hidden rounded-3xl border p-6 bg-white dark:bg-slate-900"
              >
                {/* Background Tint */}
                <div className={cn("absolute inset-0 z-0 opacity-15 dark:opacity-25", card.bgClass)} />
                <div className="absolute inset-0 bg-linear-to-r from-white/95 to-white/70 dark:from-slate-900/95 dark:to-slate-900/70 z-0" />

                <div className="relative z-10 flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg shrink-0",
                      card.iconBg
                    )}
                  >
                    {card.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display font-black text-xl text-slate-800 dark:text-white leading-none">
                        {card.title}
                      </h2>
                    </div>
                    
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 tracking-wider">
                      {card.subtitle}
                    </p>
                    
                    <p className="text-xs text-slate-500 dark:text-indigo-200/60 mt-3 leading-relaxed">
                      {card.description}
                    </p>

                    {/* Bottom Tags */}
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {card.tags.map((tag) => (
                        <span 
                          key={tag.label} 
                          className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-[9px] font-bold text-slate-600 dark:text-indigo-200/80 flex items-center gap-1 shadow-xs"
                        >
                          <span className="text-[10px]">{tag.icon}</span>
                          {tag.label}
                        </span>
                      ))}
                    </div>

                  </div>
                </div>
              </div>

              {/* Lesson Items list */}
              <div className="space-y-3.5">
                {card.lessons.map((lesson, index) => {
                  const progress = getLessonProgress(lesson.id);
                  const learnedCount = progress.charactersLearned?.length || progress.wordsLearned?.length || 0;
                  const totalCount = lesson.totalCharacters;
                  const ratioPercent = Math.min(100, Math.round((learnedCount / (totalCount || 1)) * 100));

                  return (
                    <Link
                      key={lesson.id}
                      to={lesson.path}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 shadow-xs"
                    >
                      {/* Icon circle */}
                      <div
                        className={cn(
                          "w-11 h-11 rounded-full flex items-center justify-center text-base font-black text-white shadow-md shrink-0 select-none bg-gradient-to-r",
                          lesson.color
                        )}
                      >
                        {lesson.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                            {index + 1}.
                          </span>
                          <h3 className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-primary transition-colors leading-tight">
                            {lesson.title}
                          </h3>
                          {progress.completed && <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                          {totalCount} {lesson.id === "katakana-loanwords" ? "words" : "characters"}
                        </p>
                      </div>

                      {/* Progress bar info on the right */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-slate-700 dark:text-slate-350 font-bold leading-none">
                            {learnedCount}/{totalCount}
                          </span>
                          <div className="w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all duration-300 bg-primary")}
                              style={{ width: `${ratioPercent}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors border border-slate-200/40 dark:border-white/5">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* VIDEO POPUP MODAL */}
      <AnimatePresence>
        {videoModal.isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVideoModal({ isOpen: false, url: "", title: "" })}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-4xl z-10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4.5 border-b border-slate-200 dark:border-white/5">
                <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current text-primary" />
                  {videoModal.title}
                </h3>
                <button
                  onClick={() => setVideoModal({ isOpen: false, url: "", title: "" })}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
              
              {/* Iframe container (16:9 aspect ratio) */}
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  src={videoModal.url}
                  title={videoModal.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
