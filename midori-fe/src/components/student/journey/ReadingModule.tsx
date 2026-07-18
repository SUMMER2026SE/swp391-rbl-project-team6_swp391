"use client";

import { useState, useMemo, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Clock,
  Send,
  BookText,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createShuffledOptions, type AnswerOption } from "@/lib/quiz-utils";
import { studentReadingApi, type ReadingDetailResponse } from "@/lib/api/reading";
import { useQuery } from "@tanstack/react-query";

interface ReadingQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface ReadingPassage {
  id: string;
  title: string;
  passageText: string;
  questions: ReadingQuestion[];
  difficulty?: string;
  estimatedTime?: number;
}

interface ReadingModuleProps {
  lessonNumber: number;
  onComplete: (xpEarned: number) => void;
}

type ViewState = "list" | "detail" | "submitted";

function toReadingPassages(detail: ReadingDetailResponse): ReadingPassage[] {
  return [
    {
      id: detail.id,
      title: detail.title,
      passageText: detail.passage,
      questions: detail.questions.map((question) => ({
        id: question.id,
        question: question.question,
        options: [question.optionA, question.optionB, question.optionC, question.optionD],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation ?? undefined,
      })),
      difficulty: detail.difficulty ?? undefined,
      estimatedTime: detail.estimatedMinutes ?? undefined,
    },
  ];
}

export function ReadingModule({ lessonNumber, onComplete }: ReadingModuleProps) {
  const {
    data: readingLessons,
    isLoading: lessonsLoading,
    isError: lessonsError,
    error: lessonsErrorObj,
  } = useQuery({
    queryKey: ["student-reading-lessons"],
    queryFn: () => studentReadingApi.getReadingLessons(),
    staleTime: 5 * 60 * 1000,
  });

  const matchedLesson = readingLessons?.find((item) => item.lessonNumber === lessonNumber) ?? null;
  const realReadingLessonId = matchedLesson?.id ?? null;

  const {
    data: readingDetail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrorObj,
  } = useQuery({
    queryKey: ["student-reading", realReadingLessonId],
    queryFn: () => studentReadingApi.getReadingLesson(realReadingLessonId!),
    enabled: !!realReadingLessonId,
    staleTime: 5 * 60 * 1000,
  });

  const passages = readingDetail ? toReadingPassages(readingDetail) : [];
  const isLoading = lessonsLoading || detailLoading;
  const isError = lessonsError || detailError;
  const error = lessonsErrorObj ?? detailErrorObj;
  const errorMessage =
    error instanceof Error
      ? error.message
      : readingDetail
        ? "Failed to load reading lesson."
        : "Reading lesson identifier is missing or invalid.";

  const [viewState, setViewState] = useState<ViewState>("list");
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<string, string>>(new Map());
  const [completedPassages, setCompletedPassages] = useState<Set<string>>(new Set());
  const [passageScores, setPassageScores] = useState<Map<string, number>>(new Map());
  const [xpAwarded, setXpAwarded] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<
    Map<string, { options: AnswerOption[] }>
  >(new Map());

  const selectedPassage = passages.find((p) => p.id === selectedPassageId);
  const questions = selectedPassage?.questions ?? [];

  const answeredCount = selectedAnswers.size;
  const allAnswered = answeredCount === questions.length && questions.length > 0;

  const completedCount = completedPassages.size;
  const totalQuestions = passages.reduce((sum, p) => sum + p.questions.length, 0);

  const isAllComplete = completedCount === passages.length && passages.length > 0;
  const isPassingScore = useMemo(() => {
    if (passageScores.size === 0) return false;
    const scores = Array.from(passageScores.values());
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avgScore >= 75;
  }, [passageScores]);

  // Shuffle questions when passage is selected
  useEffect(() => {
    if (selectedPassage && viewState === "detail") {
      const newShuffled = new Map<string, { options: AnswerOption[] }>();
      selectedPassage.questions.forEach((q) => {
        const shuffled = createShuffledOptions(
          q.correctAnswer,
          q.options?.filter((o) => o !== q.correctAnswer) ?? [],
        );
        newShuffled.set(q.id, { options: shuffled });
      });
      setShuffledQuestions(newShuffled);
    }
  }, [selectedPassageId, viewState]);

  const handleSelectPassage = (passageId: string) => {
    setSelectedPassageId(passageId);
    setSelectedAnswers(new Map());
    setViewState("detail");
  };

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    if (viewState === "submitted") return;
    const newAnswers = new Map(selectedAnswers);
    newAnswers.set(questionId, optionId);
    setSelectedAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (!selectedPassage) return;

    let correctCount = 0;
    selectedPassage.questions.forEach((q) => {
      const selectedId = selectedAnswers.get(q.id);
      const questionOptions = shuffledQuestions.get(q.id)?.options ?? [];
      const selectedOption = questionOptions.find((opt) => opt.id === selectedId);
      if (selectedOption?.isCorrect) {
        correctCount++;
      }
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100);

    const newScores = new Map(passageScores);
    newScores.set(selectedPassage.id, scorePercent);
    setPassageScores(newScores);

    const newCompleted = new Set(completedPassages);
    newCompleted.add(selectedPassage.id);
    setCompletedPassages(newCompleted);

    if (newCompleted.size === passages.length && !xpAwarded) {
      setXpAwarded(true);
      onComplete(100);
    }

    setViewState("submitted");
  };

  const handleRetry = () => {
    if (!selectedPassage) return;
    setSelectedAnswers(new Map());
    setViewState("detail");
  };

  const handleBackToList = () => {
    setViewState("list");
    setSelectedPassageId(null);
    setSelectedAnswers(new Map());
  };

  const getQuestionScore = (questionId: string): number => {
    if (viewState !== "submitted" || !selectedPassage) return 0;
    const selectedId = selectedAnswers.get(questionId);
    const questionOptions = shuffledQuestions.get(questionId)?.options ?? [];
    const selectedOption = questionOptions.find((opt) => opt.id === selectedId);
    return selectedOption?.isCorrect ? 1 : 0;
  };

  // Passage List View
  const ListView = () => (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">Reading Progress</h3>
          <span className="text-xs text-muted-foreground">
            {completedCount} / {passages.length} Passages
          </span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-hero"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / Math.max(passages.length, 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        {passageScores.size > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Average score:{" "}
            {Math.round(
              Array.from(passageScores.values()).reduce((a, b) => a + b, 0) / passageScores.size,
            )}
            % (minimum: 75%)
          </div>
        )}
      </div>

      {/* Passage Cards */}
      <div className="space-y-3">
        {passages.map((passage, index) => {
          const isCompleted = completedPassages.has(passage.id);
          const passageScore = passageScores.get(passage.id);

          return (
            <motion.button
              key={passage.id}
              onClick={() => handleSelectPassage(passage.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "w-full text-left rounded-xl p-4 border transition-all duration-200",
                isCompleted
                  ? passageScore !== undefined && passageScore >= 75
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                  : "bg-card border-border/50 hover:border-sky-blue/30 hover:shadow-md",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    isCompleted
                      ? passageScore !== undefined && passageScore >= 75
                        ? "bg-emerald-500 text-white"
                        : "bg-red-500 text-white"
                      : "bg-sky-blue/15 text-sky-blue",
                  )}
                >
                  {isCompleted ? (
                    passageScore !== undefined && passageScore >= 75 ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )
                  ) : (
                    <BookOpen className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {passage.title}
                    </h3>
                    {isCompleted && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                          passageScore !== undefined && passageScore >= 75
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-red-500/15 text-red-600",
                        )}
                      >
                        {passageScore !== undefined && passageScore >= 75 ? "Passed" : "Retry"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {passage.estimatedTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />~{passage.estimatedTime} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <BookText className="w-3 h-3" />
                      {passage.questions.length} questions
                    </span>
                    {passage.difficulty && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {passage.difficulty}
                      </span>
                    )}
                    {passageScore !== undefined && (
                      <span
                        className={cn(
                          "font-semibold",
                          passageScore >= 75 ? "text-emerald-600" : "text-red-600",
                        )}
                      >
                        Score: {passageScore}%
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  // Passage Detail View (Split Layout)
  const DetailView = memo(() => {
    if (!selectedPassage) return null;

    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to passages
        </button>

        {/* Progress */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{selectedPassage.title}</span>
          <span>
            {answeredCount}/{questions.length} answered
          </span>
        </div>

        {/* Split Layout */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* LEFT - Reading Passage */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-blue/15 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-sky-blue" />
                </div>
                <span className="text-xs font-semibold text-sky-blue">Reading Passage</span>
              </div>
            </div>
            <div className="p-4 lg:p-6 max-h-[500px] overflow-y-auto">
              <div
                className="text-base leading-relaxed text-foreground whitespace-pre-wrap"
                style={{ fontFamily: "var(--font-japanese, serif)" }}
              >
                {selectedPassage.passageText}
              </div>
            </div>
          </div>

          {/* RIGHT - Questions */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-blue">Questions</span>
                <span className="text-xs text-muted-foreground">
                  {answeredCount}/{questions.length}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {questions.map((q, qIndex) => {
                const selectedOptionId = selectedAnswers.get(q.id);
                const questionOptions = shuffledQuestions.get(q.id)?.options ?? [];

                return (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      {qIndex + 1}. {q.question}
                    </p>
                    {questionOptions.length > 0 && (
                      <div className="space-y-1.5">
                        {questionOptions.map((option) => {
                          const isSelected = selectedOptionId === option.id;
                          const isSubmitted = viewState === "submitted";

                          return (
                            <button
                              key={option.id}
                              onClick={() => handleSelectAnswer(q.id, option.id)}
                              disabled={isSubmitted}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-lg border text-sm transition-all",
                                !isSubmitted && "border-border/50 hover:border-sky-blue/30 bg-card",
                                isSubmitted && option.isCorrect && "border-sky-blue bg-sky-blue/15",
                                isSelected &&
                                  !option.isCorrect &&
                                  isSubmitted &&
                                  "border-red-500 bg-red-50 dark:bg-red-950/30",
                                isSelected && !isSubmitted && "border-sky-blue bg-sky-blue/15",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0",
                                    isSelected
                                      ? "border-sky-blue bg-sky-blue text-white"
                                      : "border-border",
                                  )}
                                >
                                  {String.fromCharCode(
                                    65 + questionOptions.findIndex((o) => o.id === option.id),
                                  )}
                                </span>
                                <span className="flex-1">{option.text}</span>
                                {isSubmitted && option.isCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-sky-blue" />
                                )}
                                {isSelected && !option.isCorrect && isSubmitted && (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Send className="w-4 h-4" />
            Submit ({answeredCount}/{questions.length})
          </button>
        )}
      </div>
    );
  });
  DetailView.displayName = "DetailView";

  // Submitted View
  const SubmittedView = () => {
    if (!selectedPassage) return null;
    const isPassing = (passageScores.get(selectedPassage.id) ?? 0) >= 75;

    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to passages
        </button>

        {/* Score Card */}
        <div
          className={cn(
            "rounded-xl p-5 text-center shadow-lg",
            isPassing
              ? "bg-gradient-to-r from-sky-blue to-pink-400 text-white"
              : "bg-gradient-to-r from-red-500 to-orange-500 text-white",
          )}
        >
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            {isPassing ? (
              <Trophy className="w-7 h-7 text-white" />
            ) : (
              <AlertCircle className="w-7 h-7 text-white" />
            )}
          </div>
          <h3 className={cn("text-lg font-bold mb-1", isPassing ? "text-white" : "text-white")}>
            {isPassing ? "Passage Complete!" : "Not Quite There"}
          </h3>
          <div className="text-3xl font-black my-2">{passageScores.get(selectedPassage.id)}%</div>
          <p className="text-white/80 text-sm">
            {isPassing ? "Great reading comprehension!" : "Minimum required: 75%"}
          </p>
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
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
                )}
              >
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
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
          <button
            onClick={handleBackToList}
            className="flex-1 py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-2 text-sm"
          >
            {isAllComplete ? "Complete" : "Next Passage"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="flex items-center justify-center min-h-[240px] text-sm text-muted-foreground">
          Loading reading lesson...
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-foreground">Failed to load reading lesson</p>
          <p className="text-xs text-red-500">{errorMessage}</p>
        </div>
      )}

      {!isLoading && !isError && passages.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-foreground">No reading passages available</p>
          <p className="text-xs text-muted-foreground">
            This lesson does not have any reading content yet.
          </p>
        </div>
      )}

      {!isLoading && !isError && passages.length > 0 && (
        <>
          {/* Learning Progress Steps */}
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
            {/* Reading List Step */}
            <button
              onClick={() => {
                if (viewState !== "detail" && viewState !== "submitted") {
                  setViewState("list");
                }
              }}
              disabled={viewState === "detail" || viewState === "submitted"}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1",
                viewState === "list"
                  ? "bg-card text-foreground shadow-sm"
                  : completedCount === passages.length && isPassingScore
                    ? "bg-sky-blue/15 text-sky-blue"
                    : "text-muted-foreground",
              )}
            >
              {completedCount === passages.length && isPassingScore ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <BookOpen className="w-3 h-3" />
              )}
              Passages
            </button>

            {/* Current Passage Step */}
            {selectedPassage && (
              <button
                disabled={viewState !== "detail" && viewState !== "submitted"}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1 truncate",
                  viewState === "detail" || viewState === "submitted"
                    ? "bg-card text-foreground shadow-sm"
                    : completedPassages.has(selectedPassage.id)
                      ? "bg-sky-blue/15 text-sky-blue"
                      : "text-muted-foreground",
                )}
              >
                {completedPassages.has(selectedPassage.id) ? (
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                ) : viewState === "submitted" ? (
                  <Trophy className="w-3 h-3 shrink-0" />
                ) : (
                  <BookText className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">{selectedPassage.title}</span>
              </button>
            )}
          </div>

          {/* Completion Status */}
          {passages.length > 1 && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground bg-card rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-blue" />
                <span>
                  Passages: {completedCount}/{passages.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookText className="w-3.5 h-3.5 text-sky-blue" />
                <span>
                  Questions: {totalQuestions}/{totalQuestions}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy
                  className={cn(
                    "w-3.5 h-3.5",
                    isPassingScore ? "text-emerald-500" : "text-muted-foreground",
                  )}
                />
                <span className={isPassingScore ? "text-emerald-600 font-semibold" : ""}>
                  {isPassingScore ? "Passed" : "Min 75%"}
                </span>
              </div>
            </div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewState}-${selectedPassageId}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {viewState === "list" && <ListView />}
              {viewState === "detail" && <DetailView />}
              {viewState === "submitted" && <SubmittedView />}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
