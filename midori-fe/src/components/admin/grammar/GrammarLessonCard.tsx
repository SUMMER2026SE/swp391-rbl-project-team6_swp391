"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrammarLessonResponse } from "@/lib/api/grammarContent";

interface GrammarLessonCardProps {
  lesson: GrammarLessonResponse;
  onClick?: () => void;
  className?: string;
}

export const GrammarLessonCard = memo(function GrammarLessonCard({
  lesson,
  onClick,
  className,
}: GrammarLessonCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full text-left rounded-xl p-4 border transition-all duration-200",
        "bg-card border-border/50 hover:border-lavender/30 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-lavender/15 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-lavender">
            {String(lesson.lessonNumber).padStart(2, "0")}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {lesson.title}
            </h3>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                lesson.isActive
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-amber-500/15 text-amber-600"
              )}
            >
              {lesson.isActive ? "Published" : "Draft"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {lesson.jlptLevel}
            </span>
            {lesson.description && (
              <span className="truncate line-clamp-1">{lesson.description}</span>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </motion.button>
  );
});
