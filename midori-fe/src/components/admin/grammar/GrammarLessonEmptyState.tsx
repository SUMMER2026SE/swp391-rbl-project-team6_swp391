"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Plus, BookOpenText } from "lucide-react";
import { cn } from "@/lib/utils";

interface GrammarLessonEmptyStateProps {
  onCreateClick: () => void;
  className?: string;
}

export const GrammarLessonEmptyState = memo(function GrammarLessonEmptyState({
  onCreateClick,
  className,
}: GrammarLessonEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <BookOpenText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">
        No grammar lessons yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">
        Get started by creating your first grammar lesson.
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-hero px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Create First Lesson
      </button>
    </motion.div>
  );
});
