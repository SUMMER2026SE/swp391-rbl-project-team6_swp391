/**
 * Admin Grammar API - Manages grammar library for administrators
 * Handles CRUD operations using backend GrammarResponse format
 */

import { api } from "./client";
import type { GrammarResponse, GrammarCreateRequest, GrammarUpdateRequest } from "./grammarMappers";

// ─── Backend to Frontend Mapper ─────────────────────────────────────────────────

export interface AdminGrammarItem {
  id: string;
  grammarStructure: string; // Maps to backend: pattern
  meaning: string;
  exampleSentences: { sentence: string; meaning: string }[];
  jlptLevel: "N5" | "N4" | "N3" | "N2" | "N1";
  tags: string[];
  isPublished: boolean; // true = APPROVED, false = DRAFT
  createdAt: string;
  updatedAt: string;
  // Additional backend fields
  title: string;
  structure: string;
  usage: string;
  status: string;
  teacherName: string;
}

export interface CreateGrammarInput {
  grammarStructure: string;
  meaning: string;
  jlptLevel: "N5" | "N4" | "N3" | "N2" | "N1";
  tags: string[];
  exampleSentences: { sentence: string; meaning: string }[];
  isPublished: boolean;
}

export interface UpdateGrammarInput extends Partial<CreateGrammarInput> {
  id: string;
}

/**
 * Convert backend GrammarResponse to AdminGrammarItem for frontend display
 */
function toAdminGrammarItem(response: GrammarResponse): AdminGrammarItem {
  // Combine examples and exampleMeanings into exampleSentences
  const exampleSentences = (response.examples || []).map((sentence, index) => ({
    sentence,
    meaning: response.exampleMeanings?.[index] || "",
  }));

  return {
    id: response.id,
    grammarStructure: response.pattern || response.title || "",
    title: response.title || "",
    meaning: response.meaning || "",
    structure: response.structure || "",
    usage: response.usage || "",
    exampleSentences,
    jlptLevel: (response.level as AdminGrammarItem["jlptLevel"]) || "N5",
    tags: [], // Backend doesn't have tags field
    isPublished: response.status === "APPROVED",
    createdAt: response.createdAt ? new Date(response.createdAt).toISOString().split("T")[0] : "",
    updatedAt: response.updatedAt ? new Date(response.updatedAt).toISOString().split("T")[0] : "",
    status: response.status,
    teacherName: response.teacherName || "Unknown",
  };
}

/**
 * Convert CreateGrammarInput to backend GrammarCreateRequest
 */
function toCreateRequest(input: CreateGrammarInput): GrammarCreateRequest {
  const examples = input.exampleSentences.map((ex) => ex.sentence);
  const exampleMeanings = input.exampleSentences.map((ex) => ex.meaning);

  return {
    title: input.grammarStructure, // Use grammarStructure as title
    pattern: input.grammarStructure,
    meaning: input.meaning,
    structure: "",
    usage: "",
    examples,
    exampleMeanings,
    level: input.jlptLevel,
    // isPublished: input.isPublished,
  };
}

/**
 * Convert UpdateGrammarInput to backend GrammarUpdateRequest
 */
function toUpdateRequest(input: UpdateGrammarInput): GrammarUpdateRequest {
  const update: GrammarUpdateRequest = {};

  if (input.grammarStructure !== undefined) {
    update.pattern = input.grammarStructure;
    update.title = input.grammarStructure;
  }
  if (input.meaning !== undefined) {
    update.meaning = input.meaning;
  }
  if (input.jlptLevel !== undefined) {
    update.level = input.jlptLevel;
  }
  if (input.exampleSentences !== undefined) {
    update.examples = input.exampleSentences.map((ex) => ex.sentence);
    update.exampleMeanings = input.exampleSentences.map((ex) => ex.meaning);
  }

  return update;
}

// ─── Admin Grammar API ───────────────────────────────────────────────────────────

export const adminGrammarApi = {
  /**
   * GET /api/teacher/grammar
   * Lists all grammar lessons (admin can see all)
   * Supports optional query params: level, search, status
   */
  getAll: async (params?: {
    level?: string;
    search?: string;
    status?: string;
  }): Promise<AdminGrammarItem[]> => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);
    const qs = searchParams.toString();
    const grammars = await api.get<GrammarResponse[]>(
      `/teacher/grammar${qs ? `?${qs}` : ""}`
    );
    return grammars.map(toAdminGrammarItem);
  },

  /**
   * GET /api/teacher/grammar/{grammarId}
   * Returns a single grammar lesson detail
   */
  getById: async (grammarId: string): Promise<AdminGrammarItem> => {
    const grammar = await api.get<GrammarResponse>(`/teacher/grammar/${grammarId}`);
    return toAdminGrammarItem(grammar);
  },

  /**
   * POST /api/teacher/grammar
   * Creates a new grammar lesson
   */
  create: async (data: CreateGrammarInput): Promise<AdminGrammarItem> => {
    const request = toCreateRequest(data);
    const grammar = await api.post<GrammarResponse>("/teacher/grammar", request);
    return toAdminGrammarItem(grammar);
  },

  /**
   * PUT /api/teacher/grammar/{grammarId}
   * Updates an existing grammar lesson
   */
  update: async (
    grammarId: string,
    data: UpdateGrammarInput
  ): Promise<AdminGrammarItem> => {
    const request = toUpdateRequest(data);
    const grammar = await api.put<GrammarResponse>(
      `/teacher/grammar/${grammarId}`,
      request
    );
    return toAdminGrammarItem(grammar);
  },

  /**
   * DELETE /api/teacher/grammar/{grammarId}
   * Deletes a grammar lesson
   */
  delete: (grammarId: string): Promise<void> =>
    api.delete<void>(`/teacher/grammar/${grammarId}`),

  /**
   * PATCH /api/teacher/grammar/{grammarId}/publish
   * Publishes a grammar lesson (sets status to APPROVED)
   */
  publish: (grammarId: string): Promise<AdminGrammarItem> => {
    return api.patch<GrammarResponse>(`/teacher/grammar/${grammarId}/publish`).then(toAdminGrammarItem);
  },

  /**
   * PATCH /api/teacher/grammar/{grammarId}/unpublish
   * Unpublishes a grammar lesson (sets status to DRAFT)
   */
  unpublish: (grammarId: string): Promise<AdminGrammarItem> => {
    return api.patch<GrammarResponse>(`/teacher/grammar/${grammarId}/unpublish`).then(toAdminGrammarItem);
  },
};
