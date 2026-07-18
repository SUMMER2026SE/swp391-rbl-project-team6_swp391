"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type {
  GrammarDetailResponse,
  GrammarContentResponse,
  GrammarExampleResponse,
} from "@/lib/api/grammarContent";

interface GrammarDetailModalProps {
  open: boolean;
  onClose: () => void;
  lesson: GrammarDetailResponse | null;
  isLoading: boolean;
  isError: boolean;
}

export function GrammarDetailModal({
  open,
  onClose,
  lesson,
  isLoading,
  isError,
}: GrammarDetailModalProps) {
  if (!open) return null;

  const sortedContents = lesson
    ? [...lesson.contents].sort((a, b) => a.contentOrder - b.contentOrder)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-4xl glass-modal rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator shrink-0">
          <div>
            <h2 className="font-display font-bold text-primary-col text-base">
              {lesson?.title ?? "Grammar Lesson Detail"}
            </h2>
            {lesson && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-col">JLPT {lesson.jlptLevel}</span>
                {lesson.difficulty && (
                  <>
                    <span className="text-xs text-muted-col">•</span>
                    <span className="text-xs text-muted-col">{lesson.difficulty}</span>
                  </>
                )}
                {lesson.estimatedMinutes != null && (
                  <>
                    <span className="text-xs text-muted-col">•</span>
                    <span className="text-xs text-muted-col">{lesson.estimatedMinutes} min</span>
                  </>
                )}
                <span className="text-xs text-muted-col">•</span>
                <StatusBadge status={lesson.isActive ? "active" : "inactive"} />
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block w-6 h-6 border-2 border-lavender border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-col">Loading...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-red-500 text-sm">
              Failed to load grammar lesson details.
            </div>
          ) : lesson ? (
            <div className="space-y-6">
              {lesson.description && (
                <div className="glass-card p-4">
                  <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-secondary-col">{lesson.description}</p>
                </div>
              )}

              {/* Grammar Points */}
              {sortedContents.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide">
                    Grammar Points ({sortedContents.length})
                  </h3>
                  {sortedContents.map((content, idx) => (
                    <GrammarPointDisplay
                      key={content.id || idx}
                      content={content}
                      index={idx}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-col text-sm">
                  No grammar points in this lesson yet.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-col text-sm">
              No lesson data available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface GrammarPointDisplayProps {
  content: GrammarContentResponse;
  index: number;
}

function GrammarPointDisplay({ content, index }: GrammarPointDisplayProps) {
  const hasExamples = content.examples && content.examples.length > 0;

  return (
    <div className="glass-card p-4 space-y-3 border-l-4 border-lavender">
      <div className="flex items-start gap-3">
        <span className="w-6 h-6 rounded-md bg-lavender/15 text-lavender text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
          {content.contentOrder}
        </span>
        <div className="flex-1 space-y-3">
          {/* Pattern */}
          {content.pattern && (
            <div className="rounded-lg bg-lavender/10 p-3">
              <p className="text-xs text-lavender font-semibold uppercase tracking-wide mb-1">
                Pattern
              </p>
              <p
                className="text-base font-medium text-primary-col"
                style={{ fontFamily: "var(--font-japanese, serif)" }}
              >
                {content.pattern}
              </p>
            </div>
          )}

          {/* Meaning & Structure */}
          {(content.meaning || content.structure) && (
            <div className="grid grid-cols-2 gap-3">
              {content.meaning && (
                <div>
                  <p className="text-xs text-muted-col mb-1">Meaning</p>
                  <p className="text-sm text-secondary-col">{content.meaning}</p>
                </div>
              )}
              {content.structure && (
                <div>
                  <p className="text-xs text-muted-col mb-1">Structure</p>
                  <p className="text-sm text-secondary-col">{content.structure}</p>
                </div>
              )}
            </div>
          )}

          {/* Usage */}
          {content.usage && (
            <div>
              <p className="text-xs text-muted-col mb-1">Usage & Explanation</p>
              <p className="text-sm text-secondary-col whitespace-pre-wrap">
                {content.usage}
              </p>
            </div>
          )}

          {/* Examples */}
          {hasExamples && (
            <div className="pt-2 border-t border-[var(--border)]">
              <p className="text-xs text-muted-col mb-2">Examples</p>
              <div className="space-y-2">
                {content.examples.map((example: GrammarExampleResponse) => (
                  <div
                    key={example.id}
                    className="rounded-lg bg-muted/50 p-3"
                  >
                    <p
                      className="text-sm font-medium text-primary-col"
                      style={{ fontFamily: "var(--font-japanese, serif)" }}
                    >
                      {example.japanese}
                    </p>
                    {example.vietnameseMeaning && (
                      <p className="mt-1 text-xs text-muted-col">
                        {example.vietnameseMeaning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
