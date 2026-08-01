import { api } from "./client";

export interface DictionaryHoverResponse {
  word: string;
  reading: string;
  romaji?: string;
  partOfSpeech?: string;
  meanings: string[];
}

export interface DictionaryMeaningResponse {
  meaning: string;
  partOfSpeech?: string;
  example?: string;
  exampleMeaning?: string;
}

export interface DictionaryExampleResponse {
  example: string;
  exampleMeaning?: string;
}

export interface DictionaryRelatedWordResponse {
  id?: string;
  word: string;
  reading?: string;
  romaji?: string;
}

export interface DictionaryDetailResponse {
  id?: string;
  word: string;
  reading: string;
  romaji?: string;
  jlpt?: string;
  frequency?: number;
  partOfSpeech?: string;
  meanings: DictionaryMeaningResponse[];
  examples?: DictionaryExampleResponse[];
  relatedWords?: DictionaryRelatedWordResponse[];
}

/**
 * Student dictionary API response types for transcript popup
 */
export interface DictionaryLookupResponse {
  surface: string;
  dictionaryForm: string;
  reading: string;
  romaji: string;
  jlpt: string;
  wordType: string;
  pitchAccent: string;
  meanings: string[];
  primaryMeaning: string;
  contextMeaning: string;
  contextExplanation: string;
  forms: GrammarForms | null;
  examples: WordExampleDetail[];
  audioUrl: string;
  hasAudio: boolean;
  saved: boolean;
  saveId: string | null;
  fromCache: boolean;
  fromAi: boolean;
  aiError?: string;
}

export interface GrammarForms {
  masu: string;
  te: string;
  ta: string;
  nai: string;
  potential: string;
  passive: string;
  causative: string;
  volitional: string;
  teKudasai: string;
  tai: string;
  taiToOmoimasu: string;
  nakute: string;
  nakereba: string;
  souru?: string;
}

export interface WordExampleDetail {
  japanese: string;
  reading: string;
  vietnamese: string;
  english: string;
  highlightStart: number;
  highlightEnd: number;
}

export interface SaveWordRequest {
  word: string;
  reading?: string;
  meaning?: string;
  context?: string;
  lessonId?: string;
  dictionaryForm?: string;
  wordType?: string;
  jlpt?: string;
}

export interface StudentSentenceResponse {
  originalText: string;
  translationVi: string;
  translationEn: string;
  vocabulary: VocabItem[];
  grammar: GrammarItem[];
  fromCache: boolean;
  fromAi: boolean;
}

export interface VocabItem {
  word: string;
  reading: string;
  meaning: string;
  jlpt: string;
  isHighlighted: boolean;
}

export interface GrammarItem {
  pattern: string;
  reading: string;
  meaning: string;
  explanation: string;
}

export interface SavedWordResponse {
  id: string;
  surface: string;
  reading?: string;
  dictionaryForm?: string;
  meaning: string;
  context?: string;
  wordType?: string;
  jlptLevel?: string;
  lessonId?: string;
  audioUrl?: string;
  notes?: string;
  createdAt: string;
  learningStatus: string;
  isDifficult: boolean;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  reviewCount: number;
  correctCount: number;
  lapseCount: number;
  masteredAt?: string;
}

export interface SavedWordProgressRequest {
  result: "AGAIN" | "HARD" | "GOOD" | "MASTERED";
}

export const dictionaryApi = {
  /**
   * Full dictionary lookup with grammar forms and context.
   */
  lookupWord: async (params: {
    word: string;
    reading?: string;
    sentence?: string;
    lessonId?: string;
    surface?: string;
  }): Promise<DictionaryLookupResponse> => {
    const searchParams = new URLSearchParams({ word: params.word });
    if (params.reading) searchParams.append("reading", params.reading);
    if (params.sentence) searchParams.append("sentence", params.sentence);
    if (params.lessonId) searchParams.append("lessonId", params.lessonId);
    if (params.surface) searchParams.append("surface", params.surface);
    
    const response = await api.get<DictionaryLookupResponse>(
      `/student/dictionary/lookup?${searchParams}`
    );
    return response;
  },

  /**
   * Legacy word lookup (backward compatibility).
   */
  lookupWordLegacy: async (text: string, context?: string): Promise<StudentWordResponse> => {
    const params = new URLSearchParams({ text });
    if (context) params.append("context", context);
    const response = await api.get<StudentWordResponse>(
      `/student/dictionary/word?${params}`
    );
    return response;
  },

  /**
   * Save a word to user's saved words.
   */
  saveWord: async (request: SaveWordRequest): Promise<DictionaryLookupResponse> => {
    const response = await api.post<DictionaryLookupResponse>(
      "/student/dictionary/save",
      request
    );
    return response;
  },

  /**
   * Check if a word is saved by current user.
   */
  isWordSaved: async (word: string): Promise<boolean> => {
    const response = await api.get<boolean>(
      `/student/dictionary/saved?word=${encodeURIComponent(word)}`
    );
    return response;
  },

  getSavedWords: async (params?: {
    sourceVideoId?: string;
    status?: string;
    difficult?: boolean;
    sort?: string;
  }): Promise<SavedWordResponse[]> => {
    const searchParams = new URLSearchParams();
    if (params?.sourceVideoId) searchParams.append("sourceVideoId", params.sourceVideoId);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.difficult !== undefined) searchParams.append("difficult", String(params.difficult));
    if (params?.sort) searchParams.append("sort", params.sort);
    
    return await api.get<SavedWordResponse[]>(
      `/student/dictionary/saved-words?${searchParams}`
    );
  },

  updateProgress: async (
    id: string,
    request: SavedWordProgressRequest
  ): Promise<SavedWordResponse> => {
    return await api.patch<SavedWordResponse>(
      `/student/dictionary/saved-words/${id}/progress`,
      request
    );
  },

  unsaveWord: async (word: string): Promise<void> => {
    await api.delete<void>(
      `/student/dictionary/unsave?word=${encodeURIComponent(word)}`
    );
  },

  getHoverInfo: async (word: string): Promise<DictionaryHoverResponse> => {
    const response = await api.get<DictionaryHoverResponse>(`/dictionary/hover?word=${encodeURIComponent(word)}`);
    return response;
  },

  getDetail: async (word: string): Promise<DictionaryDetailResponse> => {
    const response = await api.get<DictionaryDetailResponse>(`/dictionary/detail?word=${encodeURIComponent(word)}`);
    return response;
  },

  /**
   * Student sentence analysis for transcript popup.
   */
  analyzeSentence: async (text: string): Promise<StudentSentenceResponse> => {
    const response = await api.get<StudentSentenceResponse>(
      `/student/dictionary/sentence?text=${encodeURIComponent(text)}`
    );
    return response;
  },
};
