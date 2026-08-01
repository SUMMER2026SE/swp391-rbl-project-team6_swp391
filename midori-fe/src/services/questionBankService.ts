import { useQuery, useMutation, useQueryClient, keepPreviousData, type QueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getStoredUser } from "../lib/auth";
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
import { adminApi } from "../lib/api/admin";

export type {
  JLPTLevel,
  QuestionType,
  Difficulty,
  Lesson,
  Question,
  ListeningQuestion,
  StandardQuestion,
};

export interface CreateQuestionInput {
  type: string;
  skill?: string;
  difficulty: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  audio?: {
    audioUrl?: string;
    audioFileName?: string;
    audioDuration?: number;
  };
  translationMetadata?: any;
  sentenceWritingMetadata?: any;
  errorCorrectionMetadata?: any;
  matchingMetadata?: any;
}

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

// ─── Admin Question Bank Persistence & Prefetching ──────────────────────────
const ADMIN_QB_PERSISTANCE_PREFIX = "midori_admin_qb_cache_v1_";
const ADMIN_QB_REMEMBERED_LEVEL_KEY = "midori_admin_qb_last_level";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function rememberAdminQBLevel(level: string) {
  if (typeof window !== "undefined" && level) {
    try {
      const upper = level.toUpperCase();
      if (localStorage.getItem(ADMIN_QB_REMEMBERED_LEVEL_KEY) !== upper) {
        localStorage.setItem(ADMIN_QB_REMEMBERED_LEVEL_KEY, upper);
      }
    } catch {}
  }
}

export function getRememberedAdminQBLevel(): JLPTLevel {
  if (typeof window !== "undefined") {
    try {
      const val = localStorage.getItem(ADMIN_QB_REMEMBERED_LEVEL_KEY);
      if (val && ["N5", "N4", "N3", "N2", "N1"].includes(val.toUpperCase())) {
        return val.toUpperCase() as JLPTLevel;
      }
    } catch {}
  }
  return "N5";
}

function getCacheKeyForUser(level: string, user?: { id: string; role: string } | null): string | null {
  const targetUser = user ?? getStoredUser();
  if (!targetUser || targetUser.role !== "admin" || !targetUser.id) return null;
  return `${ADMIN_QB_PERSISTANCE_PREFIX}${targetUser.id}_${targetUser.role}_${level.toUpperCase()}`;
}

export function getPersistedAdminQBLessons(level: string): any[] | undefined {
  if (typeof window === "undefined") return undefined;
  const key = getCacheKeyForUser(level);
  if (!key) return undefined;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.timestamp || Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return undefined;
    }
    return Array.isArray(parsed.data) ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export function setPersistedAdminQBLessons(level: string, data: any[], user?: { id: string; role: string } | null) {
  if (typeof window === "undefined" || !data) return;
  const key = getCacheKeyForUser(level, user);
  if (!key) return;
  try {
    const payload = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {}
}

export function clearPersistedAdminQuestionBankCache() {
  if (typeof window === "undefined") return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("midori_admin_qb_cache_")) {
        localStorage.removeItem(k);
      }
    }
  } catch {}
}

/**
 * Background prefetcher for Admin Question Bank lesson summaries.
 * Never blocks login or navigation, and shares exact queryKey for TanStack Query deduplication.
 */
export async function prefetchAdminQuestionBankLessons(
  queryClient: QueryClient,
  user?: { id: string; role: string } | null,
  targetLevel?: string
) {
  const activeUser = user ?? getStoredUser();
  if (!activeUser || activeUser.role !== "admin") return;

  const levelToFetch = (targetLevel || getRememberedAdminQBLevel()).toUpperCase() as JLPTLevel;

  await queryClient.prefetchQuery({
    queryKey: ["adminQuestionBankLessons", levelToFetch],
    queryFn: async () => {
      const response = await adminApi.getQuestionBankLessons(levelToFetch);
      setPersistedAdminQBLessons(levelToFetch, response, activeUser);
      return response;
    },
    staleTime: CACHE_TTL_MS,
  });
}

/**
 * Admin-optimized hook for managing lesson summaries without loading question/option entity graphs.
 * Used exclusively by Admin Question Bank lesson list and import pages to avoid fetching all DB questions.
 */
export function useAdminQuestionBankLessons(level: JLPTLevel) {
  const queryClient = useQueryClient();
  rememberAdminQBLevel(level);

  const {
    data: rawLessons = [],
    refetch,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    error,
  } = useQuery({
    queryKey: ["adminQuestionBankLessons", level],
    queryFn: async () => {
      const response = await adminApi.getQuestionBankLessons(level);
      setPersistedAdminQBLessons(level, response);
      return response;
    },
    initialData: () => getPersistedAdminQBLessons(level),
    initialDataUpdatedAt: () => 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const lessons: Lesson[] = rawLessons.map((l) => ({
    id: l.id,
    lessonNumber: l.lessonNumber,
    lessonName: l.lessonName,
    status: l.status && l.status.toUpperCase() === "ACTIVE" ? "Active" : "Draft",
    questionCount: l.questionCount ?? 0,
    createdAt: l.createdAt,
  }));

  const prefetchLessons = useCallback(
    (targetLevel: JLPTLevel) => {
      prefetchAdminQuestionBankLessons(queryClient, undefined, targetLevel).catch(() => {});
    },
    [queryClient]
  );

  const createLessonMutation = useMutation({
    mutationFn: async (vars: { lessonName: string; lessonNumber?: number; status?: string }) => {
      const existingNumbers = rawLessons.map((l) => l.lessonNumber);
      const nextNum =
        vars.lessonNumber || (existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1);
      const response = await adminApi.createQuestionBankLesson({
        level,
        lessonNumber: nextNum,
        lessonName: vars.lessonName,
        status: (vars.status || "DRAFT").toUpperCase(),
      });
      return response;
    },
    onSuccess: (newLesson) => {
      queryClient.setQueryData<any[]>(["adminQuestionBankLessons", level], (old) => {
        if (!old) return [newLesson];
        if (old.some((l) => l.id === newLesson.id)) return old;
        const updated = [...old, { ...newLesson, questionCount: newLesson.questionCount ?? 0 }];
        return updated.sort((a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0));
      });
      const updatedCache = queryClient.getQueryData<any[]>(["adminQuestionBankLessons", level]);
      if (updatedCache) setPersistedAdminQBLessons(level, updatedCache);
      queryClient.invalidateQueries({ queryKey: ["questionBankLessons"], refetchType: "none" });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async (vars: {
      lessonId: number;
      lessonName: string;
      lessonNumber?: number;
      status?: string;
    }) => {
      const response = await adminApi.updateQuestionBankLesson(
        vars.lessonId,
        {
          lessonName: vars.lessonName,
          lessonNumber: vars.lessonNumber,
          status: vars.status,
        },
      );
      return response;
    },
    onSuccess: (updatedLesson, variables) => {
      queryClient.setQueryData<any[]>(["adminQuestionBankLessons", level], (old) => {
        if (!old) return old;
        return old
          .map((lesson) => {
            if (lesson.id === variables.lessonId) {
              const preservedCount = updatedLesson.questionCount ?? lesson.questionCount ?? 0;
              return {
                ...lesson,
                ...updatedLesson,
                questionCount: preservedCount,
              };
            }
            return lesson;
          })
          .sort((a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0));
      });
      const updatedCache = queryClient.getQueryData<any[]>(["adminQuestionBankLessons", level]);
      if (updatedCache) setPersistedAdminQBLessons(level, updatedCache);
      queryClient.invalidateQueries({ queryKey: ["questionBankLessons"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["questionBankQuestions"], refetchType: "none" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      await adminApi.deleteQuestionBankLesson(lessonId);
      return lessonId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<any[]>(["adminQuestionBankLessons", level], (old) => {
        if (!old) return old;
        return old.filter((lesson) => lesson.id !== deletedId);
      });
      const updatedCache = queryClient.getQueryData<any[]>(["adminQuestionBankLessons", level]);
      if (updatedCache) setPersistedAdminQBLessons(level, updatedCache);
      queryClient.invalidateQueries({ queryKey: ["questionBankLessons"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["questionBankQuestions"], refetchType: "none" });
    },
  });

  const createQuestionsBatchMutation = useMutation({
    mutationFn: async (vars: { lessonId: number; questionsData: CreateQuestionInput[] }) => {
      const req = {
        questions: vars.questionsData.map((q) => ({
          topicId: `lesson_${vars.lessonId}`,
          level,
          lessonId: vars.lessonId,
          skill: q.skill ?? (q.type || "VOCABULARY").toUpperCase(),
          prompt: q.questionText,
          questionType: q.type,
          difficulty: q.difficulty.toUpperCase(),
          correctAnswerIndex: q.correctIndex,
          explanation: q.explanation || "",
          options: q.options || [],
          audioUrl: q.audio?.audioUrl,
          audioFileName: q.audio?.audioFileName,
          audioDuration: q.audio?.audioDuration,
          translationMetadata: q.translationMetadata,
          sentenceWritingMetadata: q.sentenceWritingMetadata,
          errorCorrectionMetadata: q.errorCorrectionMetadata,
          matchingMetadata: q.matchingMetadata,
        })),
      };
      const response = await teacherQuestionsApi.createQuestionsBatch(req);

      if (response.requestedCount !== response.savedCount) {
        throw new Error(`Batch save mismatch: requested ${response.requestedCount} but saved ${response.savedCount}`);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminQuestionBankLessons"] });
      queryClient.invalidateQueries({ queryKey: ["questionBankLessons"] });
      queryClient.invalidateQueries({ queryKey: ["questionBankQuestions"] });
    },
  });

  return {
    lessons,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    error,
    refresh: refetch,
    prefetchLessons,
    createLesson: (name: string, num?: number) =>
      createLessonMutation.mutateAsync({ lessonName: name, lessonNumber: num }),
    updateLesson: (id: number, name: string, num?: number, status?: string) =>
      updateLessonMutation.mutateAsync({
        lessonId: id,
        lessonName: name,
        lessonNumber: num,
        status,
      }),
    deleteLesson: (id: number) => deleteLessonMutation.mutateAsync(id),
    createQuestionsBatch: (lessonId: number, data: CreateQuestionInput[]) =>
      createQuestionsBatchMutation.mutateAsync({ lessonId, questionsData: data }),
  };
}

export function useQuestionBank(level: JLPTLevel) {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: rawLessons = [],
    refetch: refetchLessons,
    isLoading: isLoadingLessons,
    isError: isErrorLessons,
    error: errorLessons,
  } = useQuery({
    queryKey: ["questionBankLessons", level],
    queryFn: async () => {
      const response = await adminApi.getQuestionBankLessons(level);
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: rawQuestions = [],
    refetch: refetchQuestions,
    isLoading: isLoadingQuestions,
    isError: isErrorQuestions,
    error: errorQuestions,
  } = useQuery({
    queryKey: ["questionBankQuestions"],
    queryFn: async () => {
      const response = await teacherQuestionsApi.getQuestions();
      return response;
    },
    staleTime: 2 * 60 * 1000,
  });

  const questions = rawQuestions
    .map(mapBackendQuestionToFrontend)
    .filter((q) => q.level === level)
    // Backend returns questions ordered by createdAt DESC. We want oldest-first so that
    // the UI preserves insertion order (existing questions stay at the top, new ones
    // append at the bottom).
    .slice()
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });

  const lessons: Lesson[] = rawLessons.map((l) => ({
    id: l.id,
    lessonNumber: l.lessonNumber,
    lessonName: l.lessonName,
    status: l.status && l.status.toUpperCase() === "ACTIVE" ? "Active" : "Draft",
    questionCount: (l as any).questionCount ?? questions.filter((q) => q.lesson === l.id).length,
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
    mutationFn: async (vars: { lessonName: string; lessonNumber?: number; status?: string }) => {
      const existingNumbers = rawLessons.map((l) => l.lessonNumber);
      const nextNum =
        vars.lessonNumber || (existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1);
      const response = await teacherQuestionsApi.createLesson({
        level,
        lessonNumber: nextNum,
        lessonName: vars.lessonName,
        status: (vars.status || "DRAFT").toUpperCase(),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionBankLessons"] });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async (vars: {
      lessonId: number;
      lessonName: string;
      lessonNumber?: number;
      status?: string;
    }) => {
      const response = await teacherQuestionsApi.updateLesson(
        vars.lessonId,
        vars.lessonName,
        vars.lessonNumber,
        vars.status,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionBankLessons"] });
      queryClient.invalidateQueries({ queryKey: ["questionBankQuestions"] });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const lessonQuestions = questions.filter((q) => q.lesson === lessonId);
      await Promise.all(lessonQuestions.map((q) => teacherQuestionsApi.deleteQuestion(q.id)));
      await teacherQuestionsApi.deleteLesson(lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionBankLessons"] });
      queryClient.invalidateQueries({ queryKey: ["questionBankQuestions"] });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (vars: { lessonId: number; questionData: any }) => {
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

  const createQuestionsBatchMutation = useMutation({
    mutationFn: async (vars: { lessonId: number; questionsData: any[] }) => {
      const req = {
        questions: vars.questionsData.map(q => ({
          topicId: `lesson_${vars.lessonId}`,
          level,
          lessonId: vars.lessonId,
          prompt: q.questionText,
          questionType: q.type,
          difficulty: q.difficulty.toUpperCase(),
          correctAnswerIndex: q.correctIndex,
          explanation: q.explanation || "",
          options: q.options || [],
          audioUrl: q.audio?.audioUrl,
          audioFileName: q.audio?.audioFileName,
          audioDuration: q.audio?.audioDuration,
        }))
      };
      const response = await teacherQuestionsApi.createQuestionsBatch(req);

      if (response.requestedCount !== response.savedCount) {
        throw new Error(`Batch save mismatch: requested ${response.requestedCount} but saved ${response.savedCount}`);
      }

      return {
        requestedCount: response.requestedCount,
        savedCount: response.savedCount,
        savedQuestions: response.savedQuestions.map(mapBackendQuestionToFrontend),
        rawSavedQuestions: response.savedQuestions,
      };
    },
    onSuccess: (data) => {
      queryClient.setQueryData<TeacherQuestionResponse[] | undefined>(
        ["questionBankQuestions"],
        (old) => {
          if (!old) return data.rawSavedQuestions;
          const existingIds = new Set(old.map((q) => q.id));
          const newQs = data.rawSavedQuestions.filter((q) => !existingIds.has(q.id));
          return [...old, ...newQs];
        },
      );
      queryClient.invalidateQueries({
        queryKey: ["questionBankQuestions"],
        refetchType: "none",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (vars: { questionId: string; updates: any }) => {
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
    createLesson: (name: string, num?: number) =>
      createLessonMutation.mutateAsync({ lessonName: name, lessonNumber: num }),
    updateLesson: (id: number, name: string, num?: number, status?: string) =>
      updateLessonMutation.mutateAsync({
        lessonId: id,
        lessonName: name,
        lessonNumber: num,
        status,
      }),
    deleteLesson: (id: number) => deleteLessonMutation.mutateAsync(id),
    createQuestion: (lessonId: number, data: any) =>
      createQuestionMutation.mutateAsync({ lessonId, questionData: data }),
    createQuestionsBatch: (lessonId: number, data: any[]) =>
      createQuestionsBatchMutation.mutateAsync({ lessonId, questionsData: data }),
    updateQuestion: (id: string, updates: any) =>
      updateQuestionMutation.mutateAsync({ questionId: id, updates }),
    deleteQuestion: (id: string) => deleteQuestionMutation.mutateAsync(id),
    getStats,
  };
}
