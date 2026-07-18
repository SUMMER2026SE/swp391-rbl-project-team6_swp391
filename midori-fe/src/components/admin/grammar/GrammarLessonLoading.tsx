"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Loader2, BookOpenText } from "lucide-react";
import { cn } from "@/lib/utils";

interface GrammarLessonLoadingProps {
  className?: string;
}

export const GrammarLessonLoading = memo(function GrammarLessonLoading({
  className,
}: GrammarLessonLoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">Loading grammar lessons...</p>
    </div>
  );
});
