import React, { useState } from "react";
import { Card } from "@/components/page-ui";
import { Award, ChevronRight, FileSpreadsheet, Eye } from "lucide-react";
import { ScoreDetailDialog } from "./dialogs/ScoreDetailDialog";
import type { DetailedClassInfo, ScoreBreakdown } from "@/types/class-detail";

interface ScoresSectionProps {
  classInfo: DetailedClassInfo;
}

export function ScoresSection({ classInfo }: ScoresSectionProps) {
  const [selectedScore, setSelectedScore] = useState<ScoreBreakdown | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayedScores = showAll ? classInfo.scores : classInfo.scores.slice(0, 2);

  return (
    <Card className="p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
        <h3 className="font-display font-black text-base text-foreground dark:text-white flex items-center gap-2">
          <Award className="w-4.5 h-4.5 text-primary" />
          Recent Scores
        </h3>
        {classInfo.scores.length > 2 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-bold text-primary hover:underline"
          >
            {showAll ? "Show Less" : "View All"}
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {displayedScores.map((score) => (
          <div
            key={score.assignmentId}
            onClick={() => setSelectedScore(score)}
            className="p-3.5 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002] hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-foreground dark:text-white leading-tight">
                {score.assignmentName}
              </h4>
              <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mt-0.5 block">
                {score.module} Module
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-green-500">
                {score.score} / {score.maxScore}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        ))}

        {classInfo.scores.length === 0 && (
          <div className="text-center py-6 bg-white/50 dark:bg-indigo-950/10 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
            <FileSpreadsheet className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground font-semibold">No scores recorded yet</p>
          </div>
        )}
      </div>

      {selectedScore && (
        <ScoreDetailDialog score={selectedScore} onClose={() => setSelectedScore(null)} />
      )}
    </Card>
  );
}
