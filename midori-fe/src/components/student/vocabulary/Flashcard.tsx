"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VocabularyWord } from "./VocabularyCard";

interface FlashcardProps {
  word: VocabularyWord;
  isFavorite: boolean;
  onToggleFavorite: (wordId: string) => void;
  onSpeak: (text: string) => void;
}

function speakJapanese(text: string) {
  if (!text?.trim()) return;
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

function FlashcardComponent({
  word,
  isFavorite,
  onToggleFavorite,
  onSpeak,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToSpeak = word.furigana || word.word;
    if (textToSpeak) {
      speakJapanese(textToSpeak);
      onSpeak(textToSpeak);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(word.id);
  };

  return (
    <div className="perspective-1000 w-full max-w-lg mx-auto">
      <motion.div
        onClick={() => setIsFlipped(!isFlipped)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full cursor-pointer"
        style={{ minHeight: "320px" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Front Side */}
        <div
          className={cn(
            "absolute inset-0 rounded-3xl p-6 flex flex-col",
            "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700",
            "shadow-xl backface-hidden"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Front
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeak}
                className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                aria-label="Listen"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggleFavorite}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  isFavorite
                    ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30"
                    : "text-slate-300 dark:text-slate-600 hover:text-amber-500"
                )}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star className={cn("w-4 h-4", isFavorite && "fill-amber-500")} />
              </button>
            </div>
          </div>

          {/* Word */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h2
              className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3"
              style={{ fontFamily: "var(--font-japanese, serif)" }}
            >
              {word.word}
            </h2>
            {(word.furigana || word.romaji) && (
              <p className="text-lg text-slate-500 dark:text-slate-400">
                {word.furigana || word.romaji}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-4">Tap to reveal meaning</p>
          </div>

          {/* Footer */}
          <div className="text-center">
            <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />
          </div>
        </div>

        {/* Back Side */}
        <div
          className={cn(
            "absolute inset-0 rounded-3xl p-6 flex flex-col",
            "bg-gradient-to-br from-primary/95 to-purple-600/95 text-white",
            "shadow-xl backface-hidden rotate-y-180"
          )}
          style={{ transform: "rotateY(180deg)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              Back
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeak}
                className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all"
                aria-label="Listen"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggleFavorite}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  isFavorite ? "bg-amber-500 text-white" : "bg-white/20 text-white/60 hover:bg-white/30"
                )}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star className={cn("w-4 h-4", isFavorite && "fill-white")} />
              </button>
            </div>
          </div>

          {/* Meaning */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Meaning</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {word.meaning}
            </h2>
            {word.example && (
              <div className="mt-4 p-4 bg-white/10 rounded-2xl w-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                  Example
                </p>
                <p
                  className="text-base font-medium text-white mb-1"
                  style={{ fontFamily: "var(--font-japanese, serif)" }}
                >
                  {word.example}
                </p>
                {word.exampleMeaning && (
                  <p className="text-sm text-white/70">{word.exampleMeaning}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center">
            <div className="w-8 h-1 bg-white/30 rounded-full mx-auto" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export const Flashcard = memo(FlashcardComponent);
