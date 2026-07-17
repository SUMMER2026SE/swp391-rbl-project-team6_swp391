"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { BookOpenText } from "lucide-react";
import { cn } from "@/lib/utils";

interface GrammarPointListProps {
  contents: Array<{
    id: string;
    contentOrder: number;
    pattern: string | null;
  }>;
  currentIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

export const GrammarPointList = memo(function GrammarPointList({
  contents,
  currentIndex,
  onSelect,
  className,
}: GrammarPointListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-card rounded-xl border border-border/50 p-4", className)}
    >
      <div className="flex items-center gap-2 mb-3">
        <BookOpenText className="w-4 h-4 text-lavender" />
        <span className="text-xs font-semibold text-foreground">
          Grammar Points ({contents.length})
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {contents.map((content, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={content.id}
              onClick={() => onSelect(index)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                isActive
                  ? "bg-lavender text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-lavender/20 hover:text-lavender"
              )}
            >
              {content.pattern ? (
                <span style={{ fontFamily: "var(--font-japanese, serif)" }}>
                  {content.pattern}
                </span>
              ) : (
                `Grammar ${content.contentOrder}`
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
});
