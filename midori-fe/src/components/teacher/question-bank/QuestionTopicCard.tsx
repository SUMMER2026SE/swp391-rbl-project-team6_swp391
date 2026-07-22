import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, FileText, HelpCircle } from "lucide-react";
import { LevelBadge } from "@/components/teacher/badges";
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
    <Card 
      onClick={() => onOpenPreview(topic.id)}
      className="border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_-10px_rgba(99,102,241,0.15)] hover:border-indigo-500/30 cursor-pointer overflow-hidden group"
    >
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div>
          {/* Header Badges */}
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-1.5">
              <LevelBadge level={topic.level} />
              <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-950/20">
                {topic.skill}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-full">
              <HelpCircle className="w-3 h-3 text-slate-400" />
              <span>{topic.totalQuestions} Qs</span>
            </div>
          </div>

          {/* Title & JP Name */}
          <div className="space-y-1 mb-4">
            <h4 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
              {topic.name}
            </h4>
            {topic.jpName && (
              <p className="font-jp text-[11px] text-muted-foreground/80 line-clamp-1 italic">
                {topic.jpName}
              </p>
            )}
          </div>

          {/* Difficulty breakdown */}
          <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-white/[0.02] p-2 rounded-xl border border-slate-100/50 dark:border-white/5 mb-4 text-[10px]">
            <div className="flex items-center gap-1 flex-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Easy:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{topic.easy}</span>
            </div>
            <div className="flex items-center gap-1 flex-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Medium:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{topic.medium}</span>
            </div>
            <div className="flex items-center gap-1 flex-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-muted-foreground">Hard:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{topic.hard}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 gap-2 mt-auto">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full h-8.5 rounded-xl border-slate-200/80 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onAssignHomework?.(topic.id);
            }}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Homework</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
