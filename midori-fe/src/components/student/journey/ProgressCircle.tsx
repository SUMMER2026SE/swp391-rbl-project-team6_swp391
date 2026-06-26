"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ProgressCircle({
  progress,
  size = "md",
  showLabel = true,
  className,
}: ProgressCircleProps) {
  const sizeClasses = {
    sm: { container: "w-16 h-16", stroke: 4, radius: 28, fontSize: "text-xs" },
    md: { container: "w-24 h-24", stroke: 5, radius: 42, fontSize: "text-lg" },
    lg: { container: "w-32 h-32", stroke: 6, radius: 56, fontSize: "text-2xl" },
  };

  const config = sizeClasses[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", config.container, className)}>
      {/* Background Circle */}
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={config.radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-slate-200 dark:text-slate-700"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={config.radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-primary dark:text-primary"
        />
      </svg>

      {/* Label */}
      {showLabel && (
        <div className="relative z-10">
          <span className={cn("font-bold text-primary", config.fontSize)}>{progress}%</span>
        </div>
      )}
    </div>
  );
}
