"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SKILL_META,
  SKILL_ORDER,
  type SkillStatus,
  type SkillType,
} from "./skillMeta";

export interface LessonSkillSummary {
  type: SkillType;
  status: SkillStatus;
}

interface LessonAccordionProps {
  lesson: {
    id: string;
    lessonNumber?: number;
    title: string;
    description?: string | null;
    level?: string;
  };
  skills: LessonSkillSummary[];
  onSelectSkill: (skillType: SkillType) => void;
  /** Whether this accordion should be initially expanded */
  defaultOpen?: boolean;
}

export function LessonAccordion({
  lesson,
  skills,
  onSelectSkill,
  defaultOpen = false,
}: LessonAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const skillsByType = new Map(skills.map((s) => [s.type, s]));
  const orderedSkills = SKILL_ORDER.map(
    (type) => skillsByType.get(type),
  ).filter((s): s is LessonSkillSummary => Boolean(s));

  const lessonNumber = lesson.lessonNumber ?? 1;
  const paddedNumber = lessonNumber.toString().padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden",
        "transition-all duration-200",
        isOpen
          ? "border-primary/30 shadow-md"
          : "hover:border-primary/20 hover:shadow-md",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={`lesson-panel-${lesson.id}`}
        className={cn(
          "w-full flex items-center gap-4 p-5 text-left",
          "transition-colors duration-200",
          isOpen ? "bg-accent/30" : "hover:bg-accent/20",
        )}
      >
        {/* Lesson icon */}
        <div
          className={cn(
            "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
            "bg-primary/10 text-primary",
            "transition-transform duration-200",
            isOpen && "scale-105",
          )}
        >
          <BookOpen className="w-5 h-5" />
        </div>

        {/* Lesson info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Lesson {paddedNumber}
            </span>
            {lesson.level && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                {lesson.level}
              </span>
            )}
          </div>
          <h3 className="font-display font-bold text-base sm:text-lg text-foreground truncate">
            {lesson.title}
          </h3>
          {!isOpen && lesson.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {lesson.description}
            </p>
          )}
        </div>

        {/* Expand/Collapse icon */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
            "border transition-colors duration-200",
            isOpen
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border",
          )}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`lesson-panel-${lesson.id}`}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-border/40">
              {lesson.description && (
                <p className="text-sm text-muted-foreground mb-3 mt-3">
                  {lesson.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {orderedSkills.map((skill, idx) => (
                  <motion.button
                    key={skill.type}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + idx * 0.04, duration: 0.2 }}
                    onClick={() => onSelectSkill(skill.type)}
                    disabled={skill.status !== "AVAILABLE"}
                    className={cn(
                      "group flex items-center gap-3 p-3 rounded-xl",
                      "border border-border/50 bg-background",
                      "transition-all duration-200 text-left",
                      skill.status === "AVAILABLE"
                        ? cn(
                            "cursor-pointer",
                            SKILL_META[skill.type].hoverBg,
                            "hover:border-current hover:shadow-sm",
                          )
                        : "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <div
                      className={cn(
                        "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                        SKILL_META[skill.type].accentBg,
                      )}
                    >
                      {(() => {
                        const Icon = SKILL_META[skill.type].icon;
                        return (
                          <Icon
                            className={cn(
                              "w-5 h-5",
                              SKILL_META[skill.type].accentIcon,
                            )}
                          />
                        );
                      })()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "font-semibold text-sm",
                          SKILL_META[skill.type].accentText,
                        )}
                      >
                        {SKILL_META[skill.type].label}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {skill.status === "AVAILABLE"
                          ? "Start learning"
                          : "Coming soon"}
                      </div>
                    </div>

                    <ArrowRight
                      className={cn(
                        "w-4 h-4 shrink-0 transition-transform duration-200",
                        skill.status === "AVAILABLE"
                          ? cn(
                              SKILL_META[skill.type].accentIcon,
                              "group-hover:translate-x-1",
                            )
                          : "text-muted-foreground/50",
                      )}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}