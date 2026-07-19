export interface ChatRequest {
  message: string;
  conversationId?: string;
  /**
   * Material reference for AI Sensei study mode.
   *
   * <p><strong>Trust model:</strong> the backend identifies the real lesson
   * by <code>id</code> + <code>type</code> and ignores any client-supplied
   * <code>title</code> / <code>content</code>. The frontend must always send
   * both fields together; partial references are rejected by the API with
   * HTTP 400.
   *
   * <p>The legacy <code>title</code> / <code>level</code> fields are kept
   * for instant UI display (so the chip in the sidebar does not flicker)
   * but they are NOT trusted as the authoritative source.
   */
  selectedMaterial?: {
    id: string;
    type: AiMaterialType;
    title?: string;
    level?: string;
    content?: string;
  };
}

export interface ChatResponse {
  conversationId: string;
  reply: string;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface ConversationMessagesResponse {
  conversationId: string;
  messages: AiMessage[];
}

export interface UpdateConversationTitleRequest {
  title: string;
}

export interface UpdateAiMessageRequest {
  content: string;
  selectedMaterial?: {
    id: string;
    type: AiMaterialType;
    title?: string;
    level?: string;
    content?: string;
  };
}

// Quiz types
export type QuizType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "MIXED";

export interface QuizQuestion {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  userAnswer?: number | string;
}

/**
 * Generate quiz request — Phase 2 final trust boundary.
 *
 * <p>When both <code>materialId</code> and <code>materialType</code> are
 * provided, the backend resolves the material through
 * <code>AiMaterialService</code> and ignores <code>materialContent</code>.
 *
 * <p>Partial references (id only, or type only) are rejected by the API
 * with HTTP 400.
 *
 * <p><code>materialContent</code> is still accepted for the legacy
 * manual / free-text quiz path (no materialId). It is NOT used as the
 * authoritative content when a database reference is supplied.
 */
export interface GenerateQuizRequest {
  topic: string;
  materialId?: string;
  materialType?: AiMaterialType;
  materialTitle?: string;
  materialContent?: string;
  level: string;
  count: number;
  type: string;
}

export interface GenerateQuizResponse {
  materialId?: string;
  materialTitle?: string;
  questions: QuizQuestion[];
  errorMessage?: string;
  isFallback?: boolean;
  source?: string;
}

// AI Sensei material selector (Phase 2 — backed by real published lessons).
// These match the AiMaterialSummaryResponse / AiMaterialDetailResponse DTOs
// exposed by GET /api/ai/materials.

export type AiMaterialType = "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";

export interface AiMaterialSummary {
  type: AiMaterialType;
  id: string;
  title: string;
  level: string;
  lessonNumber: number;
  shortDescription?: string | null;
  updatedAt?: string;
}

export interface AiMaterialDetail {
  type: AiMaterialType;
  id: string;
  title: string;
  level: string;
  lessonNumber: number;
  content: string;
  truncated: boolean;
}
