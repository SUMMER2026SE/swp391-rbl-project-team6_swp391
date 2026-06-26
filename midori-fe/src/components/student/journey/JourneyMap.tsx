"use client";

import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { JourneyHero } from "./JourneyHero";
import { LessonSquareCard } from "./LessonSquareCard";
import { type Lesson, type JourneyProgress } from "@/mock/student-learning-journey";
import { Map } from "lucide-react";

interface JourneyMapProps {
  lessons: Lesson[];
  progress: JourneyProgress;
}

export function JourneyMap({ lessons, progress }: JourneyMapProps) {
  const navigate = useNavigate();
  const currentLesson = lessons.find(l => l.status === "IN_PROGRESS") || lessons.find(l => l.status === "AVAILABLE");
  const overallProgress = Math.round((progress.completedLessons / progress.totalLessons) * 100);

  const handleLessonClick = (lessonId: string, status: string) => {
    if (status !== "LOCKED") {
      navigate({ to: "/student/journey/$lessonId", params: { lessonId } });
    }
  };

  return (
    <div className="space-y-5">
      {/* Hero Section */}
      <JourneyHero
        progress={progress}
        currentLessonTitle={currentLesson?.title || "No current lesson"}
        currentLessonNumber={currentLesson?.number || 1}
        overallProgress={overallProgress}
        currentLessonId={currentLesson?.id}
      />

      {/* Journey Map Section */}
      <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Map className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm text-foreground">Journey Map</h2>
            <p className="text-xs text-muted-foreground">Complete lessons to unlock new content</p>
          </div>
        </div>

        {/* Lesson Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {lessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <LessonSquareCard
                lesson={lesson}
                isCurrent={lesson.id === currentLesson?.id}
                onClick={() => handleLessonClick(lesson.id, lesson.status)}
              />
            </motion.div>
          ))}
        </div>

        {/* Progress Info */}
        <div className="mt-4 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <div className="text-xs text-muted-foreground">
              {progress.completedLessons} of {progress.totalLessons} lessons completed
            </div>
            <div className="text-base font-bold text-foreground">
              {overallProgress}% Complete
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-sky-blue" />
              <span className="text-muted-foreground">In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              <span className="text-muted-foreground">Locked</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
