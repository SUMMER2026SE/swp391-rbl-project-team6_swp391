import { api } from "@/lib/api/client";

export interface AdminVocabularyAiDraftItem {
  japanese: string;
  furigana?: string;
  romaji?: string;
  meaning: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  partOfSpeech?: string;
}

export interface AdminVocabularyAiDraft {
  title: string;
  description?: string;
  items: AdminVocabularyAiDraftItem[];
}

export interface AdminGrammarAiDraftItem {
  grammarPoint: string;
  meaningVietnamese: string;
  meaningJapanese?: string;
  explanation?: string;
  exampleSentence?: string;
  notes?: string;
}

export interface AdminGrammarAiDraft {
  title: string;
  description?: string;
  items: AdminGrammarAiDraftItem[];
}

export interface AdminReadingOptionDraft {
  optionText: string;
  isCorrect: boolean;
}

export interface AdminReadingQuestionDraft {
  questionText: string;
  questionType?: string;
  explanation?: string;
  options: AdminReadingOptionDraft[];
}

export interface AdminReadingPassageDraft {
  title?: string;
  content: string;
  passageOrder?: number;
  questions: AdminReadingQuestionDraft[];
}

export interface AdminReadingAiDraft {
  title: string;
  description?: string;
  passages: AdminReadingPassageDraft[];
}

export interface AdminAiContentGenerateRequest {
  skillType: "VOCABULARY" | "GRAMMAR" | "READING";
  lessonNumber: number;
  lessonTitle: string;
  lessonDescription?: string;
  level: string;
  topic: string;
  itemCount?: number;
  customInstructions?: string;
  // Grammar-specific
  grammarTopic?: string;
  // Reading-specific
  passageCount?: number;
  questionsPerPassage?: number;
  difficulty?: string;
  passageLength?: string;
}

export interface AdminAiContentGenerateResponse {
  skillType: string;
  level: string;
  warning?: string;
  vocabularyDraft?: AdminVocabularyAiDraft;
  grammarDraft?: AdminGrammarAiDraft;
  readingDraft?: AdminReadingAiDraft;
}

export const adminAiContentApi = {
  /**
   * Generate AI content.
   * Uses multipart form data to match @RequestPart on the backend.
   * The "request" part is wrapped in a Blob with explicit application/json type
   * so Spring deserializes it as the target DTO.
   */
  generateContent: async (
    request: AdminAiContentGenerateRequest,
    file?: File
  ): Promise<AdminAiContentGenerateResponse> => {
    const formData = new FormData();
    formData.append(
      "request",
      new Blob([JSON.stringify(request)], { type: "application/json" })
    );
    if (file) {
      formData.append("file", file);
    }

    const json = await api.post("/admin/content-library/ai/generate", formData);
    return json as AdminAiContentGenerateResponse;
  },
};
