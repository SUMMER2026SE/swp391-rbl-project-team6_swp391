import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  CheckCircle2,
  X,
  Play,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  List,
  FlipHorizontal,
  BrainCircuit,
  Layers,
  Star,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import {
  studentVocabularyApi,
  type VocabularyLessonDetailResponse,
  type VocabularyWordResponse,
} from "@/lib/api/studentVocabulary";
import { studentProgressApi } from "@/lib/api/studentProgress";
import { QuizletFlashcardModal } from "@/components/student/QuizletFlashcardModal";

const levelColors: Record<string, string> = {
  N5: "bg-blue-500/20 text-blue-400 border-blue-400/30",
  N4: "bg-green-500/20 text-green-400 border-green-400/30",
  N3: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  N2: "bg-orange-500/20 text-orange-400 border-orange-400/30",
  N1: "bg-red-500/20 text-red-400 border-red-400/30",
};

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

export const Route = createFileRoute("/student/vocabulary/$lessonId")({
  validateSearch: (search: Record<string, unknown>): { mode?: StudyMode } => {
    return {
      mode: search.mode as StudyMode | undefined,
    };
  },
  component: VocabStudyPage,
});

type StudyMode = "list" | "flashcard" | "quiz" | "srs";
type SRSCategory = "new" | "learning" | "review" | "mastered";

interface QuizOptionType {
  text: string;
  isCorrect: boolean;
}

function VocabStudyPage() {
  const { lessonId } = Route.useParams();
  const search = Route.useSearch();
  const queryClient = useQueryClient();

  const [studyMode, setStudyMode] = useState<StudyMode>(search.mode || "list");
  const [srsCategory, setSrsCategory] = useState<SRSCategory>("new");

  // Quizlet Flashcard Modal States
  const [isQuizletModalOpen, setIsQuizletModalOpen] = useState(false);
  const [quizletInitialIdx, setQuizletInitialIdx] = useState(0);

  useEffect(() => {
    if (search.mode) {
      setStudyMode(search.mode);
    }
  }, [search.mode]);

  // ── Query: Lesson details ─────────────────────────────────
  const {
    data: lesson,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["vocabulary-lesson", lessonId],
    queryFn: () => studentVocabularyApi.getPublishedLessonDetail(lessonId),
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Query: Progress data ───────────────────────────────────
  const {
    data: progressList,
    isLoading: progressLoading,
  } = useQuery({
    queryKey: ["vocabulary-progress", lessonId],
    queryFn: () => studentProgressApi.getProgress({ contentType: "VOCABULARY" }),
    enabled: !!lessonId,
    staleTime: 60 * 1000,
  });

  const words: VocabularyWordResponse[] = lesson?.words ?? [];

  // ── Progress Helpers ──────────────────────────────────────
  const progressMap = useMemo(() => {
    const map = new Map<string, any>();
    if (progressList) {
      progressList.forEach((p) => {
        map.set(p.contentId, p);
      });
    }
    return map;
  }, [progressList]);

  const getWordProgress = (wordText: string) => {
    const key = `${lessonId}::${wordText}`;
    return progressMap.get(key);
  };

  const isWordLearned = (wordText: string) => {
    const p = getWordProgress(wordText);
    return !!(p?.learned || p?.mastered);
  };

  const isWordMastered = (wordText: string) => {
    const p = getWordProgress(wordText);
    return !!p?.mastered;
  };

  const isWordBookmarked = (wordText: string) => {
    const p = getWordProgress(wordText);
    return !!p?.favorite;
  };

  const toggleLearned = async (wordText: string) => {
    if (!lessonId) return;
    const contentId = `${lessonId}::${wordText}`;
    const learned = isWordLearned(wordText);
    try {
      if (learned) {
        await studentProgressApi.unmarkAsLearned("VOCABULARY", contentId);
      } else {
        await studentProgressApi.markAsLearned("VOCABULARY", contentId);
      }
      queryClient.invalidateQueries({ queryKey: ["vocabulary-progress", lessonId] });
    } catch (err) {
      console.error("Failed to toggle learned status:", err);
    }
  };

  const toggleMastered = async (wordText: string) => {
    if (!lessonId) return;
    const contentId = `${lessonId}::${wordText}`;
    const mastered = isWordMastered(wordText);
    try {
      if (mastered) {
        await studentProgressApi.unmarkAsMastered("VOCABULARY", contentId);
      } else {
        await studentProgressApi.markAsMastered("VOCABULARY", contentId);
      }
      queryClient.invalidateQueries({ queryKey: ["vocabulary-progress", lessonId] });
    } catch (err) {
      console.error("Failed to toggle mastered status:", err);
    }
  };

  const toggleBookmark = async (wordText: string) => {
    if (!lessonId) return;
    const contentId = `${lessonId}::${wordText}`;
    try {
      await studentProgressApi.toggleFavorite("VOCABULARY", contentId);
      queryClient.invalidateQueries({ queryKey: ["vocabulary-progress", lessonId] });
    } catch (err) {
      console.error("Failed to toggle bookmark status:", err);
    }
  };

  // ── Flashcard Mode States ───────────────────────────────────
  const [flashCardIdx, setFlashCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // ── Quiz Mode States ────────────────────────────────────────
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizOptions, setQuizOptions] = useState<QuizOptionType[]>([]);

  // Generate options for the current quiz word
  useEffect(() => {
    if (studyMode === "quiz" && words.length > 0 && words[quizIdx]) {
      const correctWord = words[quizIdx];
      const correctOption: QuizOptionType = {
        text: correctWord.meaning,
        isCorrect: true,
      };

      // Filter other words from the lesson
      const otherWords = words.filter((_, idx) => idx !== quizIdx);
      // Shuffle other meanings
      const wrongOptions: QuizOptionType[] = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => ({
          text: w.meaning,
          isCorrect: false,
        }));

      // In case we don't have enough words in the lesson, fill with dummy values
      while (wrongOptions.length < 3) {
        wrongOptions.push({
          text: `Alternative Meaning ${wrongOptions.length + 1}`,
          isCorrect: false,
        });
      }

      const allOptions = [correctOption, ...wrongOptions].sort(() => Math.random() - 0.5);
      setQuizOptions(allOptions);
      setQuizAnswer(null);
    }
  }, [quizIdx, studyMode, lesson]);

  // Reset indices on mode switch
  useEffect(() => {
    setFlashCardIdx(0);
    setFlipped(false);
    setQuizIdx(0);
    setQuizAnswer(null);
    setQuizFinished(false);
    setQuizScore(0);
  }, [studyMode]);

  // Keyboard navigation for Flashcards
  useEffect(() => {
    if (studyMode !== "flashcard") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is on input/textarea
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (flashCardIdx < words.length - 1) {
          setFlashCardIdx((idx) => idx + 1);
          setFlipped(false);
        }
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (flashCardIdx > 0) {
          setFlashCardIdx((idx) => idx - 1);
          setFlipped(false);
        }
      } else if (e.code === "KeyV" || e.code === "Enter") {
        e.preventDefault();
        if (words[flashCardIdx]) {
          speakJapanese(words[flashCardIdx].furigana || words[flashCardIdx].word);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [studyMode, flashCardIdx, words]);

  // ── Loading & Error Rendering ──────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={18} />
        <div className="relative z-10 flex flex-col items-center gap-3 text-center animate-pulse">
          <BookOpen className="w-12 h-12 text-white/50" />
          <p className="text-white font-bold text-base">Loading vocabulary...</p>
          <p className="text-white/60 text-sm">Please wait while information is being prepared.</p>
        </div>
      </div>
    );
  }

  if (isError || !lesson) {
    const errorMessage =
      error instanceof Error ? error.message : "Something went wrong. Please try again.";
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={18} />
        <div className="relative z-10 text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Failed to load lesson details</h3>
          <p className="text-sm text-white/60 mb-4">{errorMessage}</p>
          <Link
            to="/student/vocabulary"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-semibold hover:bg-white/25 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Vocabulary
          </Link>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={18} />
        <div className="relative z-10 text-center max-w-sm mx-auto px-4">
          <BookOpen className="w-12 h-12 mx-auto text-white/30 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No vocabulary words available</h3>
          <p className="text-sm text-white/60 mb-4">This lesson does not have any words yet.</p>
          <Link
            to="/student/vocabulary"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-semibold hover:bg-white/25 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Vocabulary
          </Link>
        </div>
      </div>
    );
  }

  const lessonLevel = lesson.level ?? "N5";
  const lessonTitle = lesson.title ?? "Vocabulary Lesson";

  // Categorize words for SRS
  const srsNewWords = words.filter((w) => {
    const p = getWordProgress(w.word);
    return !p?.learned && !p?.mastered;
  });

  const srsLearningWords = words.filter((w) => {
    const p = getWordProgress(w.word);
    return p?.learned && !p?.mastered;
  });

  const srsReviewWords = words.filter((w) => {
    const p = getWordProgress(w.word);
    return !!p?.favorite;
  });

  const srsMasteredWords = words.filter((w) => {
    const p = getWordProgress(w.word);
    return !!p?.mastered;
  });

  const activeSrsWords =
    srsCategory === "new"
      ? srsNewWords
      : srsCategory === "learning"
        ? srsLearningWords
        : srsCategory === "review"
          ? srsReviewWords
          : srsMasteredWords;

  return (
    <div className="min-h-screen relative flex flex-col dark:bg-linear-to-br dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950">
      <SakuraBg count={18} />

      {/* ── Header ── */}
      <div className="relative z-10 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <Link
            to="/student/vocabulary"
            className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/20 transition"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
          </Link>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-sm ${levelColors[lessonLevel] ?? levelColors.N5}`}
              >
                JLPT {lessonLevel}
              </span>
              <span className="font-display font-black text-slate-800 dark:text-white text-base leading-tight text-center">
                {lessonTitle}
              </span>
            </div>
          </div>

          <div className="w-10 h-10" />
        </div>
      </div>

      {/* ── Mode Selector Tabs ── */}
      <div className="relative z-10 px-4 pb-4 flex justify-center">
        <div className="flex gap-2 bg-white/80 dark:bg-indigo-950/50 backdrop-blur-sm rounded-xl p-1 border border-slate-200/60 dark:border-indigo-400/20 w-fit shadow-sm">
          {[
            { id: "list" as StudyMode, icon: List, label: "List" },
            { id: "flashcard" as StudyMode, icon: FlipHorizontal, label: "Flashcard" },
            { id: "quiz" as StudyMode, icon: BrainCircuit, label: "Quiz" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setStudyMode(mode.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                studyMode === mode.id
                  ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow"
                  : "text-muted-foreground dark:text-indigo-300 hover:text-foreground dark:hover:bg-indigo-400/15"
              }`}
            >
              <mode.icon className="w-4 h-4" /> {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mode Content ── */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pb-6 gap-3 max-w-4xl mx-auto w-full">
        {studyMode === "list" && (
          <div className="space-y-3 w-full">
            {words.map((word, i) => {
              const isFav = isWordBookmarked(word.word);
              const learned = isWordLearned(word.word);
              const mastered = isWordMastered(word.word);

              return (
                <motion.div
                  key={word.word}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => {
                    const index = words.findIndex(w => w.word === word.word);
                    if (index !== -1) {
                      setQuizletInitialIdx(index);
                      setIsQuizletModalOpen(true);
                    }
                  }}
                  className="group bg-card/85 dark:bg-[#0f1430]/90 dark:border-indigo-400/20 dark:hover:border-cyan-300/40 rounded-2xl border border-border/50 px-4 py-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div
                          className="font-display text-2xl font-black text-foreground dark:text-white"
                          style={{ fontFamily: "var(--font-japanese, serif)" }}
                        >
                          {word.word}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakJapanese(word.furigana || word.word);
                          }}
                          title="Play pronunciation"
                          className="p-1.5 rounded-lg text-muted-foreground dark:text-indigo-300/60 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-sm text-primary/95 dark:text-cyan-400 font-bold">
                        {word.furigana || word.romaji}
                      </div>
                      <div className="text-sm font-semibold text-foreground dark:text-slate-100">
                        {word.meaning}
                      </div>
                      {word.exampleJapanese && (
                        <div className="text-xs text-muted-foreground dark:text-slate-300/80 italic mt-1 border-l-2 border-primary/30 pl-2">
                          <div>{word.exampleJapanese}</div>
                          {word.exampleMeaning && (
                            <div className="text-muted-foreground/70 dark:text-indigo-200/50 mt-0.5">
                              {word.exampleMeaning}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleMastered(word.word)}
                        title={mastered ? "Unmark Mastered" : "Mark Mastered"}
                        className={`p-2 rounded-xl border transition-all ${
                          mastered
                            ? "bg-green-500/20 border-green-500/30 text-green-400"
                            : "bg-white/5 dark:bg-white/5 border-border/40 text-muted-foreground dark:text-indigo-300/60 hover:text-green-400"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleLearned(word.word)}
                        title={learned ? "Unmark Learning" : "Mark Learning"}
                        className={`p-2 rounded-xl border transition-all ${
                          learned && !mastered
                            ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                            : "bg-white/5 dark:bg-white/5 border-border/40 text-muted-foreground dark:text-indigo-300/60 hover:text-blue-400"
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleBookmark(word.word)}
                        title="Star"
                        className={`p-2 rounded-xl border transition-all ${
                          isFav
                            ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                            : "bg-white/5 dark:bg-white/5 border-border/40 text-muted-foreground dark:text-indigo-300/60 hover:text-amber-400"
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isFav ? "fill-amber-400" : ""}`} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {studyMode === "flashcard" && (
          <div className="flex-1 flex flex-col gap-4 max-w-lg mx-auto w-full">
            <style>{`
              .perspective-1000 {
                perspective: 1000px;
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

            {/* Card Progress Bar */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-indigo-200/80 font-semibold px-2">
              <span>
                Card <span className="font-bold text-slate-800 dark:text-white">{flashCardIdx + 1}</span> of{" "}
                <span className="text-slate-500 dark:text-indigo-300/60">{words.length}</span>
              </span>
              <span>{Math.round(((flashCardIdx + 1) / words.length) * 100)}%</span>
            </div>
            <div className="h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-pink-400 transition-all duration-300"
                style={{ width: `${((flashCardIdx + 1) / words.length) * 100}%` }}
              />
            </div>

            {/* Flashcard container */}
            <div className="relative flex-1 min-h-[350px] w-full perspective-1000 flex flex-col mt-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={flashCardIdx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col"
                >
                  <div
                    onClick={() => setFlipped(!flipped)}
                    className="relative flex-1 min-h-[350px] w-full transform-style-3d transition-transform duration-500 select-none cursor-pointer"
                    style={{
                      transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* FRONT SIDE */}
                    <div className="absolute inset-0 backface-hidden rounded-3xl bg-white/80 dark:bg-indigo-950/40 backdrop-blur-xl border border-slate-200 dark:border-white/20 shadow-2xl flex flex-col justify-between p-6">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-indigo-200/60">
                          Front · Japanese
                        </span>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakJapanese(words[flashCardIdx].furigana || words[flashCardIdx].word);
                            }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:text-slate-800 dark:hover:text-white transition-all"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(words[flashCardIdx].word);
                            }}
                            className={`p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors ${
                              isWordBookmarked(words[flashCardIdx].word) ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-white/40 hover:text-slate-800 dark:hover:text-white"
                            }`}
                          >
                            <Star className={`w-4 h-4 ${isWordBookmarked(words[flashCardIdx].word) ? "fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400" : ""}`} />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                        <div
                          className="font-display font-black text-slate-800 dark:text-white leading-tight mb-2 tracking-wide"
                          style={{
                            fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
                            fontFamily: "var(--font-japanese, serif)",
                          }}
                        >
                          {words[flashCardIdx].word}
                        </div>
                        <div className="text-slate-500 dark:text-indigo-200/50 text-[10px] font-bold tracking-widest uppercase mt-4">
                          Click card or press Space to flip
                        </div>
                      </div>

                      <div className="text-center text-[10px] text-slate-500 dark:text-indigo-200/50">
                        Lesson: {lessonTitle}
                      </div>
                    </div>

                    {/* BACK SIDE */}
                    <div
                      className="absolute inset-0 backface-hidden rounded-3xl bg-linear-to-br from-indigo-900/90 via-purple-950/90 to-slate-900/90 border border-white/20 shadow-2xl flex flex-col justify-between p-6 rotate-y-180"
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                          Back · Definition
                        </span>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakJapanese(words[flashCardIdx].furigana || words[flashCardIdx].word);
                            }}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/15 transition-all"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(words[flashCardIdx].word);
                            }}
                            className={`p-2 rounded-xl bg-white/5 border border-white/10 transition-colors ${
                              isWordBookmarked(words[flashCardIdx].word) ? "text-amber-400" : "text-white/40 hover:text-white"
                            }`}
                          >
                            <Star className={`w-4 h-4 ${isWordBookmarked(words[flashCardIdx].word) ? "fill-amber-400" : ""}`} />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center text-center py-4 px-2 space-y-4">
                        <div>
                          <div className="text-sm text-cyan-300 font-bold uppercase tracking-wider mb-1">
                            {words[flashCardIdx].furigana || words[flashCardIdx].romaji}
                          </div>
                          <div className="text-2xl text-white font-black leading-tight">
                            {words[flashCardIdx].meaning}
                          </div>
                        </div>

                        {words[flashCardIdx].exampleJapanese && (
                          <div className="w-full max-w-sm px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-left">
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                              Example Sentence
                            </div>
                            <div
                              className="text-white text-base font-semibold mb-1"
                              style={{ fontFamily: "var(--font-japanese, serif)" }}
                            >
                              {words[flashCardIdx].exampleJapanese}
                            </div>
                            {words[flashCardIdx].exampleMeaning && (
                              <div className="text-white/60 text-xs">
                                {words[flashCardIdx].exampleMeaning}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-center text-[10px] text-white/30">
                        Lesson: {lessonTitle}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Keyboard shortcuts tip */}
            <div className="hidden sm:flex items-center justify-center gap-4 text-[10px] text-slate-500 dark:text-white/40 font-semibold px-2">
              <span>← / → Navigate</span>
              <span>Space Flip</span>
              <span>Enter Pronounce</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (flashCardIdx > 0) {
                    setFlashCardIdx(flashCardIdx - 1);
                    setFlipped(false);
                  }
                }}
                disabled={flashCardIdx === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/60 dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-800 dark:text-white font-bold text-sm hover:bg-white/80 dark:hover:bg-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => {
                  if (flashCardIdx < words.length - 1) {
                    setFlashCardIdx(flashCardIdx + 1);
                    setFlipped(false);
                  }
                }}
                disabled={flashCardIdx === words.length - 1}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-pink-500 text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status Setter */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleLearned(words[flashCardIdx].word)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all border ${
                  isWordLearned(words[flashCardIdx].word)
                    ? "bg-green-500/20 border-green-500/30 text-green-600 dark:text-green-300"
                    : "bg-white/60 dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-800 dark:text-white hover:bg-white/80 dark:hover:bg-white/20"
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {isWordLearned(words[flashCardIdx].word) ? "Learned" : "Mark Learned"}
              </button>
            </div>
          </div>
        )}

        {studyMode === "quiz" && (
          <div className="flex-1 flex flex-col gap-4 max-w-lg mx-auto w-full">
            {!quizFinished ? (
              <>
                {/* Question Info */}
                <div className="flex justify-between items-center text-xs text-slate-700 dark:text-indigo-200/80 font-semibold px-2">
                  <span>
                    Question <span className="font-bold text-slate-800 dark:text-white">{quizIdx + 1}</span> of{" "}
                    <span className="text-slate-600 dark:text-indigo-300/60">{words.length}</span>
                  </span>
                  <span className="text-slate-800 dark:text-white font-bold">Score: {quizScore}</span>
                </div>
                <div className="h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-pink-400 transition-all duration-300"
                    style={{ width: `${((quizIdx + 1) / words.length) * 100}%` }}
                  />
                </div>

                {/* Quiz Card */}
                <div className="bg-white/80 dark:bg-indigo-950/40 backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-6 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-indigo-200/70 mb-2">
                    What does this word mean?
                  </div>
                  <div
                    className="font-display font-black text-slate-800 dark:text-white leading-tight mb-2"
                    style={{
                      fontSize: "clamp(2rem, 8vw, 3.5rem)",
                      fontFamily: "var(--font-japanese, serif)",
                    }}
                  >
                    {words[quizIdx]?.word}
                  </div>
                  {words[quizIdx]?.furigana && (
                    <div className="text-sm text-cyan-600 dark:text-cyan-300 font-bold">
                      {words[quizIdx].furigana}
                    </div>
                  )}
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {quizOptions.map((opt) => {
                    const isSelected = quizAnswer === opt.text;
                    const showCorrect = quizAnswer !== null && opt.isCorrect;
                    const showIncorrect = quizAnswer !== null && isSelected && !opt.isCorrect;

                    let btnStyle = "bg-white/60 dark:bg-white/10 border border-slate-200/80 dark:border-white/20 text-slate-800 dark:text-white hover:bg-white/80 dark:hover:bg-white/20";
                    if (showCorrect) {
                      btnStyle = "bg-green-500/20 border-green-500/40 text-green-600 dark:text-green-300";
                    } else if (showIncorrect) {
                      btnStyle = "bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-300";
                    } else if (quizAnswer !== null) {
                      btnStyle = "bg-slate-100/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-400 dark:text-white/40 cursor-default";
                    }

                    return (
                      <button
                        key={opt.text}
                        disabled={quizAnswer !== null}
                        onClick={() => {
                          setQuizAnswer(opt.text);
                          if (opt.isCorrect) {
                            setQuizScore((s) => s + 1);
                          }
                        }}
                        className={`w-full text-left px-5 py-3.5 rounded-2xl border transition-all text-sm font-semibold ${btnStyle}`}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>

                {/* Next Question / Finish Quiz button */}
                {quizAnswer !== null && (
                  <button
                    onClick={() => {
                      if (quizIdx < words.length - 1) {
                        setQuizIdx((idx) => idx + 1);
                        setQuizAnswer(null);
                      } else {
                        setQuizFinished(true);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-pink-500 text-white font-bold text-sm hover:opacity-90 transition mt-4"
                  >
                    {quizIdx < words.length - 1 ? "Next Question" : "Finish Quiz"} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              /* Quiz Finished Screen */
              <div className="text-center bg-white/80 dark:bg-indigo-950/40 backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 space-y-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-pink-500 flex items-center justify-center mx-auto shadow-lg">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">Quiz Completed!</h3>
                  <p className="text-sm text-slate-600 dark:text-indigo-200/60">
                    You got <span className="font-bold text-slate-800 dark:text-white">{quizScore}</span> out of{" "}
                    <span className="font-bold text-slate-800 dark:text-white">{words.length}</span> correct.
                  </p>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-white/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-pink-400"
                    style={{ width: `${(quizScore / words.length) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => {
                    setQuizIdx(0);
                    setQuizAnswer(null);
                    setQuizFinished(false);
                    setQuizScore(0);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/60 dark:bg-white/15 border border-slate-200 dark:border-white/20 text-slate-800 dark:text-white hover:bg-white/80 dark:hover:bg-white/25 transition"
                >
                  <RotateCcw className="w-4 h-4" /> Retry Quiz
                </button>
              </div>
            )}
          </div>
        )}

        {studyMode === "srs" && (
          <div className="space-y-4">
            {/* SRS Categories Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
              {[
                { id: "new" as SRSCategory, label: "New", count: srsNewWords.length, color: "text-blue-400" },
                { id: "learning" as SRSCategory, label: "Learning", count: srsLearningWords.length, color: "text-amber-400" },
                { id: "review" as SRSCategory, label: "Review (Starred)", count: srsReviewWords.length, color: "text-red-400" },
                { id: "mastered" as SRSCategory, label: "Mastered", count: srsMasteredWords.length, color: "text-green-400" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSrsCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    srsCategory === cat.id
                      ? "bg-white/15 border border-white/20 text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <span className={cat.color}>●</span> {cat.label} ({cat.count})
                </button>
              ))}
            </div>

            {/* SRS Words List */}
            {activeSrsWords.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-sm text-white/50">No words in this category.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeSrsWords.map((word) => {
                  const isFav = isWordBookmarked(word.word);
                  const learned = isWordLearned(word.word);
                  const mastered = isWordMastered(word.word);

                  return (
                    <div
                      key={word.word}
                      className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div
                          className="text-lg font-black text-white"
                          style={{ fontFamily: "var(--font-japanese, serif)" }}
                        >
                          {word.word}
                        </div>
                        <div className="text-xs text-cyan-300 font-bold">{word.furigana || word.romaji}</div>
                        <div className="text-sm text-white/80 mt-0.5">{word.meaning}</div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleMastered(word.word)}
                          className={`p-1.5 rounded-lg border transition ${
                            mastered ? "bg-green-500/20 text-green-400" : "text-white/40 hover:text-white"
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleLearned(word.word)}
                          className={`p-1.5 rounded-lg border transition ${
                            learned && !mastered ? "bg-blue-500/20 text-blue-400" : "text-white/40 hover:text-white"
                          }`}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleBookmark(word.word)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-white"
                        >
                          <Star className={`w-4 h-4 ${isFav ? "fill-amber-400 text-amber-400" : ""}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <QuizletFlashcardModal
        isOpen={isQuizletModalOpen}
        onClose={() => setIsQuizletModalOpen(false)}
        initialIndex={quizletInitialIdx}
        words={words.map(w => ({
          word: w.word,
          furigana: w.furigana || w.romaji || "",
          meaning: w.meaning,
          example: w.exampleJapanese || "",
          exampleMeaning: w.exampleMeaning || "",
        }))}
        isBookmarked={(word) => isWordBookmarked(word)}
        toggleBookmark={(word) => toggleBookmark(word)}
        isLearned={(word) => isWordLearned(word)}
        toggleLearned={(word) => toggleLearned(word)}
        isMastered={(word) => isWordMastered(word)}
        toggleMastered={(word) => toggleMastered(word)}
      />
    </div>
  );
}
