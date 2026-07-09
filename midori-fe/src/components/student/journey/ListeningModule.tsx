"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones,
  Play,
  Pause,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Sparkles,
  ListChecks,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  BookText,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createShuffledOptions, type AnswerOption } from "@/lib/quiz-utils";
import {
  studentListeningApi,
  type ListeningDetailResponse,
  type ListeningQuestionResponse,
} from "@/lib/api/listening";
import { useQuery } from "@tanstack/react-query";

interface ListeningQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface ListeningModuleProps {
  lessonId: string;
  onComplete: (xpEarned: number) => void;
}

type ViewState = "list" | "detail" | "submitted";

function toListeningQuestions(detail: ListeningDetailResponse): ListeningQuestion[] {
  return (detail.questions ?? []).map((question: ListeningQuestionResponse) => ({
    id: question.id,
    question: question.question,
    options: [question.optionA, question.optionB, question.optionC, question.optionD],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation ?? undefined,
  }));
}

export function ListeningModule({ lessonId, onComplete }: ListeningModuleProps) {
  const {
    data: listeningDetail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrorObj,
  } = useQuery({
    queryKey: ["student-listening", lessonId],
    queryFn: () => studentListeningApi.getListeningLesson(lessonId),
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000,
  });

  const questions = listeningDetail ? toListeningQuestions(listeningDetail) : [];
  const isLoading = detailLoading;
  const isError = detailError;
  const errorMessage =
    detailErrorObj instanceof Error ? detailErrorObj.message : "Failed to load listening lesson.";

  const [viewState, setViewState] = useState<ViewState>("detail");
  const [selectedAnswers, setSelectedAnswers] = useState<Map<string, string>>(new Map());
  const [xpAwarded, setXpAwarded] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Map<string, { options: AnswerOption[] }>>(
    new Map()
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const answeredCount = selectedAnswers.size;
  const allAnswered = answeredCount === questions.length && questions.length > 0;
  const isPassingScore = useMemo(() => {
    if (selectedAnswers.size === 0) return false;
    let correct = 0;
    questions.forEach((q) => {
      const selectedId = selectedAnswers.get(q.id);
      const questionOptions = shuffledQuestions.get(q.id)?.options ?? [];
      const selectedOption = questionOptions.find((opt) => opt.id === selectedId);
      if (selectedOption?.isCorrect) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100) >= 75;
  }, [selectedAnswers, questions, shuffledQuestions]);

  // Shuffle questions when component mounts or questions change
  useEffect(() => {
    if (questions.length > 0) {
      const newShuffled = new Map<string, { options: AnswerOption[] }>();
      questions.forEach((q) => {
        const shuffled = createShuffledOptions(
          q.correctAnswer,
          q.options?.filter((o) => o !== q.correctAnswer) ?? []
        );
        newShuffled.set(q.id, { options: shuffled });
      });
      setShuffledQuestions(newShuffled);
    }
  }, [questions]);

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    if (viewState === "submitted") return;
    const newAnswers = new Map(selectedAnswers);
    newAnswers.set(questionId, optionId);
    setSelectedAnswers(newAnswers);
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      const selectedId = selectedAnswers.get(q.id);
      const questionOptions = shuffledQuestions.get(q.id)?.options ?? [];
      const selectedOption = questionOptions.find((opt) => opt.id === selectedId);
      if (selectedOption?.isCorrect) {
        correctCount++;
      }
    });

    if (correctCount === questions.length && !xpAwarded) {
      setXpAwarded(true);
      onComplete(100);
    }

    setViewState("submitted");
  };

  const handleRetry = () => {
    setSelectedAnswers(new Map());
    // Reshuffle options
    const newShuffled = new Map<string, { options: AnswerOption[] }>();
    questions.forEach((q) => {
      const shuffled = createShuffledOptions(
        q.correctAnswer,
        q.options?.filter((o) => o !== q.correctAnswer) ?? []
      );
      newShuffled.set(q.id, { options: shuffled });
    });
    setShuffledQuestions(newShuffled);
    setViewState("detail");
  };

  const handlePlayAudio = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  const handleBack = () => {
    setViewState("list");
    setSelectedAnswers(new Map());
  };

  const getQuestionScore = (questionId: string): boolean => {
    if (viewState !== "submitted") return false;
    const selectedId = selectedAnswers.get(questionId);
    const questionOptions = shuffledQuestions.get(questionId)?.options ?? [];
    const selectedOption = questionOptions.find((opt) => opt.id === selectedId);
    return selectedOption?.isCorrect ?? false;
  };

  const score = useMemo(() => {
    if (selectedAnswers.size === 0) return 0;
    let correct = 0;
    questions.forEach((q) => {
      const selectedId = selectedAnswers.get(q.id);
      const questionOptions = shuffledQuestions.get(q.id)?.options ?? [];
      const selectedOption = questionOptions.find((opt) => opt.id === selectedId);
      if (selectedOption?.isCorrect) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  }, [selectedAnswers, questions, shuffledQuestions]);

  // Detail View with Audio and Quiz
  const DetailView = memo(() => (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      {/* Audio Player */}
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
        {listeningDetail?.transcript && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Transcript:</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{listeningDetail.transcript}</p>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{listeningDetail?.title || "Listening Lesson"}</span>
        <span>
          {answeredCount}/{questions.length} answered
        </span>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qIndex) => {
          const selectedOptionId = selectedAnswers.get(q.id);
          const questionOptions = shuffledQuestions.get(q.id)?.options ?? [];
          const isSubmitted = viewState === "submitted";

          return (
            <div key={q.id} className="bg-card rounded-xl border border-border/50 p-4 space-y-3">
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
                  {questionOptions.map((option) => {
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
                              {String.fromCharCode(65 + questionOptions.findIndex((o) => o.id === option.id))}
                            </span>
                            <span>{option.text}</span>
                          </span>
                          {isSubmitted && isCorrectOption && <CheckCircle2 className="w-4 h-4 text-sky-blue" />}
                          {isSelected && !isCorrectOption && isSubmitted && <X className="w-4 h-4 text-red-500" />}
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

      {/* Submit Button */}
      {viewState !== "submitted" && (
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
          Submit ({answeredCount}/{questions.length})
        </button>
      )}
    </div>
  ));
  DetailView.displayName = "DetailView";

  // Submitted View
  const SubmittedView = () => {
    const isPassing = score >= 75;

    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

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
              <Trophy className="w-7 h-7 text-white" />
            ) : (
              <AlertCircle className="w-7 h-7 text-white" />
            )}
          </div>
          <h3 className="text-lg font-bold mb-1">
            {isPassing ? "Listening Complete!" : "Not Quite There"}
          </h3>
          <div className="text-3xl font-black my-2">{score}%</div>
          <p className="text-white/80 text-sm">
            {isPassing ? "Great listening comprehension!" : "Minimum required: 75%"}
          </p>
          {isPassing && xpAwarded && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-sm font-semibold mt-2">
              <Sparkles className="w-3.5 h-3.5" />
              +100 XP Earned
            </div>
          )}
        </div>

        {/* Answer Review */}
        <div className="space-y-3">
          <h3 className="font-bold text-foreground text-sm">Answer Review</h3>
          {questions.map((q, qIndex) => {
            const userAnswerId = selectedAnswers.get(q.id);
            const questionOptions = shuffledQuestions.get(q.id)?.options ?? [];
            const userAnswerOption = questionOptions.find((opt) => opt.id === userAnswerId);
            const correctOption = questionOptions.find((opt) => opt.isCorrect);
            const isCorrect = userAnswerOption?.isCorrect ?? false;

            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-xl p-3 border",
                  isCorrect
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                )}
              >
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm mb-1">
                      Q{qIndex + 1}: {q.question}
                    </p>
                    <div className="text-xs space-y-0.5">
                      <p
                        className={
                          isCorrect
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        Your answer: {userAnswerOption?.text ?? "—"}
                      </p>
                      {!isCorrect && correctOption && (
                        <p className="text-emerald-600 dark:text-emerald-400">
                          Correct: {correctOption.text}
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-muted-foreground mt-1">{q.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 py-2.5 rounded-lg font-semibold bg-secondary text-foreground hover:bg-muted transition flex items-center justify-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-blue/15 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-sky-blue" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">{listeningDetail?.title || "Listening Lesson"}</h3>
            <p className="text-xs text-muted-foreground">
              {questions.length} question{questions.length !== 1 ? "s" : ""} •{" "}
              {listeningDetail?.estimatedMinutes
                ? `~${listeningDetail.estimatedMinutes} min`
                : "Multiple Choice"}
            </p>
          </div>
          <ListChecks className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center min-h-[240px] text-sm text-muted-foreground">
          Loading listening lesson...
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-foreground">Failed to load listening lesson</p>
          <p className="text-xs text-red-500">{errorMessage}</p>
        </div>
      )}

      {!isLoading && !isError && questions.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <Headphones className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-foreground">No listening questions available</p>
          <p className="text-xs text-muted-foreground">
            This lesson does not have any questions yet.
          </p>
        </div>
      )}

      {!isLoading && !isError && questions.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewState}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {viewState === "detail" && <DetailView />}
            {viewState === "submitted" && <SubmittedView />}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
