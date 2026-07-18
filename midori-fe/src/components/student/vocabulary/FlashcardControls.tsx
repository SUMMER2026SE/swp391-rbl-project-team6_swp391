"use client";

import { memo } from "react";
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw } from "lucide-react";

interface FlashcardControlsProps {
  currentIndex: number;
  totalCards: number;
  onPrevious: () => void;
  onNext: () => void;
  onShuffle: () => void;
  onRestart: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export const FlashcardControls = memo(function FlashcardControls({
  currentIndex,
  totalCards,
  onPrevious,
  onNext,
  onShuffle,
  onRestart,
  canGoPrevious,
  canGoNext,
}: FlashcardControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Navigation */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-hero text-white font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onShuffle}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
          title="Shuffle cards"
        >
          <Shuffle className="w-4 h-4" />
          Shuffle
        </button>
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
          title="Restart from beginning"
        >
          <RotateCcw className="w-4 h-4" />
          Restart
        </button>
      </div>
    </div>
  );
});
