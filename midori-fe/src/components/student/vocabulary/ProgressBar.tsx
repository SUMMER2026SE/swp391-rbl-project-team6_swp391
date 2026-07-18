"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export const ProgressBar = memo(function ProgressBar({
  current,
  total,
  className,
}: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">
          Card <span className="font-bold text-slate-900 dark:text-white">{current}</span> of{" "}
          <span className="text-slate-500">{total}</span>
        </span>
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-hero rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});
