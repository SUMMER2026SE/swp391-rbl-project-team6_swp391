"use client";

import { motion } from "framer-motion";
import { Sparkles, BookOpen, GraduationCap, Headphones, Trophy, Check } from "lucide-react";
import { type SkillType } from "@/mock/student-learning-journey";
import { cn } from "@/lib/utils";

interface XPCardProps {
  xpGained: number;
  completedSkill?: SkillType;
}

const skillXP: Record<SkillType, number> = {
  VOCABULARY: 50,
  GRAMMAR: 100,
  READING: 75,
  LISTENING: 75,
};

const skillIcons: Record<SkillType, React.ElementType> = {
  VOCABULARY: BookOpen,
  GRAMMAR: GraduationCap,
  READING: BookOpen,
  LISTENING: Headphones,
};

export function XPCard({ xpGained, completedSkill }: XPCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-card border border-border/50 rounded-xl p-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide">
            XP Earned
          </div>
          <div className="font-bold text-lg text-amber-600 dark:text-amber-400">+{xpGained} XP</div>
        </div>
      </div>

      {completedSkill && (
        <div className="mt-2.5 pt-2.5 border-t border-border/50">
          <div className="text-[10px] text-muted-foreground mb-1.5">Completed:</div>
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = skillIcons[completedSkill];
              return (
                <>
                  <Icon className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {completedSkill.charAt(0) + completedSkill.slice(1).toLowerCase()}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    +{skillXP[completedSkill]} XP
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface LessonCompleteCardProps {
  lessonTitle: string;
  totalXp: number;
  score: number;
  badgesEarned?: string[];
}

export function LessonCompleteCard({
  lessonTitle,
  totalXp,
  score,
  badgesEarned,
}: LessonCompleteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-gradient-hero rounded-xl p-5 text-white"
    >
      <div className="text-center mb-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center"
        >
          <Trophy className="w-8 h-8" />
        </motion.div>

        <h2 className="text-xl font-bold mb-1">Lesson Complete!</h2>
        <p className="text-white/70 text-sm">{lessonTitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white/15 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-white/60 mb-0.5">Score</div>
          <div className="text-xl font-bold">{score}%</div>
        </div>
        <div className="bg-white/15 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-white/60 mb-0.5">XP Earned</div>
          <div className="text-xl font-bold">+{totalXp}</div>
        </div>
      </div>

      {badgesEarned && badgesEarned.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] text-white/60 mb-2 text-center">Badges Earned:</div>
          <div className="flex justify-center gap-2">
            {badgesEarned.map((badge) => (
              <div
                key={badge}
                className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-xl"
              >
                {badge === "first-lesson" && "🌱"}
                {badge === "vocabulary-master" && "📚"}
                {badge === "grammar-hero" && "🏆"}
                {badge === "listening-champion" && "🎧"}
                {badge === "reading-expert" && "📖"}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
