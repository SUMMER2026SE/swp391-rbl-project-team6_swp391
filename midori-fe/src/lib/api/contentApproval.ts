import { api } from "./client";
import type {
  ContentApprovalSummary,
  ContentApprovalDetail,
  ContentRejectPayload,
} from "./contentApproval.types";

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
