"use client";

import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Volume2, ChevronRight, ChevronLeft, Check, X, Sparkles, Lock, Unlock, AlertCircle } from "lucide-react";
import { type VocabularyItem } from "@/mock/student-learning-journey";
import { cn } from "@/lib/utils";
import { createShuffledOptions, type AnswerOption } from "@/lib/quiz-utils";

interface VocabularyModuleProps {
  vocabulary: VocabularyItem[];
  onComplete: (xpEarned: number) => void;
}

type LearningStep = "theory" | "theory_complete" | "flashcard" | "flashcard_complete" | "quiz" | "complete";
type QuizState = "not_started" | "in_progress" | "complete";

export function VocabularyModule({ vocabulary, onComplete }: VocabularyModuleProps) {
  const [learningStep, setLearningStep] = useState<LearningStep>("theory");
  const [theoryIndex, setTheoryIndex] = useState(0);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctQuizAnswers, setCorrectQuizAnswers] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>("not_started");
  const [xpAwarded, setXpAwarded] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<AnswerOption[]>([]);

  const currentWord = vocabulary[theoryIndex];
  const isLastTheoryWord = theoryIndex === vocabulary.length - 1;
  const isFirstTheoryWord = theoryIndex === 0;
  const theoryProgress = ((theoryIndex + 1) / vocabulary.length) * 100;

  const flashcardProgress = ((flashcardIndex + 1) / vocabulary.length) * 100;
  const isLastFlashcard = flashcardIndex === vocabulary.length - 1;
  const isFirstFlashcard = flashcardIndex === 0;

  const quizProgress = ((quizIndex + 1) / vocabulary.length) * 100;
  const isLastQuiz = quizIndex === vocabulary.length - 1;
  const isFirstQuiz = quizIndex === 0;

  const isPassingScore = finalScore >= 75;

  // Shuffle options when quiz starts or question changes
  useEffect(() => {
    if (learningStep === "quiz" && vocabulary.length > 0) {
      const quizWord = vocabulary[quizIndex];
      const wrongOptions = vocabulary
        .filter((_, i) => i !== quizIndex)
        .slice(0, 3)
        .map(v => v.meaning);
      const shuffled = createShuffledOptions(quizWord.meaning, wrongOptions);
      setShuffledOptions(shuffled);
    }
  }, [learningStep, quizIndex, vocabulary]);

  const speakWord = (text: string) => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const handleTheoryNext = () => {
    if (isLastTheoryWord) {
      setLearningStep("theory_complete");
    } else {
      setTheoryIndex(prev => prev + 1);
    }
  };

  const handleTheoryPrevious = () => {
    if (!isFirstTheoryWord) {
      setTheoryIndex(prev => prev - 1);
    }
  };

  const handleFlashcardNext = () => {
    if (isLastFlashcard) {
      setLearningStep("flashcard_complete");
    } else {
      setFlashcardIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handleFlashcardPrevious = () => {
    if (!isFirstFlashcard) {
      setFlashcardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleQuizAnswer = (optionId: string) => {
    if (selectedAnswerId !== null) return;
    setSelectedAnswerId(optionId);
    const selectedOption = shuffledOptions.find(opt => opt.id === optionId);
    const correct = selectedOption?.isCorrect ?? false;
    setIsCorrect(correct);
    if (correct) {
      setCorrectQuizAnswers(prev => prev + 1);
    }
  };

  const handleQuizNext = () => {
    if (isLastQuiz) {
      const totalCorrect = correctQuizAnswers + (isCorrect ? 1 : 0);
      const score = Math.round((totalCorrect / vocabulary.length) * 100);
      setFinalScore(score);

      if (score >= 75 && !xpAwarded) {
        setXpAwarded(true);
        onComplete(50);
      }
      setLearningStep("complete");
    } else {
      setQuizIndex(prev => prev + 1);
      setSelectedAnswerId(null);
      setIsCorrect(null);
    }
  };

  const handleQuizPrevious = () => {
    if (!isFirstQuiz) {
      setQuizIndex(prev => prev + 1);
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
          Learn {theoryIndex + 1} of {vocabulary.length}
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

      <div className="bg-card rounded-xl p-5 border border-border/50">
        <div className="text-center">
          <button
            onClick={() => speakWord(currentWord.word)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition mb-4"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Listen
          </button>

          <div className="mb-4">
            <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
              {currentWord.word}
            </div>
            <div className="text-base text-muted-foreground">
              {currentWord.furigana}
            </div>
          </div>

          <div className="py-4 border-y border-border/50 mb-4">
            <div className="text-[10px] text-primary font-semibold uppercase tracking-wide mb-1">Meaning</div>
            <div className="text-xl font-bold text-foreground">
              {currentWord.meaning}
            </div>
          </div>

          <div className="text-left">
            <div className="text-[10px] text-primary font-semibold uppercase tracking-wide mb-2">Example</div>
            <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3">
              <div className="text-base font-medium text-foreground mb-1" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                {currentWord.example}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentWord.exampleMeaning}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleTheoryPrevious}
          disabled={isFirstTheoryWord}
          className={cn(
            "flex-1 py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 text-sm",
            isFirstTheoryWord
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-secondary text-foreground hover:bg-muted"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={handleTheoryNext}
          className="flex-1 py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-1.5 text-sm"
        >
          {isLastTheoryWord ? "Complete Theory" : "Next"}
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
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/15 flex items-center justify-center">
        <Unlock className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Theory Complete!</h2>
      <p className="text-sm text-muted-foreground mb-5">
        You learned all {vocabulary.length} vocabulary words. Ready for practice?
      </p>
      <button
        onClick={() => {
          setFlashcardIndex(0);
          setIsFlipped(false);
          setLearningStep("flashcard");
        }}
        className="w-full py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-1.5 text-sm"
      >
        Start Flashcards
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );

  const FlashcardView = () => {
    const flashcardWord = vocabulary[flashcardIndex];
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-2">
            Flashcard {flashcardIndex + 1} of {vocabulary.length}
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-hero"
              initial={{ width: 0 }}
              animate={{ width: `${flashcardProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Flashcard Container - Centered and Sized to Match Learn Page */}
        <div className="flex justify-center">
          <motion.button
            onClick={() => setIsFlipped(!isFlipped)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "w-full max-w-[650px] rounded-xl border transition-all duration-300 flex flex-col items-center justify-center cursor-pointer",
              !isFlipped
                ? "bg-card border-border/50"
                : "bg-card border-primary/30"
            )}
            style={{ minHeight: "300px", height: "340px" }}
          >
            <AnimatePresence mode="wait">
              {!isFlipped ? (
                <motion.div
                  key="front"
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 90 }}
                  transition={{ duration: 0.3 }}
                  className="text-center px-5 w-full"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakWord(flashcardWord.word);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition mb-4"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Listen
                  </button>

                  <div className="mb-4">
                    <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                      {flashcardWord.word}
                    </div>
                    <div className="text-base text-muted-foreground">
                      {flashcardWord.furigana}
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    Tap to reveal meaning
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="back"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -90 }}
                  transition={{ duration: 0.3 }}
                  className="text-center px-5 w-full"
                >
                  <div className="mb-4">
                    <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                      {flashcardWord.word}
                    </div>
                    <div className="text-base text-muted-foreground mb-4">
                      {flashcardWord.furigana}
                    </div>
                  </div>

                  <div className="py-4 border-y border-border/50 mb-4">
                    <div className="text-[10px] text-primary font-semibold uppercase tracking-wide mb-1">Meaning</div>
                    <div className="text-xl font-bold text-foreground">
                      {flashcardWord.meaning}
                    </div>
                  </div>

                  <div className="text-left w-full max-w-[90%] mx-auto">
                    <div className="text-[10px] text-primary font-semibold uppercase tracking-wide mb-2">Example</div>
                    <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3">
                      <div className="text-base font-medium text-foreground mb-1">
                        {flashcardWord.example}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentWord.exampleMeaning}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <div className="flex gap-2 max-w-[650px] mx-auto">
          <button
            onClick={handleFlashcardPrevious}
            disabled={isFirstFlashcard}
            className={cn(
              "flex-1 py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 text-sm",
              isFirstFlashcard
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-secondary text-foreground hover:bg-muted"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={handleFlashcardNext}
            className="flex-1 py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-1.5 text-sm"
          >
            {isLastFlashcard ? "Complete Flashcards" : "Next"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const FlashcardCompleteView = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/15 flex items-center justify-center">
        <Unlock className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Flashcards Complete!</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Great practice! Ready to test your knowledge?
      </p>
      <button
        onClick={() => {
          resetQuiz();
          setQuizState("in_progress");
          setLearningStep("quiz");
        }}
        className="w-full py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-1.5 text-sm"
      >
        Start Quiz
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );

  const QuizView = memo(() => {
    const quizWord = vocabulary[quizIndex];
    const correctOptionId = shuffledOptions.find(opt => opt.isCorrect)?.id;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-2">
            Quiz {quizIndex + 1} of {vocabulary.length}
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
          <div className="text-[10px] text-primary font-semibold uppercase tracking-wide mb-1">What does this word mean?</div>
          <div className="text-3xl md:text-4xl font-bold text-foreground">
            {quizWord.word}
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
                  selectedAnswerId === null && "border-border/50 hover:border-primary/30 bg-card hover:bg-accent/30",
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

        {selectedAnswerId !== null && (
          <div className="flex gap-2">
            <button
              onClick={handleQuizPrevious}
              disabled={isFirstQuiz}
              className={cn(
                "flex-1 py-2.5 rounded-lg font-semibold transition flex items-center justify-center text-sm",
                isFirstQuiz
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-secondary text-foreground hover:bg-muted"
              )}
            >
              Previous
            </button>
            <button
              onClick={handleQuizNext}
              className="flex-1 py-2.5 rounded-lg font-semibold bg-gradient-hero text-white hover:opacity-90 transition flex items-center justify-center gap-1.5 text-sm"
            >
              {isLastQuiz ? "Complete Quiz" : "Next Question"}
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
      <div className={cn(
        "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
        isPassingScore ? "bg-primary/15" : "bg-red-100 dark:bg-red-950/30"
      )}>
        {isPassingScore ? (
          <Sparkles className="w-8 h-8 text-primary" />
        ) : (
          <AlertCircle className="w-8 h-8 text-red-500" />
        )}
      </div>

      <h2 className={cn(
        "text-xl font-bold mb-1",
        isPassingScore ? "text-foreground" : "text-red-600 dark:text-red-400"
      )}>
        {isPassingScore ? "Vocabulary Mastered!" : "Not Quite There"}
      </h2>

      <p className="text-sm text-muted-foreground mb-3">
        Score: {finalScore}% (minimum required: 75%)
      </p>

      {isPassingScore && xpAwarded && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-sm font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          +50 XP Earned
        </div>
      )}

      {!isPassingScore && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-3">
            Score 75% or higher to complete Vocabulary.
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
          disabled={learningStep !== "theory" && learningStep !== "theory_complete" && learningStep !== "complete"}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1",
            learningStep === "theory"
              ? "bg-card text-foreground shadow-sm"
              : learningStep === "theory_complete" || learningStep === "flashcard" || learningStep === "flashcard_complete" || learningStep === "quiz" || learningStep === "complete"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground cursor-not-allowed"
          )}
        >
          {learningStep === "theory_complete" || learningStep === "flashcard" || learningStep === "flashcard_complete" || learningStep === "quiz" || learningStep === "complete" ? (
            <Check className="w-3 h-3" />
          ) : (
            <BookOpen className="w-3 h-3" />
          )}
          Learn
        </button>

        {/* Flashcard Step */}
        <button
          onClick={() => {
            if (learningStep === "flashcard" || learningStep === "flashcard_complete" || learningStep === "complete") {
              setFlashcardIndex(0);
              setIsFlipped(false);
              setLearningStep("flashcard");
            }
          }}
          disabled={learningStep === "theory" || learningStep === "theory_complete"}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1",
            learningStep === "flashcard"
              ? "bg-card text-foreground shadow-sm"
              : learningStep === "flashcard_complete" || learningStep === "quiz" || learningStep === "complete"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground cursor-not-allowed"
          )}
        >
          {learningStep === "flashcard_complete" || learningStep === "quiz" || learningStep === "complete" ? (
            <Check className="w-3 h-3" />
          ) : (
            <Lock className="w-3 h-3" />
          )}
          Practice
        </button>

        {/* Quiz Step */}
        <button
          onClick={() => {
            if (learningStep === "quiz" || learningStep === "complete") {
              resetQuiz();
              setQuizState("in_progress");
              setLearningStep("quiz");
            }
          }}
          disabled={learningStep !== "quiz" && learningStep !== "complete" && learningStep !== "flashcard_complete"}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1",
            learningStep === "quiz"
              ? "bg-card text-foreground shadow-sm"
              : learningStep === "complete"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground cursor-not-allowed"
          )}
        >
          {learningStep === "complete" ? (
            <Check className="w-3 h-3" />
          ) : (
            <Lock className="w-3 h-3" />
          )}
          Quiz
        </button>
      </div>

      {/* Lock message */}
      {(learningStep === "flashcard" || learningStep === "flashcard_complete") && (
        <div className="text-xs text-center text-muted-foreground">
          Complete theory to unlock next step
        </div>
      )}
      {learningStep === "quiz" && quizState === "not_started" && (
        <div className="text-xs text-center text-muted-foreground">
          Complete flashcards to unlock quiz
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
          {learningStep === "flashcard" && <FlashcardView />}
          {learningStep === "flashcard_complete" && <FlashcardCompleteView />}
          {learningStep === "quiz" && <QuizView />}
          {learningStep === "complete" && <CompleteView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
