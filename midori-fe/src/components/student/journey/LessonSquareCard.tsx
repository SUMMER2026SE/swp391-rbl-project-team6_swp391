"use client";

import { motion } from "framer-motion";
import { Lock, CheckCircle, PlayCircle, Star } from "lucide-react";
import { type LessonStatus } from "@/mock/student-learning-journey";
import { cn } from "@/lib/utils";

interface LessonStatusBadgeProps {
  status: LessonStatus;
  score?: number;
}

export function LessonStatusBadge({ status, score }: LessonStatusBadgeProps) {
  switch (status) {
    case "COMPLETED":
      return (
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
            <CheckCircle className="w-2.5 h-2.5" />
            <span>Done</span>
          </div>
          {score !== undefined && (
            <span className="text-[10px] font-semibold text-primary">{score}%</span>
          )}
        </div>
      );
    case "IN_PROGRESS":
      return (
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-blue/20 text-sky-blue text-[10px] font-bold">
            <PlayCircle className="w-2.5 h-2.5" />
            <span>Continue</span>
          </div>
          {score !== undefined && (
            <span className="text-[10px] font-semibold text-sky-blue">{score}%</span>
          )}
        </div>
      );
    case "AVAILABLE":
      return (
        <div className="px-2 py-0.5 rounded-full bg-lavender/30 text-lavender text-[10px] font-bold">
          Start
        </div>
      );
    case "LOCKED":
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
          <Lock className="w-2.5 h-2.5" />
          <span>Locked</span>
        </div>
      );
    default:
      return null;
  }
}

interface LessonSquareCardProps {
  lesson: {
    id: string;
    number: number;
    title: string;
    titleJapanese: string;
    status: LessonStatus;
    score?: number;
  };
  isCurrent: boolean;
  onClick: () => void;
}

export function LessonSquareCard({ lesson, isCurrent, onClick }: LessonSquareCardProps) {
  const isLocked = lesson.status === "LOCKED";
  const isCompleted = lesson.status === "COMPLETED";
  const isInProgress = lesson.status === "IN_PROGRESS";

  const getStatusStyles = () => {
    if (isLocked) {
      return {
        card: "bg-muted/50 dark:bg-muted/30 border-border/50",
        icon: "bg-muted text-muted-foreground",
        number: "bg-muted text-muted-foreground",
        title: "text-muted-foreground",
        subtitle: "text-muted-foreground/60",
      };
    }
    if (isCompleted) {
      return {
        card: "bg-primary/10 border-primary/30",
        icon: "bg-primary/20 text-primary",
        number: "bg-primary/20 text-primary",
        title: "text-primary",
        subtitle: "text-primary/70",
      };
    }
    if (isCurrent || isInProgress) {
      return {
        card: "bg-sky-blue/10 border-sky-blue/30",
        icon: "bg-sky-blue/20 text-sky-blue",
        number: "bg-sky-blue/20 text-sky-blue",
        title: "text-sky-blue",
        subtitle: "text-sky-blue/70",
      };
    }
    // AVAILABLE
    return {
      card: "bg-card border-border/50 hover:border-primary/30",
      icon: "bg-accent text-primary",
      number: "bg-accent text-primary",
      title: "text-foreground",
      subtitle: "text-muted-foreground",
    };
  };

  const styles = getStatusStyles();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={!isLocked ? { scale: 1.02, y: -2 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      className={cn("relative", isLocked && "cursor-not-allowed")}
    >
      {/* Current Lesson Glow Effect */}
      {isCurrent && (
        <div className="absolute -inset-0.5 bg-gradient-hero rounded-xl opacity-25 blur-sm" />
      )}

      <button
        onClick={onClick}
        disabled={isLocked}
        className={cn(
          "relative w-full aspect-square rounded-xl border transition-all duration-200 overflow-hidden flex flex-col",
          styles.card,
          !isLocked && "hover:shadow-md",
        )}
      >
        {/* Header */}
        <div className="relative z-10 flex items-start justify-between p-2.5">
          <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold", styles.number)}>
            L{lesson.number.toString().padStart(2, "0")}
          </span>

          {isCompleted && (
            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <CheckCircle className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center relative z-10">
          {isLocked ? (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
          ) : isCompleted ? (
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/15 flex items-center justify-center">
              <Star className="w-6 h-6 md:w-7 md:h-7 text-primary fill-primary/30" />
            </div>
          ) : isInProgress ? (
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-sky-blue/15 flex items-center justify-center">
              <PlayCircle className="w-6 h-6 md:w-7 md:h-7 text-sky-blue" />
            </div>
          ) : (
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-accent flex items-center justify-center">
              <span className="text-xl md:text-2xl font-bold text-primary">{lesson.number}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn("relative z-10 p-2 text-center", isLocked && "opacity-60")}>
          <div className={cn("font-semibold text-[11px] mb-0.5 truncate", styles.title)}>
            {lesson.title}
          </div>
          <div className={cn("text-[9px] truncate", styles.subtitle)}>{lesson.titleJapanese}</div>
        </div>
      </button>

      {/* Status Badge - Positioned below card */}
      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20">
        <LessonStatusBadge status={lesson.status} score={lesson.score} />
      </div>
    </motion.div>
  );
}
