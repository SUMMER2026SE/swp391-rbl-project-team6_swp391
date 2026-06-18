import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Volume2, Star, VolumeX, ArrowLeft, ArrowRight,
  Shuffle, RotateCcw, Sparkles, Check, Play, Pause,
  Layers, HelpCircle, Eye, EyeOff
} from "lucide-react";

export interface VocabWord {
  word: string;
  furigana: string;
  meaning: string;
  example?: string;
  exampleMeaning?: string;
}

interface QuizletFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIndex: number;
  words: VocabWord[];
  isBookmarked: (word: string) => boolean;
  toggleBookmark: (word: string) => void;
  isLearned: (word: string) => boolean;
  toggleLearned: (word: string) => void;
  isMastered: (word: string) => boolean;
  toggleMastered: (word: string) => void;
}

function speakJapanese(text: string) {
  if (!text?.trim()) return;
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.8;
  window.speechSynthesis.speak(utterance);
}

export function QuizletFlashcardModal({
  isOpen,
  onClose,
  initialIndex,
  words: initialWords,
  isBookmarked,
  toggleBookmark,
  isLearned,
  toggleLearned,
  isMastered,
  toggleMastered,
}: QuizletFlashcardModalProps) {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [autoplayAudio, setAutoplayAudio] = useState(false);
  const [showFurigana, setShowFurigana] = useState(true);
  const [termFirst, setTermFirst] = useState(true); // true: Japanese first, false: Definition first

  // Interactive sorting piles for this session
  const [stillLearning, setStillLearning] = useState<string[]>([]);
  const [know, setKnow] = useState<string[]>([]);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  // Initialize and sync words
  useEffect(() => {
    if (isOpen) {
      setWords(initialWords);
      setCurrentIdx(Math.min(initialIndex, initialWords.length - 1));
      setFlipped(false);
      setStillLearning([]);
      setKnow([]);
      setSwipeDirection(null);
    }
  }, [isOpen, initialWords, initialIndex]);

  const activeWord = words[currentIdx];

  // Auto-speak on card change or flip (if enabled)
  useEffect(() => {
    if (isOpen && activeWord && autoplayAudio) {
      const showFront = !flipped;
      // If termFirst is true, pronounce when showing front. If termFirst is false, pronounce when showing back (or vice versa)
      const shouldSpeak = termFirst ? showFront : flipped;
      if (shouldSpeak) {
        speakJapanese(activeWord.furigana || activeWord.word);
      }
    }
  }, [currentIdx, flipped, autoplayAudio, activeWord, termFirst, isOpen]);

  // Handle classification
  const handleSort = useCallback((type: "still" | "know") => {
    if (!activeWord) return;

    // Save swipe direction for animation
    setSwipeDirection(type === "still" ? "left" : "right");

    // Perform state changes after animation completes
    setTimeout(() => {
      if (type === "still") {
        if (!stillLearning.includes(activeWord.word)) {
          setStillLearning((prev) => [...prev, activeWord.word]);
        }
        setKnow((prev) => prev.filter((w) => w !== activeWord.word));
        // Toggle learned status to false (still learning)
        if (isMastered(activeWord.word)) {
          toggleMastered(activeWord.word);
        }
        if (!isLearned(activeWord.word)) {
          toggleLearned(activeWord.word);
        }
      } else {
        if (!know.includes(activeWord.word)) {
          setKnow((prev) => [...prev, activeWord.word]);
        }
        setStillLearning((prev) => prev.filter((w) => w !== activeWord.word));
        // Toggle mastered status to true (know)
        if (!isMastered(activeWord.word)) {
          toggleMastered(activeWord.word);
        }
      }

      setSwipeDirection(null);
      setFlipped(false);
      if (currentIdx < words.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        // Finished all cards in set
        setCurrentIdx(words.length); // trigger end screen
      }
    }, 250);
  }, [activeWord, currentIdx, words, stillLearning, know, isLearned, isMastered, toggleLearned, toggleMastered]);

  const goNext = useCallback(() => {
    if (currentIdx < words.length - 1) {
      setSwipeDirection("right");
      setTimeout(() => {
        setSwipeDirection(null);
        setFlipped(false);
        setCurrentIdx((prev) => prev + 1);
      }, 200);
    }
  }, [currentIdx, words]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) {
      setSwipeDirection("left");
      setTimeout(() => {
        setSwipeDirection(null);
        setFlipped(false);
        setCurrentIdx((prev) => prev - 1);
      }, 200);
    }
  }, [currentIdx]);

  const toggleFlip = useCallback(() => {
    setFlipped((f) => !f);
  }, []);

  const handleShuffle = useCallback(() => {
    if (words.length <= 1) return;
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIdx(0);
    setFlipped(false);
    setStillLearning([]);
    setKnow([]);
  }, [words]);

  const handleReset = useCallback(() => {
    setCurrentIdx(0);
    setFlipped(false);
    setStillLearning([]);
    setKnow([]);
  }, []);

  const startReviewStillLearning = useCallback(() => {
    const stillLearningWords = words.filter(w => stillLearning.includes(w.word));
    if (stillLearningWords.length > 0) {
      setWords(stillLearningWords);
      setCurrentIdx(0);
      setFlipped(false);
      setStillLearning([]);
      setKnow([]);
    }
  }, [words, stillLearning]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing when input is focused
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          toggleFlip();
          break;
        case "ArrowLeft":
          e.preventDefault();
          // If shift key is pressed or we want to sort, use Left Arrow for "Still learning"
          if (e.shiftKey) {
            handleSort("still");
          } else {
            goPrev();
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) {
            handleSort("know");
          } else {
            goNext();
          }
          break;
        case "ArrowUp":
        case "ArrowDown":
          e.preventDefault();
          toggleFlip();
          break;
        case "KeyV":
        case "Enter":
          e.preventDefault();
          if (activeWord) {
            speakJapanese(activeWord.furigana || activeWord.word);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "KeyA":
          e.preventDefault();
          handleSort("still");
          break;
        case "KeyD":
          e.preventDefault();
          handleSort("know");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeWord, currentIdx, toggleFlip, handleSort, goPrev, goNext, onClose]);

  if (!isOpen) return null;

  const isFinished = currentIdx >= words.length && words.length > 0;
  const progressPercent = words.length > 0 ? Math.round((Math.min(currentIdx, words.length) / words.length) * 100) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-900/90 backdrop-blur-md text-white select-none">
        {/* Style definitions for card flipping */}
        <style>{`
          .perspective-2000 {
            perspective: 2000px;
          }
          .transform-style-3d {
            transform-style: preserve-3d;
          }
          .backface-hidden {
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          }
          .rotate-y-180 {
            transform: rotateY(180deg);
          }
        `}</style>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-pink-400 to-amber-300">
              MIDORI FLASHCARDS
            </span>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">
              <span className="font-bold text-white">Shift + ←</span> Still Learning · <span className="font-bold text-white">Shift + →</span> Know · <span className="font-bold text-white">Space</span> Flip
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShuffle}
              disabled={isFinished}
              title="Shuffle Cards"
              className="p-2 rounded-xl hover:bg-white/10 transition text-white/80 hover:text-white disabled:opacity-30"
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <button
              onClick={handleReset}
              title="Reset Progress"
              className="p-2 rounded-xl hover:bg-white/10 transition text-white/80 hover:text-white"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 transition text-white/80 hover:text-white ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Main Workspace ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-4xl w-full mx-auto py-6">
          {!isFinished ? (
            activeWord && (
              <div className="w-full flex flex-col gap-6 items-center">
                {/* Progress bar */}
                <div className="w-full max-w-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/60 font-semibold px-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-orange-400">
                        Still Learning: <span className="font-black text-white">{stillLearning.length}</span>
                      </span>
                      <span className="text-white/20">|</span>
                      <span className="flex items-center gap-1 text-green-400">
                        Know: <span className="font-black text-white">{know.length}</span>
                      </span>
                    </div>
                    <span>
                      Card <span className="font-bold text-white">{currentIdx + 1}</span> of{" "}
                      <span className="text-white/50">{words.length}</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-pink-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* 3D Flip Card */}
                <div className="relative w-full max-w-2xl min-h-[380px] perspective-2000 mt-2">
                  <motion.div
                    key={currentIdx}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      x: swipeDirection === "left" ? -100 : swipeDirection === "right" ? 100 : 0,
                      rotate: swipeDirection === "left" ? -5 : swipeDirection === "right" ? 5 : 0,
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    onClick={toggleFlip}
                    className="absolute inset-0 transform-style-3d transition-transform duration-500 cursor-pointer select-none"
                    style={{
                      transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front Side */}
                    <div className="absolute inset-0 backface-hidden rounded-[2.5rem] bg-slate-800/80 border border-white/10 shadow-2xl p-8 flex flex-col justify-between">
                      {/* Top Action Row */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          {termFirst ? "Term" : "Definition"}
                        </span>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => speakJapanese(activeWord.furigana || activeWord.word)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-white/80 hover:text-white"
                          >
                            <Volume2 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => toggleBookmark(activeWord.word)}
                            className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition ${
                              isBookmarked(activeWord.word) ? "text-amber-400" : "text-white/40 hover:text-white"
                            }`}
                          >
                            <Star className={`w-4.5 h-4.5 ${isBookmarked(activeWord.word) ? "fill-amber-400" : ""}`} />
                          </button>
                        </div>
                      </div>

                      {/* Center Content */}
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                        {termFirst ? (
                          // Japanese Term
                          <div className="space-y-4">
                            <h2
                              className="font-display font-black text-white leading-tight tracking-wide"
                              style={{
                                fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
                                fontFamily: "var(--font-japanese, 'Noto Sans JP', sans-serif)",
                              }}
                            >
                              {activeWord.word}
                            </h2>
                            {showFurigana && activeWord.furigana && (
                              <p className="text-xl text-cyan-400 font-medium tracking-wide">
                                {activeWord.furigana}
                              </p>
                            )}
                          </div>
                        ) : (
                          // Meaning Definition
                          <div className="space-y-3 px-4">
                            <p className="text-2xl sm:text-3xl font-black text-white leading-snug">
                              {activeWord.meaning}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Bottom Hint */}
                      <div className="flex items-center justify-between text-xs text-white/30 border-t border-white/5 pt-4">
                        <span>Click or Space to flip</span>
                        <span>{termFirst ? "Japanese" : "Vietnamese/English"}</span>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div className="absolute inset-0 backface-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-white/10 shadow-2xl p-8 flex flex-col justify-between rotate-y-180">
                      {/* Top Action Row */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          {!termFirst ? "Term" : "Definition"}
                        </span>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => speakJapanese(activeWord.furigana || activeWord.word)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-white/80 hover:text-white"
                          >
                            <Volume2 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => toggleBookmark(activeWord.word)}
                            className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition ${
                              isBookmarked(activeWord.word) ? "text-amber-400" : "text-white/40"
                            }`}
                          >
                            <Star className={`w-4.5 h-4.5 ${isBookmarked(activeWord.word) ? "fill-amber-400" : ""}`} />
                          </button>
                        </div>
                      </div>

                      {/* Center Content */}
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-4 px-2 space-y-5">
                        {!termFirst ? (
                          // Japanese Term (on back)
                          <div className="space-y-2">
                            <h2
                              className="font-display font-black text-white leading-tight tracking-wide"
                              style={{
                                fontSize: "clamp(2.5rem, 8vw, 4rem)",
                                fontFamily: "var(--font-japanese, 'Noto Sans JP', sans-serif)",
                              }}
                            >
                              {activeWord.word}
                            </h2>
                            {showFurigana && activeWord.furigana && (
                              <p className="text-lg text-cyan-400 font-medium">
                                {activeWord.furigana}
                              </p>
                            )}
                          </div>
                        ) : (
                          // Meaning Definition (on back)
                          <div className="space-y-4 max-w-md">
                            <p className="text-2xl sm:text-3xl font-black text-white leading-tight">
                              {activeWord.meaning}
                            </p>

                            {/* Example Sentence Section */}
                            {activeWord.example && (
                              <div className="py-3 px-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                                  Example
                                </span>
                                <p
                                  className="text-white text-base font-semibold leading-relaxed"
                                  style={{ fontFamily: "var(--font-japanese, sans-serif)" }}
                                >
                                  {activeWord.example}
                                </p>
                                {activeWord.exampleMeaning && (
                                  <p className="text-white/60 text-xs leading-relaxed">
                                    {activeWord.exampleMeaning}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom Hint */}
                      <div className="flex items-center justify-between text-xs text-white/30 border-t border-white/5 pt-4">
                        <span>Click or Space to flip</span>
                        <span>{!termFirst ? "Japanese" : "Vietnamese/English"}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* ── Swipe and Sort Controls (Quizlet-style) ── */}
                <div className="flex items-center gap-4 w-full max-w-md mt-2">
                  <button
                    onClick={() => handleSort("still")}
                    className="flex-1 group flex flex-col items-center justify-center py-3.5 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 font-bold transition shadow-lg shadow-red-950/20"
                  >
                    <span className="text-sm">Still Learning</span>
                    <span className="text-[10px] opacity-60 font-medium mt-0.5">Press A or Shift+←</span>
                  </button>

                  <button
                    onClick={() => handleSort("know")}
                    className="flex-1 group flex flex-col items-center justify-center py-3.5 px-4 rounded-2xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 text-green-400 hover:text-green-300 font-bold transition shadow-lg shadow-green-950/20"
                  >
                    <span className="text-sm">Know</span>
                    <span className="text-[10px] opacity-60 font-medium mt-0.5">Press D or Shift+→</span>
                  </button>
                </div>

                {/* Navigation Back / Forth & Options */}
                <div className="flex items-center justify-between w-full max-w-md pt-4 border-t border-white/5 text-xs text-white/50">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goPrev}
                      disabled={currentIdx === 0}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-white/80">{currentIdx + 1} / {words.length}</span>
                    <button
                      onClick={goNext}
                      disabled={currentIdx === words.length - 1}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Auto play audio toggle */}
                    <label className="flex items-center gap-2 cursor-pointer hover:text-white transition">
                      <input
                        type="checkbox"
                        checked={autoplayAudio}
                        onChange={(e) => setAutoplayAudio(e.target.checked)}
                        className="rounded bg-slate-800 border-white/20 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                      />
                      <span>Auto-pronounce</span>
                    </label>

                    {/* Term first / Definition first */}
                    <button
                      onClick={() => setTermFirst(!termFirst)}
                      className="hover:text-white transition font-semibold"
                    >
                      Show: <span className="text-cyan-400">{termFirst ? "Japanese first" : "Definition first"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            // ── Finished Screen ──
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 text-center max-w-md w-full py-8"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 via-pink-500 to-purple-500 flex items-center justify-center shadow-2xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>

              <div>
                <h2 className="text-3xl font-display font-black text-white">Superb! Lesson Complete</h2>
                <p className="text-sm text-white/60 mt-1.5">You've successfully sorted all flashcards in this set.</p>
              </div>

              {/* Progress Summary Piles */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <div className="font-display font-black text-3xl text-orange-400">{stillLearning.length}</div>
                  <div className="text-xs text-white/50 mt-1 font-semibold">Still Learning</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <div className="font-display font-black text-3xl text-green-400">{know.length}</div>
                  <div className="text-xs text-white/50 mt-1 font-semibold">Know (Mastered)</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3.5 w-full">
                {stillLearning.length > 0 && (
                  <button
                    onClick={startReviewStillLearning}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-orange-400 hover:bg-orange-500 text-slate-900 text-sm font-bold transition shadow-lg"
                  >
                    <RotateCcw className="w-4 h-4" /> Review Still Learning ({stillLearning.length})
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-bold transition"
                >
                  <RotateCcw className="w-4 h-4" /> Study all cards again
                </button>
                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-pink-500 text-white text-sm font-bold transition hover:opacity-90 shadow-lg"
                >
                  <X className="w-4 h-4" /> Close study view
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
}
