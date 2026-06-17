// ─── Mock Data Index ──────────────────────────────────────────────────────────

export * from "./grammar";
export * from "./vocabulary";
export * from "./listening";
export * from "./reading";
export * from "./shadowing";
export * from "./flashcards";

import { mockGrammar } from "./grammar";
import { mockVocabulary } from "./vocabulary";
import { mockListening } from "./listening";
import { mockReading } from "./reading";
import { mockShadowing } from "./shadowing";
import { mockFlashcards } from "./flashcards";
import type { JLPTLevel } from "../types/content-library";

export const mockData = {
  grammar: mockGrammar,
  vocabulary: mockVocabulary,
  listening: mockListening,
  reading: mockReading,
  shadowing: mockShadowing,
  flashcards: mockFlashcards,
};

export const getMockDataCount = () => ({
  grammar: mockGrammar.length,
  vocabulary: mockVocabulary.length,
  listening: mockListening.length,
  reading: mockReading.length,
  shadowing: mockShadowing.length,
  flashcards: mockFlashcards.length,
});

export const getMockDataByLevel = (level: JLPTLevel) => ({
  grammar: mockGrammar.filter(item => item.jlptLevel === level),
  vocabulary: mockVocabulary.filter(item => item.jlptLevel === level),
  listening: mockListening.filter(item => item.jlptLevel === level),
  reading: mockReading.filter(item => item.jlptLevel === level),
  shadowing: mockShadowing.filter(item => item.jlptLevel === level),
  flashcards: mockFlashcards.filter(item => item.jlptLevel === level),
});
