"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { BookOpenText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrammarContentResponse, GrammarExampleResponse } from "@/lib/api/grammarContent";

interface GrammarPointViewProps {
  content: GrammarContentResponse;
  className?: string;
}

export const GrammarPointView = memo(function GrammarPointView({
  content,
  className,
}: GrammarPointViewProps) {
  const hasExamples = content.examples && content.examples.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card rounded-xl border border-border/50 p-5 shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-lavender/20 px-2.5 py-1 text-xs font-semibold text-lavender">
            <BookOpenText className="h-3.5 w-3.5" />
            Grammar {content.contentOrder}
          </div>
        </div>
        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          #{content.contentOrder}
        </span>
      </div>

      {/* Pattern Section */}
      {content.pattern && (
        <section className="mb-5 rounded-xl bg-lavender/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-lavender">
            Pattern
          </div>
          <p
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-japanese, serif)" }}
          >
            {content.pattern}
          </p>
        </section>
      )}

      {/* Meaning & Structure Grid */}
      <div className="grid gap-4 md:grid-cols-2 mb-5">
        {content.meaning && (
          <section className="rounded-xl border border-border/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Meaning
            </div>
            <p className="text-sm leading-6 text-foreground">{content.meaning}</p>
          </section>
        )}
        {content.structure && (
          <section className="rounded-xl border border-border/40 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Structure
            </div>
            <p className="text-sm leading-6 text-foreground">{content.structure}</p>
          </section>
        )}
      </div>

      {/* Usage & Explanation */}
      {content.usage && (
        <section className="mb-5 rounded-xl border border-border/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Usage & Explanation
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
            {content.usage}
          </p>
        </section>
      )}

      {/* Examples */}
      {hasExamples && (
        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Examples
          </h4>
          <div className="space-y-2">
            {content.examples.map((example) => (
              <ExampleItem key={example.id} example={example} />
            ))}
          </div>
        </section>
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
