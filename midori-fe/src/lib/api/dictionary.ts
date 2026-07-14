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

export const dictionaryApi = {
  getHoverInfo: async (word: string): Promise<DictionaryHoverResponse> => {
    const response = await api.get<DictionaryHoverResponse>(`/dictionary/hover?word=${encodeURIComponent(word)}`);
    return response;
  },

  getDetail: async (word: string): Promise<DictionaryDetailResponse> => {
    const response = await api.get<DictionaryDetailResponse>(`/dictionary/detail?word=${encodeURIComponent(word)}`);
    return response;
  },
};
