"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
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
  Mic,
  ListChecks,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { type QuizQuestion } from "@/mock/student-learning-journey";
import { cn } from "@/lib/utils";
import { createShuffledOptions, type AnswerOption } from "@/lib/quiz-utils";

interface ListeningModuleProps {
  questions: QuizQuestion[];
  onComplete: (xpEarned: number) => void;
}

type LearningStep = "dictation" | "multiple_choice" | "listening_complete";
type PracticeMode = "dictation" | "multiple_choice";

interface DictationViewProps {
  dictationAnswer: string;
  setDictationAnswer: (value: string) => void;
  dictationChecked: boolean;
  dictationCorrect: boolean;
  currentQuestion: QuizQuestion | undefined;
  questionsLength: number;
  currentQuestionIndex: number;
  progress: number;
  isPlaying: boolean;
  isLastQuestion: boolean;
  completedMultipleChoice: boolean;
  handlePlayAudio: () => void;
  handleCheckDictation: () => void;
  handleResetDictation: () => void;
  handleNextDictation: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface MultipleChoiceViewProps {
  currentQuestion: QuizQuestion | undefined;
  questionsLength: number;
  currentQuestionIndex: number;
  progress: number;
  isPlaying: boolean;
  quizAnswer: string | null;
  isCorrect: boolean | null;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  completedDictation: boolean;
  shuffledOptions: AnswerOption[];
  handlePlayAudio: () => void;
  handleQuizAnswer: (optionId: string) => void;
  handlePrevious: () => void;
  handleNext: () => void;
}

const DictationView = memo(function DictationView({
  dictationAnswer,
  setDictationAnswer,
  dictationChecked,
  dictationCorrect,
  currentQuestion,
  questionsLength,
  currentQuestionIndex,
  progress,
  isPlaying,
  isLastQuestion,
  completedMultipleChoice,
  handlePlayAudio,
  handleCheckDictation,
  handleResetDictation,
  handleNextDictation,
  inputRef,
}: DictationViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-2">
          Dictation {currentQuestionIndex + 1} of {questionsLength}
        </div>
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Audio Player */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center justify-center">
          <button
            onClick={handlePlayAudio}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md transition-all",
              isPlaying
                ? "bg-gradient-hero animate-pulse"
                : "bg-gradient-hero hover:scale-105"
            )}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
        </div>

        <div className="text-center mt-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs">
            <Volume2 className="w-3 h-3" />
            Click to play audio
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide mb-1">
          Dictation
        </div>
        <div className="text-base font-medium text-foreground">
          Listen carefully and type what you hear.
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <textarea
          ref={inputRef}
          value={dictationAnswer}
          onChange={(e) => setDictationAnswer(e.target.value)}
          placeholder="Type what you hear..."
          disabled={dictationChecked}
          className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm resize-none outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60 transition-all"
          rows={2}
        />

        {!dictationChecked ? (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCheckDictation}
              disabled={!dictationAnswer.trim()}
              className={cn(
                "flex-1 py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 text-sm",
                dictationAnswer.trim()
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Check className="w-4 h-4" />
              Check Answer
            </button>
            <button
              onClick={handleResetDictation}
              className="px-4 py-2.5 rounded-lg font-semibold bg-secondary text-foreground hover:bg-muted transition flex items-center justify-center gap-1.5 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className={cn(
              "p-4 rounded-xl border",
              dictationCorrect
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
            )}>
              <div className={cn(
                "flex items-center gap-2 font-bold text-sm",
                dictationCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {dictationCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Excellent! Perfect score!
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5" />
                    Not quite right. Try again!
                  </>
                )}
              </div>

              {!dictationCorrect && (
                <div className="mt-3 pt-3 border-t border-current/20">
                  <p className="text-xs text-muted-foreground mb-1">Correct answer:</p>
                  <p className="font-semibold text-foreground">{currentQuestion?.correctAnswer}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleResetDictation}
                className="px-4 py-2.5 rounded-lg font-semibold bg-secondary text-foreground hover:bg-muted transition flex items-center justify-center gap-1.5 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={handleNextDictation}
                className="flex-1 py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-1.5 text-sm"
              >
                {isLastQuestion ? (completedMultipleChoice ? "Complete" : "Go to Quiz") : "Next"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});
DictationView.displayName = "DictationView";

const MultipleChoiceView = memo(function MultipleChoiceView({
  currentQuestion,
  questionsLength,
  currentQuestionIndex,
  progress,
  isPlaying,
  quizAnswer,
  isCorrect,
  isFirstQuestion,
  isLastQuestion,
  completedDictation,
  shuffledOptions,
  handlePlayAudio,
  handleQuizAnswer,
  handlePrevious,
  handleNext,
}: MultipleChoiceViewProps) {
  const correctOptionId = shuffledOptions.find(opt => opt.isCorrect)?.id;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-2">
          Question {currentQuestionIndex + 1} of {questionsLength}
        </div>
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Audio Player */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center justify-center">
          <button
            onClick={handlePlayAudio}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md transition-all",
              isPlaying
                ? "bg-gradient-hero animate-pulse"
                : "bg-gradient-hero hover:scale-105"
            )}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
        </div>

        <div className="text-center mt-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs">
            <Volume2 className="w-3 h-3" />
            Click to play audio
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-1">
          Question
        </div>
        <div className="text-base font-medium text-foreground">
          {currentQuestion?.question}
        </div>
      </div>

      {/* Options */}
      {shuffledOptions.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {shuffledOptions.map((option) => {
            const isSelected = quizAnswer === option.id;
            const showCorrect = quizAnswer !== null && option.isCorrect;
            const showWrong = quizAnswer === option.id && !isCorrect;

            return (
              <button
                key={option.id}
                onClick={() => handleQuizAnswer(option.id)}
                disabled={quizAnswer !== null}
                className={cn(
                  "p-3 rounded-lg border transition-all text-left font-medium text-sm",
                  quizAnswer === null && "border-border/50 hover:border-blue-500/30 bg-card hover:bg-accent/30",
                  showCorrect && "border-primary bg-primary/10 text-primary",
                  showWrong && "border-destructive bg-destructive/10 text-destructive"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{option.text}</span>
                  {isSelected && (
                    isCorrect ? <Check className="w-4 h-4 text-primary" /> : <X className="w-4 h-4 text-destructive" />
                  )}
                  {showCorrect && !isSelected && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {quizAnswer !== null && (
        <div className="flex gap-2">
          <button
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            className={cn(
              "flex-1 py-2.5 rounded-lg font-semibold transition flex items-center justify-center text-sm",
              isFirstQuestion
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-secondary text-foreground hover:bg-muted"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-1.5 text-sm"
          >
            {isLastQuestion ? (completedDictation ? "Complete" : "Go to Dictation") : "Next"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
});
MultipleChoiceView.displayName = "MultipleChoiceView";

export function ListeningModule({ questions, onComplete }: ListeningModuleProps) {
  const [learningStep, setLearningStep] = useState<LearningStep>("dictation");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>("dictation");
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dictationAnswer, setDictationAnswer] = useState("");
  const [dictationChecked, setDictationChecked] = useState(false);
  const [dictationCorrect, setDictationCorrect] = useState(false);
  const [completedDictation, setCompletedDictation] = useState(false);
  const [completedMultipleChoice, setCompletedMultipleChoice] = useState(false);
  const [score, setScore] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<AnswerOption[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dictationInputRef = useRef<HTMLTextAreaElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentDuration, setDuration] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const listeningProgress = (() => {
    let completed = 0;
    if (completedDictation) completed++;
    if (completedMultipleChoice) completed++;
    return completed;
  })();

  const isListeningComplete = completedDictation && completedMultipleChoice;
  const isPassingScore = score >= 75;

  // Shuffle options ONLY when entering multiple_choice mode or question changes
  useEffect(() => {
    if (learningStep === "multiple_choice" && currentQuestion?.options && shuffledOptions.length === 0) {
      const opts = createShuffledOptions(
        currentQuestion.correctAnswer,
        currentQuestion.options.filter(o => o !== currentQuestion.correctAnswer)
      );
      setShuffledOptions(opts);
    }
  }, [learningStep, currentQuestionIndex, currentQuestion, shuffledOptions.length]);

  // Reset shuffled options when leaving multiple_choice
  useEffect(() => {
    if (learningStep !== "multiple_choice") {
      setShuffledOptions([]);
    }
  }, [learningStep]);

  const handlePlayAudio = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  const handleQuizAnswer = (optionId: string) => {
    if (selectedAnswerId !== null) return;
    setSelectedAnswerId(optionId);
    const selectedOption = shuffledOptions.find(opt => opt.id === optionId);
    const correct = selectedOption?.isCorrect ?? false;
    setIsCorrect(correct);
    if (correct) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const totalCorrect = correctAnswers + (isCorrect ? 1 : 0);
      const newScore = Math.round((totalCorrect / questions.length) * 100);
      setScore(newScore);
      setCompletedMultipleChoice(true);

      if (completedDictation && !xpAwarded) {
        setXpAwarded(true);
        onComplete(100);
      }
      setLearningStep("listening_complete");
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerId(null);
      setIsCorrect(null);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswerId(null);
      setIsCorrect(null);
    }
  };

  const handleSelectMode = (mode: PracticeMode) => {
    setSelectedMode(mode);
    setCurrentQuestionIndex(0);
    setSelectedAnswerId(null);
    setIsCorrect(null);
    setDictationAnswer("");
    setDictationChecked(false);
    setDictationCorrect(false);
    setLearningStep(mode);
  };

  const handleCheckDictation = useCallback(() => {
    if (!dictationAnswer.trim()) return;
    setDictationChecked(true);
    const cleanAnswer = dictationAnswer.trim().toLowerCase();
    const cleanCorrect = (currentQuestion?.correctAnswer || "").trim().toLowerCase();
    const isAnswerCorrect = cleanAnswer === cleanCorrect;
    setDictationCorrect(isAnswerCorrect);
    if (isAnswerCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
  }, [dictationAnswer, currentQuestion]);

  const handleNextDictation = () => {
    if (isLastQuestion) {
      setCompletedDictation(true);
      if (completedMultipleChoice && !xpAwarded) {
        setXpAwarded(true);
        onComplete(100);
      }
      setLearningStep("listening_complete");
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setDictationAnswer("");
      setDictationChecked(false);
      setDictationCorrect(false);
    }
  };

  const handleResetDictation = useCallback(() => {
    setDictationAnswer("");
    setDictationChecked(false);
    setDictationCorrect(false);
    dictationInputRef.current?.focus();
  }, []);

  const CompleteView = memo(() => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <div className={cn(
        "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
        isPassingScore ? "bg-sakura/15" : "bg-red-100 dark:bg-red-950/30"
      )}>
        {isPassingScore ? (
          <Sparkles className="w-8 h-8 text-sakura" />
        ) : (
          <AlertCircle className="w-8 h-8 text-red-500" />
        )}
      </div>

      <h2 className={cn(
        "text-xl font-bold mb-1",
        isPassingScore ? "text-foreground" : "text-red-600 dark:text-red-400"
      )}>
        {isPassingScore ? "Listening Mastered!" : "Not Quite There"}
      </h2>

      <p className="text-sm text-muted-foreground mb-3">
        Score: {score}% (minimum required: 75%)
      </p>

      {isPassingScore && xpAwarded && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sakura/15 text-sakura text-sm font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          +100 XP Earned
        </div>
      )}

      {!isPassingScore && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-3">
            Complete both activities with 75% or higher to pass.
          </p>
          <div className="flex gap-2 max-w-xs mx-auto">
            <button
              onClick={() => handleSelectMode("dictation")}
              className="flex-1 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium"
            >
              Retry Dictation
            </button>
            <button
              onClick={() => handleSelectMode("multiple_choice")}
              className="flex-1 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium"
            >
              Retry Quiz
            </button>
          </div>
        </div>
      )}
    </motion.div>
  ));
  CompleteView.displayName = "CompleteView";

  return (
    <div className="space-y-4">
      {/* Listening Progress */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">Listening Progress</h3>
          <span className="text-xs text-muted-foreground">
            {listeningProgress} / 2 Completed
          </span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-hero"
            initial={{ width: 0 }}
            animate={{ width: `${(listeningProgress / 2) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        {score > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Current score: {score}% (minimum: 75%)
          </div>
        )}
      </div>

      {/* Learning Progress Steps */}
      <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
        {/* Dictation Tab */}
        <button
          onClick={() => handleSelectMode("dictation")}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1",
            learningStep === "dictation"
              ? "bg-card text-foreground shadow-sm"
              : completedDictation
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground hover:text-foreground"
          )}
        >
          {completedDictation ? (
            <Check className="w-3 h-3" />
          ) : (
            <Mic className="w-3 h-3" />
          )}
          Dictation
        </button>

        {/* Multiple Choice Tab */}
        <button
          onClick={() => handleSelectMode("multiple_choice")}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1",
            learningStep === "multiple_choice"
              ? "bg-card text-foreground shadow-sm"
              : completedMultipleChoice
                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground"
          )}
        >
          {completedMultipleChoice ? (
            <Check className="w-3 h-3" />
          ) : (
            <ListChecks className="w-3 h-3" />
          )}
          Quiz
        </button>
      </div>

      {/* Completion Status */}
      <div className="grid grid-cols-2 gap-2">
        <div className={cn(
          "p-3 rounded-lg border text-center",
          completedDictation
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
            : "bg-card border-border/50"
        )}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-foreground">Dictation</span>
          </div>
          <div className={cn(
            "text-xs font-medium",
            completedDictation ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
          )}>
            {completedDictation ? "Completed" : "Not Started"}
          </div>
        </div>
        <div className={cn(
          "p-3 rounded-lg border text-center",
          completedMultipleChoice
            ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
            : "bg-card border-border/50"
        )}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ListChecks className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-foreground">Multiple Choice</span>
          </div>
          <div className={cn(
            "text-xs font-medium",
            completedMultipleChoice ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
          )}>
            {completedMultipleChoice ? "Completed" : "Not Started"}
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {learningStep === "dictation" && (
          <DictationView
            key="dictation-content"
            dictationAnswer={dictationAnswer}
            setDictationAnswer={setDictationAnswer}
            dictationChecked={dictationChecked}
            dictationCorrect={dictationCorrect}
            currentQuestion={currentQuestion}
            questionsLength={questions.length}
            currentQuestionIndex={currentQuestionIndex}
            progress={progress}
            isPlaying={isPlaying}
            isLastQuestion={isLastQuestion}
            completedMultipleChoice={completedMultipleChoice}
            handlePlayAudio={handlePlayAudio}
            handleCheckDictation={handleCheckDictation}
            handleResetDictation={handleResetDictation}
            handleNextDictation={handleNextDictation}
            inputRef={dictationInputRef}
          />
        )}
        {learningStep === "multiple_choice" && (
          <MultipleChoiceView
            key={`mc-${currentQuestionIndex}`}
            currentQuestion={currentQuestion}
            questionsLength={questions.length}
            currentQuestionIndex={currentQuestionIndex}
            progress={progress}
            isPlaying={isPlaying}
            quizAnswer={selectedAnswerId}
            isCorrect={isCorrect}
            isFirstQuestion={isFirstQuestion}
            isLastQuestion={isLastQuestion}
            completedDictation={completedDictation}
            shuffledOptions={shuffledOptions}
            handlePlayAudio={handlePlayAudio}
            handleQuizAnswer={handleQuizAnswer}
            handlePrevious={handlePrevious}
            handleNext={handleNext}
          />
        )}
        {learningStep === "listening_complete" && <CompleteView key="complete-view" />}
      </AnimatePresence>
    </div>
  );
}
