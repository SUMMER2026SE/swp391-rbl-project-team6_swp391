// ─── All Quiz Questions Index ────────────────────────────────────────────────────

import { n5ReadingExercises, type ReadingExercise } from "./exercises";
import { n4QuizQuestions, type QuizQuestion as N4QuizQuestion } from "./quiz-n4";
import { n3QuizQuestions, type QuizQuestion as N3QuizQuestion } from "./quiz-n3";
import { n2QuizQuestions, type QuizQuestion as N2QuizQuestion } from "./quiz-n2";
import { n1QuizQuestions, type QuizQuestion as N1QuizQuestion } from "./quiz-n1";

// Type for combined quiz questions
export type QuizQuestion = {
  id: string;
  type:
    | "multiple-choice"
    | "true-false"
    | "fill-blank"
    | "vocabulary-matching"
    | "comprehension"
    | "sentence-order"
    | "translation";
  difficulty: "easy" | "medium" | "hard";
  jlptLevel: "N5" | "N4" | "N3" | "N2" | "N1";
  question: string;
  passage?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  grammar?: string;
};

// Convert exercises to unified QuizQuestion format
const convertExercisesToQuizQuestions = (): QuizQuestion[] => {
  return n5ReadingExercises.map((exercise) => {
    const data = exercise.data;

    switch (exercise.type) {
      case "multiple-choice":
        return {
          id: exercise.id,
          type: "multiple-choice" as const,
          difficulty: exercise.difficulty,
          jlptLevel: exercise.jlptLevel,
          question: (data as any).question,
          passage: (data as any).passage,
          options: (data as any).options,
          correctAnswer: (data as any).correctAnswer,
          explanation: (data as any).explanation || "",
          grammar: undefined,
        };
      case "true-false":
        return {
          id: exercise.id,
          type: "true-false" as const,
          difficulty: exercise.difficulty,
          jlptLevel: exercise.jlptLevel,
          question: (data as any).statement,
          passage: (data as any).passage,
          options: ["True", "False"],
          correctAnswer: (data as any).correctAnswer ? 0 : 1,
          explanation: (data as any).explanation || "",
          grammar: undefined,
        };
      case "fill-blank":
        return {
          id: exercise.id,
          type: "fill-blank" as const,
          difficulty: exercise.difficulty,
          jlptLevel: exercise.jlptLevel,
          question: (data as any).sentence,
          passage: (data as any).passage,
          options: (data as any).options,
          correctAnswer: (data as any).correctAnswer,
          explanation: (data as any).explanation || "",
          grammar: undefined,
        };
      default:
        return {
          id: exercise.id,
          type: "multiple-choice" as const,
          difficulty: exercise.difficulty,
          jlptLevel: exercise.jlptLevel,
          question: "",
          options: [],
          correctAnswer: 0,
          explanation: "",
          grammar: undefined,
        };
    }
  });
};

// Convert N4-N1 quiz questions to unified format
const convertHigherLevelQuestions = (): QuizQuestion[] => {
  const allQuestions: QuizQuestion[] = [];

  [...n4QuizQuestions, ...n3QuizQuestions, ...n2QuizQuestions, ...n1QuizQuestions].forEach((q) => {
    allQuestions.push({
      id: q.id,
      type: q.type,
      difficulty: q.difficulty,
      jlptLevel: q.jlptLevel,
      question: q.question,
      passage: q.passage,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      grammar: q.grammar,
    });
  });

  return allQuestions;
};

// All quiz questions combined
export const allQuizQuestions: QuizQuestion[] = [
  ...convertExercisesToQuizQuestions(),
  ...convertHigherLevelQuestions(),
];

// Quiz questions by level
export const getQuizQuestionsByLevel = (level: QuizQuestion["jlptLevel"]): QuizQuestion[] => {
  return allQuizQuestions.filter((q) => q.jlptLevel === level);
};

// Quiz questions by difficulty
export const getQuizQuestionsByDifficulty = (
  difficulty: QuizQuestion["difficulty"],
): QuizQuestion[] => {
  return allQuizQuestions.filter((q) => q.difficulty === difficulty);
};

// Quiz questions by type
export const getQuizQuestionsByType = (type: QuizQuestion["type"]): QuizQuestion[] => {
  return allQuizQuestions.filter((q) => q.type === type);
};

// Random quiz questions
export const getRandomQuizQuestions = (
  count: number,
  level?: QuizQuestion["jlptLevel"],
): QuizQuestion[] => {
  const questions = level ? getQuizQuestionsByLevel(level) : allQuizQuestions;
  return [...questions].sort(() => Math.random() - 0.5).slice(0, count);
};

// Quiz question generator for a specific reading lesson
export const generateQuizForLesson = (lessonId: string, count: number = 10): QuizQuestion[] => {
  const lessonQuestions = allQuizQuestions.filter((q) => (q as any).readingId === lessonId);

  if (lessonQuestions.length >= count) {
    return [...lessonQuestions].sort(() => Math.random() - 0.5).slice(0, count);
  }

  // If not enough questions for the lesson, supplement with random questions
  const supplemental = getRandomQuizQuestions(count - lessonQuestions.length);
  return [...lessonQuestions, ...supplemental];
};

// Statistics
export const quizStats = {
  total: allQuizQuestions.length,
  byLevel: {
    N5: getQuizQuestionsByLevel("N5").length,
    N4: getQuizQuestionsByLevel("N4").length,
    N3: getQuizQuestionsByLevel("N3").length,
    N2: getQuizQuestionsByLevel("N2").length,
    N1: getQuizQuestionsByLevel("N1").length,
  },
  byDifficulty: {
    easy: getQuizQuestionsByDifficulty("easy").length,
    medium: getQuizQuestionsByDifficulty("medium").length,
    hard: getQuizQuestionsByDifficulty("hard").length,
  },
  byType: {
    "multiple-choice": getQuizQuestionsByType("multiple-choice").length,
    "true-false": getQuizQuestionsByType("true-false").length,
    "fill-blank": getQuizQuestionsByType("fill-blank").length,
    "vocabulary-matching": getQuizQuestionsByType("vocabulary-matching").length,
    comprehension: getQuizQuestionsByType("comprehension").length,
    "sentence-order": getQuizQuestionsByType("sentence-order").length,
    translation: getQuizQuestionsByType("translation").length,
  },
};

export default {
  allQuizQuestions,
  getQuizQuestionsByLevel,
  getQuizQuestionsByDifficulty,
  getQuizQuestionsByType,
  getRandomQuizQuestions,
  generateQuizForLesson,
  quizStats,
};
