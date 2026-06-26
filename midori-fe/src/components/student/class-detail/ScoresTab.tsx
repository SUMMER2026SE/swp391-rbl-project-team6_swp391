import React, { useState } from "react";
import { Card } from "@/components/page-ui";
import { Award, Sparkles, ChevronRight, FileSpreadsheet } from "lucide-react";
import { ScoreDetailDialog } from "./dialogs/ScoreDetailDialog";
import type { DetailedClassInfo, ScoreBreakdown } from "@/types/class-detail";

interface ScoresTabProps {
  classInfo: DetailedClassInfo;
}

export function ScoresTab({ classInfo }: ScoresTabProps) {
  const [selectedScore, setSelectedScore] = useState<ScoreBreakdown | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {classInfo.scores.map((score) => (
          <Card
            key={score.assignmentId}
            onClick={() => setSelectedScore(score)}
            className="p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer border border-border/50 hover:border-primary/30"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-primary">
                  {score.module} Module
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(score.submissionTime).toLocaleDateString()}
                </span>
              </div>
              <h4 className="font-display font-bold text-base text-foreground dark:text-white mb-2 leading-tight">
                {score.assignmentName}
              </h4>
            </div>

            <div className="flex items-center justify-between mt-4 border-t border-dashed border-slate-100 dark:border-white/5 pt-3">
              <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                <Award className="w-4 h-4" />
                Score: {score.score} / {score.maxScore}
              </div>
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                View Result <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Card>
        ))}

        {classInfo.scores.length === 0 && (
          <div className="sm:col-span-2 text-center py-12 bg-white/50 dark:bg-indigo-950/10 border border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground font-semibold">
              No graded assignment records found
            </p>
          </div>
        )}
      </div>

      {selectedScore && (
        <ScoreDetailDialog score={selectedScore} onClose={() => setSelectedScore(null)} />
      )}
    </div>
  );
}
