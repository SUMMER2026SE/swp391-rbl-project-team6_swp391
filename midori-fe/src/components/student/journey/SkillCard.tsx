"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Mic, GraduationCap, Headphones, ChevronRight, Check } from "lucide-react";
import { type SkillContent, type SkillType } from "@/mock/student-learning-journey";
import { cn } from "@/lib/utils";

interface SkillCardProps {
  skill: SkillContent;
  isActive: boolean;
  onSelect: () => void;
  progress?: number;
}

const skillIcons: Record<SkillType, React.ElementType> = {
  VOCABULARY: BookOpen,
  GRAMMAR: GraduationCap,
  READING: BookOpen,
  LISTENING: Headphones,
};

const skillColors: Record<SkillType, { bg: string; border: string; icon: string; text: string }> = {
  VOCABULARY: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    icon: "text-primary",
    text: "text-primary",
  },
  GRAMMAR: {
    bg: "bg-lavender/20",
    border: "border-lavender/30",
    icon: "text-lavender",
    text: "text-lavender",
  },
  READING: {
    bg: "bg-sky-blue/15",
    border: "border-sky-blue/30",
    icon: "text-sky-blue",
    text: "text-sky-blue",
  },
  LISTENING: {
    bg: "bg-sakura/20",
    border: "border-sakura/30",
    icon: "text-sakura",
    text: "text-sakura",
  },
};

export function SkillCard({ skill, isActive, onSelect, progress = 0 }: SkillCardProps) {
  const Icon = skillIcons[skill.type];
  const colors = skillColors[skill.type];
  const isCompleted = progress >= 100;

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full p-3.5 rounded-xl border transition-all duration-200 text-left",
        isActive
          ? `${colors.bg} ${colors.border} shadow-sm`
          : "bg-card border-border/50 hover:border-primary/30 hover:shadow-sm",
        isCompleted && !isActive && "opacity-70"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isActive ? colors.bg : "bg-muted"
          )}>
            <Icon className={cn("w-5 h-5", isActive ? colors.icon : "text-muted-foreground")} />
          </div>
          <div>
            <div className={cn(
              "font-semibold text-sm",
              isActive ? colors.text : "text-foreground"
            )}>
              {skill.type.charAt(0) + skill.type.slice(1).toLowerCase()}
            </div>
            <div className="text-xs text-muted-foreground">
              {skill.type === "VOCABULARY" && `${skill.vocabulary?.length || 0} words`}
              {skill.type === "GRAMMAR" && `${skill.grammar?.length || 0} patterns`}
              {skill.type === "READING" && "Reading practice"}
              {skill.type === "LISTENING" && "Listening practice"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
    </motion.button>
  );
}
