import { api } from "./client";
import type {
  AiMaterialDetail,
  AiMaterialSummary,
  AiMaterialType,
  ChatRequest,
  ChatResponse,
  AiConversation,
  AiMessage,
  ConversationMessagesResponse,
  UpdateConversationTitleRequest,
  UpdateAiMessageRequest,
  GenerateQuizRequest,
  GenerateQuizResponse,
} from "@/types/ai";

export type PdfImportMode = "IMPORT_EXISTING_QUESTIONS" | "GENERATE_FROM_CONTENT";

export type TargetSkill = "VOCABULARY" | "GRAMMAR" | "READING";

export type PdfImportQuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "SHORT_ANSWER";

export interface DifficultyPercentages {
  easy: number;
  medium: number;
  hard: number;
}

export interface AiPdfPreviewRequest {
  file: File;
  mode: PdfImportMode;
  level?: string;
  count?: number;
  questionType?: PdfImportQuestionType;
  /**
   * Legacy single-difficulty hint (only used in IMPORT_EXISTING_QUESTIONS
   * or when the caller does not supply percentage breakdowns). For new
   * GENERATE_FROM_CONTENT requests, use {@link #difficultyPercent} instead.
   */
  difficulty?: string;
  /**
   * Per-difficulty percentage breakdown used by GENERATE_FROM_CONTENT.
   * Easy + Medium + Hard MUST equal exactly 100.
   */
  difficultyPercent?: DifficultyPercentages;
  targetSkills?: TargetSkill[];
}

export interface AiPdfPreviewResponse {
  mode: string;
  title?: string;
  description?: string;
  pageCount?: number;
  extractedTextLength?: number;
  likelyScanned?: boolean;
  warning?: string;
  errorMessage?: string;
  questions: {
    type?: string;
    content?: string;
    difficulty?: string;
    explanation?: string;
    category?: string;
    answers?: { content?: string; isCorrect?: boolean }[];
  }[];
}

export const aiApi = {
  chat: (request: ChatRequest): Promise<ChatResponse> =>
    api.post<ChatResponse>("/ai/chat", request),

  getConversations: (): Promise<AiConversation[]> => api.get<AiConversation[]>("/ai/conversations"),

  getMessages: (conversationId: string): Promise<ConversationMessagesResponse> =>
    api.get<ConversationMessagesResponse>(`/ai/conversations/${conversationId}/messages`),

  deleteConversation: (conversationId: string): Promise<void> =>
    api.delete<void>(`/ai/conversations/${conversationId}`),

  updateConversationTitle: (
    conversationId: string,
    request: UpdateConversationTitleRequest,
  ): Promise<AiConversation> =>
    api.patch<AiConversation>(`/ai/conversations/${conversationId}/title`, request),

  updateUserMessage: (
    conversationId: string,
    messageId: string,
    request: UpdateAiMessageRequest,
  ): Promise<ConversationMessagesResponse> =>
    api.patch<ConversationMessagesResponse>(
      `/ai/conversations/${conversationId}/messages/${messageId}`,
      request,
    ),

  generateQuestions: (request: GenerateQuizRequest): Promise<GenerateQuizResponse> =>
    api.post<GenerateQuizResponse>("/ai/generate-questions", request),

  generateQuestionsFromPdf: (request: AiPdfPreviewRequest): Promise<AiPdfPreviewResponse> => {
    const formData = new FormData();
    formData.append("file", request.file);
    formData.append("mode", request.mode);
    if (request.level) formData.append("level", request.level);
    if (request.count !== undefined) formData.append("count", String(request.count));
    if (request.questionType) formData.append("questionType", request.questionType);
    if (request.difficulty) formData.append("difficulty", request.difficulty);
    if (request.difficultyPercent) {
      // Strict distribution path — always send all three so the BE has a
      // complete picture for validation.
      formData.append("easyPct", String(request.difficultyPercent.easy));
      formData.append("mediumPct", String(request.difficultyPercent.medium));
      formData.append("hardPct", String(request.difficultyPercent.hard));
    }
    if (request.targetSkills && request.targetSkills.length > 0) {
      request.targetSkills.forEach(skill => {
        formData.append("targetSkills", skill);
      });
      // Legacy/forward-compat: some controllers still read a singular
      // `targetSkill`. Also send a CSV variant for any server that
      // collapses repeated parameters into a single string.
      formData.append("targetSkill", request.targetSkills.join(","));
      formData.append("targetSkills", request.targetSkills.join(","));
    }
    return api.post<AiPdfPreviewResponse>("/ai/questions/generate-from-pdf", formData);
  },

  /**
   * AI Sensei material selector — list lightweight summaries.
   *
   * Backend filters: only published, active, non-deleted lessons are
   * returned. userId is NEVER accepted as a query parameter.
   */
  listMaterials: (params?: {
    type?: AiMaterialType;
    level?: string;
    search?: string;
  }): Promise<AiMaterialSummary[]> => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.level) searchParams.set("level", params.level);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    return api.get<AiMaterialSummary[]>(
      `/ai/materials${qs ? `?${qs}` : ""}`,
    );
  },

  /**
   * AI Sensei material selector — fetch full formatted detail for one material.
   * The backend returns a single string `content` capped at 12000 chars.
   */
  getMaterialDetail: (
    type: AiMaterialType,
    id: string,
  ): Promise<AiMaterialDetail> => {
    return api.get<AiMaterialDetail>(
      `/ai/materials/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
    );
  },
};
