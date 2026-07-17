import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  Headphones,
  ListChecks,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Volume2,
  Loader2,
  AlertCircle,
  Search,
  X,
  RotateCcw,
  Check,
  X as XIcon,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { studentListeningApi, type ListeningItemResponse } from "@/lib/api/listening";
import { cn } from "@/lib/utils";

type JLPTLevel = "All" | "N5" | "N4" | "N3" | "N2" | "N1";

const JLPT_LEVELS: JLPTLevel[] = ["All", "N5", "N4", "N3", "N2", "N1"];
const ITEMS_PER_PAGE = 6;

interface ListeningLessonSummary {
  id: string;
  title: string;
  level: string;
  description: string | null;
  estimatedMinutes: number | null;
  itemCount: number;
}

interface ListeningExerciseState {
  id: string;
  title: string;
  level: string;
  description: string | null;
  items: ListeningItemResponse[];
  selectedAnswers: Map<string, string>;
  isSubmitted: boolean;
}

type ReviewView = "quiz" | "result" | "review";

function getLevelBoxStyle(level: string, isSelected: boolean) {
  if (isSelected) return "bg-linear-to-r from-blue-400 to-pink-400 text-white shadow-md";
  const styles: Record<string, string> = {
    N5: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200",
    N4: "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-200",
    N3: "bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-200",
    N2: "bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-200",
    N1: "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200",
  };
  return styles[level] ?? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
}

export const Route = createFileRoute("/student/listening")({ component: Listening });

function Listening() {
  const [exercises, setExercises] = useState<ListeningLessonSummary[]>([]);
  const [selectedEx, setSelectedEx] = useState<ListeningExerciseState | null>(null);
  const [levelFilter, setLevelFilter] = useState<JLPTLevel>("All");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewView, setReviewView] = useState<ReviewView>("quiz");
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const fetchExercises = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await studentListeningApi.getListeningLessons(
        levelFilter === "All" ? undefined : { level: levelFilter },
      );
      const summaries: ListeningLessonSummary[] = list.map((item) => ({
        id: item.id,
        title: item.title,
        level: item.jlptLevel,
        description: item.description,
        estimatedMinutes: item.estimatedMinutes,
        itemCount: 0,
      }));
      setExercises(summaries);
    } catch (err) {
      console.error(err);
      setError("Failed to load listening exercises.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExerciseDetail = async (exerciseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const detail = await studentListeningApi.getListeningLesson(exerciseId);
      const items = (detail.listeningItems ?? []).slice().sort(
        (a, b) => a.questionOrder - b.questionOrder,
      );
      setSelectedEx({
        id: detail.id,
        title: detail.title,
        level: detail.jlptLevel,
        description: detail.description,
        items,
        selectedAnswers: new Map(),
        isSubmitted: false,
      });
      setReviewView("quiz");
    } catch (err) {
      console.error(err);
      setError("Failed to load exercise details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [levelFilter]);

  const filteredExercises = useMemo(() => {
    let result = exercises;
    if (appliedSearch) {
      const search = appliedSearch.toLowerCase();
      result = result.filter(
        (ex) =>
          ex.title.toLowerCase().includes(search) ||
          ex.level.toLowerCase().includes(search),
      );
    }
    return result;
  }, [exercises, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredExercises.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedExercises = filteredExercises.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const handleSelectLevel = (level: JLPTLevel) => {
    setLevelFilter(level);
    setPage(1);
  };

  const handleSelectExercise = async (ex: ListeningLessonSummary) => {
    await fetchExerciseDetail(ex.id);
  };

  const handleBack = () => {
    setSelectedEx(null);
    setReviewView("quiz");
  };

  const handleSelectAnswer = (itemId: string, letter: string) => {
    if (!selectedEx || selectedEx.isSubmitted) return;
    setSelectedEx((current) => {
      if (!current) return current;
      const next = new Map(current.selectedAnswers);
      next.set(itemId, letter);
      return { ...current, selectedAnswers: next };
    });
  };

  const handleSubmit = () => {
    setSelectedEx((current) => (current ? { ...current, isSubmitted: true } : current));
    setReviewView("result");
  };

  const handleRetry = async () => {
    if (!selectedEx) return;
    await fetchExerciseDetail(selectedEx.id);
  };

  const handleReview = () => {
    setReviewView("review");
  };

  const result = useMemo(() => {
    if (!selectedEx) return null;
    let correct = 0;
    const perItem = selectedEx.items.map((item) => {
      const userAnswer = selectedEx.selectedAnswers.get(item.id);
      const correctAnswer = item.correctAnswer.toUpperCase().trim();
      const isCorrect = userAnswer?.toUpperCase().trim() === correctAnswer;
      if (isCorrect) correct += 1;
      return {
        item,
        userAnswer: userAnswer ?? null,
        correctAnswer,
        isCorrect,
      };
    });
    const total = selectedEx.items.length;
    const scorePercent = total === 0 ? 0 : Math.round((correct / total) * 1000) / 10;
    return { correct, total, scorePercent, perItem };
  }, [selectedEx]);

  return (
    <div className="dark:bg-linear-to-br dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950 min-h-screen">
      <SakuraBg count={14} />
      <div className="relative z-10">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-black">Listening Lessons</h1>
              <p className="text-sm text-muted-foreground dark:text-slate-300 mt-0.5 leading-relaxed">
                Each lesson contains multiple listening items. Listen, then choose A–D for each.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-center px-3 py-2 rounded-xl bg-card/70 dark:bg-indigo-950/50 backdrop-blur-sm border border-border/50 dark:border-indigo-400/20 shadow-sm">
                <div className="text-lg font-black text-blue-500">{exercises.length}</div>
                <div className="text-[10px] text-muted-foreground font-medium">Total</div>
              </div>
            </div>
          </div>

          {/* Search */}
          {!selectedEx && (
            <div className="relative flex">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setAppliedSearch(searchInput.trim());
                }}
                placeholder="Search listening exercises..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-card/70 dark:bg-white/5.5 backdrop-blur-sm border border-border/50 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-400/40 dark:focus:ring-cyan-300/30 dark:focus:border-cyan-300/30 shadow-sm dark:placeholder:text-slate-400 dark:text-slate-200 dark:focus:bg-white/[0.07] pr-20"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setAppliedSearch("");
                  }}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setAppliedSearch(searchInput.trim())}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Exercise List */}
          {!selectedEx && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Level Filter */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                {JLPT_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => handleSelectLevel(level)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap",
                      levelFilter === level
                        ? getLevelBoxStyle(level, true)
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              ) : paginatedExercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Headphones className="w-12 h-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No listening exercises found.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedExercises.map((ex, i) => (
                      <motion.button
                        key={ex.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleSelectExercise(ex)}
                        className="relative flex flex-col gap-3 p-5 rounded-2xl border-2 bg-white/80 dark:bg-indigo-950/30 backdrop-blur-sm border-white/60 dark:border-indigo-400/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                            <Headphones className="w-5 h-5 text-blue-500" />
                          </div>
                          <span
                            className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-full",
                              getLevelBoxStyle(ex.level, false).split(" ").slice(0, 2).join(" "),
                            )}
                          >
                            {ex.level}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-2">{ex.title}</h3>
                          {ex.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {ex.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ListChecks className="w-3.5 h-3.5" />
                            Listening
                          </span>
                          {ex.estimatedMinutes && (
                            <span className="flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5" />~{ex.estimatedMinutes}m
                            </span>
                          )}
                        </div>
                        <ChevronRight className="absolute bottom-5 right-5 w-4 h-4 text-muted-foreground" />
                      </motion.button>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="p-2 rounded-lg bg-card border border-border/50 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {safePage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        className="p-2 rounded-lg bg-card border border-border/50 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Quiz View */}
          {selectedEx && reviewView === "quiz" && (
            <ListeningQuizView
              exercise={selectedEx}
              audioRefs={audioRefs}
              onBack={handleBack}
              onSelect={handleSelectAnswer}
              onSubmit={handleSubmit}
            />
          )}

          {/* Result */}
          {selectedEx && reviewView === "result" && result && (
            <ListeningResultView
              exercise={selectedEx}
              correct={result.correct}
              total={result.total}
              scorePercent={result.scorePercent}
              onRetry={handleRetry}
              onReview={handleReview}
              onBack={handleBack}
            />
          )}

          {/* Review */}
          {selectedEx && reviewView === "review" && result && (
            <ListeningReviewView
              exercise={selectedEx}
              perItem={result.perItem}
              onBack={() => setReviewView("result")}
              onRetry={handleRetry}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Quiz View ───────────────────────────────────────────────────────────────

interface ListeningQuizViewProps {
  exercise: ListeningExerciseState;
  audioRefs: React.MutableRefObject<Map<string, HTMLAudioElement>>;
  onBack: () => void;
  onSelect: (itemId: string, letter: string) => void;
  onSubmit: () => void;
}

function ListeningQuizView({
  exercise,
  audioRefs,
  onBack,
  onSelect,
  onSubmit,
}: ListeningQuizViewProps) {
  const answered = exercise.selectedAnswers.size;
  const total = exercise.items.length;
  const allAnswered = total > 0 && answered === total;

  return (
    <motion.div
      key="quiz"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-muted transition text-sm font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to List
      </button>

      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">{exercise.title}</h2>
            <p className="text-xs text-muted-foreground">
              {total} item{total === 1 ? "" : "s"}
              {exercise.description ? ` • ${exercise.description}` : ""}
            </p>
          </div>
          <span
            className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              getLevelBoxStyle(exercise.level, false).split(" ").slice(0, 2).join(" "),
            )}
          >
            {exercise.level}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{exercise.title}</span>
        <span>{answered}/{total} answered</span>
      </div>

      <div className="space-y-4">
        {exercise.items.map((item, index) => {
          const selectedLetter = exercise.selectedAnswers.get(item.id);
          return (
            <div
              key={item.id}
              className="bg-card rounded-xl border border-border/50 p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                </div>
                <p className="text-sm font-medium text-foreground flex-1">{item.question}</p>
              </div>

              {item.audioUrl ? (
                <div className="ml-11">
                  <audio
                    ref={(el) => {
                      if (el) audioRefs.current.set(item.id, el);
                    }}
                    controls
                    preload="metadata"
                    src={item.audioUrl}
                    className="w-full h-10"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : (
                <div className="ml-11 text-xs text-red-500">Audio is not available.</div>
              )}

              <div className="space-y-2 ml-11">
                {(["A", "B", "C", "D"] as const).map((letter) => {
                  const isSelected = selectedLetter === letter;
                  const value = item[`option${letter}` as "optionA" | "optionB" | "optionC" | "optionD"];
                  return (
                    <button
                      key={letter}
                      onClick={() => onSelect(item.id, letter)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-2",
                        isSelected
                          ? "border-sky-blue bg-sky-blue/15"
                          : "border-border/50 hover:border-blue-500/30 bg-card",
                      )}
                    >
                      <span
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0",
                          isSelected
                            ? "border-sky-blue bg-sky-blue text-white"
                            : "border-border",
                        )}
                      >
                        {letter}
                      </span>
                      <span>{value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onSubmit}
        disabled={!allAnswered}
        className={cn(
          "w-full py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2",
          allAnswered
            ? "bg-gradient-hero text-white hover:opacity-90"
            : "bg-muted text-muted-foreground cursor-not-allowed",
        )}
      >
        Submit ({answered}/{total})
      </button>
    </motion.div>
  );
}

// ─── Result View ──────────────────────────────────────────────────────────────

interface ListeningResultViewProps {
  exercise: ListeningExerciseState;
  correct: number;
  total: number;
  scorePercent: number;
  onRetry: () => void;
  onReview: () => void;
  onBack: () => void;
}

function ListeningResultView({
  correct,
  total,
  scorePercent,
  onRetry,
  onReview,
  onBack,
}: ListeningResultViewProps) {
  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="rounded-xl p-6 text-center shadow-lg bg-gradient-to-r from-sky-blue to-pink-400 text-white">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold mb-1">Listening Complete</h3>
        <p className="text-3xl font-black my-3">
          {correct} / {total}
        </p>
        <p className="text-2xl font-bold">{scorePercent}%</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 py-2.5 rounded-lg font-semibold bg-secondary text-foreground hover:bg-muted transition flex items-center justify-center gap-2 text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Retry
        </button>
        <button
          onClick={onReview}
          className="flex-1 py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-2 text-sm"
        >
          Review
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <button
        onClick={onBack}
        className="w-full py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition"
      >
        Back to List
      </button>
    </motion.div>
  );
}

// ─── Review View ──────────────────────────────────────────────────────────────

interface ListeningReviewViewProps {
  exercise: ListeningExerciseState;
  perItem: Array<{
    item: ListeningItemResponse;
    userAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
  onBack: () => void;
  onRetry: () => void;
}

function ListeningReviewView({ exercise, perItem, onBack, onRetry }: ListeningReviewViewProps) {
  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-muted transition text-sm font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Result
      </button>

      <div className="bg-card rounded-xl p-4 border border-border/50">
        <h2 className="font-bold text-foreground">Review — {exercise.title}</h2>
        <p className="text-xs text-muted-foreground">
          {perItem.filter((p) => p.isCorrect).length} correct out of {perItem.length}
        </p>
      </div>

      <div className="space-y-3">
        {perItem.map(({ item, userAnswer, correctAnswer, isCorrect }, index) => (
          <div
            key={item.id}
            className={cn(
              "rounded-xl border p-4 space-y-3",
              isCorrect
                ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20"
                : "border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0",
                  isCorrect
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-red-500/15 text-red-600",
                )}
              >
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-foreground flex-1">{item.question}</p>
              {isCorrect ? (
                <Check className="w-5 h-5 text-emerald-600" />
              ) : (
                <XIcon className="w-5 h-5 text-red-500" />
              )}
            </div>

            {item.audioUrl && (
              <audio
                controls
                preload="metadata"
                src={item.audioUrl}
                className="w-full h-10"
              />
            )}

            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Your answer</p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isCorrect ? "text-emerald-700" : "text-red-600",
                  )}
                >
                  {userAnswer ?? "—"}
                  {userAnswer &&
                    ` — ${
                      item[
                        `option${userAnswer}` as "optionA" | "optionB" | "optionC" | "optionD"
                      ] ?? ""
                    }`}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
                <p className="text-xs text-muted-foreground mb-1">Correct answer</p>
                <p className="text-sm font-semibold text-emerald-700">
                  {correctAnswer} —{" "}
                  {
                    item[
                      `option${correctAnswer}` as "optionA" | "optionB" | "optionC" | "optionD"
                    ]
                  }
                </p>
              </div>
            </div>

            {item.explanation && (
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Explanation</p>
                <p className="text-sm text-foreground">{item.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onRetry}
        className="w-full py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-2 text-sm"
      >
        <RotateCcw className="w-4 h-4" />
        Retry
      </button>
    </motion.div>
  );
}