"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Volume2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VocabularyWord {
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

interface VocabularyCardProps {
  word: VocabularyWord;
  isFavorite: boolean;
  onToggleFavorite: (wordId: string) => void;
  onSpeak: (text: string) => void;
  isLoading?: boolean;
  isToggling?: boolean;
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

function VocabularyCardComponent({
  word,
  isFavorite,
  onToggleFavorite,
  onSpeak,
  isLoading = false,
  isToggling = false,
}: VocabularyCardProps) {
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isLoading ? 0.5 : 1, y: 0 }}
      whileHover={{ scale: isLoading ? 1 : 1.01 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
            {word.itemOrder}
          </div>
          {word.partOfSpeech && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium">
              {word.partOfSpeech}
            </span>
          )}
        </div>
        <button
          onClick={handleToggleFavorite}
          disabled={isToggling}
          className={cn(
            "p-2 rounded-xl transition-all",
            isToggling && "animate-pulse",
            isFavorite
              ? "text-amber-500 hover:text-amber-600"
              : "text-slate-300 dark:text-slate-600 hover:text-amber-500"
          )}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            className={cn(
              "w-5 h-5 transition-all",
              isFavorite && "fill-amber-500"
            )}
          />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3
              className="text-2xl font-bold text-slate-900 dark:text-white"
              style={{ fontFamily: "var(--font-japanese, serif)" }}
            >
              {word.word}
            </h3>
            {(word.furigana || word.romaji) && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {word.furigana || word.romaji}
              </p>
            )}
          </div>
          <button
            onClick={handleSpeak}
            className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all"
            aria-label="Listen to pronunciation"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Meaning
        </p>
        <p className="text-base font-semibold text-slate-900 dark:text-white">
          {word.meaning}
        </p>
      </div>

      {word.example && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Example
          </p>
          <div className="space-y-1">
            <p
              className="text-sm font-medium text-slate-800 dark:text-slate-200"
              style={{ fontFamily: "var(--font-japanese, serif)" }}
            >
              {word.example}
            </p>
            {word.exampleMeaning && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {word.exampleMeaning}
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export const VocabularyCard = memo(VocabularyCardComponent);
