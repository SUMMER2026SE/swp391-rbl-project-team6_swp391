import React from "react";
import { ArrowUp, ArrowDown, Copy, Trash2, Sparkles, Loader2 } from "lucide-react";

interface QuestionToolbarProps {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReAnalyze: () => void;
  isReAnalyzing: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const QuestionToolbar: React.FC<QuestionToolbarProps> = React.memo(
  ({
    onMoveUp,
    onMoveDown,
    onDuplicate,
    onDelete,
    onReAnalyze,
    isReAnalyzing,
    canMoveUp,
    canMoveDown,
  }) => {
    return (
      <div className="flex items-center gap-1.5 bg-[var(--accent)] border border-[var(--border)] rounded-lg p-1">
        {onMoveUp && (
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1.5 rounded hover:bg-[var(--border)] text-secondary-col hover:text-primary-col disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Move Up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
        {onMoveDown && (
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1.5 rounded hover:bg-[var(--border)] text-secondary-col hover:text-primary-col disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Move Down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}
        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />
        <button
          onClick={undefined}
          disabled={true}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-muted-foreground transition font-semibold text-xs opacity-50 cursor-not-allowed"
          title="Re-analyze Question text using AI (Coming Soon)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Re-analyze (Coming Soon)</span>
        </button>
        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />
        <button
          onClick={onDuplicate}
          className="p-1.5 rounded hover:bg-[var(--border)] text-secondary-col hover:text-primary-col transition"
          title="Duplicate Question"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-500/10 text-red-500 hover:text-red-600 transition"
          title="Delete Question"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  },
);

QuestionToolbar.displayName = "QuestionToolbar";
