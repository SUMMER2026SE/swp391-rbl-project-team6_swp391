import type { QuestionTopic } from "@/data/teacher-data";
import { QuestionTopicCard } from "./QuestionTopicCard";

interface SkillGridProps {
  groupedSkills: Record<string, QuestionTopic[]>;
  onOpenPreview: (id: string) => void;
}

export function SkillGrid({ groupedSkills, onOpenPreview }: SkillGridProps) {
  const skillKeys = Object.keys(groupedSkills).sort();

  return (
    <div className="space-y-6">
      {skillKeys.map((skill) => {
        const topics = groupedSkills[skill] || [];
        if (topics.length === 0) return null;

        return (
          <div key={skill} className="space-y-3">
            <h3 className="text-lg font-bold text-foreground border-b pb-1 font-display">
              {skill}
              <span className="ml-2 text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {topics.length} {topics.length === 1 ? "topic" : "topics"}
              </span>
            </h3>

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
  );
}
