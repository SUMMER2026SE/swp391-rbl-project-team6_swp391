import React from "react";
import { Card } from "@/components/page-ui";
import { Sparkles, BrainCircuit, AlertTriangle } from "lucide-react";
import type { DetailedClassInfo } from "@/types/class-detail";

interface WeakPointsSectionProps {
  classInfo: DetailedClassInfo;
}

export function WeakPointsSection({ classInfo }: WeakPointsSectionProps) {
  const wp = classInfo.weakPoints;

  return (
    <Card className="p-5 space-y-4 border border-indigo-500/20 bg-indigo-500/[0.01]">
      <h3 className="font-display font-black text-base text-foreground dark:text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        AI Weak Points
      </h3>

      <div className="space-y-3">
        {/* Listening Weakness */}
        {wp.listening.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground dark:text-slate-200">Listening</h4>
            <ul className="list-disc list-inside text-[11px] text-muted-foreground pl-1 space-y-0.5">
              {wp.listening.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Grammar Weakness */}
        {wp.grammar.length > 0 && (
          <div className="space-y-1 border-t border-slate-100 dark:border-white/5 pt-2">
            <h4 className="text-xs font-bold text-foreground dark:text-slate-200">Grammar</h4>
            <ul className="list-disc list-inside text-[11px] text-muted-foreground pl-1 space-y-0.5">
              {wp.grammar.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Vocabulary Weakness */}
        {wp.vocabularyCount > 0 && (
          <div className="border-t border-slate-100 dark:border-white/5 pt-2">
            <h4 className="text-xs font-bold text-foreground dark:text-slate-200">Vocabulary</h4>
            <p className="text-[11px] text-muted-foreground pl-1">
              {wp.vocabularyCount} words need review.
            </p>
          </div>
        )}
      </div>

      <button className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition">
        <BrainCircuit className="w-3.5 h-3.5" />
        Review Mistakes
      </button>
    </Card>
  );
}
