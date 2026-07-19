"use client";

import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LessonAccordion, type LessonSkillSummary } from "./LessonAccordion";
import type {
  LessonResponse,
  SkillStatus,
  SkillType,
} from "@/lib/api/lessons";

interface JourneyMapProps {
  lessons: LessonResponse[];
  /** Map of lessonId -> list of skill availability statuses (in load order). */
  skillStatusByLesson: Record<string, LessonSkillSummary[]>;
}

export function JourneyMap({ lessons, skillStatusByLesson }: JourneyMapProps) {
  const navigate = useNavigate();

  const handleSelectSkill = (lessonId: string, skillType: SkillType) => {
    navigate({
      to: "/student/journey/$lessonId",
      params: { lessonId },
      search: { skill: skillType.toLowerCase() },
    });
  };

  if (lessons.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">No lessons available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
      {lessons.map((lesson, index) => (
        <motion.div
          key={lesson.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
        >
          <LessonAccordion
            lesson={lesson}
            skills={skillStatusByLesson[lesson.id] ?? defaultSkillStatuses()}
            onSelectSkill={(skillType) =>
              handleSelectSkill(lesson.id, skillType)
            }
          />
        </motion.div>
      ))}
    </div>
  );
}

function defaultSkillStatuses(): LessonSkillSummary[] {
  return (["VOCABULARY", "GRAMMAR", "READING", "LISTENING"] as SkillType[]).map(
    (type) => ({
      type,
      status: "COMING_SOON" as SkillStatus,
    }),
  );
}