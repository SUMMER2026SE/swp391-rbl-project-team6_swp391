"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { BookOpenText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrammarContentResponse, GrammarExampleResponse } from "@/lib/api/grammarContent";

interface GrammarPointCardProps {
  content: GrammarContentResponse;
  className?: string;
}

export const GrammarPointCard = memo(function GrammarPointCard({
  content,
  className,
}: GrammarPointCardProps) {
  const hasExamples = content.examples && content.examples.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card rounded-xl border border-border/50 p-4 hover:shadow-md transition-shadow",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-6 h-6 rounded-lg bg-lavender/15 text-lavender flex items-center justify-center text-xs font-bold">
          {content.contentOrder}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-lavender">
          Grammar {content.contentOrder}
        </span>
      </div>

      {/* Pattern Section */}
      {content.pattern && (
        <div className="mb-4 rounded-xl bg-lavender/10 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-lavender mb-2">
            Pattern
          </div>
          <p
            className="text-lg font-semibold text-foreground"
            style={{ fontFamily: "var(--font-japanese, serif)" }}
          >
            {content.pattern}
          </p>
        </div>
      )}

      {/* Meaning & Structure Grid */}
      <div className="grid gap-4 md:grid-cols-2 mb-4">
        {content.meaning && (
          <div className="rounded-xl border border-border/40 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Meaning
            </div>
            <p className="text-sm leading-6 text-foreground">{content.meaning}</p>
          </div>
        )}
        {content.structure && (
          <div className="rounded-xl border border-border/40 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Structure
            </div>
            <p className="text-sm leading-6 text-foreground">{content.structure}</p>
          </div>
        )}
      </div>

      {/* Usage & Explanation */}
      {content.usage && (
        <div className="rounded-xl border border-border/40 p-4 mb-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Usage & Explanation
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
            {content.usage}
          </p>
        </div>
      )}

      {/* Examples */}
      {hasExamples && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Examples
          </div>
          {content.examples.map((example) => (
            <ExampleItem key={example.id} example={example} />
          ))}
        </div>
      )}
    </motion.div>
  );
});

interface ExampleItemProps {
  example: GrammarExampleResponse;
}

function ExampleItem({ example }: ExampleItemProps) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p
        className="text-sm font-medium text-foreground"
        style={{ fontFamily: "var(--font-japanese, serif)" }}
      >
        {example.japanese}
      </p>
      {example.vietnameseMeaning && (
        <p className="mt-1 text-xs text-muted-foreground">{example.vietnameseMeaning}</p>
      )}
    </div>
  );
}
