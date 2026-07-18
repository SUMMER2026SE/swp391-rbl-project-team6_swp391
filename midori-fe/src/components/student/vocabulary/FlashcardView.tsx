"use client";

import { memo, useState, useEffect, useMemo, useCallback } from "react";
import { Flashcard } from "./Flashcard";
import { FlashcardControls } from "./FlashcardControls";
import { FlashcardToolbar } from "./FlashcardToolbar";
import { ProgressBar } from "./ProgressBar";
import type { VocabularyWord } from "./VocabularyCard";

interface FlashcardViewProps {
  words: VocabularyWord[];
  favoriteIds: string[];
  onToggleFavorite: (wordId: string) => void;
  onSpeak: (text: string) => void;
  isLoadingFavorites?: boolean;
  isToggling?: boolean;
}

export const FlashcardView = memo(function FlashcardView({
  words,
  favoriteIds,
  onToggleFavorite,
  onSpeak,
  isLoadingFavorites = false,
  isToggling = false,
}: FlashcardViewProps) {
  const [onlySaved, setOnlySaved] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledWords, setShuffledWords] = useState<VocabularyWord[]>(words);
  const [isShuffled, setIsShuffled] = useState(false);

  // Reset when words change
  useEffect(() => {
    setShuffledWords(words);
    setCurrentIndex(0);
    setIsShuffled(false);
  }, [words]);

  // Filter words based on onlySaved toggle
  const displayWords = useMemo(() => {
    if (!onlySaved) return shuffledWords;
    return shuffledWords.filter((word) => favoriteIds.includes(word.id));
  }, [shuffledWords, onlySaved, favoriteIds]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [onlySaved]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(displayWords.length - 1, prev + 1));
  }, [displayWords.length]);

  const handleShuffle = useCallback(() => {
    const shuffled = [...displayWords].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setCurrentIndex(0);
    setIsShuffled(true);
  }, [displayWords]);

  const handleRestart = useCallback(() => {
    setShuffledWords(words);
    setCurrentIndex(0);
    setIsShuffled(false);
  }, [words]);

  const handleToggleOnlySaved = useCallback(() => {
    setOnlySaved((prev) => !prev);
  }, []);

  const savedCount = favoriteIds.length;
  const currentWord = displayWords[currentIndex];

  if (displayWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          {onlySaved ? "No saved words yet" : "No flashcards available"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          {onlySaved
            ? "Save words by tapping the star icon on vocabulary cards or flashcards."
            : "This lesson doesn't have any vocabulary words to study."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <FlashcardToolbar
        onlySaved={onlySaved}
        onToggleOnlySaved={handleToggleOnlySaved}
        savedCount={savedCount}
        totalCount={words.length}
        isLoading={isLoadingFavorites}
      />

      {/* Progress */}
      <ProgressBar current={currentIndex + 1} total={displayWords.length} />

      {/* Flashcard */}
      <div className="py-4">
        {currentWord && (
          <Flashcard
            key={currentWord.id}
            word={currentWord}
            isFavorite={favoriteIds.includes(currentWord.id)}
            onToggleFavorite={onToggleFavorite}
            onSpeak={onSpeak}
            isToggling={isToggling && favoriteIds.includes(currentWord.id)}
          />
        )}
      </div>

      {/* Controls */}
      <FlashcardControls
        currentIndex={currentIndex}
        totalCards={displayWords.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onShuffle={handleShuffle}
        onRestart={handleRestart}
        canGoPrevious={currentIndex > 0}
        canGoNext={currentIndex < displayWords.length - 1}
      />

      {/* Keyboard shortcuts hint */}
      <div className="hidden sm:flex items-center justify-center gap-6 text-xs text-slate-400">
        <span>← → Navigate</span>
        <span>Space Flip</span>
        <span>Enter Pronounce</span>
      </div>
    </div>
  );
});
