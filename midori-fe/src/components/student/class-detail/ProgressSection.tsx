import React from "react";
import { Card, Progress } from "@/components/page-ui";
import { BookOpen, Flame } from "lucide-react";
import type { DetailedClassInfo } from "@/types/class-detail";

interface ProgressSectionProps {
  classInfo: DetailedClassInfo;
}

export function ProgressSection({ classInfo }: ProgressSectionProps) {
  const modules = [
    { name: "Vocabulary", val: classInfo.progress.vocabulary, completed: "12/15 lessons", streak: 5 },
    { name: "Grammar", val: classInfo.progress.grammar, completed: "6/10 lessons", streak: 3 },
    { name: "Listening", val: classInfo.progress.listening, completed: "3/8 lessons", streak: 0 },
    { name: "Reading", val: classInfo.progress.reading, completed: "3/6 lessons", streak: 2 },
    { name: "Shadowing", val: classInfo.progress.shadowing, completed: "4/12 lessons", streak: 1 },
    { name: "Writing", val: classInfo.progress.writing, completed: "1/5 lessons", streak: 0 },
  ];

  return (
    <Card className="p-5 space-y-4">
      <h3 className="font-display font-black text-base text-foreground dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
        <BookOpen className="w-4.5 h-4.5 text-primary" />
        Learning Progress
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {modules.map((m, i) => (
          <div
            key={i}
            className="p-3 border border-slate-200/40 dark:border-white/5 bg-slate-50/10 dark:bg-white/[0.002] rounded-2xl flex flex-col justify-between min-h-[105px]"
          >
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-foreground dark:text-slate-300">
                <span>{m.name}</span>
                <span className="font-black text-primary">{m.val}%</span>
              </div>
              <div className="mt-2">
                <Progress value={m.val} />
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-3 pt-1.5 border-t border-slate-100 dark:border-white/5">
              <span>{m.completed}</span>
              {m.streak > 0 && (
                <span className="flex items-center gap-0.5 text-orange-500 font-bold">
                  <Flame className="w-3 h-3 fill-current" /> {m.streak}d
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
