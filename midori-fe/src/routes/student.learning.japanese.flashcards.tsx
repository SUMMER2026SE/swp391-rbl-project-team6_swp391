import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Shuffle,
  RotateCcw,
  CheckCircle2,
  Star,
  Play,
  ArrowLeft,
  ArrowRight,
  Volume1,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import {
  LESSONS,
  HIRAGANA_BASIC,
  KATAKANA_BASIC,
  HIRAGANA_DAKUTEN,
  KATAKANA_DAKUTEN,
  HIRAGANA_COMBINATION,
  KATAKANA_COMBINATION,
  speakJapanese,
  type Lesson,
} from "@/data/japanese-learning-data";

export const Route = createFileRoute("/student/learning/japanese/flashcards")({
  component: FlashcardsPage,
});

type CardSet = "all" | "hiragana-basic" | "katakana-basic" | "hiragana-dakuten" | "katakana-dakuten" | "hiragana-combination" | "katakana-combination";

function getCardSet(id: CardSet) {
  switch (id) {
    case "hiragana-basic":
      return { name: "Hiragana Basic", chars: HIRAGANA_BASIC, color: "from-pink-400 to-rose-500" };
    case "katakana-basic":
      return { name: "Katakana Basic", chars: KATAKANA_BASIC, color: "from-blue-400 to-cyan-500" };
    case "hiragana-dakuten":
      return { name: "Hiragana Dakuten", chars: HIRAGANA_DAKUTEN, color: "from-purple-400 to-violet-500" };
    case "katakana-dakuten":
      return { name: "Katakana Dakuten", chars: KATAKANA_DAKUTEN, color: "from-indigo-400 to-blue-500" };
    case "hiragana-combination":
      return { name: "Hiragana Combinations", chars: HIRAGANA_COMBINATION, color: "from-emerald-400 to-teal-500" };
    case "katakana-combination":
      return { name: "Katakana Combinations", chars: KATAKANA_COMBINATION, color: "from-cyan-400 to-sky-500" };
    default:
      return null;
  }
}

function FlashcardsPage() {
  const [selectedSet, setSelectedSet] = useState<CardSet>("hiragana-basic");
  const [cards, setCards] = useState<{ char: string; romaji: string }[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set());
  const [showSetSelector, setShowSetSelector] = useState(true);

  // Initialize cards when set changes
  useEffect(() => {
    const setData = getCardSet(selectedSet);
    if (setData) {
      setCards([...setData.chars].sort(() => Math.random() - 0.5));
      setCurrentIdx(0);
      setIsFlipped(false);
    }
  }, [selectedSet]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSetSelector) return;
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (currentIdx < cards.length - 1) {
          setCurrentIdx((i) => i + 1);
          setIsFlipped(false);
        }
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (currentIdx > 0) {
          setCurrentIdx((i) => i - 1);
          setIsFlipped(false);
        }
      } else if (e.code === "KeyV" || e.code === "Enter") {
        e.preventDefault();
        if (cards[currentIdx]) {
          speakJapanese(cards[currentIdx].char);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIdx, cards, showSetSelector]);

  const shuffleCards = () => {
    setCards([...cards].sort(() => Math.random() - 0.5));
    setCurrentIdx(0);
    setIsFlipped(false);
  };

  const resetCards = () => {
    const setData = getCardSet(selectedSet);
    if (setData) {
      setCards([...setData.chars].sort(() => Math.random() - 0.5));
      setCurrentIdx(0);
      setIsFlipped(false);
      setStudiedCards(new Set());
    }
  };

  const markAsStudied = () => {
    if (cards[currentIdx]) {
      setStudiedCards((prev) => new Set([...prev, cards[currentIdx].char]));
    }
  };

  const setData = getCardSet(selectedSet);

  if (!setData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Select a character set to study</p>
      </div>
    );
  }

  // Set selector view
  if (showSetSelector) {
    return (
      <div className="min-h-screen">
        <SakuraBg count={15} />
        <div className="relative z-10">
          <div className="w-full max-w-2xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <Link
                to="/student/learning/japanese"
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">Flashcards</h1>
                <p className="text-sm text-slate-500 dark:text-indigo-200/60">Choose a character set</p>
              </div>
            </div>

            {/* Card Set Grid */}
            <div className="grid gap-4">
              {[
                { id: "hiragana-basic" as CardSet, icon: "あ", name: "Hiragana Basic", color: "from-pink-400 to-rose-500", count: HIRAGANA_BASIC.length },
                { id: "katakana-basic" as CardSet, icon: "ア", name: "Katakana Basic", color: "from-blue-400 to-cyan-500", count: KATAKANA_BASIC.length },
                { id: "hiragana-dakuten" as CardSet, icon: "が", name: "Hiragana Dakuten", color: "from-purple-400 to-violet-500", count: HIRAGANA_DAKUTEN.length },
                { id: "katakana-dakuten" as CardSet, icon: "ガ", name: "Katakana Dakuten", color: "from-indigo-400 to-blue-500", count: KATAKANA_DAKUTEN.length },
                { id: "hiragana-combination" as CardSet, icon: "きゃ", name: "Hiragana Combinations", color: "from-emerald-400 to-teal-500", count: HIRAGANA_COMBINATION.length },
                { id: "katakana-combination" as CardSet, icon: "キャ", name: "Katakana Combinations", color: "from-cyan-400 to-sky-500", count: KATAKANA_COMBINATION.length },
              ].map((set) => (
                <motion.button
                  key={set.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    setSelectedSet(set.id);
                    setShowSetSelector(false);
                  }}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl bg-white/80 dark:bg-indigo-950/50 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all text-left",
                    selectedSet === set.id && "ring-2 ring-primary"
                  )}
                >
                  <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl font-bold text-white shadow-lg", set.color)}>
                    {set.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-white">{set.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-indigo-200/60">{set.count} characters</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Flashcard view
  return (
    <div className="min-h-screen">
      <SakuraBg count={15} />
      <div className="relative z-10">
        <div className="w-full max-w-lg mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSetSelector(true)}
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </button>
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-white">{setData.name}</h1>
                <p className="text-xs text-slate-500 dark:text-indigo-200/60">
                  {studiedCards.size} / {cards.length} studied
                </p>
              </div>
            </div>
            <button
              onClick={shuffleCards}
              className="p-2 rounded-xl bg-white/60 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-600 dark:text-indigo-200/80 hover:bg-white/80 transition"
            >
              <Shuffle className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-indigo-200/80">
              Card <span className="font-bold text-slate-800 dark:text-white">{currentIdx + 1}</span> of{" "}
              <span className="text-slate-500">{cards.length}</span>
            </span>
            <span className="text-slate-600 dark:text-indigo-200/80">
              {Math.round(((currentIdx + 1) / cards.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }}
              className={cn("h-full rounded-full", `bg-gradient-to-r ${setData.color}`)}
            />
          </div>

          {/* Flashcard */}
          <div className="relative h-[350px] mb-6">
            <style>{`
              .perspective-1000 { perspective: 1000px; }
              .transform-style-3d { transform-style: preserve-3d; }
              .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
              .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative w-full h-full cursor-pointer"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-3xl bg-white/90 dark:bg-indigo-950/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/20 shadow-2xl flex flex-col items-center justify-center p-6",
                    isFlipped && "invisible"
                  )}
                >
                  <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-indigo-200/60">
                    Character
                  </span>
                  <div
                    className="text-7xl md:text-8xl font-black text-slate-800 dark:text-white select-none"
                    style={{ fontFamily: "var(--font-japanese)" }}
                  >
                    {cards[currentIdx]?.char}
                  </div>
                  <div className="absolute bottom-4 text-xs text-slate-400 dark:text-indigo-200/50">
                    Tap to flip
                  </div>
                </div>

                {/* Back */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-3xl bg-gradient-to-br backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col items-center justify-center p-6",
                    `bg-gradient-to-br ${setData.color}`,
                    !isFlipped && "invisible"
                  )}
                >
                  <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest text-white/60">
                    Romaji
                  </span>
                  <div className="text-5xl font-black text-white">
                    {cards[currentIdx]?.romaji}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakJapanese(cards[currentIdx].char);
                    }}
                    className="mt-6 p-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition"
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-4 text-xs text-white/60">
                    {studiedCards.has(cards[currentIdx]?.char) ? "✓ Studied" : "Tap to mark as studied"}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (currentIdx > 0) {
                  setCurrentIdx((i) => i - 1);
                  setIsFlipped(false);
                }
              }}
              disabled={currentIdx === 0}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white font-bold disabled:opacity-30 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Previous
            </button>
            <button
              onClick={markAsStudied}
              className={cn(
                "p-4 rounded-2xl border transition",
                studiedCards.has(cards[currentIdx]?.char)
                  ? "bg-green-500/20 border-green-500/40 text-green-600"
                  : "bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-600 dark:text-indigo-200/80 hover:bg-green-50"
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (currentIdx < cards.length - 1) {
                  setCurrentIdx((i) => i + 1);
                  setIsFlipped(false);
                }
              }}
              disabled={currentIdx === cards.length - 1}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold disabled:opacity-30 transition"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => speakJapanese(cards[currentIdx]?.char)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/60 dark:bg-white/10 text-slate-600 dark:text-indigo-200/80 hover:bg-slate-200/60 transition text-sm"
            >
              <Volume1 className="w-4 h-4" />
              Listen
            </button>
            <button
              onClick={resetCards}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/60 dark:bg-white/10 text-slate-600 dark:text-indigo-200/80 hover:bg-slate-200/60 transition text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

          {/* Keyboard hints */}
          <div className="hidden sm:flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-indigo-200/50 font-medium mt-6">
            <span>← → Navigate</span>
            <span>Space Flip</span>
            <span>V Pronounce</span>
          </div>
        </div>
      </div>
    </div>
  );
}
