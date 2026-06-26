// Quizzes for Alphabet Learning

export interface QuizQuestion {
  id: string;
  type: "recognition" | "romaji_to_char" | "matching" | "dakuten" | "combination";
  question: string;
  character?: string;
  romaji?: string;
  options: string[];
  correctAnswer: string;
  lessonId: string;
}

import { hiraganaBasic } from "./hiraganaBasic";
import { hiraganaDakuten } from "./hiraganaDakuten";
import { hiraganaCombination } from "./hiraganaCombination";
import { katakanaBasic } from "./katakanaBasic";
import { katakanaDakuten } from "./katakanaDakuten";
import { katakanaCombination } from "./katakanaCombination";

// Generate recognition quiz questions (Character -> Romaji)
export function generateRecognitionQuestions(
  characters: Array<{ id: string; character: string; romaji: string }>,
  lessonId: string,
): QuizQuestion[] {
  return characters.map((char, idx) => {
    const otherChars = characters.filter((c) => c.id !== char.id);
    const wrongOptions = otherChars
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.romaji);

    return {
      id: `${lessonId}-recognition-${idx}`,
      type: "recognition" as const,
      question: `What is the romaji for "${char.character}"?`,
      character: char.character,
      options: [char.romaji, ...wrongOptions].sort(() => Math.random() - 0.5),
      correctAnswer: char.romaji,
      lessonId,
    };
  });
}

// Generate romaji to character questions (Romaji -> Character)
export function generateRomajiToCharQuestions(
  characters: Array<{ id: string; character: string; romaji: string }>,
  lessonId: string,
): QuizQuestion[] {
  return characters.map((char, idx) => {
    const otherChars = characters.filter((c) => c.id !== char.id);
    const wrongOptions = otherChars
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.character);

    return {
      id: `${lessonId}-romaji-${idx}`,
      type: "romaji_to_char" as const,
      question: `Which character is "${char.romaji}"?`,
      romaji: char.romaji,
      options: [char.character, ...wrongOptions].sort(() => Math.random() - 0.5),
      correctAnswer: char.character,
      lessonId,
    };
  });
}

// Generate all quizzes
export const quizzes = {
  hiraganaBasic: {
    recognition: generateRecognitionQuestions(hiraganaBasic, "hiragana-basic"),
    romajiToChar: generateRomajiToCharQuestions(hiraganaBasic, "hiragana-basic"),
  },
  hiraganaDakuten: {
    recognition: generateRecognitionQuestions(hiraganaDakuten, "hiragana-dakuten"),
    romajiToChar: generateRomajiToCharQuestions(hiraganaDakuten, "hiragana-dakuten"),
  },
  hiraganaCombination: {
    recognition: generateRecognitionQuestions(hiraganaCombination, "hiragana-combination"),
    romajiToChar: generateRomajiToCharQuestions(hiraganaCombination, "hiragana-combination"),
  },
  katakanaBasic: {
    recognition: generateRecognitionQuestions(katakanaBasic, "katakana-basic"),
    romajiToChar: generateRomajiToCharQuestions(katakanaBasic, "katakana-basic"),
  },
  katakanaDakuten: {
    recognition: generateRecognitionQuestions(katakanaDakuten, "katakana-dakuten"),
    romajiToChar: generateRomajiToCharQuestions(katakanaDakuten, "katakana-dakuten"),
  },
  katakanaCombination: {
    recognition: generateRecognitionQuestions(katakanaCombination, "katakana-combination"),
    romajiToChar: generateRomajiToCharQuestions(katakanaCombination, "katakana-combination"),
  },
};

// Get quiz by lesson ID
export function getQuizByLessonId(
  lessonId: string,
): { recognition: QuizQuestion[]; romajiToChar: QuizQuestion[] } | null {
  return quizzes[lessonId as keyof typeof quizzes] || null;
}

// Get random quiz questions from all lessons
export function getMixedQuiz(count: number = 10): QuizQuestion[] {
  const allQuestions: QuizQuestion[] = [];

  Object.values(quizzes).forEach((quiz) => {
    allQuestions.push(...quiz.recognition);
  });

  return allQuestions.sort(() => Math.random() - 0.5).slice(0, count);
}

export default quizzes;
