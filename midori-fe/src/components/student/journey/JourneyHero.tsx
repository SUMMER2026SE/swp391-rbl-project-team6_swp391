"use client";

import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Zap, Trophy, ArrowRight, Play } from "lucide-react";
import { type JourneyProgress } from "@/mock/student-learning-journey";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface JourneyHeroProps {
  progress: JourneyProgress;
  currentLessonTitle: string;
  currentLessonNumber: number;
  overallProgress: number;
  currentLessonId?: string;
}

export function JourneyHero({
  progress,
  currentLessonTitle,
  currentLessonNumber,
  overallProgress,
  currentLessonId,
}: JourneyHeroProps) {
  const navigate = useNavigate();

  const handleContinue = () => {
    if (currentLessonId) {
      navigate({ to: "/student/journey/$lessonId", params: { lessonId: currentLessonId } });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-hero p-5 text-white shadow-md"
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/4 -translate-x-1/4" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-3 right-3 md:top-4 md:right-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold">
          <Trophy className="w-3.5 h-3.5" />
          <span>{progress.badges.length} Badges</span>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider">
            N5 Beginner
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display font-bold text-xl md:text-2xl mb-1">
          Learning Journey
        </h1>
        <p className="text-white/70 text-xs md:text-sm mb-4">
          Your path to mastering Japanese
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 md:gap-3 mb-4">
          {/* Current Level */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 md:p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3 h-3 text-white/60" />
              <span className="text-[9px] md:text-[10px] text-white/60 uppercase tracking-wide">Level</span>
            </div>
            <div className="font-bold text-sm md:text-base">N5</div>
          </div>

          {/* Progress */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 md:p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-white/60" />
              <span className="text-[9px] md:text-[10px] text-white/60 uppercase tracking-wide">Progress</span>
            </div>
            <div className="font-bold text-sm md:text-base">{overallProgress}%</div>
          </div>

          {/* Total XP */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 md:p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-white/60" />
              <span className="text-[9px] md:text-[10px] text-white/60 uppercase tracking-wide">Total XP</span>
            </div>
            <div className="font-bold text-sm md:text-base">{progress.totalXp.toLocaleString()}</div>
          </div>

          {/* Lessons */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 md:p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="w-3 h-3 text-white/60" />
              <span className="text-[9px] md:text-[10px] text-white/60 uppercase tracking-wide">Lessons</span>
            </div>
            <div className="font-bold text-sm md:text-base">
              {progress.completedLessons}/{progress.totalLessons}
            </div>
          </div>
        </div>

        {/* Current Lesson Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                Lesson {currentLessonNumber}
              </span>
              <span className="text-white/50 text-xs">Current</span>
            </div>
            <div className="text-xs text-white/60">
              {progress.completedLessons} of {progress.totalLessons} completed
            </div>
          </div>

          <h3 className="font-semibold text-sm md:text-base mb-3">{currentLessonTitle}</h3>

          {/* Progress Bar */}
          <div className="mb-3">
            <Progress value={overallProgress} className="h-1.5 bg-white/20 [&>div]:bg-white" />
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-all text-sm",
              "bg-white text-primary hover:bg-white/95",
              "focus:outline-none focus:ring-2 focus:ring-white/50"
            )}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Continue Learning</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
