"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GrammarNavigationProps {
  currentIndex: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export const GrammarNavigation = memo(function GrammarNavigation({
  currentIndex,
  totalItems,
  onPrevious,
  onNext,
  className,
}: GrammarNavigationProps) {
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalItems - 1;
  const progress = ((currentIndex + 1) / totalItems) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-3", className)}
    >
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>
          Grammar <span className="font-bold text-foreground">{currentIndex + 1}</span> of{" "}
          <span>{totalItems}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-hero rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={cn(
            "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            canGoPrevious
              ? "bg-secondary text-foreground hover:bg-muted"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={cn(
            "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
            canGoNext
              ? "bg-gradient-hero text-white hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
});
