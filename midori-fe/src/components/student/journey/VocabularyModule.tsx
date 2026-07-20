"use client";

import { useState, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Layers,
  Star,
  AlertCircle,
  Shuffle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  studentVocabularyApi,
  type VocabularyItemResponse,
} from "@/lib/api/vocabulary";
import { useVocabularyFavorites } from "@/hooks/useVocabularyFavorites";
import { useQuery } from "@tanstack/react-query";

type TabType = "list" | "flashcards";

export interface VocabularyItem {
  id: string;
  itemOrder: number;
  word: string;
  furigana: string | null;
  romaji: string | null;
  meaning: string;
  example: string | null;
  exampleMeaning: string | null;
  partOfSpeech: string | null;
}

interface VocabularyModuleProps {
  lessonId: string;
}

export function VocabularyModule({ lessonId }: VocabularyModuleProps) {
  const [activeTab, setActiveTab] = useState<TabType>("list");

  const {
    data: vocabularyLessons,
    isLoading: lessonsLoading,
    isError: lessonsError,
    error: lessonsErrorObj,
  } = useQuery({
    queryKey: ["student-vocabulary-lessons"],
    queryFn: () => studentVocabularyApi.getVocabularyLessons(),
    staleTime: 5 * 60 * 1000,
  });

  const matchedLesson =
    vocabularyLessons?.find((vocabularyLesson) => vocabularyLesson.lessonId === lessonId) ?? null;
  const vocabularyLessonId = matchedLesson?.id ?? null;

  const {
    data: vocabularyDetail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrorObj,
  } = useQuery({
    queryKey: ["student-vocabulary", vocabularyLessonId],
    queryFn: () => studentVocabularyApi.getVocabularyLesson(vocabularyLessonId!),
    enabled: !!vocabularyLessonId,
    staleTime: 5 * 60 * 1000,
  });

  const {
    favoriteIds,
    isLoading: isLoadingFavorites,
    isToggling,
    toggleFavorite,
  } = useVocabularyFavorites({ lessonId: vocabularyLessonId ?? undefined });

  const vocabulary = useMemo(
    () =>
      [...(vocabularyDetail?.items ?? [])]
        .sort((a, b) => a.itemOrder - b.itemOrder)
        .map((item: VocabularyItemResponse): VocabularyItem => ({
          id: item.id,
          itemOrder: item.itemOrder,
          word: item.japanese,
          furigana: item.furigana ?? null,
          romaji: item.romaji ?? null,
          meaning: item.meaning,
          example: item.exampleSentence ?? null,
          exampleMeaning: item.exampleTranslation ?? null,
          partOfSpeech: item.partOfSpeech ?? null,
        })),
    [vocabularyDetail],
  );

  const isLoading = lessonsLoading || detailLoading;
  const isError = lessonsError || detailError;
  const error = lessonsErrorObj ?? detailErrorObj;
  const errorMessage =
    error instanceof Error
      ? error.message
      : "Failed to load vocabulary lesson.";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[240px] text-sm text-muted-foreground">
        Loading vocabulary lesson...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center min-h-[240px]">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm text-foreground">Failed to load vocabulary lesson</p>
        <p className="text-xs text-red-500">{errorMessage}</p>
      </div>
    );
  }

  if (vocabulary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center min-h-[240px]">
        <BookOpen className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-foreground">No vocabulary items available</p>
        <p className="text-xs text-muted-foreground">
          This lesson does not have any vocabulary content yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-muted rounded-lg p-1">
        <button
          onClick={() => setActiveTab("list")}
          className={cn(
            "flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
            activeTab === "list"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Vocabulary List
        </button>
        <button
          onClick={() => setActiveTab("flashcards")}
          className={cn(
            "flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
            activeTab === "flashcards"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          Flashcards
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "list" ? (
          <VocabularyListTab
            key="list"
            vocabulary={vocabulary}
            favoriteIds={favoriteIds}
            isLoadingFavorites={isLoadingFavorites}
            isToggling={isToggling}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <FlashcardsTab
            key="flashcards"
            vocabulary={vocabulary}
            favoriteIds={favoriteIds}
            isLoadingFavorites={isLoadingFavorites}
            isToggling={isToggling}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface VocabularyListTabProps {
  vocabulary: VocabularyItem[];
  favoriteIds: string[];
  isLoadingFavorites: boolean;
  isToggling: boolean;
  onToggleFavorite: (wordId: string) => Promise<void>;
}

interface VocabularyCardProps {
  word: VocabularyItem;
  isFavorite: boolean;
  isToggling: boolean;
  onToggleFavorite: (wordId: string) => Promise<void>;
}

function VocabularyCard({
  word,
  isFavorite,
  isToggling,
  onToggleFavorite,
}: VocabularyCardProps) {
  const [showExample, setShowExample] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border/60 p-4 hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-200 flex flex-col justify-between relative group"
    >
      <div>
        {/* Top Header Row: Order & Part of Speech & Favorite Star */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-[10px] font-black tracking-wide border border-border/30">
              {word.itemOrder.toString().padStart(2, "0")}
            </span>
            {word.partOfSpeech && (
              <span className="px-1.5 py-0.5 rounded-md bg-primary/5 text-primary text-[9px] font-bold uppercase tracking-wider">
                {word.partOfSpeech}
              </span>
            )}
          </div>
          <button
            onClick={() => onToggleFavorite(word.id)}
            disabled={isToggling}
            className={cn(
              "p-1 rounded-lg transition-all duration-205 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-95",
              isToggling && "animate-pulse",
              isFavorite
                ? "text-amber-500"
                : "text-slate-300 dark:text-slate-650 hover:text-slate-450 dark:hover:text-slate-400"
            )}
          >
            <Star className={cn("w-4 h-4 transition-transform duration-200 group-hover:scale-105", isFavorite && "fill-amber-400 text-amber-500")} />
          </button>
        </div>

        {/* Word Display Section */}
        <div className="mb-2">
          <h3
            className="text-xl font-bold text-slate-850 dark:text-slate-50 tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-japanese, serif)" }}
          >
            {word.word}
          </h3>
          {(word.furigana || word.romaji) && (
            <p 
              className="text-xs text-slate-550 dark:text-slate-400 font-medium mt-0.5 tracking-wide"
              style={{ fontFamily: "var(--font-japanese, serif)" }}
            >
              {word.furigana || word.romaji}
            </p>
          )}
        </div>

        {/* Meaning Section */}
        <div className="mb-2.5">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
            {word.meaning}
          </p>
        </div>
      </div>

      {/* Example Collapsible Section */}
      {word.example && (
        <div className="mt-2.5 pt-2.5 border-t border-border/50">
          <button
            onClick={() => setShowExample(!showExample)}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-wider transition-colors duration-150 focus:outline-none cursor-pointer"
          >
            <ChevronRight className={cn("w-3 h-3 transition-transform duration-200", showExample && "rotate-90")} />
            <span>{showExample ? "Hide Example" : "Show Example"}</span>
          </button>

          <AnimatePresence initial={false}>
            {showExample && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden mt-2 space-y-1 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg p-2 border border-border/30"
              >
                <p
                  className="text-xs font-semibold text-slate-850 dark:text-slate-200 leading-normal"
                  style={{ fontFamily: "var(--font-japanese, serif)" }}
                >
                  {word.example}
                </p>
                {word.exampleMeaning && (
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal">
                    {word.exampleMeaning}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

const VocabularyListTab = memo(function VocabularyListTab({
  vocabulary,
  favoriteIds,
  isLoadingFavorites,
  isToggling,
  onToggleFavorite,
}: VocabularyListTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-3"
    >
      {vocabulary.map((word) => {
        const isFavorite = favoriteIds.includes(word.id);
        return (
          <VocabularyCard
            key={word.id}
            word={word}
            isFavorite={isFavorite}
            isToggling={isToggling}
            onToggleFavorite={onToggleFavorite}
          />
        );
      })}
    </motion.div>
  );
});

VocabularyListTab.displayName = "VocabularyListTab";

interface FlashcardsTabProps {
  vocabulary: VocabularyItem[];
  favoriteIds: string[];
  isLoadingFavorites: boolean;
  isToggling: boolean;
  onToggleFavorite: (wordId: string) => Promise<void>;
}

const FlashcardsTab = memo(function FlashcardsTab({
  vocabulary,
  favoriteIds,
  isLoadingFavorites,
  isToggling,
  onToggleFavorite,
}: FlashcardsTabProps) {
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);

  const displayWords = onlySaved
    ? vocabulary.filter((word) => favoriteIds.includes(word.id))
    : vocabulary;

  const savedCount = favoriteIds.length;
  const currentWord = displayWords[cardIndex];

  const handlePrevious = () => {
    if (cardIndex > 0) {
      setCardIndex(cardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (cardIndex < displayWords.length - 1) {
      setCardIndex(cardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    if (displayWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * displayWords.length);
      setCardIndex(randomIndex);
      setIsFlipped(false);
    }
  };

  const handleRestart = () => {
    setCardIndex(0);
    setIsFlipped(false);
  };

  const handleToggleOnlySaved = () => {
    setOnlySaved(!onlySaved);
    setCardIndex(0);
    setIsFlipped(false);
  };

  if (displayWords.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-2">
          {onlySaved ? "No saved words yet" : "No flashcards available"}
        </h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          {onlySaved
            ? "Save words by tapping the star icon on vocabulary cards."
            : "This lesson doesn't have any vocabulary words."}
        </p>
        {onlySaved && (
          <button
            onClick={handleToggleOnlySaved}
            className="mt-4 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            Show All Words
          </button>
        )}
      </div>
    );
  }

  const progress = ((cardIndex + 1) / displayWords.length) * 100;
  const isFavorite = currentWord && favoriteIds.includes(currentWord.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-center">
        <button
          onClick={handleToggleOnlySaved}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            onlySaved
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Star className={cn("w-3.5 h-3.5", onlySaved && "fill-amber-500")} />
          Only Saved Words
          {savedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-[10px] font-bold">
              {savedCount}/{vocabulary.length}
            </span>
          )}
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>
            Card <span className="font-bold text-foreground">{cardIndex + 1}</span> of{" "}
            <span>{displayWords.length}</span>
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-hero rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {currentWord && (
        <div className="flex justify-center">
          <motion.div
            onClick={() => setIsFlipped(!isFlipped)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "w-full max-w-md rounded-xl border p-6 cursor-pointer transition-all min-h-[280px] flex flex-col",
              !isFlipped
                ? "bg-card border-border/50"
                : "bg-gradient-to-br from-primary/95 to-purple-600/95 border-primary/30"
            )}
          >
            <AnimatePresence mode="wait">
              {!isFlipped ? (
                <motion.div
                  key="front"
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 90 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center h-full text-center"
                >
                  <div className="flex items-center justify-between w-full mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Front
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(currentWord.id);
                      }}
                      disabled={isToggling}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isFavorite
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-500"
                          : "bg-primary/10 text-muted-foreground hover:text-amber-500"
                      )}
                    >
                      <Star className={cn("w-3.5 h-3.5", isFavorite && "fill-amber-500")} />
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center">
                    <h2
                      className="text-3xl md:text-4xl font-bold text-foreground mb-2"
                      style={{ fontFamily: "var(--font-japanese, serif)" }}
                    >
                      {currentWord.word}
                    </h2>
                    {(currentWord.furigana || currentWord.romaji) && (
                      <p className="text-base text-muted-foreground">
                        {currentWord.furigana || currentWord.romaji}
                      </p>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-4">
                    Tap to reveal meaning
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="back"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -90 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center h-full text-center text-white"
                >
                  <div className="flex items-center justify-between w-full mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                      Back
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(currentWord.id);
                      }}
                      disabled={isToggling}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isFavorite
                          ? "bg-amber-500 text-white"
                          : "bg-white/20 text-white/60 hover:bg-white/30"
                      )}
                    >
                      <Star className={cn("w-3.5 h-3.5", isFavorite && "fill-white")} />
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                      Meaning
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                      {currentWord.meaning}
                    </h2>
                    {currentWord.example && (
                      <div className="max-w-[90%] mx-auto p-3 bg-white/10 rounded-xl">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1.5">
                          Example
                        </p>
                        <p
                          className="text-sm font-medium text-white mb-1"
                          style={{ fontFamily: "var(--font-japanese, serif)" }}
                        >
                          {currentWord.example}
                        </p>
                        {currentWord.exampleMeaning && (
                          <p className="text-xs text-white/70">
                            {currentWord.exampleMeaning}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      <div className="flex items-center gap-2 max-w-md mx-auto">
        <button
          onClick={handlePrevious}
          disabled={cardIndex === 0}
          className={cn(
            "flex-1 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-sm",
            cardIndex === 0
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-secondary text-foreground hover:bg-muted"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={cardIndex === displayWords.length - 1}
          className={cn(
            "flex-1 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-sm",
            cardIndex === displayWords.length - 1
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-gradient-hero text-white hover:opacity-90"
          )}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handleShuffle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Shuffle
        </button>
        <button
          onClick={handleRestart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart
        </button>
      </div>
    </motion.div>
  );
});

FlashcardsTab.displayName = "FlashcardsTab";
