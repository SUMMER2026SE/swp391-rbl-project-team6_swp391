"use client";

import { useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, BookOpen, Layers } from "lucide-react";
import { VocabularyList } from "./VocabularyList";
import { FlashcardView } from "./FlashcardView";
import { useVocabularyFavorites } from "@/hooks/useVocabularyFavorites";
import { studentVocabularyApi } from "@/lib/api/vocabulary";
import type { VocabularyWord } from "./VocabularyCard";

type TabType = "list" | "flashcards";

const levelColors: Record<string, string> = {
  N5: "bg-blue-500/20 text-blue-400 border-blue-400/30",
  N4: "bg-green-500/20 text-green-400 border-green-400/30",
  N3: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  N2: "bg-orange-500/20 text-orange-400 border-orange-400/30",
  N1: "bg-red-500/20 text-red-400 border-red-400/30",
};

export interface VocabularyLessonPageProps {
  lessonId: string;
}

export function VocabularyLessonPage({ lessonId }: VocabularyLessonPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("list");

  // Fetch lesson details
  const { data: lesson, isLoading, isError, error } = useQuery({
    queryKey: ["student-vocabulary-lesson", lessonId],
    queryFn: () => studentVocabularyApi.getVocabularyLesson(lessonId),
    enabled: !!lessonId,
  });

  // Use vocabulary favorites hook (API-based)
  const {
    favoriteIds,
    isLoading: isLoadingFavorites,
    isToggling,
    toggleFavorite,
  } = useVocabularyFavorites({ lessonId });

  // Transform API response to component format
  const words: VocabularyWord[] = lesson?.items
    ? [...lesson.items]
        .sort((a, b) => a.itemOrder - b.itemOrder)
        .map((item) => ({
          id: item.id,
          itemOrder: item.itemOrder,
          word: item.japanese,
          furigana: item.furigana ?? null,
          romaji: item.romaji ?? null,
          meaning: item.meaning,
          example: item.exampleSentence ?? null,
          exampleMeaning: item.exampleTranslation ?? null,
          partOfSpeech: item.partOfSpeech ?? null,
        }))
    : [];

  const handleToggleFavorite = useCallback(
    async (wordId: string) => {
      await toggleFavorite(wordId);
    },
    [toggleFavorite]
  );

  const handleSpeak = useCallback((_text: string) => {
    // Speech synthesis is handled in child components
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  if (isError || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Failed to load lesson</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Link
            to="/student/vocabulary"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-semibold hover:opacity-90 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Vocabulary
          </Link>
        </div>
      </div>
    );
  }

  const lessonLevel = lesson.jlptLevel ?? "N5";
  const lessonTitle = lesson.title ?? "Vocabulary Lesson";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Back button and title */}
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/student/vocabulary"
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-sm ${levelColors[lessonLevel] ?? levelColors.N5}`}
                >
                  JLPT {lessonLevel}
                </span>
              </div>
              <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white truncate">
                {lessonTitle}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Layers className="w-4 h-4" />
              <span>{words.length} words</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "list"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Vocabulary List
            </button>
            <button
              onClick={() => setActiveTab("flashcards")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "flashcards"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              Flashcards
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {words.length > 0 ? (
                <VocabularyList
                  words={words}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  onSpeak={handleSpeak}
                  isLoadingFavorites={isLoadingFavorites}
                  isToggling={isToggling}
                />
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-muted-foreground">No vocabulary words in this lesson.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <FlashcardView
                words={words}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                onSpeak={handleSpeak}
                isLoadingFavorites={isLoadingFavorites}
                isToggling={isToggling}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
