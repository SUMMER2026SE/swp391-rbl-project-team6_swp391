export interface ChatRequest {
  message: string;
  conversationId?: string;
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
}
