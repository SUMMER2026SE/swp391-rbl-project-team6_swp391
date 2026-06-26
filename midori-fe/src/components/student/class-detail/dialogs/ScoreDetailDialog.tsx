import React from "react";
import ReactDOM from "react-dom";
import {
  X,
  Sparkles,
  AlertCircle,
  Award,
  CheckCircle,
  BrainCircuit,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/page-ui";
import type { ScoreBreakdown } from "@/types/class-detail";

interface ScoreDetailDialogProps {
  score: ScoreBreakdown;
  onClose: () => void;
  /** Optional: open review workspace for this assignment */
  onReview?: () => void;
}

export function ScoreDetailDialog({ score, onClose, onReview }: ScoreDetailDialogProps) {
  const isListening = score.module.toLowerCase() === "listening";
  const isWriting = score.module.toLowerCase() === "writing";
  const isShadowing = score.module.toLowerCase() === "shadowing";

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-foreground dark:text-white">
              {score.assignmentName}
            </h3>
            <span className="text-xs text-muted-foreground">{score.module} Module</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-4 scrollbar-hide">
          {/* Score & Submission date */}
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5 text-center flex flex-col items-center gap-1">
            <Award className="w-8 h-8 text-primary" />
            <div className="text-3xl font-black text-foreground dark:text-white mt-1">
              {score.score} / {score.maxScore}
            </div>
            <div className="text-xs text-muted-foreground">
              Submitted on {new Date(score.submissionTime).toLocaleDateString()}
            </div>
          </div>

          {/* AI Explanation & Feedback */}
          <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/15 rounded-2xl p-4 space-y-2">
            <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              AI Sensei Explanation
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{score.aiFeedback}</p>
          </div>

          {/* Custom Section: Listening diagnostics */}
          {isListening && (
            <div className="p-4 border border-amber-500/20 rounded-2xl bg-amber-500/[0.01] space-y-3">
              <h5 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                Listening Skill Analysis
              </h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002]">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Pronunciation
                  </span>
                  <div className="font-bold mt-0.5 text-foreground dark:text-slate-200">
                    Good, minor accent tweaks needed
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002]">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Numbers
                  </span>
                  <div className="font-bold mt-0.5 text-red-500">
                    Struggled with large figures (万, 億)
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002]">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Time Expressions
                  </span>
                  <div className="font-bold mt-0.5 text-red-500">
                    Confused duration with specific time stamps
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002]">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Particles
                  </span>
                  <div className="font-bold mt-0.5 text-foreground dark:text-slate-200">
                    Identified wa and ga context clues
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Section: Writing diagnostics */}
          {isWriting && (
            <div className="p-4 border border-indigo-500/20 rounded-2xl bg-indigo-500/[0.01] space-y-3">
              <h5 className="text-xs font-bold text-indigo-500 uppercase tracking-wider">
                Writing Quality Breakdown
              </h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002]">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Grammar Mistakes
                  </span>
                  <div className="font-bold mt-0.5 text-red-500">
                    2 errors with transitivity (他動詞)
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002]">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Vocabulary Mistakes
                  </span>
                  <div className="font-bold mt-0.5 text-foreground dark:text-slate-200">
                    Appropriate word selection
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002]">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Spelling / Kanji
                  </span>
                  <div className="font-bold mt-0.5 text-foreground dark:text-slate-200">
                    Kanji strokes correct
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002]">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Naturalness & Expression
                  </span>
                  <div className="font-bold mt-0.5 text-indigo-500">
                    Level appropriate; expression style: 8.5/10
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Section: Shadowing diagnostics */}
          {isShadowing && (
            <div className="p-4 border border-purple-500/20 rounded-2xl bg-purple-500/[0.01] space-y-3">
              <h5 className="text-xs font-bold text-purple-500 uppercase tracking-wider">
                Shadowing Audio Analysis
              </h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002]">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Pronunciation
                  </span>
                  <div className="font-bold mt-0.5 text-foreground dark:text-slate-200">
                    Clear consonant articulation
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002]">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Fluency
                  </span>
                  <div className="font-bold mt-0.5 text-foreground dark:text-slate-200">
                    Speech rate: 110 WPM (Target: 120)
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002]">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Accuracy
                  </span>
                  <div className="font-bold mt-0.5 text-red-500">
                    Missed 2 end particles (ね, よ)
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.002]">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Intonation
                  </span>
                  <div className="font-bold mt-0.5 text-foreground dark:text-slate-200">
                    Good rising pitch contour
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-green-500/20 rounded-2xl p-4 bg-green-500/[0.01] space-y-2">
              <h5 className="text-xs font-bold text-green-500 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Strengths
              </h5>
              <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-1">
                {score.strengths.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
                {score.strengths.length === 0 && <li>Consistent response patterns</li>}
              </ul>
            </div>
            <div className="border border-red-500/20 rounded-2xl p-4 bg-red-500/[0.01] space-y-2">
              <h5 className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Weaknesses
              </h5>
              <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-1">
                {score.weaknesses.map((wk, i) => (
                  <li key={i}>{wk}</li>
                ))}
                {score.weaknesses.length === 0 && (
                  <li>Speed and parsing accuracy under time limit</li>
                )}
              </ul>
            </div>
          </div>

          {/* Suggestions & Words/Grammar Needing Review */}
          <Card className="p-4 space-y-3 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5">
            <h5 className="text-xs font-black uppercase text-primary tracking-wider">
              AI Improvement Plan
            </h5>

            <div className="space-y-2 text-xs">
              <div>
                <div className="font-bold text-foreground dark:text-slate-200">
                  Suggestions for Improvement
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Focus on particle differentiations Wa and Ga, and re-listen to lesson 1 auditory
                  examples.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-white/5 mt-2">
                <div>
                  <div className="font-bold text-foreground dark:text-slate-200">
                    Words to Review
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">時間, 曜日, 今日</div>
                </div>
                <div>
                  <div className="font-bold text-foreground dark:text-slate-200">
                    Grammar to Review
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">～てから, ～ながら</div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 mt-2">
                <div className="font-bold text-foreground dark:text-slate-200">
                  Practice Recommendations
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Practice basic N5 listening drills focusing specifically on time duration markers.
                </p>
              </div>
            </div>
          </Card>

          {/* Wrong Answers List */}
          {score.wrongAnswers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground dark:text-white">
                Wrong Answers Breakdown
              </h4>
              <div className="space-y-2.5">
                {score.wrongAnswers.map((wrong, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]"
                  >
                    <div className="text-xs font-bold text-foreground mb-2">
                      Q: {wrong.question}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-[9px] uppercase font-bold text-red-500">
                          Your Answer
                        </div>
                        <div className="font-semibold text-red-400 mt-0.5">{wrong.userAnswer}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-green-500">
                          Correct Answer
                        </div>
                        <div className="font-semibold text-green-400 mt-0.5">
                          {wrong.correctAnswer}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 border-t border-slate-100 dark:border-white/10 pt-4 mt-2">
          <button
            onClick={() => {
              onClose();
              if (onReview) onReview();
            }}
            className="flex-1 py-2.5 rounded-xl bg-primary hover:opacity-95 text-primary-foreground text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <BrainCircuit className="w-3.5 h-3.5" /> Review Mistakes
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
