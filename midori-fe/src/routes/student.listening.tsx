import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Headphones,
  ListChecks,
  Check,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Loader2,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { studentListeningApi } from "@/lib/api/listening";
import { cn } from "@/lib/utils";
import { createShuffledOptions, type AnswerOption } from "@/lib/quiz-utils";

type JLPTLevel = "All" | "N5" | "N4" | "N3" | "N2" | "N1";

const JLPT_LEVELS: JLPTLevel[] = ["All", "N5", "N4", "N3", "N2", "N1"];
const ITEMS_PER_PAGE = 6;

interface ListeningExercise {
  id: string;
  title: string;
  level: string;
  transcript: string;
  audioUrl?: string;
  estimatedMinutes: number | null;
  questions: {
    id: string;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation?: string;
  }[];
}

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
  const [exercises, setExercises] = useState<ListeningExercise[]>([]);
  const [selectedEx, setSelectedEx] = useState<ListeningExercise | null>(null);
  const [levelFilter, setLevelFilter] = useState<JLPTLevel>("All");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Map<string, string>>(new Map());
  const [shuffledOptions, setShuffledOptions] = useState<Map<string, AnswerOption[]>>(new Map());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const completedExercises = new Set<string>();

  const fetchExercises = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await studentListeningApi.getListeningLessons(
        levelFilter === "All" ? undefined : { level: levelFilter }
      );
      const mapped: ListeningExercise[] = list.map((item) => ({
        id: item.id,
        title: item.title,
        level: item.jlptLevel,
        transcript: item.transcript || "",
        audioUrl: item.audioUrl || undefined,
        estimatedMinutes: item.estimatedMinutes,
        questions: [],
      }));
      setExercises(mapped);
    } catch (err) {
      console.error(err);
      setError("Failed to load listening exercises.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExerciseDetail = async (exerciseId: string) => {
    setIsLoading(true);
    try {
      const detail = await studentListeningApi.getListeningLesson(exerciseId);
      const mapped: ListeningExercise = {
        id: detail.id,
        title: detail.title,
        level: detail.jlptLevel,
        transcript: detail.transcript || "",
        audioUrl: detail.audioUrl || undefined,
        estimatedMinutes: detail.estimatedMinutes,
        questions: (detail.questions || []).map((q) => ({
          id: q.id,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || undefined,
        })),
      };

      // Shuffle options for each question
      const shuffled = new Map<string, AnswerOption[]>();
      mapped.questions.forEach((q) => {
        const options = createShuffledOptions(
          q.correctAnswer,
          [q.optionA, q.optionB, q.optionC, q.optionD].filter((o) => o !== q.correctAnswer)
        );
        shuffled.set(q.id, options);
      });
      setShuffledOptions(shuffled);

      setSelectedEx(mapped);
      setSelectedAnswers(new Map());
      setIsSubmitted(false);
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
          ex.level.toLowerCase().includes(search)
      );
    }
    return result;
  }, [exercises, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredExercises.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedExercises = filteredExercises.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const handleSelectLevel = (level: JLPTLevel) => {
    setLevelFilter(level);
    setPage(1);
  };

  const handleSelectExercise = async (ex: ListeningExercise) => {
    await fetchExerciseDetail(ex.id);
  };

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    const newAnswers = new Map(selectedAnswers);
    newAnswers.set(questionId, optionId);
    setSelectedAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const handleRetry = () => {
    // Reshuffle options
    if (selectedEx) {
      const shuffled = new Map<string, AnswerOption[]>();
      selectedEx.questions.forEach((q) => {
        const options = createShuffledOptions(
          q.correctAnswer,
          [q.optionA, q.optionB, q.optionC, q.optionD].filter((o) => o !== q.correctAnswer)
        );
        shuffled.set(q.id, options);
      });
      setShuffledOptions(shuffled);
    }
    setSelectedAnswers(new Map());
    setIsSubmitted(false);
  };

  const handleBack = () => {
    setSelectedEx(null);
    setSelectedAnswers(new Map());
    setShuffledOptions(new Map());
    setIsSubmitted(false);
  };

  const handlePlayAudio = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  const score = useMemo(() => {
    if (!selectedEx || selectedAnswers.size === 0) return 0;
    let correct = 0;
    selectedEx.questions.forEach((q) => {
      const selectedId = selectedAnswers.get(q.id);
      const questionOptions = shuffledOptions.get(q.id) || [];
      const selectedOption = questionOptions.find((opt) => opt.id === selectedId);
      if (selectedOption?.isCorrect) {
        correct++;
      }
    });
    return Math.round((correct / selectedEx.questions.length) * 100);
  }, [selectedEx, selectedAnswers, shuffledOptions]);

  const isPassing = score >= 75;
  const allAnswered = selectedEx ? selectedAnswers.size === selectedEx.questions.length : false;

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
                Practice listening comprehension with multiple choice questions.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {[
                { label: "Completed", value: completedExercises.size, color: "text-green-500" },
                { label: "Total", value: exercises.length, color: "text-blue-500" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center px-3 py-2 rounded-xl bg-card/70 dark:bg-indigo-950/50 backdrop-blur-sm border border-border/50 dark:border-indigo-400/20 shadow-sm"
                >
                  <div className={`text-lg font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative flex">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setAppliedSearch(searchInput.trim());
                }
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
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* Exercise Grid */}
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
                        className={cn(
                          "relative flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all duration-300 text-left",
                          completedExercises.has(ex.id)
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                            : "bg-white/80 dark:bg-indigo-950/30 backdrop-blur-sm border-white/60 dark:border-indigo-400/20 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        )}
                      >
                        {completedExercises.has(ex.id) && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                            <Headphones className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <span
                              className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-full",
                                getLevelBoxStyle(ex.level, false).split(" ").slice(0, 2).join(" ")
                              )}
                            >
                              {ex.level}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-2">{ex.title}</h3>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ListChecks className="w-3.5 h-3.5" />
                            Quiz
                          </span>
                          {ex.estimatedMinutes && (
                            <span className="flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5" />
                              ~{ex.estimatedMinutes}m
                            </span>
                          )}
                        </div>
                        <ChevronRight className="absolute bottom-5 right-5 w-4 h-4 text-muted-foreground" />
                      </motion.button>
                    ))}
                  </div>

                  {/* Pagination */}
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
          {selectedEx && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-muted transition text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to List
              </button>

              {/* Exercise Header */}
              <div className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-foreground">{selectedEx.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedEx.questions.length} questions
                      {selectedEx.estimatedMinutes ? ` • ~${selectedEx.estimatedMinutes} min` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-1 rounded-full",
                      getLevelBoxStyle(selectedEx.level, false).split(" ").slice(0, 2).join(" ")
                    )}
                  >
                    {selectedEx.level}
                  </span>
                </div>
              </div>

              {/* Audio Player */}
              {selectedEx.audioUrl && (
                <div className="bg-card rounded-xl p-4 border border-border/50">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={handlePlayAudio}
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md transition-all",
                        isPlaying ? "bg-gradient-hero animate-pulse" : "bg-gradient-hero hover:scale-105"
                      )}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                  </div>
                  <div className="text-center mt-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs">
                      <Volume2 className="w-3 h-3" />
                      Click to play audio
                    </div>
                  </div>
                </div>
              )}

              {/* Transcript */}
              {selectedEx.transcript && (
                <div className="bg-card rounded-xl p-4 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Transcript:</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selectedEx.transcript}</p>
                </div>
              )}

              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{selectedEx.title}</span>
                <span>
                  {selectedAnswers.size}/{selectedEx.questions.length} answered
                </span>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {selectedEx.questions.map((q, qIndex) => {
                  const selectedOptionId = selectedAnswers.get(q.id);
                  const questionOptions = shuffledOptions.get(q.id) || [];

                  return (
                    <div
                      key={q.id}
                      className="bg-card rounded-xl border border-border/50 p-4 space-y-3"
                    >
                      {/* Question */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-blue-600">{qIndex + 1}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground flex-1">{q.question}</p>
                      </div>

                      {/* Options */}
                      {questionOptions.length > 0 && (
                        <div className="space-y-2 ml-11">
                          {questionOptions.map((option, optIndex) => {
                            const isSelected = selectedOptionId === option.id;
                            const isCorrectOption = option.isCorrect;

                            return (
                              <button
                                key={option.id}
                                onClick={() => handleSelectAnswer(q.id, option.id)}
                                disabled={isSubmitted}
                                className={cn(
                                  "w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all",
                                  !isSubmitted && "border-border/50 hover:border-blue-500/30 bg-card",
                                  isSubmitted && isCorrectOption && "border-sky-blue bg-sky-blue/15",
                                  isSelected && !isCorrectOption && isSubmitted && "border-red-500 bg-red-50 dark:bg-red-950/30",
                                  isSelected && !isSubmitted && "border-sky-blue bg-sky-blue/15"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0",
                                        isSelected
                                          ? "border-sky-blue bg-sky-blue text-white"
                                          : "border-border"
                                      )}
                                    >
                                      {String.fromCharCode(65 + optIndex)}
                                    </span>
                                    <span>{option.text}</span>
                                  </span>
                                  {isSubmitted && isCorrectOption && (
                                    <CheckCircle2 className="w-4 h-4 text-sky-blue" />
                                  )}
                                  {isSelected && !isCorrectOption && isSubmitted && (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation (shown after submit) */}
                      {isSubmitted && q.explanation && (
                        <div className="ml-11 p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Explanation:</p>
                          <p className="text-sm text-foreground">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit / Result */}
              {!isSubmitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2",
                    allAnswered
                      ? "bg-gradient-hero text-white hover:opacity-90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  Submit ({selectedAnswers.size}/{selectedEx.questions.length})
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Score Card */}
                  <div
                    className={cn(
                      "rounded-xl p-5 text-center shadow-lg",
                      isPassing
                        ? "bg-gradient-to-r from-sky-blue to-pink-400 text-white"
                        : "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                    )}
                  >
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                      {isPassing ? (
                        <Sparkles className="w-7 h-7 text-white" />
                      ) : (
                        <AlertCircle className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold mb-1">
                      {isPassing ? "Quiz Complete!" : "Not Quite There"}
                    </h3>
                    <div className="text-3xl font-black my-2">{score}%</div>
                    <p className="text-white/80 text-sm">
                      {isPassing ? "Great listening comprehension!" : "Minimum required: 75%"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleRetry}
                      className="flex-1 py-2.5 rounded-lg font-semibold bg-secondary text-foreground hover:bg-muted transition flex items-center justify-center gap-2 text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retry
                    </button>
                    <button
                      onClick={handleBack}
                      className="flex-1 py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-2 text-sm"
                    >
                      Back to List
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
