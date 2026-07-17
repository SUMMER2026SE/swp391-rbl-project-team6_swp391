"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type GrammarDetailResponse } from "@/lib/api/grammarContent";
import {
  GrammarPointView,
  GrammarPointList,
  GrammarNavigation,
} from "../grammar";

interface GrammarModuleProps {
  /**
   * Pre-fetched grammar lesson details from the Learning Journey.
   * The Journey page already aggregates `GrammarDetailResponse[]` (one entry per
   * matched `GrammarLesson`) and forwards it here, so this component does not
   * re-fetch the list.
   */
  grammar?: GrammarDetailResponse[];
}

type ViewState = "list" | "detail";

function toGrammarLessons(detail: GrammarDetailResponse[]) {
  return detail.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    jlptLevel: d.jlptLevel,
    lessonNumber: d.lessonNumber,
    contentsCount: d.contents?.length ?? 0,
  }));
}

export function GrammarModule({ grammar = [] }: GrammarModuleProps) {
  const [viewState, setViewState] = useState<ViewState>("list");
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);

  const lessons = useMemo(() => toGrammarLessons(grammar), [grammar]);
  const selectedLesson = lessons.find((l) => l.id === selectedLessonId) ?? null;
  const selectedDetail =
    grammar.find((d) => d.id === selectedLessonId) ?? null;

  const contents = useMemo(() => {
    if (!selectedDetail) return [];
    return [...(selectedDetail.contents ?? [])].sort(
      (a, b) => a.contentOrder - b.contentOrder,
    );
  }, [selectedDetail]);

  const currentContent = contents[currentContentIndex] ?? null;

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentContentIndex(0);
    setViewState("detail");
  };

  const handlePrevious = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(currentContentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentContentIndex < contents.length - 1) {
      setCurrentContentIndex(currentContentIndex + 1);
    }
  };

  const handleBackToList = () => {
    setViewState("list");
    setSelectedLessonId(null);
    setCurrentContentIndex(0);
  };

  // Empty state: no grammar lesson matched this Journey lesson
  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <BookOpen className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-foreground">No grammar content available</p>
        <p className="text-xs text-muted-foreground">
          This lesson does not have grammar content yet.
        </p>
      </div>
    );
  }

  // List View
  const ListView = () => (
    <div className="space-y-3">
      {lessons.map((lesson, index) => (
        <motion.button
          key={lesson.id}
          onClick={() => handleSelectLesson(lesson.id)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "w-full text-left rounded-xl p-4 border transition-all duration-200",
            "bg-card border-border/50 hover:border-lavender/30 hover:shadow-md"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-lavender/15 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-lavender">
                {String(lesson.lessonNumber).padStart(2, "0")}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {lesson.title}
                </h3>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {lesson.jlptLevel}
                </span>
                <span>
                  {lesson.contentsCount} grammar point{lesson.contentsCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
          </div>
        </motion.button>
      ))}
    </div>
  );

  // Detail View
  const DetailView = () => {
    if (!selectedDetail || !currentContent) return null;

    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to lessons
        </button>

        {/* Lesson Header */}
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lavender/15 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-lavender" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-foreground">{selectedDetail.title}</h2>
              <p className="text-xs text-muted-foreground">
                {contents.length} grammar point{contents.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Grammar Points List */}
        {contents.length > 1 && (
          <GrammarPointList
            contents={contents}
            currentIndex={currentContentIndex}
            onSelect={setCurrentContentIndex}
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
            currentIndex={currentContentIndex}
            totalItems={contents.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Learning Progress Steps */}
      <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
        <button
          onClick={() => {
            if (viewState !== "list") {
              handleBackToList();
            }
          }}
          disabled={viewState === "list"}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1",
            viewState === "list"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          <BookOpen className="w-3 h-3" />
          Lessons
        </button>

        {selectedLesson && viewState === "detail" && (
          <button
            disabled
            className={cn(
              "flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1",
              "bg-card text-foreground shadow-sm"
            )}
          >
            <BookOpen className="w-3 h-3" />
            <span className="truncate">{selectedLesson.title}</span>
          </button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewState}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {viewState === "list" && <ListView />}
          {viewState === "detail" && <DetailView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
