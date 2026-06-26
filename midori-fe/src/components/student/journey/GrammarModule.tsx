"use client";

import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
} from "lucide-react";
import { type GrammarPattern } from "@/mock/student-learning-journey";
import { cn } from "@/lib/utils";
import { createShuffledOptions, type AnswerOption } from "@/lib/quiz-utils";

interface GrammarModuleProps {
  grammar: GrammarPattern[];
  onComplete: (xpEarned: number) => void;
}

type LearningStep = "theory" | "theory_complete" | "quiz" | "complete";

export function GrammarModule({ grammar, onComplete }: GrammarModuleProps) {
  const [learningStep, setLearningStep] = useState<LearningStep>("theory");
  const [theoryIndex, setTheoryIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctQuizAnswers, setCorrectQuizAnswers] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<AnswerOption[]>([]);

  const currentPattern = grammar[theoryIndex];
  const isLastTheoryPattern = theoryIndex === grammar.length - 1;
  const isFirstTheoryPattern = theoryIndex === 0;
  const theoryProgress = ((theoryIndex + 1) / grammar.length) * 100;

  const quizProgress = ((quizIndex + 1) / grammar.length) * 100;
  const isLastQuiz = quizIndex === grammar.length - 1;
  const isFirstQuiz = quizIndex === 0;

  const isPassingScore = finalScore >= 75;

  // Shuffle options when quiz starts or question changes
  useEffect(() => {
    if (learningStep === "quiz" && grammar.length > 0) {
      const correctExample = currentPattern.examples[0];
      const wrongExamples = [
        "私は元気です。(I am fine.)",
        "明日学校があります。(There is school tomorrow.)",
        "これが apple です。(This is apple.)",
      ];
      const shuffled = createShuffledOptions(correctExample, wrongExamples);
      setShuffledOptions(shuffled);
    }
  }, [learningStep, quizIndex, grammar, currentPattern]);

  const handleTheoryNext = () => {
    if (isLastTheoryPattern) {
      setLearningStep("theory_complete");
    } else {
      setTheoryIndex((prev) => prev + 1);
    }
  };

  const handleTheoryPrevious = () => {
    if (!isFirstTheoryPattern) {
      setTheoryIndex((prev) => prev - 1);
    }
  };

  const handleQuizAnswer = (optionId: string) => {
    if (selectedAnswerId !== null) return;
    setSelectedAnswerId(optionId);
    const selectedOption = shuffledOptions.find((opt) => opt.id === optionId);
    const correct = selectedOption?.isCorrect ?? false;
    setIsCorrect(correct);
    if (correct) {
      setCorrectQuizAnswers((prev) => prev + 1);
    }
  };

  const handleQuizNext = () => {
    if (isLastQuiz) {
      const totalCorrect = correctQuizAnswers + (isCorrect ? 1 : 0);
      const score = Math.round((totalCorrect / grammar.length) * 100);
      setFinalScore(score);

      if (score >= 75 && !xpAwarded) {
        setXpAwarded(true);
        onComplete(100);
      }
      setLearningStep("complete");
    } else {
      setQuizIndex((prev) => prev + 1);
      setSelectedAnswerId(null);
      setIsCorrect(null);
    }
  };

  const handleQuizPrevious = () => {
    if (!isFirstQuiz) {
      setQuizIndex((prev) => prev + 1);
      setSelectedAnswerId(null);
      setIsCorrect(null);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setSelectedAnswerId(null);
    setIsCorrect(null);
    setCorrectQuizAnswers(0);
    setFinalScore(0);
  };

  const TheoryView = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-2">
          Learn {theoryIndex + 1} of {grammar.length}
        </div>
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-hero"
            initial={{ width: 0 }}
            animate={{ width: `${theoryProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Pattern Card */}
      <div className="bg-card rounded-xl p-5 border border-border/50">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-lavender/20 text-lavender text-xs font-semibold mb-3">
            <GraduationCap className="w-3.5 h-3.5" />
            Grammar Pattern
          </div>
          <div
            className="text-2xl md:text-3xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-japanese, serif)" }}
          >
            {currentPattern.pattern}
          </div>
        </div>

        <div className="border-t border-border/50 pt-4">
          <div className="text-[10px] text-lavender font-semibold uppercase tracking-wide mb-2">
            Explanation
          </div>
          <div className="text-sm text-foreground leading-relaxed">
            {currentPattern.explanation}
          </div>
        </div>
      </div>

      {/* Examples Card */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="text-[10px] text-lavender font-semibold uppercase tracking-wide mb-3">
          Examples
        </div>
        <div className="space-y-2">
          {currentPattern.examples.map((example, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-2.5 rounded-lg bg-muted/50"
            >
              <div
                className="text-sm font-medium text-foreground mb-0.5"
                style={{ fontFamily: "var(--font-japanese, serif)" }}
              >
                {example.split("(")[0].trim()}
              </div>
              {example.includes("(") && (
                <div className="text-xs text-muted-foreground">
                  {example.split("(")[1].replace(")", "")}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleTheoryPrevious}
          disabled={isFirstTheoryPattern}
          className={cn(
            "flex-1 py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 text-sm",
            isFirstTheoryPattern
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-secondary text-foreground hover:bg-muted",
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={handleTheoryNext}
          className="flex-1 py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-1.5 text-sm"
        >
          {isLastTheoryPattern ? "Complete Theory" : "Next"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const TheoryCompleteView = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lavender/20 flex items-center justify-center">
        <Unlock className="w-8 h-8 text-lavender" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Theory Complete!</h2>
      <p className="text-sm text-muted-foreground mb-5">
        You learned all {grammar.length} grammar patterns. Ready for practice?
      </p>
      <button
        onClick={() => {
          resetQuiz();
          setLearningStep("quiz");
        }}
        className="w-full py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-1.5 text-sm"
      >
        Start Practice
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );

  const QuizView = memo(() => {
    const correctOptionId = shuffledOptions.find((opt) => opt.isCorrect)?.id;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-2">
            Practice {quizIndex + 1} of {grammar.length}
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-hero"
              initial={{ width: 0 }}
              animate={{ width: `${quizProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
          <div className="text-[10px] text-lavender font-semibold uppercase tracking-wide mb-1">
            Which sentence uses this pattern correctly?
          </div>
          <div
            className="text-xl md:text-2xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-japanese, serif)" }}
          >
            {currentPattern.pattern}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {shuffledOptions.map((option) => {
            const isSelected = selectedAnswerId === option.id;
            const showCorrect = selectedAnswerId !== null && option.isCorrect;
            const showWrong = selectedAnswerId === option.id && !isCorrect;

            return (
              <button
                key={option.id}
                onClick={() => handleQuizAnswer(option.id)}
                disabled={selectedAnswerId !== null}
                className={cn(
                  "p-3 rounded-lg border transition-all text-left font-medium text-sm",
                  selectedAnswerId === null &&
                    "border-border/50 hover:border-lavender/30 bg-card hover:bg-accent/30",
                  showCorrect && "border-primary bg-primary/10 text-primary",
                  showWrong && "border-destructive bg-destructive/10 text-destructive",
                )}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "var(--font-japanese, serif)" }}>{option.text}</span>
                  {isSelected &&
                    (isCorrect ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <X className="w-4 h-4 text-destructive" />
                    ))}
                  {showCorrect && !isSelected && <Check className="w-4 h-4 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>

        {selectedAnswerId !== null && (
          <div className="flex gap-2">
            <button
              onClick={handleQuizPrevious}
              disabled={isFirstQuiz}
              className={cn(
                "flex-1 py-2.5 rounded-lg font-semibold transition flex items-center justify-center text-sm",
                isFirstQuiz
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-secondary text-foreground hover:bg-muted",
              )}
            >
              Previous
            </button>
            <button
              onClick={handleQuizNext}
              className="flex-1 py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-1.5 text-sm"
            >
              {isLastQuiz ? "Complete" : "Next Pattern"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  });
  QuizView.displayName = "QuizView";

  const CompleteView = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <div
        className={cn(
          "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
          isPassingScore ? "bg-lavender/20" : "bg-red-100 dark:bg-red-950/30",
        )}
      >
        {isPassingScore ? (
          <Sparkles className="w-8 h-8 text-lavender" />
        ) : (
          <AlertCircle className="w-8 h-8 text-red-500" />
        )}
      </div>

      <h2
        className={cn(
          "text-xl font-bold mb-1",
          isPassingScore ? "text-foreground" : "text-red-600 dark:text-red-400",
        )}
      >
        {isPassingScore ? "Grammar Mastered!" : "Not Quite There"}
      </h2>

      <p className="text-sm text-muted-foreground mb-3">
        Score: {finalScore}% (minimum required: 75%)
      </p>

      {isPassingScore && xpAwarded && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lavender/20 text-lavender text-sm font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          +100 XP Earned
        </div>
      )}

      {!isPassingScore && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-3">
            Score 75% or higher to complete Grammar.
          </p>
          <button
            onClick={() => {
              resetQuiz();
              setLearningStep("quiz");
            }}
            className="py-2 px-4 rounded-lg bg-secondary text-foreground hover:bg-muted transition text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-4">
      {/* Learning Progress Steps */}
      <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
        {/* Theory Step */}
        <button
          onClick={() => {
            if (learningStep === "theory" || learningStep === "theory_complete") {
              setLearningStep("theory");
            }
          }}
          disabled={
            learningStep !== "theory" &&
            learningStep !== "theory_complete" &&
            learningStep !== "complete"
          }
          className={cn(
            "flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1",
            learningStep === "theory"
              ? "bg-card text-foreground shadow-sm"
              : learningStep === "theory_complete" ||
                  learningStep === "quiz" ||
                  learningStep === "complete"
                ? "bg-lavender/20 text-lavender"
                : "text-muted-foreground cursor-not-allowed",
          )}
        >
          {learningStep === "theory_complete" ||
          learningStep === "quiz" ||
          learningStep === "complete" ? (
            <Check className="w-3 h-3" />
          ) : (
            <GraduationCap className="w-3 h-3" />
          )}
          Learn
        </button>

        {/* Practice Step */}
        <button
          onClick={() => {
            if (learningStep === "quiz" || learningStep === "complete") {
              resetQuiz();
              setLearningStep("quiz");
            }
          }}
          disabled={learningStep === "theory" || learningStep === "theory_complete"}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1",
            learningStep === "quiz"
              ? "bg-card text-foreground shadow-sm"
              : learningStep === "complete"
                ? "bg-lavender/20 text-lavender"
                : "text-muted-foreground cursor-not-allowed",
          )}
        >
          {learningStep === "complete" ? (
            <Check className="w-3 h-3" />
          ) : (
            <Lock className="w-3 h-3" />
          )}
          Practice
        </button>
      </div>

      {/* Lock message */}
      {learningStep === "theory_complete" && (
        <div className="text-xs text-center text-muted-foreground">
          Complete theory to unlock practice
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={learningStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {learningStep === "theory" && <TheoryView />}
          {learningStep === "theory_complete" && <TheoryCompleteView />}
          {learningStep === "quiz" && <QuizView />}
          {learningStep === "complete" && <CompleteView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
