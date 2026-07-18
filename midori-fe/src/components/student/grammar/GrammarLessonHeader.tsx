"use client";

import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const levelColors: Record<string, string> = {
  N5: "bg-blue-500/20 text-blue-400 border-blue-400/30",
  N4: "bg-green-500/20 text-green-400 border-green-400/30",
  N3: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  N2: "bg-orange-500/20 text-orange-400 border-orange-400/30",
  N1: "bg-red-500/20 text-red-400 border-red-400/30",
};

interface GrammarLessonHeaderProps {
  jlptLevel: string;
  title: string;
  grammarCount: number;
  className?: string;
}

export const GrammarLessonHeader = memo(function GrammarLessonHeader({
  jlptLevel,
  title,
  grammarCount,
  className,
}: GrammarLessonHeaderProps) {
  const levelColorClass = levelColors[jlptLevel] ?? levelColors.N5;

  return (
    <div className={cn("sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800", className)}>
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Back button and title */}
        <div className="flex items-center gap-4 mb-4">
          <Link
            to="/student/grammar"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-sm ${levelColorClass}`}
              >
                JLPT {jlptLevel}
              </span>
            </div>
            <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white truncate">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Layers className="w-4 h-4" />
            <span>{grammarCount} grammar point{grammarCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
