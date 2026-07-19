import { api } from "./client";
import type {
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

export interface AiPdfPreviewRequest {
  file: File;
  mode: PdfImportMode;
  level?: string;
  count?: number;
  questionType?: string;
  difficulty?: string;
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
};
