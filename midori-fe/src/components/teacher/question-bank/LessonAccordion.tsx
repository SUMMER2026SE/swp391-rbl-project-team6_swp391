import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import type { QuestionTopic } from "@/data/teacher-data";
import { QuestionTopicCard } from "./QuestionTopicCard";

interface LessonAccordionProps {
  groupedLessons: Record<string, Record<string, QuestionTopic[]>>;
  expandedLessons: Record<string, boolean>;
  onToggleLesson: (lesson: string) => void;
  onSelectSkill: (lesson: string, skill: string) => void;
  onOpenPreview: (id: string) => void;
}

export function LessonAccordion({
  groupedLessons,
  expandedLessons,
  onToggleLesson,
  onSelectSkill,
  onOpenPreview,
}: LessonAccordionProps) {
  const lessonKeys = Object.keys(groupedLessons).sort();

  return (
    <div className="space-y-4">
      {lessonKeys.map((les) => {
        const skillsGroup = groupedLessons[les] || {};
        const skillKeys = Object.keys(skillsGroup);
        if (skillKeys.length === 0) return null;

        const isExpanded = !!expandedLessons[les];
        const totalTopics = Object.values(skillsGroup).reduce(
          (s, list) => s + list.length,
          0
        );

        return (
          <div
            key={les}
            className="border border-border/60 rounded-xl bg-card overflow-hidden shadow-sm transition-all"
          >
            <button
              onClick={() => onToggleLesson(les)}
              className="w-full flex items-center justify-between p-4 font-display font-bold text-base hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4.5 w-4.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4.5 w-4.5 text-muted-foreground" />
                )}
                <span>{les}</span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                {totalTopics} {totalTopics === 1 ? "topic" : "topics"}
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-border/40 p-4 bg-muted/10 space-y-4">
                {skillKeys.map((skill) => {
                  const topics = skillsGroup[skill] || [];
                  if (topics.length === 0) return null;

                  return (
                    <div key={skill} className="space-y-2.5">
                      <button
                        onClick={() => onSelectSkill(les, skill)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{skill}</span>
                        <span className="text-xs text-muted-foreground">
                          ({topics.length})
                        </span>
                      </button>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {topics.map((topic) => (
                          <QuestionTopicCard
                            key={topic.id}
                            topic={topic}
                            onOpenPreview={onOpenPreview}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
