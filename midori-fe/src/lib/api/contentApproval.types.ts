// Frontend types for Content Approval — aligned with backend DTOs

// Status values from backend
export type ContentApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "DRAFT";

// Content types from backend
export type ContentType = "GRAMMAR" | "FLASHCARD";

// ─── ContentApprovalSummaryResponse ───────────────────────────────────────────

export interface ContentApprovalSummary {
  contentType: string;
  contentId: string;
  title: string;
  level: string;
  status: ContentApprovalStatus;
  teacherId: string;
  teacherName: string;
  rejectReason: string | null;
  submittedAt: string;
  updatedAt: string;
}

// ─── ContentApprovalDetailResponse ─────────────────────────────────────────────

export interface FlashcardCard {
  id: string;
  frontText: string;
  backText: string;
  example: string | null;
  hint: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface GrammarDetailContent {
  id: string;
  title: string;
  pattern: string;
  meaning: string;
  structure: string;
  usage: string;
  examples: string[];
  level: string;
  status: ContentApprovalStatus;
  rejectReason: string | null;
  createdBy: string;
  teacherName: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardDetailContent {
  id: string;
  title: string;
  description: string;
  level: string;
  status: ContentApprovalStatus;
  rejectReason: string | null;
  teacherId: string;
  teacherName: string;
  cardCount: number;
  cards: FlashcardCard[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentApprovalDetail {
  contentType: ContentType;
  contentId: string;
  grammar: GrammarDetailContent | null;
  flashcard: FlashcardDetailContent | null;
}

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface ContentRejectPayload {
  reason: string;
}

// ─── Status Configuration ──────────────────────────────────────────────────────

export const CONTENT_STATUS_CONFIG: Record<
  ContentApprovalStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDING: {
    label: "Pending",
    bg: "badge-pending",
    text: "text-[var(--status-pending)]",
    border: "border-[var(--status-pending)]/25",
  },
  APPROVED: {
    label: "Approved",
    bg: "badge-approved",
    text: "text-[var(--status-approved)]",
    border: "border-[var(--status-approved)]/25",
  },
  REJECTED: {
    label: "Rejected",
    bg: "badge-rejected",
    text: "text-[var(--status-rejected)]",
    border: "border-[var(--status-rejected)]/25",
  },
  DRAFT: {
    label: "Draft",
    bg: "bg-muted",
    text: "text-muted-col",
    border: "border-[var(--border)]",
  },
};

export const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; bg: string; text: string }> =
  {
    GRAMMAR: {
      label: "Grammar",
      bg: "bg-primary/12",
      text: "text-primary",
    },
    FLASHCARD: {
      label: "Flashcard",
      bg: "bg-[var(--status-teacher)]/12",
      text: "text-[var(--status-teacher)]",
    },
  };
