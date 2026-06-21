// Question Bank Service Layer
// This service manages all Question Bank data operations
// Currently uses React state (mock data mode)
// Can be easily replaced with real API calls in the future

import { useState, useCallback } from "react";
import type { JLPTLevel, QuestionType, Difficulty, Lesson, Question, ListeningQuestion, StandardQuestion } from "./questionBank.types";
import { baseMockData, sampleQuestions } from "../mocks/questionBankMock";
import { formatDuration } from "./questionBank.types";

// In-memory data store (simulates database)
let lessonsData: Record<JLPTLevel, Lesson[]> = {} as Record<JLPTLevel, Lesson[]>;
let questionsData: Question[] = [];

// Initialize with mock data
function initializeData() {
  const allLevels: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];
  allLevels.forEach(level => {
    lessonsData[level] = baseMockData[level].map(l => ({
      id: l.id,
      lessonNumber: l.lessonNumber,
      lessonName: l.lessonName,
      questionCount: 0,
      createdAt: l.createdAt,
    }));
  });
  
  questionsData = sampleQuestions.map(q => {
    // Handle listening questions with audio
    if (q.type === "Listening") {
      return {
        ...q,
        audio: {
          audioUrl: (q as { audioUrl: string }).audioUrl,
          audioFileName: (q as { audioFileName: string }).audioFileName,
          audioDuration: (q as { audioDuration: number }).audioDuration,
        },
      } as ListeningQuestion;
    }
    // Standard questions
    return q as StandardQuestion;
  });
  
  updateQuestionCounts();
}

function updateQuestionCounts() {
  const allLevels: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];
  allLevels.forEach(level => {
    lessonsData[level] = lessonsData[level].map(lesson => ({
      ...lesson,
      questionCount: questionsData.filter(q => q.level === level && q.lesson === lesson.id).length,
    }));
  });
}

function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Initialize on module load
initializeData();

// Service API functions
export type { Lesson, Question, ListeningQuestion, StandardQuestion };

export const questionBankService = {
  getLessons(level: JLPTLevel): Lesson[] {
    return lessonsData[level] || [];
  },
  
  getLesson(level: JLPTLevel, lessonId: number): Lesson | undefined {
    return lessonsData[level]?.find(l => l.id === lessonId);
  },
  
  getQuestions(level: JLPTLevel, lessonId: number): Question[] {
    return questionsData.filter(q => q.level === level && q.lesson === lessonId);
  },
  
  getAllQuestions(level: JLPTLevel): Question[] {
    return questionsData.filter(q => q.level === level);
  },
  
  getLevelStats(level: JLPTLevel) {
    const lessons = lessonsData[level] || [];
    const questions = questionsData.filter(q => q.level === level);
    return {
      totalLessons: lessons.length,
      totalQuestions: questions.length,
      activeLessons: lessons.filter(l => l.questionCount > 0).length,
    };
  },
  
  createLesson(level: JLPTLevel, lessonName: string, lessonNumber?: number): Lesson {
    const lessons = lessonsData[level] || [];
    const maxId = lessons.length > 0 ? Math.max(...lessons.map(l => l.id)) : 0;
    const newLesson: Lesson = {
      id: maxId + 1,
      lessonNumber: lessonNumber || maxId + 1,
      lessonName,
      questionCount: 0,
      createdAt: new Date().toISOString(),
    };
    lessonsData[level] = [...lessons, newLesson];
    return newLesson;
  },
  
  updateLesson(level: JLPTLevel, lessonId: number, lessonName: string): Lesson | undefined {
    const lessons = lessonsData[level] || [];
    const index = lessons.findIndex(l => l.id === lessonId);
    if (index === -1) return undefined;
    
    lessons[index] = { ...lessons[index], lessonName };
    lessonsData[level] = [...lessons];
    return lessons[index];
  },
  
  deleteLesson(level: JLPTLevel, lessonId: number): boolean {
    const lessons = lessonsData[level] || [];
    lessonsData[level] = lessons.filter(l => l.id !== lessonId);
    questionsData = questionsData.filter(q => !(q.level === level && q.lesson === lessonId));
    return true;
  },
  
  createQuestion(level: JLPTLevel, lessonId: number, questionData: {
    type: QuestionType;
    difficulty: Difficulty;
    questionText: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    audio?: {
      audioUrl: string;
      audioFileName: string;
      audioDuration: number;
    };
  }): Question {
    const baseQuestion = {
      id: generateId(),
      level,
      lesson: lessonId,
      type: questionData.type,
      difficulty: questionData.difficulty,
      questionText: questionData.questionText,
      options: questionData.options,
      correctIndex: questionData.correctIndex,
      explanation: questionData.explanation,
      createdAt: new Date().toISOString(),
    };
    
    // Create the appropriate question type
    if (questionData.type === "Listening" && questionData.audio) {
      const newListeningQuestion: ListeningQuestion = {
        ...baseQuestion,
        type: "Listening",
        audio: questionData.audio,
      };
      questionsData = [...questionsData, newListeningQuestion];
      return newListeningQuestion;
    } else {
      const newStandardQuestion: StandardQuestion = {
        ...baseQuestion,
        type: questionData.type as "Vocabulary" | "Grammar" | "Reading",
      };
      questionsData = [...questionsData, newStandardQuestion];
      return newStandardQuestion;
    }
  },
  
  updateQuestion(questionId: string, updates: {
    type?: QuestionType;
    difficulty?: Difficulty;
    questionText?: string;
    options?: string[];
    correctIndex?: number;
    explanation?: string;
    audio?: {
      audioUrl: string;
      audioFileName: string;
      audioDuration: number;
    };
  }): Question | undefined {
    const index = questionsData.findIndex(q => q.id === questionId);
    if (index === -1) return undefined;
    
    const existingQuestion = questionsData[index];
    
    // Handle type-specific updates
    if (existingQuestion.type === "Listening") {
      const updatedListening: ListeningQuestion = {
        ...existingQuestion,
        type: updates.type as "Listening" || "Listening",
        difficulty: updates.difficulty || existingQuestion.difficulty,
        questionText: updates.questionText || existingQuestion.questionText,
        options: updates.options || existingQuestion.options,
        correctIndex: updates.correctIndex ?? existingQuestion.correctIndex,
        explanation: updates.explanation || existingQuestion.explanation,
        audio: updates.audio || (existingQuestion as ListeningQuestion).audio,
      };
      questionsData[index] = updatedListening;
      return updatedListening;
    } else {
      const updatedStandard: StandardQuestion = {
        ...existingQuestion,
        type: updates.type as "Vocabulary" | "Grammar" | "Reading" || existingQuestion.type,
        difficulty: updates.difficulty || existingQuestion.difficulty,
        questionText: updates.questionText || existingQuestion.questionText,
        options: updates.options || existingQuestion.options,
        correctIndex: updates.correctIndex ?? existingQuestion.correctIndex,
        explanation: updates.explanation || existingQuestion.explanation,
      };
      questionsData[index] = updatedStandard;
      return updatedStandard;
    }
  },
  
  deleteQuestion(questionId: string): boolean {
    const index = questionsData.findIndex(q => q.id === questionId);
    if (index === -1) return false;
    
    questionsData = questionsData.filter(q => q.id !== questionId);
    updateQuestionCounts();
    return true;
  },
  
  getQuestion(questionId: string): Question | undefined {
    return questionsData.find(q => q.id === questionId);
  },
  
  reset() {
    initializeData();
  },

  // Check if question has audio (for Listening type)
  hasAudio(question: Question): boolean {
    if (question.type !== "Listening") return false;
    return !!(question as ListeningQuestion).audio?.audioUrl;
  },

  // Get audio info from question
  getAudioInfo(question: Question): { url: string; fileName: string; duration: number } | null {
    if (question.type !== "Listening") return null;
    const audio = (question as ListeningQuestion).audio;
    if (!audio) return null;
    return {
      url: audio.audioUrl,
      fileName: audio.audioFileName,
      duration: audio.audioDuration,
    };
  },
};

// React hook for using the service with state
export function useQuestionBank(level: JLPTLevel) {
  const [lessons, setLessons] = useState<Lesson[]>(questionBankService.getLessons(level));
  const [questions, setQuestions] = useState<Question[]>(questionBankService.getAllQuestions(level));
  
  const refresh = useCallback(() => {
    setLessons(questionBankService.getLessons(level));
    setQuestions(questionBankService.getAllQuestions(level));
  }, [level]);
  
  const getLessonStats = useCallback((lessonId: number) => {
    const lessonQs = questions.filter(q => q.lesson === lessonId);
    return {
      total: lessonQs.length,
      Vocabulary: lessonQs.filter(q => q.type === "Vocabulary").length,
      Grammar: lessonQs.filter(q => q.type === "Grammar").length,
      Reading: lessonQs.filter(q => q.type === "Reading").length,
      Listening: lessonQs.filter(q => q.type === "Listening").length,
    };
  }, [questions]);
  
  const createLessonAction = useCallback((lessonName: string, lessonNumber?: number) => {
    const newLesson = questionBankService.createLesson(level, lessonName, lessonNumber);
    setLessons(questionBankService.getLessons(level));
    return newLesson;
  }, [level]);
  
  const updateLessonAction = useCallback((lessonId: number, lessonName: string) => {
    const updated = questionBankService.updateLesson(level, lessonId, lessonName);
    setLessons(questionBankService.getLessons(level));
    return updated;
  }, [level]);
  
  const deleteLessonAction = useCallback((lessonId: number) => {
    questionBankService.deleteLesson(level, lessonId);
    setLessons(questionBankService.getLessons(level));
    setQuestions(questionBankService.getAllQuestions(level));
  }, [level]);
  
  const createQuestionAction = useCallback((lessonId: number, questionData: Parameters<typeof questionBankService.createQuestion>[2]) => {
    const newQuestion = questionBankService.createQuestion(level, lessonId, questionData);
    setQuestions(questionBankService.getAllQuestions(level));
    setLessons(questionBankService.getLessons(level));
    return newQuestion;
  }, [level]);
  
  const updateQuestionAction = useCallback((questionId: string, updates: Parameters<typeof questionBankService.updateQuestion>[1]) => {
    const updated = questionBankService.updateQuestion(questionId, updates);
    setQuestions(questionBankService.getAllQuestions(level));
    setLessons(questionBankService.getLessons(level));
    return updated;
  }, [level]);
  
  const deleteQuestionAction = useCallback((questionId: string) => {
    questionBankService.deleteQuestion(questionId);
    setQuestions(questionBankService.getAllQuestions(level));
    setLessons(questionBankService.getLessons(level));
  }, [level]);
  
  const getStats = useCallback(() => {
    return questionBankService.getLevelStats(level);
  }, [level]);
  
  return {
    lessons,
    questions,
    refresh,
    getLessonStats,
    createLesson: createLessonAction,
    updateLesson: updateLessonAction,
    deleteLesson: deleteLessonAction,
    createQuestion: createQuestionAction,
    updateQuestion: updateQuestionAction,
    deleteQuestion: deleteQuestionAction,
    getStats,
  };
}
