import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import type { QuestionTopic } from "@/data/teacher-data";

interface LevelAccordionProps {
  groupedData: Record<string, Record<string, Record<string, QuestionTopic[]>>>;
  expandedLevels: Record<string, boolean>;
  onToggleLevel: (level: string) => void;
  onSelectLesson: (level: string, lesson: string) => void;
}

export function LevelAccordion({
  groupedData,
  expandedLevels,
  onToggleLevel,
  onSelectLesson,
}: LevelAccordionProps) {
  const levels = ["N5", "N4", "N3", "N2", "N1"];

  return (
    <div className="space-y-3">
      {levels.map((lvl) => {
        const lessonsGroup = groupedData[lvl] || {};
        const lessonKeys = Object.keys(lessonsGroup);
        if (lessonKeys.length === 0) return null;

        const isExpanded = !!expandedLevels[lvl];
        const totalTopics = Object.values(lessonsGroup).reduce(
          (sum, skillMap) =>
            sum +
            Object.values(skillMap).reduce((s, topics) => s + topics.length, 0),
          0
        );

        return (
          <div
            key={lvl}
            className="border border-border/60 rounded-xl bg-card overflow-hidden shadow-sm transition-all"
          >
            <button
              onClick={() => onToggleLevel(lvl)}
              className="w-full flex items-center justify-between p-4 font-display font-bold text-lg hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <span>{lvl} Level</span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                {totalTopics} {totalTopics === 1 ? "topic" : "topics"}
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-border/40 p-3 bg-muted/10 space-y-2">
                {lessonKeys.map((les) => {
                  const skills = lessonsGroup[les];
                  const topicCount = Object.values(skills).reduce(
                    (s, list) => s + list.length,
                    0
                  );

                  return (
                    <div
                      key={les}
                      onClick={() => onSelectLesson(lvl, les)}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:border-primary/45 hover:text-primary transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 font-medium text-sm">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{les}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {topicCount} {topicCount === 1 ? "topic" : "topics"}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
