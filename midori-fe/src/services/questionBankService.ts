import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type {
  JLPTLevel,
  QuestionType,
  Difficulty,
  Lesson,
  Question,
  ListeningQuestion,
  StandardQuestion,
} from "./questionBank.types";
import { teacherQuestionsApi, TeacherQuestionResponse } from "../lib/api/teacherQuestions";

// Helper mapper for Difficulty
function mapDifficultyToFrontend(difficulty: string): Difficulty {
  if (!difficulty) return "Medium";
  const lower = difficulty.toLowerCase();
  if (lower === "easy") return "Easy";
  if (lower === "hard") return "Hard";
  return "Medium";
}

// Mapper from Backend Question to Frontend Question
export function mapBackendQuestionToFrontend(q: TeacherQuestionResponse): Question {
  const base = {
    id: q.id,
    level: (q.level || "N5") as JLPTLevel,
    lesson: q.lessonId || 0,
    type: (q.questionType || "Vocabulary") as QuestionType,
    difficulty: mapDifficultyToFrontend(q.difficulty),
    questionText: q.prompt,
    options: q.options || [],
    correctIndex: q.correctAnswerIndex,
    explanation: q.explanation || "",
    points: q.points || 0,
    createdAt: q.createdAt,
  };

  if (q.questionType === "Listening") {
    return {
      ...base,
      type: "Listening",
      audio: {
        audioUrl: q.audioUrl || "",
        audioFileName: q.audioFileName || "",
        audioDuration: q.audioDuration || 0,
      },
    } as ListeningQuestion;
  }

  return base as StandardQuestion;
}

export const questionBankService = {
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

export function useQuestionBank(level: JLPTLevel) {
  const queryClient = useQueryClient();

  // Queries
  const { data: rawLessons = [], refetch: refetchLessons, isLoading: isLoadingLessons, isError: isErrorLessons, error: errorLessons } = useQuery({
    queryKey: ["questionBankLessons", level],
    queryFn: async () => {
      const response = await teacherQuestionsApi.getLessons(level);
      return response;
    },
  });

  const { data: rawQuestions = [], refetch: refetchQuestions, isLoading: isLoadingQuestions, isError: isErrorQuestions, error: errorQuestions } = useQuery({
    queryKey: ["questionBankQuestions"],
    queryFn: async () => {
      const response = await teacherQuestionsApi.getQuestions();
      return response;
    },
  });

  const questions = rawQuestions
    .map(mapBackendQuestionToFrontend)
    .filter((q) => q.level === level);

  const lessons: Lesson[] = rawLessons.map((l) => ({
    id: l.id,
    lessonNumber: l.lessonNumber,
    lessonName: l.lessonName,
    status: l.status && l.status.toUpperCase() === "ACTIVE" ? "Active" : "Draft",
    questionCount: questions.filter((q) => q.lesson === l.id).length,
    createdAt: l.createdAt,
  }));

  const isLoading = isLoadingLessons || isLoadingQuestions;
  const isError = isErrorLessons || isErrorQuestions;
  const error = errorLessons || errorQuestions;

  const refresh = useCallback(async () => {
    await Promise.all([refetchLessons(), refetchQuestions()]);
  }, [refetchLessons, refetchQuestions]);

  // Mutations
  const createLessonMutation = useMutation({
    mutationFn: async (vars: { lessonName: string; lessonNumber?: number }) => {
      const existingNumbers = rawLessons.map((l) => l.lessonNumber);
      const nextNum = vars.lessonNumber || (existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1);
      const response = await teacherQuestionsApi.createLesson({
        level,
        lessonNumber: nextNum,
        lessonName: vars.lessonName,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionBankLessons", level] });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async (vars: { lessonId: number; lessonName: string; lessonNumber?: number; status?: string }) => {
      const response = await teacherQuestionsApi.updateLesson(vars.lessonId, vars.lessonName, vars.lessonNumber, vars.status);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionBankLessons", level] });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const lessonQuestions = questions.filter((q) => q.lesson === lessonId);
      await Promise.all(lessonQuestions.map((q) => teacherQuestionsApi.deleteQuestion(q.id)));
      await teacherQuestionsApi.deleteLesson(lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionBankLessons", level] });
      queryClient.invalidateQueries({ queryKey: ["questionBankQuestions"] });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (vars: {
      lessonId: number;
      questionData: any;
    }) => {
      const req = {
        topicId: `lesson_${vars.lessonId}`,
        level,
        lessonId: vars.lessonId,
        prompt: vars.questionData.questionText,
        questionType: vars.questionData.type,
        difficulty: vars.questionData.difficulty.toUpperCase(),
        correctAnswerIndex: vars.questionData.correctIndex,
        explanation: vars.questionData.explanation,
        options: vars.questionData.options,
        audioUrl: vars.questionData.audio?.audioUrl,
        audioFileName: vars.questionData.audio?.audioFileName,
        audioDuration: vars.questionData.audio?.audioDuration,
      };
      const response = await teacherQuestionsApi.createQuestion(req);
      return mapBackendQuestionToFrontend(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionBankQuestions"] });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (vars: {
      questionId: string;
      updates: any;
    }) => {
      const current = rawQuestions.find((q) => q.id === vars.questionId);
      if (!current) throw new Error("Question not found");

      const req = {
        topicId: current.topicId,
        level: current.level,
        lessonId: current.lessonId,
        prompt: vars.updates.questionText ?? current.prompt,
        questionType: vars.updates.type ?? current.questionType,
        difficulty: vars.updates.difficulty?.toUpperCase() ?? current.difficulty,
        correctAnswerIndex: vars.updates.correctIndex ?? current.correctAnswerIndex,
        explanation: vars.updates.explanation ?? current.explanation,
        options: vars.updates.options ?? current.options,
        audioUrl: vars.updates.audio?.audioUrl ?? current.audioUrl,
        audioFileName: vars.updates.audio?.audioFileName ?? current.audioFileName,
        audioDuration: vars.updates.audio?.audioDuration ?? current.audioDuration,
      };
      const response = await teacherQuestionsApi.updateQuestion(vars.questionId, req);
      return mapBackendQuestionToFrontend(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionBankQuestions"] });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      await teacherQuestionsApi.deleteQuestion(questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionBankQuestions"] });
    },
  });

  const getLessonStats = useCallback(
    (lessonId: number) => {
      const lessonQs = questions.filter((q) => q.lesson === lessonId);
      return {
        total: lessonQs.length,
        Vocabulary: lessonQs.filter((q) => q.type === "Vocabulary").length,
        Grammar: lessonQs.filter((q) => q.type === "Grammar").length,
        Reading: lessonQs.filter((q) => q.type === "Reading").length,
        Listening: lessonQs.filter((q) => q.type === "Listening").length,
      };
    },
    [questions],
  );

  const getStats = useCallback(() => {
    return {
      totalLessons: lessons.length,
      totalQuestions: questions.length,
      activeLessons: lessons.filter((l) => l.questionCount > 0).length,
    };
  }, [lessons, questions]);

  return {
    lessons,
    questions,
    isLoading,
    isError,
    error,
    refresh,
    getLessonStats,
    createLesson: (name: string, num?: number) => createLessonMutation.mutateAsync({ lessonName: name, lessonNumber: num }),
    updateLesson: (id: number, name: string, num?: number, status?: string) => updateLessonMutation.mutateAsync({ lessonId: id, lessonName: name, lessonNumber: num, status }),
    deleteLesson: (id: number) => deleteLessonMutation.mutateAsync(id),
    createQuestion: (lessonId: number, data: any) => createQuestionMutation.mutateAsync({ lessonId, questionData: data }),
    updateQuestion: (id: string, updates: any) => updateQuestionMutation.mutateAsync({ questionId: id, updates }),
    deleteQuestion: (id: string) => deleteQuestionMutation.mutateAsync(id),
    getStats,
  };
}
