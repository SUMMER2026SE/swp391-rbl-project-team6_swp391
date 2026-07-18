import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, FileText } from "lucide-react";
import { LevelBadge, DifficultyBadge } from "@/components/teacher/badges";
import type { QuestionTopic } from "@/data/teacher-data";

interface QuestionTopicCardProps {
  topic: QuestionTopic;
  onOpenPreview: (id: string) => void;
  onAssignHomework?: (id: string) => void;
  onAssignExam?: (id: string) => void;
}

export function QuestionTopicCard({
  topic,
  onOpenPreview,
  onAssignHomework,
  onAssignExam,
}: QuestionTopicCardProps) {
  return (
    <Card className="border-border/60 transition-all hover:border-primary/40 hover:shadow-md">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <LevelBadge level={topic.level} />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {topic.skill}
          </span>
        </div>
        <button
          onClick={() => onOpenPreview(topic.id)}
          className="block w-full truncate text-left font-semibold hover:text-primary cursor-pointer"
        >
          {topic.name}
        </button>
        <div className="font-jp text-xs text-muted-foreground">{topic.jpName}</div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="font-semibold">{topic.totalQuestions}</span>
          <span className="text-muted-foreground">questions</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
          <DifficultyBadge d="Easy" />
          <span>{topic.easy}</span>
          <DifficultyBadge d="Medium" />
          <span>{topic.medium}</span>
          <DifficultyBadge d="Hard" />
          <span>{topic.hard}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={(e) => {
              e.stopPropagation();
              onAssignHomework?.(topic.id);
            }}
          >
            <ClipboardList className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={(e) => {
              e.stopPropagation();
              onAssignExam?.(topic.id);
            }}
          >
            <FileText className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-center text-[9px] uppercase tracking-wider text-muted-foreground">
          <span>HW</span>
          <span>Exam</span>
        </div>
      </CardContent>
    </Card>
  );
}
