// ─── Flashcard Mappers ────────────────────────────────────────────────────────────
// Maps backend DTOs to normalized frontend types
// Aligned with backend: FlashcardSetResponse, FlashcardSetDetailResponse,
//                       FlashcardCardResponse, FlashcardSetCreateRequest,
//                       FlashcardSetUpdateRequest, FlashcardCardCreateRequest,
//                       FlashcardCardUpdateRequest

// ─── Response Types ─────────────────────────────────────────────────────────────

export interface FlashcardSetResponse {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  status: FlashcardSetStatus;
  rejectReason: string | null;
  teacherId: string;
  teacherName: string;
  ownedByMe: boolean;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardSetDetailResponse {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  status: FlashcardSetStatus;
  rejectReason: string | null;
  teacherId: string;
  teacherName: string;
  ownedByMe: boolean;
  cardCount: number;
  cards: FlashcardCardResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardCardResponse {
  id: string;
  frontText: string;
  backText: string;
  kana: string | null;
  meaning: string | null;
  example: string | null;
  hint: string | null;
  orderIndex: number | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Request Types ──────────────────────────────────────────────────────────────

export interface FlashcardSetCreateRequest {
  title: string;
  description?: string | null;
  level?: string | null;
}

export interface FlashcardSetUpdateRequest {
  title: string;
  description?: string | null;
  level?: string | null;
}

export interface FlashcardCardCreateRequest {
  frontText: string;
  backText: string;
  meaning?: string | null;
  kana?: string | null;
  example?: string | null;
  hint?: string | null;
  orderIndex?: number | null;
}

export interface FlashcardCardUpdateRequest {
  frontText: string;
  backText: string;
  meaning?: string | null;
  kana?: string | null;
  example?: string | null;
  hint?: string | null;
  orderIndex?: number | null;
}

// ─── Status Type ────────────────────────────────────────────────────────────────

export type FlashcardSetStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

// ─── List Params ────────────────────────────────────────────────────────────────

export interface FlashcardSetListParams {
  level?: string;
  search?: string;
}

// ─── Normalizers ───────────────────────────────────────────────────────────────

function normalizeCard(raw: unknown): FlashcardCardResponse {
  const r = raw as Record<string, unknown>;
  const meaning = r.meaning != null ? String(r.meaning) : null;
  return {
    id: String(r.id ?? ""),
    frontText: String(r.frontText ?? r.front_text ?? ""),
    backText: String(r.backText ?? r.back_text ?? ""),
    kana: r.kana != null ? String(r.kana) : null,
    meaning: meaning,
    example: r.example != null ? String(r.example) : null,
    hint: r.hint != null ? String(r.hint) : null,
    orderIndex: r.orderIndex != null ? Number(r.orderIndex) : null,
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
  };
}

export function normalizeFlashcardSet(raw: unknown): FlashcardSetResponse {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    title: String(r.title ?? ""),
    description: r.description != null ? String(r.description) : null,
    level: r.level != null ? String(r.level) : null,
    status: (r.status as FlashcardSetStatus) ?? "DRAFT",
    rejectReason: r.rejectReason != null ? String(r.rejectReason) : null,
    teacherId: String(r.teacherId ?? r.teacher_id ?? ""),
    teacherName: String(r.teacherName ?? r.teacher_name ?? "Unknown"),
    ownedByMe: Boolean(r.ownedByMe ?? r.owned_by_me ?? false),
    cardCount: Number(r.cardCount ?? r.card_count ?? 0),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
  };
}

export function normalizeFlashcardSetDetail(raw: unknown): FlashcardSetDetailResponse {
  const r = raw as Record<string, unknown>;
  const rawCards = r.cards;
  const normalizedCards: FlashcardCardResponse[] = Array.isArray(rawCards)
    ? rawCards.map((card) => normalizeCard(card))
    : [];

  return {
    id: String(r.id ?? ""),
    title: String(r.title ?? ""),
    description: r.description != null ? String(r.description) : null,
    level: r.level != null ? String(r.level) : null,
    status: (r.status as FlashcardSetStatus) ?? "DRAFT",
    rejectReason: r.rejectReason != null ? String(r.rejectReason) : null,
    teacherId: String(r.teacherId ?? r.teacher_id ?? ""),
    teacherName: String(r.teacherName ?? r.teacher_name ?? "Unknown"),
    ownedByMe: Boolean(r.ownedByMe ?? r.owned_by_me ?? false),
    cardCount: Number(r.cardCount ?? r.card_count ?? 0),
    cards: normalizedCards,
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
  };
}

// ─── Create/Update Payload Normalizers ──────────────────────────────────────────

export function normalizeCreateSetPayload(
  data: FlashcardSetCreateRequest,
): FlashcardSetCreateRequest {
  return {
    title: data.title,
    description: data.description ?? null,
    level: data.level ?? null,
  };
}

export function normalizeUpdateSetPayload(
  data: FlashcardSetUpdateRequest,
): FlashcardSetUpdateRequest {
  return {
    title: data.title,
    description: data.description ?? null,
    level: data.level ?? null,
  };
}

export function normalizeCreateCardPayload(
  data: FlashcardCardCreateRequest,
): FlashcardCardCreateRequest {
  return {
    frontText: data.frontText,
    backText: data.backText,
    meaning: data.meaning ?? null,
    kana: data.kana ?? null,
    example: data.example ?? null,
    hint: data.hint ?? null,
    orderIndex: data.orderIndex ?? null,
  };
}

export function normalizeUpdateCardPayload(
  data: FlashcardCardUpdateRequest,
): FlashcardCardUpdateRequest {
  return {
    frontText: data.frontText,
    backText: data.backText,
    meaning: data.meaning ?? null,
    kana: data.kana ?? null,
    example: data.example ?? null,
    hint: data.hint ?? null,
    orderIndex: data.orderIndex ?? null,
  };
}
