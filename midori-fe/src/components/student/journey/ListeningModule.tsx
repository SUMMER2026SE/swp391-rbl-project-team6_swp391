"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Sparkles,
  AlertCircle,
  Headphones,
  RotateCcw,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { studentListeningApi, type ListeningDetailResponse } from "@/lib/api/listening";
import { useQuery } from "@tanstack/react-query";

interface ListeningItemView {
  id: string;
  question: string;
  audioUrl: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctLetter: string;
  explanation?: string;
}

interface ListeningModuleProps {
  lessonId: string;
}

type ListeningViewState = "list" | "quiz" | "result" | "review";

function toListeningItems(detail: ListeningDetailResponse): ListeningItemView[] {
  const items = detail.listeningItems ?? [];
  return items
    .slice()
    .sort((a, b) => a.questionOrder - b.questionOrder)
    .map((item) => ({
      id: item.id,
      question: item.question,
      audioUrl: item.audioUrl,
      optionA: item.optionA,
      optionB: item.optionB,
      optionC: item.optionC,
      optionD: item.optionD,
      correctLetter: (item.correctAnswer || "").toUpperCase().trim(),
      explanation: item.explanation ?? undefined,
    }));
}

export function ListeningModule({ lessonId }: ListeningModuleProps) {
  const {
    data: listeningLessons,
    isLoading: lessonsLoading,
    isError: lessonsError,
    error: lessonsErrorObj,
  } = useQuery({
    queryKey: ["student-listening-lessons"],
    queryFn: () => studentListeningApi.getListeningLessons(),
    staleTime: 5 * 60 * 1000,
  });

  const matchedLesson = listeningLessons?.find((item) => item.lessonId === lessonId) ?? null;
  const realListeningLessonId = matchedLesson?.id ?? null;

  const {
    data: listeningDetail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrorObj,
  } = useQuery({
    queryKey: ["student-listening", realListeningLessonId],
    queryFn: () => studentListeningApi.getListeningLesson(realListeningLessonId!),
    enabled: !!realListeningLessonId,
    staleTime: 5 * 60 * 1000,
  });

  const items = useMemo<ListeningItemView[]>(
    () => (listeningDetail ? toListeningItems(listeningDetail) : []),
    [listeningDetail],
  );

  const isLoading = lessonsLoading || detailLoading;
  const isError = lessonsError || detailError;
  const error = lessonsErrorObj ?? detailErrorObj;
  const errorMessage =
    error instanceof Error
      ? error.message
      : listeningDetail
        ? "Failed to load listening lesson."
        : "Listening lesson identifier is missing or invalid.";

  const [viewState, setViewState] = useState<ListeningViewState>("list");
  const [selectedAnswers, setSelectedAnswers] = useState<Map<string, string>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset the in-progress state when the underlying lesson changes
  useEffect(() => {
    setSelectedAnswers(new Map());
    setCurrentIndex(0);
    setViewState("list");
  }, [listeningDetail?.id]);

  const total = items.length;
  const answered = selectedAnswers.size;
  const allAnswered = total > 0 && answered === total;
  const currentItem = total > 0 ? items[Math.min(currentIndex, total - 1)] : null;

  const result = useMemo(() => {
    if (!total) return null;
    let correct = 0;
    const perItem = items.map((item) => {
      const userAnswer = selectedAnswers.get(item.id);
      const isCorrect = userAnswer?.toUpperCase().trim() === item.correctLetter;
      if (isCorrect) correct += 1;
      return { item, userAnswer: userAnswer ?? null, isCorrect };
    });
    const scorePercent = Math.round((correct / total) * 1000) / 10;
    return { correct, total, scorePercent, perItem };
  }, [items, selectedAnswers, total]);

  const handleSelectAnswer = useCallback(
    (itemId: string, letter: string) => {
      if (viewState !== "quiz") return;
      setSelectedAnswers((prev) => {
        const next = new Map(prev);
        next.set(itemId, letter);
        return next;
      });
    },
    [viewState],
  );

  const handleSubmit = useCallback(() => {
    setViewState("result");
  }, []);

  const handleRetry = useCallback(() => {
    setSelectedAnswers(new Map());
    setCurrentIndex(0);
    setViewState("list");
  }, []);

  const handleStartQuiz = useCallback(() => {
    setSelectedAnswers(new Map());
    setCurrentIndex(0);
    setViewState("quiz");
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[240px] text-sm text-muted-foreground">
        Loading listening lesson...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm text-foreground">Failed to load listening lesson</p>
        <p className="text-xs text-red-500">{errorMessage}</p>
      </div>
    );
  }

  if (!listeningDetail || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <BookOpen className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-foreground">No listening items available</p>
        <p className="text-xs text-muted-foreground">
          This lesson does not have listening items yet.
        </p>
      </div>
    );
  }

  const detail = listeningDetail;
  const safeIndex = Math.min(currentIndex, total - 1);

  return (
    <div className="space-y-4">
      {/* Lesson header */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">{detail.title}</h2>
            <p className="text-xs text-muted-foreground">{total} listening items</p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewState === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {detail.transcript && (
              <div className="bg-card rounded-xl p-4 border border-border/50 space-y-1">
                <span className="text-xs font-semibold text-foreground">Transcript</span>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {detail.transcript}
                </p>
              </div>
            )}

            <div className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-sakura" />
                <span className="text-xs font-semibold text-foreground">
                  {answered} / {total} answered
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                <motion.div
                  className="h-full bg-gradient-hero"
                  initial={{ width: 0 }}
                  animate={{ width: `${(answered / Math.max(total, 1)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => {
                const isAnswered = selectedAnswers.has(item.id);
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      setViewState("quiz");
                    }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={cn(
                      "w-full text-left rounded-xl p-4 border transition-all duration-200",
                      isAnswered
                        ? "bg-sakura/10 border-sakura/30"
                        : "bg-card border-border/50 hover:border-sakura/30 hover:shadow-md",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm text-foreground">{item.question}</div>
                        <div className="text-xs text-muted-foreground">Item {index + 1}</div>
                      </div>
                      {isAnswered ? (
                        <Check className="w-4 h-4 text-sakura" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {answered > 0 && (
              <button
                onClick={handleStartQuiz}
                className="w-full py-2.5 rounded-xl font-semibold bg-secondary text-foreground hover:bg-muted transition text-sm"
              >
                Resume from where you left off
              </button>
            )}
          </motion.div>
        )}

        {viewState === "quiz" && currentItem && (
          <motion.div
            key={`quiz-${currentItem.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <button
              onClick={() => setViewState("list")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="bg-card rounded-xl p-4 border border-border/50 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Item {safeIndex + 1} / {total}
                </span>
                <span>
                  {answered} / {total} answered
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-hero"
                  initial={{ width: 0 }}
                  animate={{ width: `${(answered / Math.max(total, 1)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
              <p className="text-sm font-semibold text-foreground">{currentItem.question}</p>

              {currentItem.audioUrl ? (
                <audio
                  ref={audioRef}
                  key={currentItem.id}
                  controls
                  preload="metadata"
                  src={currentItem.audioUrl}
                  className="w-full h-10"
                >
                  Your browser does not support the audio element.
                </audio>
              ) : (
                <p className="text-xs text-red-500">Audio is not available for this item.</p>
              )}

              <div className="space-y-2">
                {(["A", "B", "C", "D"] as const).map((letter) => {
                  const value = currentItem[`option${letter}` as "optionA" | "optionB" | "optionC" | "optionD"];
                  const isSelected = selectedAnswers.get(currentItem.id) === letter;
                  return (
                    <button
                      key={letter}
                      onClick={() => handleSelectAnswer(currentItem.id, letter)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg border text-sm transition-all flex items-center gap-2",
                        isSelected
                          ? "border-sakura bg-sakura/15"
                          : "border-border/50 hover:border-sakura/30 bg-card",
                      )}
                    >
                      <span
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0",
                          isSelected
                            ? "border-sakura bg-sakura text-white"
                            : "border-border",
                        )}
                      >
                        {letter}
                      </span>
                      <span className="flex-1">{value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                disabled={safeIndex === 0}
                className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4 inline" /> Prev
              </button>
              {safeIndex < total - 1 ? (
                <button
                  onClick={() => setCurrentIndex((idx) => Math.min(total - 1, idx + 1))}
                  className="px-4 py-2 rounded-lg bg-gradient-hero text-white hover:opacity-90 transition text-sm font-semibold"
                >
                  Next <ChevronRight className="w-4 h-4 inline" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition",
                    allAnswered
                      ? "bg-gradient-hero text-white hover:opacity-90"
                      : "bg-muted text-muted-foreground cursor-not-allowed",
                  )}
                >
                  Submit ({answered}/{total})
                </button>
              )}
            </div>
          </motion.div>
        )}

        {viewState === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="rounded-xl p-5 text-center shadow-lg bg-gradient-to-r from-sakura to-pink-400 text-white">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-1">Listening Complete</h3>
              <p className="text-2xl font-black my-2">
                {result.correct} / {result.total}
              </p>
              <p className="text-3xl font-black">{result.scorePercent}%</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 py-2.5 rounded-lg font-semibold bg-secondary text-foreground hover:bg-muted transition flex items-center justify-center gap-2 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={() => setViewState("review")}
                className="flex-1 py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-2 text-sm"
              >
                Review
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {viewState === "review" && result && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <button
              onClick={() => setViewState("result")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Result
            </button>

            <div className="bg-card rounded-xl p-4 border border-border/50">
              <h3 className="font-bold text-foreground">Review</h3>
              <p className="text-xs text-muted-foreground">
                {result.correct} correct out of {result.total}
              </p>
            </div>

            <div className="space-y-3">
              {result.perItem.map(({ item, userAnswer, isCorrect }, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border p-4 space-y-2",
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
                      <X className="w-5 h-5 text-red-500" />
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
                        {item.correctLetter} —{" "}
                        {
                          item[
                            `option${item.correctLetter}` as "optionA" | "optionB" | "optionC" | "optionD"
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
              onClick={handleRetry}
              className="w-full py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}