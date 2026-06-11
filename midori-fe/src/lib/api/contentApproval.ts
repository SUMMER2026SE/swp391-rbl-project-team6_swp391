import { api } from "./client";
import type {
  ContentApprovalSummary,
  ContentApprovalDetail,
  ContentRejectPayload,
  GrammarDetailContent,
  GrammarApprovalStatsResponse,
} from "./contentApproval.types";

// ─── Backend Response Types ──────────────────────────────────────────────────────
// Backend wraps response in { success, data, message } format

interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Mapper Functions ─────────────────────────────────────────────────────────────

/**
 * Normalize grammar detail from backend response.
 * Backend returns: { contentType, contentId, grammar: { id, title, pattern, ... } }
 * We need to unwrap and map it properly.
 */
export function mapGrammarApprovalDetail(raw: {
  contentType?: string;
  contentId?: string;
  grammar?: GrammarDetailContent | null;
  id?: string;
  title?: string;
  pattern?: string;
  meaning?: string;
  structure?: string;
  usage?: string;
  examples?: string[];
  level?: string;
  status?: string;
  rejectReason?: string | null;
  createdBy?: string;
  teacherName?: string;
  cardCount?: number;
  createdAt?: string;
  updatedAt?: string;
}): GrammarDetailContent {
  // If backend returns wrapped format with grammar field
  if (raw.grammar) {
    return {
      id: raw.grammar.id ?? raw.contentId ?? "",
      title: raw.grammar.title ?? "",
      pattern: raw.grammar.pattern ?? "",
      meaning: raw.grammar.meaning ?? "",
      structure: raw.grammar.structure ?? "",
      usage: raw.grammar.usage ?? "",
      examples: raw.grammar.examples ?? [],
      level: raw.grammar.level ?? "",
      status: raw.grammar.status ?? "PENDING",
      rejectReason: raw.grammar.rejectReason ?? null,
      createdBy: raw.grammar.createdBy ?? "",
      teacherName: raw.grammar.teacherName ?? "Unknown",
      cardCount: raw.grammar.cardCount ?? raw.grammar.examples?.length ?? 0,
      createdAt: raw.grammar.createdAt ?? "",
      updatedAt: raw.grammar.updatedAt ?? "",
    };
  }

  // Fallback: raw object (direct mapping)
  return {
    id: raw.id ?? raw.contentId ?? "",
    title: raw.title ?? "",
    pattern: raw.pattern ?? "",
    meaning: raw.meaning ?? "",
    structure: raw.structure ?? "",
    usage: raw.usage ?? "",
    examples: raw.examples ?? [],
    level: raw.level ?? "",
    status: raw.status ?? "PENDING",
    rejectReason: raw.rejectReason ?? null,
    createdBy: raw.createdBy ?? "",
    teacherName: raw.teacherName ?? "Unknown",
    cardCount: raw.cardCount ?? raw.examples?.length ?? 0,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
  };
}

/**
 * Fetch pending content approvals, optionally filtered by content type.
 */
export const getPendingContent = (contentType?: string): Promise<ContentApprovalSummary[]> =>
  api.get<ContentApprovalSummary[]>(
    contentType
      ? `/admin/content-approvals/pending?contentType=${encodeURIComponent(contentType)}`
      : "/admin/content-approvals/pending",
  );

/**
 * Fetch approved content, optionally filtered by content type.
 */
export const getApprovedContent = (contentType?: string): Promise<ContentApprovalSummary[]> =>
  api.get<ContentApprovalSummary[]>(
    contentType
      ? `/admin/content-approvals/approved?contentType=${encodeURIComponent(contentType)}`
      : "/admin/content-approvals/approved",
  );

/**
 * Fetch detailed information about a specific content item pending approval.
 */
export const getContentDetail = (
  contentType: string,
  contentId: string,
): Promise<ContentApprovalDetail> =>
  api.get<ContentApprovalDetail>(
    `/admin/content-approvals/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}`,
  );

/**
 * Approve a pending content item.
 */
export const approveContent = (
  contentType: string,
  contentId: string,
): Promise<ContentApprovalSummary> =>
  api.post<ContentApprovalSummary>(
    `/admin/content-approvals/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/approve`,
  );

/**
 * Reject a pending content item with a reason.
 */
export const rejectContent = (
  contentType: string,
  contentId: string,
  payload: ContentRejectPayload,
): Promise<ContentApprovalSummary> =>
  api.post<ContentApprovalSummary>(
    `/admin/content-approvals/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/reject`,
    payload,
  );

// ─── Grammar-specific Approval Functions ────────────────────────────────────────
// These connect to existing backend endpoints using contentType=GRAMMAR

/**
 * Fetch grammar lessons waiting for admin review.
 * Uses existing backend endpoint: GET /api/admin/content-approvals/pending?contentType=GRAMMAR
 */
export const getPendingGrammar = (): Promise<ContentApprovalSummary[]> =>
  getPendingContent("GRAMMAR");

/**
 * Fetch approved grammar lessons.
 * Uses existing backend endpoint: GET /api/admin/content-approvals/approved?contentType=GRAMMAR
 */
export const getApprovedGrammar = (): Promise<ContentApprovalSummary[]> =>
  api.get<ContentApprovalSummary[]>(
    "/admin/content-approvals/approved?contentType=GRAMMAR",
  );

/**
 * Fetch full grammar lesson details for admin review.
 * Uses existing backend endpoint: GET /api/admin/content-approvals/GRAMMAR/{grammarId}
 * 
 * Backend returns: { success: true, data: { contentType, contentId, grammar: {...} } }
 * api.get already unwraps to return data directly, so we get the ContentApprovalDetail object.
 */
export const getGrammarApprovalDetail = async (grammarId: string): Promise<GrammarDetailContent> => {
  // api.get already unwraps { success, data } to return data directly
  const response = await api.get<ContentApprovalDetail>(
    `/admin/content-approvals/GRAMMAR/${encodeURIComponent(grammarId)}`,
  );

  // Debug: log the raw response
  console.log("[Grammar Approval] Raw detail response:", response);

  // Check if response has nested grammar property (wrapper format)
  if (response && 'grammar' in response && response.grammar) {
    console.log("[Grammar Approval] Mapped grammar detail:", mapGrammarApprovalDetail(response as any));
    return mapGrammarApprovalDetail(response as any);
  }
  
  // Direct grammar object (shouldn't happen but handle it)
  console.log("[Grammar Approval] Direct grammar detail:", mapGrammarApprovalDetail(response as any));
  return mapGrammarApprovalDetail(response as any);
};

/**
 * Approve a pending grammar lesson.
 * Uses existing backend endpoint: POST /api/admin/content-approvals/GRAMMAR/{grammarId}/approve
 */
export const approveGrammar = (grammarId: string): Promise<ContentApprovalSummary> =>
  approveContent("GRAMMAR", grammarId);

/**
 * Reject a pending grammar lesson with a reason.
 * Uses existing backend endpoint: POST /api/admin/content-approvals/GRAMMAR/{grammarId}/reject
 */
export const rejectGrammar = (
  grammarId: string,
  reason: string,
): Promise<ContentApprovalSummary> => {
  const payload: ContentRejectPayload = { reason };
  return rejectContent("GRAMMAR", grammarId, payload);
};

/**
 * Fetch grammar approval statistics.
 * Uses backend endpoint: GET /api/admin/content-approvals/grammar-statistics
 * Backend returns: { success: true, data: { pendingReview, totalGrammar, approved, ... } }
 * api.get unwraps outer wrapper and returns data directly.
 * We normalize the response to ensure correct field mapping.
 */
export const getGrammarApprovalStats = async (): Promise<GrammarApprovalStatsResponse> => {
  // api.get already returns the unwrapped data (json.data from backend response)
  const raw = await api.get<GrammarApprovalStatsResponse>(
    "/admin/content-approvals/grammar-statistics",
  );

  // Validate and normalize response
  if (!raw || typeof raw !== "object") {
    console.warn("[Grammar Approval] Invalid stats response, using defaults:", raw);
    return {
      pendingReview: 0,
      totalGrammar: 0,
      approved: 0,
      rejected: 0,
      draft: 0,
    };
  }

  console.log("[Grammar Approval] Stats response:", raw);

  // Normalize: ensure all fields are numbers with 0 fallback
  const pendingReview = Number(raw.pendingReview ?? 0);
  const approved = Number(raw.approved ?? 0);
  return {
    pendingReview,
    totalGrammar: pendingReview + approved,
    approved,
    rejected: Number(raw.rejected ?? 0),
    draft: Number(raw.draft ?? 0),
  };
};
