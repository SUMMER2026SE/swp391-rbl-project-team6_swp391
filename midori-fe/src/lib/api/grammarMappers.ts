/**
 * Grammar mappers and shared types for Teacher Grammar API.
 * Contains TypeScript interfaces and normalize functions aligned with backend DTOs.
 */

// ─── Status ─────────────────────────────────────────────────────────────────────

export type GrammarStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

// ─── GrammarResponse (backend GrammarResponse.java) ──────────────────────────────

export interface GrammarResponse {
  id: string;
  title: string;
  pattern: string;
  meaning: string;
  structure: string;
  usage: string;
  examples: string[];
  exampleMeanings: string[];
  level: string;
  status: GrammarStatus;
  rejectReason: string | null;
  createdBy: string;
  teacherName: string;
  ownedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  // Pending update fields
  hasPendingUpdate?: boolean;
  pendingTitle?: string | null;
  pendingPattern?: string | null;
  pendingMeaning?: string | null;
  pendingStructure?: string | null;
  pendingUsage?: string | null;
  pendingExamples?: string[] | null;
  pendingExampleMeanings?: string[] | null;
  pendingLevel?: string | null;
  pendingUpdateRejectReason?: string | null;
}

// ─── GrammarCreateRequest (backend GrammarCreateRequest.java) ────────────────────

export interface GrammarCreateRequest {
  title: string;
  pattern: string;
  meaning: string;
  structure: string;
  usage: string;
  examples: string[];
  exampleMeanings: string[];
  level: string;
}

// ─── GrammarUpdateRequest (backend GrammarUpdateRequest.java) ────────────────────

export interface GrammarUpdateRequest {
  title?: string;
  pattern?: string;
  meaning?: string;
  structure?: string;
  usage?: string;
  examples?: string[];
  exampleMeanings?: string[];
  level?: string;
}

// ─── List Params ────────────────────────────────────────────────────────────────

export interface GrammarListParams {
  level?: string;
  search?: string;
  status?: string;
}

// ─── GrammarStatsResponse (backend GrammarStatsResponse.java) ───────────────────

export interface GrammarStatsResponse {
  views: number;
  completions: number;
  learned: number;
}

// ─── Normalize ────────────────────────────────────────────────────────────────

/**
 * Normalize a GrammarResponse to a consistent shape.
 * Handles any field aliasing from the backend response.
 */
export function normalizeGrammar(grammar: GrammarResponse): GrammarResponse {
  return {
    ...grammar,
    status: (grammar.status?.toUpperCase() ?? "DRAFT") as GrammarStatus,
    rejectReason: grammar.rejectReason ?? null,
    teacherName: grammar.teacherName ?? "Unknown Teacher",
  };
}
