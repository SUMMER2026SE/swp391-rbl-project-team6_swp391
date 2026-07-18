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
};
