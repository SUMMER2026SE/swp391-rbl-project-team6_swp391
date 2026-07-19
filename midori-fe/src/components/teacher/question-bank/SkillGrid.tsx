import { useState } from "react";
import type { QuestionTopic } from "@/data/teacher-data";
import { QuestionTopicCard } from "./QuestionTopicCard";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SkillGridProps {
  groupedSkills: Record<string, QuestionTopic[]>;
  onOpenPreview: (id: string) => void;
  onAssignHomework?: (id: string) => void;
  onAssignExam?: (id: string) => void;
}

export function SkillGrid({
  groupedSkills,
  onOpenPreview,
  onAssignHomework,
  onAssignExam,
}: SkillGridProps) {
  const skillKeys = Object.keys(groupedSkills).sort();
  const [collapsedSkills, setCollapsedSkills] = useState<Record<string, boolean>>({});

  const toggleCollapse = (skill: string) => {
    setCollapsedSkills((prev) => ({
      ...prev,
      [skill]: !prev[skill],
    }));
  };

  return (
    <div className="space-y-6">
      {skillKeys.map((skill) => {
        const topics = groupedSkills[skill] || [];
        if (topics.length === 0) return null;
        const isCollapsed = !!collapsedSkills[skill];

        return (
          <div key={skill} className="space-y-3">
            <h3
              onClick={() => toggleCollapse(skill)}
              className="text-lg font-bold text-foreground border-b pb-1 font-display flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                {skill}
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {topics.length} {topics.length === 1 ? "topic" : "topics"}
                </span>
              </div>
              <span className="text-muted-foreground hover:text-foreground transition-colors">
                {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </span>
            </h3>

            {!isCollapsed && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topics.map((topic) => (
                  <QuestionTopicCard
                    key={topic.id}
                    topic={topic}
                    onOpenPreview={onOpenPreview}
                    onAssignHomework={onAssignHomework}
                    onAssignExam={onAssignExam}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
