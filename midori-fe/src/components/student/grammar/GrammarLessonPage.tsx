"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, AlertCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { GrammarLessonHeader } from "./GrammarLessonHeader";
import { GrammarPointView } from "./GrammarPointView";
import { GrammarPointList } from "./GrammarPointList";
import { GrammarNavigation } from "./GrammarNavigation";
import { GrammarEmptyState } from "./GrammarEmptyState";
import { GrammarLoading } from "./GrammarLoading";
import { studentGrammarApi, type GrammarDetailResponse } from "@/lib/api/grammarContent";
import { useQuery } from "@tanstack/react-query";

interface GrammarLessonPageProps {
  lessonId: string;
}

export function GrammarLessonPage({ lessonId }: GrammarLessonPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    data: lesson,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["student-grammar-lesson", lessonId],
    queryFn: () => studentGrammarApi.getGrammarLesson(lessonId),
    enabled: !!lessonId,
  });

  const contents = useMemo(() => {
    if (!lesson) return [];
    return [...lesson.contents].sort((a, b) => a.contentOrder - b.contentOrder);
  }, [lesson]);

  const currentContent = contents[currentIndex] ?? null;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < contents.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <GrammarLoading />
      </div>
    );
  }

  // Error state
  if (isError || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Failed to load lesson</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Link
            to="/student/grammar"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-semibold hover:opacity-90 transition"
          >
            Back to Grammar
          </Link>
        </div>
      </div>
    );
  }

  // Empty state
  if (contents.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <GrammarLessonHeader
          jlptLevel={lesson.jlptLevel}
          title={lesson.title}
          grammarCount={0}
        />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <GrammarEmptyState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <GrammarLessonHeader
        jlptLevel={lesson.jlptLevel}
        title={lesson.title}
        grammarCount={contents.length}
      />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {/* Grammar Point List */}
          {contents.length > 1 && (
            <GrammarPointList
              contents={contents}
              currentIndex={currentIndex}
              onSelect={setCurrentIndex}
            />
          )}

          {/* Grammar Point View */}
          <AnimatePresence mode="wait">
            {currentContent && (
              <motion.div
                key={currentContent.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <GrammarPointView content={currentContent} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {contents.length > 1 && (
            <GrammarNavigation
              currentIndex={currentIndex}
              totalItems={contents.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />
          )}
        </div>
      </div>
    </div>
  );
}
