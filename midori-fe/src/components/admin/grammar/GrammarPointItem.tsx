"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, GripVertical, Plus, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrammarContentResponse, GrammarExampleRequest } from "@/lib/api/grammarContent";

interface GrammarPointItemProps {
  content: GrammarContentResponse;
  index: number;
  totalItems: number;
  readOnly?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const GrammarPointItem = memo(function GrammarPointItem({
  content,
  index,
  totalItems,
  readOnly = false,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  className,
}: GrammarPointItemProps) {
  const hasExamples = content.examples && content.examples.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "bg-card rounded-xl border border-border/50 p-4 transition-shadow hover:shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-lavender/15 text-lavender flex items-center justify-center text-xs font-bold">
            {index + 1}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-lavender">
            Grammar {index + 1}
          </span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1">
            {onMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                disabled={index === 0}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  index === 0
                    ? "text-muted-foreground/30 cursor-not-allowed"
                    : "text-muted-foreground hover:bg-muted"
                )}
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                disabled={index === totalItems - 1}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  index === totalItems - 1
                    ? "text-muted-foreground/30 cursor-not-allowed"
                    : "text-muted-foreground hover:bg-muted"
                )}
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pattern */}
      {content.pattern && (
        <div className="mb-3 rounded-lg bg-lavender/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-lavender mb-1">
            Pattern
          </p>
          <p
            className="text-base font-semibold text-foreground"
            style={{ fontFamily: "var(--font-japanese, serif)" }}
          >
            {content.pattern}
          </p>
        </div>
      )}

      {/* Meaning & Structure */}
      <div className="grid gap-3 md:grid-cols-2 mb-3">
        {content.meaning && (
          <div className="rounded-lg border border-border/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Meaning
            </p>
            <p className="text-sm text-foreground">{content.meaning}</p>
          </div>
        )}
        {content.structure && (
          <div className="rounded-lg border border-border/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Structure
            </p>
            <p className="text-sm text-foreground">{content.structure}</p>
          </div>
        )}
      </div>

      {/* Usage */}
      {content.usage && (
        <div className="rounded-lg border border-border/40 p-3 mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Usage
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{content.usage}</p>
        </div>
      )}

      {/* Examples count */}
      {hasExamples && (
        <div className="text-xs text-muted-foreground">
          {content.examples.length} example{content.examples.length > 1 ? "s" : ""}
        </div>
      )}
    </motion.div>
  );
});
