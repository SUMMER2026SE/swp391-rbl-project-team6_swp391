"use client";

import { memo } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashcardToolbarProps {
  onlySaved: boolean;
  onToggleOnlySaved: () => void;
  savedCount: number;
  totalCount: number;
  isLoading?: boolean;
}

export const FlashcardToolbar = memo(function FlashcardToolbar({
  onlySaved,
  onToggleOnlySaved,
  savedCount,
  totalCount,
  isLoading = false,
}: FlashcardToolbarProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <label className={cn(
        "flex items-center gap-3 cursor-pointer group",
        isLoading && "opacity-50 pointer-events-none"
      )}>
        <div
          onClick={onToggleOnlySaved}
          className={cn(
            "relative w-12 h-6 rounded-full transition-colors",
            onlySaved ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"
          )}
        >
          <div
            className={cn(
              "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
              onlySaved ? "translate-x-7" : "translate-x-1"
            )}
          />
        </div>
        <div className="flex items-center gap-2">
          <Star className={cn("w-4 h-4", onlySaved ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
          <span className={cn(
            "text-sm font-medium transition-colors",
            onlySaved ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"
          )}>
            Only Saved Words
          </span>
          {savedCount > 0 && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              onlySaved 
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            )}>
              {savedCount}/{totalCount}
            </span>
          )}
        </div>
      </label>
    </div>
  );
});
