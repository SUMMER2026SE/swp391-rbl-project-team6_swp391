export interface ChatRequest {
  message: string;
  conversationId?: string;
  selectedMaterial?: {
    id: string;
    title: string;
    type: "vocabulary" | "grammar" | "reading" | "listening" | "shadowing";
    level: string;
    content: string;
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
    title: string;
    type: "vocabulary" | "grammar" | "reading" | "listening" | "shadowing";
    level: string;
    content: string;
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

export interface GenerateQuizRequest {
  topic: string;
  materialId?: string;
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
