"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  X,
  Volume2,
  FlipHorizontal,
  Shuffle,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Star,
  BookmarkCheck,
  Loader2,
} from "lucide-react";

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle?: string;
  initialWords?: {
    id: string;
    japanese: string;
    reading: string;
    meaning: string;
    example?: string;
  }[];
}

// Mini mock data if no words provided
const defaultWords = [
  { id: "1", japanese: "食べる", reading: "たべる", meaning: "ăn", example: "日本食を食べる" },
  { id: "2", japanese: "飲む", reading: "のむ", meaning: "uống", example: "水を飲む" },
  { id: "3", japanese: "行く", reading: "いく", meaning: "đi", example: "学校に行く" },
  { id: "4", japanese: "来る", reading: "くる", meaning: "đến", example: "友達が来る" },
  { id: "5", japanese: "見る", reading: "みる", meaning: "xem", example: "映画を見る" },
  { id: "6", japanese: "聞く", reading: "きく", meaning: "nghe", example: "音楽を聞く" },
  { id: "7", japanese: "読む", reading: "よむ", meaning: "đọc", example: "本を読む" },
  { id: "8", japanese: "書く", reading: "かく", meaning: "viết", example: "手紙を書く" },
  { id: "9", japanese: "話す", reading: "はなす", meaning: "nói", example: "日本語を話す" },
  { id: "10", japanese: "寝る", reading: "ねる", meaning: "ngủ", example: "早く寝る" },
];

export function QuizletFlashcardModal({
  isOpen,
  onClose,
  lessonTitle = "Vocabulary Review",
  initialWords,
}: FlashcardModalProps) {
  const words = initialWords && initialWords.length > 0 ? initialWords : defaultWords;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedIds, setStudiedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setStudiedIds(new Set());
    }
  }, [isOpen]);

  const current = words[currentIndex];
  const progress = words.length > 0 ? (currentIndex / words.length) * 100 : 0;

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setStudiedIds((prev) => new Set(prev).add(current.id));
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      // Completed all cards
      setStudiedIds((prev) => new Set(prev).add(current.id));
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudiedIds(new Set());
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudiedIds(new Set());
  };

  const speakWord = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-base">Flashcards</h2>
                <p className="text-xs text-muted-foreground">{lessonTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700">
            <motion.div
              className="h-full bg-gradient-hero rounded-r-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Card */}
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {currentIndex + 1} / {words.length}
              </span>
              <span>{studiedIds.size} studied</span>
            </div>

            {/* Flashcard */}
            <motion.div
              onClick={handleFlip}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative h-64 cursor-pointer mb-6"
            >
              <div
                className={`absolute inset-0 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg overflow-hidden ${
                  isFlipped ? "opacity-0" : "opacity-100"
                } transition-opacity duration-200`}
              >
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <span className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
                    {current.japanese}
                  </span>
                  <span className="text-lg text-muted-foreground mb-6">{current.reading}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord(current.japanese);
                      }}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFlipped(true);
                      }}
                      className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                    >
                      Show Answer
                    </button>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 text-xs text-muted-foreground flex items-center gap-1">
                  <FlipHorizontal className="w-3 h-3" />
                  Click to flip
                </div>
              </div>

              <div
                className={`absolute inset-0 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10 shadow-lg overflow-hidden ${
                  isFlipped ? "opacity-100" : "opacity-0"
                } transition-opacity duration-200`}
              >
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <span className="text-3xl font-bold text-primary mb-2">{current.meaning}</span>
                  {current.example && (
                    <p className="text-sm text-muted-foreground mb-4">{current.example}</p>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFlipped(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                  >
                    Show Question
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleShuffle}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="Shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 rounded-xl bg-gradient-hero text-white hover:opacity-90 transition-opacity font-medium shadow-md"
                >
                  {currentIndex === words.length - 1 ? "Finish" : "Next"}
                </button>
              </div>
            </div>

            {/* Completion State */}
            {studiedIds.size === words.length && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-center"
              >
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-bold text-green-700 dark:text-green-300">
                  Great job! You completed all {words.length} cards!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Keep practicing to memorize these words
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
