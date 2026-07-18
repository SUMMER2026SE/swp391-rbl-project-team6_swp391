"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  Headphones,
  ChevronRight,
  BookText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SkillType = "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";

interface SkillCardProps {
  skill: {
    type: SkillType;
    status: "available" | "coming_soon";
  };
  isActive: boolean;
  onSelect: () => void;
}

const skillIcons: Record<SkillType, React.ElementType> = {
  VOCABULARY: BookOpen,
  GRAMMAR: GraduationCap,
  READING: BookText,
  LISTENING: Headphones,
};

const skillColors: Record<SkillType, { bg: string; icon: string; text: string }> = {
  VOCABULARY: { bg: "bg-primary/15", icon: "text-primary", text: "text-primary" },
  GRAMMAR: { bg: "bg-lavender/20", icon: "text-lavender", text: "text-lavender" },
  READING: { bg: "bg-sky-blue/15", icon: "text-sky-blue", text: "text-sky-blue" },
  LISTENING: { bg: "bg-sakura/20", icon: "text-sakura", text: "text-sakura" },
};

const skillLabel: Record<SkillType, string> = {
  VOCABULARY: "Vocabulary",
  GRAMMAR: "Grammar",
  READING: "Reading",
  LISTENING: "Listening",
};

export function SkillCard({ skill, isActive, onSelect }: SkillCardProps) {
  const Icon = skillIcons[skill.type];
  const colors = skillColors[skill.type];
  const isAvailable = skill.status === "available";

  return (
    <motion.button
      onClick={onSelect}
      disabled={!isAvailable}
      whileHover={isAvailable ? { scale: 1.01 } : {}}
      whileTap={isAvailable ? { scale: 0.99 } : {}}
      className={cn(
        "w-full p-3 rounded-lg border transition-all duration-200 text-left",
        isActive
          ? `${colors.bg} border-current shadow-sm`
          : "bg-card border-border/50 hover:border-primary/30",
        !isAvailable && "opacity-60 cursor-not-allowed",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              isActive ? colors.bg : "bg-muted",
            )}
          >
            <Icon
              className={cn("w-4 h-4", isActive ? colors.icon : "text-muted-foreground")}
            />
          </div>
          <div>
            <div
              className={cn(
                "font-semibold text-sm",
                isActive ? colors.text : "text-foreground",
              )}
            >
              {skillLabel[skill.type]}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {isAvailable ? "Open skill" : "Coming soon"}
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </motion.button>
  );
}














