"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle,
  Loader2,
  RotateCcw,
  Check,
  X as XIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  studentReadingApi,
  type ReadingDetailResponse,
  type ReadingPassageResponse,
  type ReadingQuestionResponse,
  type ReadingSubmitAnswerResult,
  type ReadingSubmitResponse,
} from "@/lib/api/reading";

interface ReadingModuleProps {
  lessonNumber: number;
}

interface ReadingQuestionView {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctLetter: string;
  explanation?: string | null;
}

interface ReadingPassageView {
  id: string;
  title: string;
  passageText: string;
  questions: ReadingQuestionView[];
}

type ViewState = "list" | "quiz" | "result" | "review";

const LETTERS = ["A", "B", "C", "D"] as const;
type Letter = (typeof LETTERS)[number];

function extractTitleFromPassage(content: string | null | undefined, fallback: string): string {
  if (!content) return fallback;
  const newline = content.indexOf("\n");
  if (newline > 0) {
    const firstLine = content.substring(0, newline).trim();
    if (firstLine.length > 0 && firstLine.length <= 100) return firstLine;
  }
  return content.length > 50 ? content.substring(0, 50).trim() + "..." : content.trim();
}

function toReadingPassages(detail: ReadingDetailResponse): ReadingPassageView[] {
  const questions: ReadingQuestionResponse[] = detail.questions ?? [];
  const passages: ReadingPassageResponse[] = detail.passages ?? [];

  // ─── Legacy single-passage layout ─────────────────────────────────────────
  // No explicit passages on the lesson — collapse all questions into a single
  // synthetic passage so the student still has a place to answer them.
  if (passages.length === 0) {
    return [
      {
        id: detail.id,
        title: detail.title,
        passageText: detail.passage ?? "",
        questions: questions.map(toQuestionView),
      },
    ];
  }

  // ─── Multi-passage layout ─────────────────────────────────────────────────
  // Build a Map<passageId, questions[]> that prefers the per-passage nested
  // array (`passages[i].questions`) because that is what the backend's
  // `toPassageResponse(...)` actually populates. We only fall back to
  // grouping the lesson-level `questions[]` by `readingPassageId` if the
  // nested array is missing or empty (defensive — `readingPassageId` is not
  // populated by every backend code path, e.g. the older
  // `ReadingQuestionServiceImpl.toResponse(...)` mapper).
  const questionsByPassageId = new Map<string, ReadingQuestionResponse[]>();
  passages.forEach((p) => questionsByPassageId.set(p.id, []));

  passages.forEach((p) => {
    const nested = p.questions ?? [];
    if (nested.length > 0) {
      questionsByPassageId.set(p.id, nested);
    }
  });

  // If at least one nested array was populated, the lesson is "fully
  // populated" — questions tied to a passageId but not nested anywhere are
  // orphans and we ignore them on purpose.
  const anyNested = passages.some((p) => (p.questions ?? []).length > 0);
  if (!anyNested) {
    // Fallback: bucket the lesson-level questions by `readingPassageId`.
    questions.forEach((q) => {
      const passageId = q.readingPassageId ?? null;
      if (passageId && questionsByPassageId.has(passageId)) {
        questionsByPassageId.get(passageId)!.push(q);
      }
    });
    // If everything was unlinked (legacy data), distribute across the single
    // passage so the student can still see them.
    const totalAssigned = Array.from(questionsByPassageId.values()).reduce(
      (sum, list) => sum + list.length,
      0,
    );
    if (totalAssigned === 0 && questions.length > 0 && passages.length > 0) {
      questionsByPassageId.set(passages[0].id, questions);
    }
  }

  return passages
    .slice()
    .sort((a, b) => a.passageOrder - b.passageOrder)
    .map((p, index) => ({
      id: p.id,
      title: extractTitleFromPassage(p.title, `Passage ${p.passageOrder || index + 1}`),
      passageText: p.passage ?? "",
      questions: (questionsByPassageId.get(p.id) ?? []).map(toQuestionView),
    }));
}

function toQuestionView(q: ReadingQuestionResponse): ReadingQuestionView {
  return {
    id: q.id,
    question: q.question,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctLetter: (q.correctAnswer || "").toUpperCase().trim(),
    explanation: q.explanation ?? null,
  };
}

function getOptionText(q: ReadingQuestionView, letter: Letter | string | null | undefined): string {
  if (!letter) return "";
  switch (letter.toUpperCase()) {
    case "A":
      return q.optionA;
    case "B":
      return q.optionB;
    case "C":
      return q.optionC;
    case "D":
      return q.optionD;
    default:
      return "";
  }
}

export function ReadingModule({ lessonNumber }: ReadingModuleProps) {
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

  const passages = useMemo<ReadingPassageView[]>(
    () => (readingDetail ? toReadingPassages(readingDetail) : []),
    [readingDetail],
  );

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
  const [selectedAnswers, setSelectedAnswers] = useState<Map<string, Letter>>(new Map());
  const [submitResult, setSubmitResult] = useState<ReadingSubmitResponse | null>(null);

  // Reset transient state whenever the underlying lesson changes
  useEffect(() => {
    setViewState("list");
    setSelectedPassageId(null);
    setSelectedAnswers(new Map());
    setSubmitResult(null);
  }, [readingDetail?.id]);

  const selectedPassage =
    passages.find((p) => p.id === selectedPassageId) ?? null;

  const submitMutation = useMutation({
    mutationFn: (payload: {
      lessonId: string;
      passageId: string | null;
      answers: { questionId: string; selectedAnswer: Letter | null }[];
    }) =>
      studentReadingApi.submitReadingAnswers(payload.lessonId, {
        passageId: payload.passageId,
        answers: payload.answers.map((a) => ({
          questionId: a.questionId,
          selectedAnswer: a.selectedAnswer,
        })),
      }),
    onSuccess: (data) => {
      setSubmitResult(data);
      setViewState("result");
    },
  });

  const handleOpenPassage = (passageId: string) => {
    setSelectedPassageId(passageId);
    setSelectedAnswers(new Map());
    setSubmitResult(null);
    setViewState("quiz");
  };

  const handleBackToList = () => {
    setViewState("list");
    setSelectedPassageId(null);
    setSelectedAnswers(new Map());
    setSubmitResult(null);
  };

  const handleSelectAnswer = (questionId: string, letter: Letter) => {
    if (viewState !== "quiz") return;
    setSelectedAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, letter);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!selectedPassage || !realReadingLessonId) return;
    if (selectedPassage.questions.length === 0) return;

    const answers = selectedPassage.questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: selectedAnswers.get(q.id) ?? null,
    }));

    submitMutation.mutate({
      lessonId: realReadingLessonId,
      passageId: selectedPassage.id,
      answers,
    });
  };

  const handleRetry = () => {
    setSelectedAnswers(new Map());
    setSubmitResult(null);
    setViewState("quiz");
  };

  const handleReview = () => {
    setViewState("review");
  };

  const handleBackToResult = () => {
    setViewState("result");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[240px] gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading reading lesson...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center min-h-[240px]">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm text-foreground">Failed to load reading lesson</p>
        <p className="text-xs text-red-500">{errorMessage}</p>
      </div>
    );
  }

  if (!readingDetail || passages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center min-h-[240px]">
        <BookOpen className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-foreground">No reading passages available</p>
        <p className="text-xs text-muted-foreground">
          This lesson does not have any reading content yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {viewState === "list" && (
          <ReadingListView
            key="list"
            passages={passages}
            onOpen={handleOpenPassage}
          />
        )}

        {viewState === "quiz" && selectedPassage && (
          <ReadingQuizView
            key="quiz"
            passage={selectedPassage}
            selectedAnswers={selectedAnswers}
            onSelect={handleSelectAnswer}
            onBack={handleBackToList}
            onSubmit={handleSubmit}
            isSubmitting={submitMutation.isPending}
            submitError={submitMutation.error?.message ?? null}
          />
        )}

        {viewState === "result" && submitResult && selectedPassage && (
          <ReadingResultView
            key="result"
            passage={selectedPassage}
            result={submitResult}
            onRetry={handleRetry}
            onReview={handleReview}
            onBack={handleBackToList}
          />
        )}

        {viewState === "review" && submitResult && selectedPassage && (
          <ReadingReviewView
            key="review"
            passage={selectedPassage}
            result={submitResult}
            onBack={handleBackToResult}
            onRetry={handleRetry}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── List View ─────────────────────────────────────────────────────────────────

interface ReadingListViewProps {
  passages: ReadingPassageView[];
  onOpen: (passageId: string) => void;
}

function ReadingListView({ passages, onOpen }: ReadingListViewProps) {
  return (
    <motion.div
      key="list"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-blue/15 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-sky-blue" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">Reading Passages</h2>
            <p className="text-xs text-muted-foreground">
              {passages.length} passage{passages.length === 1 ? "" : "s"} available
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {passages.map((passage, index) => (
          <motion.button
            key={passage.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={() => onOpen(passage.id)}
            className="w-full text-left rounded-xl p-4 border bg-card border-border/50 hover:border-sky-blue/30 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-blue/15 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-sky-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                  {passage.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {passage.questions.length} question
                  {passage.questions.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(passage.id);
                }}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-gradient-hero text-white text-xs font-semibold hover:opacity-90 transition"
              >
                Open
              </button>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Quiz View ────────────────────────────────────────────────────────────────

interface ReadingQuizViewProps {
  passage: ReadingPassageView;
  selectedAnswers: Map<string, Letter>;
  onSelect: (questionId: string, letter: Letter) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

function ReadingQuizView({
  passage,
  selectedAnswers,
  onSelect,
  onBack,
  onSubmit,
  isSubmitting,
  submitError,
}: ReadingQuizViewProps) {
  const total = passage.questions.length;
  const answered = selectedAnswers.size;
  const allAnswered = total > 0 && answered === total;

  return (
    <motion.div
      key="quiz"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to passages
      </button>

      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-blue/15 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-sky-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground truncate">{passage.title}</h2>
            <p className="text-xs text-muted-foreground">
              {answered}/{total} answered
            </p>
          </div>
        </div>
      </div>

      {/* Reading text */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <span className="text-xs font-semibold text-sky-blue">Reading Text</span>
        </div>
        <div className="p-4 max-h-[320px] overflow-y-auto">
          <div
            className="text-base leading-relaxed text-foreground whitespace-pre-wrap"
            style={{ fontFamily: "var(--font-japanese, serif)" }}
          >
            {passage.passageText}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {passage.questions.map((q, index) => {
          const selectedLetter = selectedAnswers.get(q.id);
          return (
            <div
              key={q.id}
              className="bg-card rounded-xl border border-border/50 p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-blue/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-sky-blue">{index + 1}</span>
                </div>
                <p className="text-sm font-medium text-foreground flex-1">{q.question}</p>
              </div>

              <div className="space-y-2 ml-11">
                {LETTERS.map((letter) => {
                  const isSelected = selectedLetter === letter;
                  const value = getOptionText(q, letter);
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => onSelect(q.id, letter)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-2",
                        isSelected
                          ? "border-sky-blue bg-sky-blue/15"
                          : "border-border/50 hover:border-sky-blue/30 bg-card",
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
                      <span className="flex-1">{value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {submitError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20 p-3 text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!allAnswered || isSubmitting}
        className={cn(
          "w-full py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2",
          allAnswered && !isSubmitting
            ? "bg-gradient-hero text-white hover:opacity-90"
            : "bg-muted text-muted-foreground cursor-not-allowed",
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit ({answered}/{total})
          </>
        )}
      </button>
    </motion.div>
  );
}

// ─── Result View ──────────────────────────────────────────────────────────────

interface ReadingResultViewProps {
  passage: ReadingPassageView;
  result: ReadingSubmitResponse;
  onRetry: () => void;
  onReview: () => void;
  onBack: () => void;
}

function ReadingResultView({
  passage,
  result,
  onRetry,
  onReview,
  onBack,
}: ReadingResultViewProps) {
  const total = result.totalQuestions;
  const correct = result.correctAnswers;
  const wrong = result.wrongAnswers;
  const percentage = result.percentage;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 1000) / 10;

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to passages
      </button>

      <div className="rounded-xl p-6 text-center shadow-lg bg-gradient-to-r from-sky-blue to-pink-400 text-white">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold mb-1">Reading Result</h3>
        <p className="text-xs text-white/80 mb-2">{passage.title}</p>
        <p className="text-4xl font-black my-3">{accuracy}%</p>
        <p className="text-lg font-semibold">
          {correct} / {total} Correct
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Correct" value={correct} tone="emerald" />
        <StatTile label="Wrong" value={wrong} tone="rose" />
        <StatTile label="Accuracy" value={`${accuracy}%`} tone="sky" />
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
        Back to passages
      </button>
    </motion.div>
  );
}

// ─── Review View ──────────────────────────────────────────────────────────────

interface ReadingReviewViewProps {
  passage: ReadingPassageView;
  result: ReadingSubmitResponse;
  onBack: () => void;
  onRetry: () => void;
}

function ReadingReviewView({
  passage,
  result,
  onBack,
  onRetry,
}: ReadingReviewViewProps) {
  // Index questions by id so we can decorate the server response with the
  // local question text (the server already includes it, but this keeps us
  // resilient if the response order changes).
  const questionById = useMemo(() => {
    const map = new Map<string, ReadingQuestionView>();
    passage.questions.forEach((q) => map.set(q.id, q));
    return map;
  }, [passage]);

  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Result
      </button>

      <div className="bg-card rounded-xl p-4 border border-border/50">
        <h2 className="font-bold text-foreground">Review — {passage.title}</h2>
        <p className="text-xs text-muted-foreground">
          {result.correctAnswers} correct out of {result.totalQuestions}
        </p>
      </div>

      <div className="space-y-3">
        {result.answers.map((answer, index) => (
          <ReviewCard
            key={answer.questionId}
            index={index}
            answer={answer}
            localQuestion={questionById.get(answer.questionId) ?? null}
          />
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

interface ReviewCardProps {
  index: number;
  answer: ReadingSubmitAnswerResult;
  localQuestion: ReadingQuestionView | null;
}

function ReviewCard({ index, answer, localQuestion }: ReviewCardProps) {
  const isCorrect = answer.isCorrect;

  const optionText = (letter: string | null | undefined): string => {
    if (!letter) return "";
    const upper = letter.toUpperCase();
    if (answer.optionA || answer.optionB || answer.optionC || answer.optionD) {
      switch (upper) {
        case "A":
          return answer.optionA;
        case "B":
          return answer.optionB;
        case "C":
          return answer.optionC;
        case "D":
          return answer.optionD;
      }
    }
    if (localQuestion) {
      return getOptionText(localQuestion, upper);
    }
    return "";
  };

  return (
    <div
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
        <p className="text-sm font-semibold text-foreground flex-1">{answer.question}</p>
        {isCorrect ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <AnswerTile
          label="Your answer"
          letter={answer.userAnswer}
          text={optionText(answer.userAnswer) || answer.userAnswerText}
          tone={isCorrect ? "correct" : "wrong"}
        />
        <AnswerTile
          label="Correct answer"
          letter={answer.correctAnswer}
          text={optionText(answer.correctAnswer) || answer.correctAnswerText}
          tone="correct"
        />
      </div>

      {answer.explanation && (
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground mb-1">Explanation</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{answer.explanation}</p>
        </div>
      )}
    </div>
  );
}

interface AnswerTileProps {
  label: string;
  letter: string | null | undefined;
  text: string | null | undefined;
  tone: "correct" | "wrong";
}

function AnswerTile({ label, letter, text, tone }: AnswerTileProps) {
  const displayLetter = letter ? letter.toUpperCase() : null;
  const isWrongTone = tone === "wrong";

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        isWrongTone
          ? "border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20"
          : "border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20",
      )}
    >
      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
        {label}
        {displayLetter &&
          (isWrongTone ? (
            <XIcon className="w-3 h-3 text-red-500" />
          ) : (
            <Check className="w-3 h-3 text-emerald-600" />
          ))}
      </p>
      <p
        className={cn(
          "text-sm font-semibold flex items-start gap-2",
          isWrongTone ? "text-red-600" : "text-emerald-700",
        )}
      >
        <span className="shrink-0">{displayLetter ?? "—"}</span>
        <span className="flex-1">{displayLetter ? (text ? `— ${text}` : "") : "No answer"}</span>
      </p>
    </div>
  );
}

// ─── Stat Tile ────────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: number | string;
  tone: "emerald" | "rose" | "sky";
}

function StatTile({ label, value, tone }: StatTileProps) {
  const toneStyles: Record<StatTileProps["tone"], string> = {
    emerald: "text-emerald-600",
    rose: "text-red-500",
    sky: "text-sky-blue",
  };

  return (
    <div className="rounded-xl bg-card border border-border/50 p-3 text-center">
      <p className={cn("text-2xl font-black", toneStyles[tone])}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </p>
    </div>
  );
}
