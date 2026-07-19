"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { BookOpenText } from "lucide-react";
import { cn } from "@/lib/utils";

interface GrammarEmptyStateProps {
  className?: string;
}

export const GrammarEmptyState = memo(function GrammarEmptyState({
  className,
}: GrammarEmptyStateProps) {
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
        No grammar content available
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        This lesson doesn't have any grammar points yet.
      </p>
    </motion.div>
  );
});
