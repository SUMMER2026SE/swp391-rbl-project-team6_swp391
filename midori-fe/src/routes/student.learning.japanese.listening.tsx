import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Volume2,
  Volume1,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  Headphones,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import {
  HIRAGANA_BASIC,
  KATAKANA_BASIC,
  HIRAGANA_DAKUTEN,
  KATAKANA_DAKUTEN,
  HIRAGANA_COMBINATION,
  KATAKANA_COMBINATION,
  speakJapanese,
} from "@/data/japanese-learning-data";

export const Route = createFileRoute("/student/learning/japanese/listening")({
  component: ListeningPracticePage,
});

type CharacterSet = {
  name: string;
  chars: { char: string; romaji: string }[];
  color: string;
};

const CHARACTER_SETS: { id: string; name: string; data: CharacterSet }[] = [
  { id: "hiragana-basic", name: "Hiragana Basic", data: { name: "Hiragana Basic", chars: HIRAGANA_BASIC, color: "from-pink-400 to-rose-500" } },
  { id: "katakana-basic", name: "Katakana Basic", data: { name: "Katakana Basic", chars: KATAKANA_BASIC, color: "from-blue-400 to-cyan-500" } },
  { id: "hiragana-dakuten", name: "Hiragana Dakuten", data: { name: "Hiragana Dakuten", chars: HIRAGANA_DAKUTEN, color: "from-purple-400 to-violet-500" } },
  { id: "katakana-dakuten", name: "Katakana Dakuten", data: { name: "Katakana Dakuten", chars: KATAKANA_DAKUTEN, color: "from-indigo-400 to-blue-500" } },
  { id: "hiragana-combination", name: "Hiragana Combinations", data: { name: "Hiragana Combinations", chars: HIRAGANA_COMBINATION, color: "from-emerald-400 to-teal-500" } },
  { id: "katakana-combination", name: "Katakana Combinations", data: { name: "Katakana Combinations", chars: KATAKANA_COMBINATION, color: "from-cyan-400 to-sky-500" } },
];

function ListeningPracticePage() {
  const [selectedSetId, setSelectedSetId] = useState("hiragana-basic");
  const [showSetSelector, setShowSetSelector] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPlayed, setTotalPlayed] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [correctStreak, setCorrectStreak] = useState(0);

  const selectedSet = CHARACTER_SETS.find((s) => s.id === selectedSetId)?.data;
  const currentChar = selectedSet?.chars[currentIdx];

  // Generate options when character changes
  useEffect(() => {
    if (selectedSet && currentChar) {
      const wrongOptions = selectedSet.chars
        .filter((c) => c.char !== currentChar.char)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((c) => c.char);

      setOptions([currentChar.char, ...wrongOptions].sort(() => Math.random() - 0.5));
      setSelectedAnswer(null);
      setShowResult(false);
    }
  }, [currentIdx, selectedSetId, selectedSet]);

  const playSound = () => {
    if (!currentChar) return;
    setIsPlaying(true);
    speakJapanese(currentChar.char);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const handleAnswer = (answer: string) => {
    if (showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);
    setTotalPlayed((t) => t + 1);

    if (answer === currentChar?.char) {
      setScore((s) => s + 1);
      setCorrectStreak((s) => s + 1);
    } else {
      setCorrectStreak(0);
    }
  };

  const nextQuestion = () => {
    if (selectedSet && currentIdx < selectedSet.chars.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else if (selectedSet) {
      // Loop back to beginning
      setCurrentIdx(0);
    }
  };

  const replayQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    playSound();
  };

  const resetPractice = () => {
    setScore(0);
    setTotalPlayed(0);
    setCorrectStreak(0);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

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
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">Listening Practice</h1>
                <p className="text-sm text-slate-500 dark:text-indigo-200/60">Train your ear to recognize characters</p>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10 rounded-2xl p-5 border border-blue-200/40 dark:border-blue-500/20 mb-6">
              <div className="flex items-center gap-3">
                <Headphones className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">How it works</h3>
                  <p className="text-sm text-slate-600 dark:text-indigo-200/80">
                    Listen to the audio and select the correct character from the options.
                  </p>
                </div>
              </div>
            </div>

            {/* Character Sets */}
            <div className="grid gap-4">
              {CHARACTER_SETS.map((set, index) => (
                <motion.button
                  key={set.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedSetId(set.id);
                    setCurrentIdx(0);
                    setScore(0);
                    setTotalPlayed(0);
                    setCorrectStreak(0);
                    setShowSetSelector(false);
                  }}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl bg-white/80 dark:bg-indigo-950/50 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all text-left",
                    selectedSetId === set.id && "ring-2 ring-primary"
                  )}
                >
                  <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl font-bold text-white shadow-lg", set.data.color)}>
                    {set.data.chars[0]?.char}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-white">{set.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-indigo-200/60">{set.data.chars.length} characters</p>
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

  if (!selectedSet || !currentChar) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <SakuraBg count={15} />
      <div className="relative z-10">
        <div className="w-full max-w-lg mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSetSelector(true)}
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </button>
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-white">{selectedSet.name}</h1>
                <p className="text-xs text-slate-500 dark:text-indigo-200/60">Listening Practice</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/70 dark:bg-indigo-950/50 rounded-xl p-3 text-center border border-slate-200/60 dark:border-white/10">
              <div className="text-2xl font-black text-slate-800 dark:text-white">{score}</div>
              <div className="text-[10px] text-slate-500 dark:text-indigo-200/60 uppercase">Correct</div>
            </div>
            <div className="bg-white/70 dark:bg-indigo-950/50 rounded-xl p-3 text-center border border-slate-200/60 dark:border-white/10">
              <div className="text-2xl font-black text-slate-800 dark:text-white">{totalPlayed}</div>
              <div className="text-[10px] text-slate-500 dark:text-indigo-200/60 uppercase">Played</div>
            </div>
            <div className="bg-white/70 dark:bg-indigo-950/50 rounded-xl p-3 text-center border border-slate-200/60 dark:border-white/10">
              <div className="text-2xl font-black text-slate-800 dark:text-white">{correctStreak}</div>
              <div className="text-[10px] text-slate-500 dark:text-indigo-200/60 uppercase">Streak</div>
            </div>
          </div>

          {/* Progress */}
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-indigo-200/80">
              Question <span className="font-bold text-slate-800 dark:text-white">{currentIdx + 1}</span> of{" "}
              <span className="text-slate-500">{selectedSet.chars.length}</span>
            </span>
            <span className="text-slate-600 dark:text-indigo-200/80">
              {totalPlayed > 0 ? Math.round((score / totalPlayed) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + 1) / selectedSet.chars.length) * 100}%` }}
              className={cn("h-full rounded-full", `bg-gradient-to-r ${selectedSet.color}`)}
            />
          </div>

          {/* Audio Player */}
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 dark:bg-indigo-950/50 backdrop-blur-xl rounded-3xl p-8 text-center border border-slate-200/60 dark:border-white/20 shadow-xl mb-6"
          >
            <p className="text-sm text-slate-500 dark:text-indigo-200/60 mb-6">Listen and select the correct character</p>

            <motion.button
              onClick={playSound}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all shadow-2xl",
                isPlaying
                  ? "bg-gradient-to-br from-blue-500 to-purple-500 animate-pulse"
                  : "bg-gradient-to-br from-pink-500 to-purple-500 hover:opacity-90"
              )}
            >
              <Volume2 className="w-12 h-12 text-white" />
            </motion.button>

            <p className="text-xs text-slate-400 dark:text-indigo-200/50 mt-4">
              {isPlaying ? "Playing..." : "Tap to play"}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={replayQuestion}
                disabled={showResult}
                className="p-2 rounded-xl bg-slate-100/80 dark:bg-white/10 text-slate-500 hover:text-slate-700 disabled:opacity-50 transition"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <span className="text-xs text-slate-500 dark:text-indigo-200/60">Replay</span>
            </div>
          </motion.div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {options.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentChar.char;
              const showCorrect = showResult && isCorrect;
              const showIncorrect = showResult && isSelected && !isCorrect;

              let btnStyle = "bg-white/80 dark:bg-indigo-950/50 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white";
              if (showCorrect) {
                btnStyle = "bg-green-500/20 border-2 border-green-500/40 text-green-600 dark:text-green-300";
              } else if (showIncorrect) {
                btnStyle = "bg-red-500/20 border-2 border-red-500/40 text-red-600 dark:text-red-300";
              } else if (showResult) {
                btnStyle = "bg-slate-100/50 dark:bg-white/5 text-slate-400 cursor-default";
              } else {
                btnStyle += " hover:bg-slate-100 hover:border-slate-300 transition-all";
              }

              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult}
                  className={cn(
                    "py-6 rounded-2xl font-bold text-3xl transition-all",
                    btnStyle
                  )}
                  style={{ fontFamily: "var(--font-japanese)" }}
                >
                  {option}
                  {showCorrect && <CheckCircle2 className="w-6 h-6 inline ml-2" />}
                  {showIncorrect && <XCircle className="w-6 h-6 inline ml-2" />}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <AnimatePresence>
            {showResult && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={nextQuestion}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:opacity-90 transition"
              >
                {currentIdx < selectedSet.chars.length - 1 ? (
                  <>
                    Next Question
                    <ChevronRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Start Over
                    <RefreshCw className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Reset Button */}
          <button
            onClick={resetPractice}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/60 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-600 dark:text-indigo-200/80 hover:bg-slate-100 transition text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Practice
          </button>

          {/* Keyboard hint */}
          <div className="hidden sm:flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-indigo-200/50 font-medium mt-6">
            <span>Space Play audio</span>
            <span>1-4 Select option</span>
          </div>
        </div>
      </div>
    </div>
  );
}
