// ─── Mock Data Index ──────────────────────────────────────────────────────────

export * from "./vocabulary";
export * from "./listening";
export * from "./reading";
export * from "./shadowing";
export * from "./classes";

import { mockVocabulary } from "./vocabulary";
import { mockListening } from "./listening";
import { mockReading } from "./reading";
import { mockShadowing } from "./shadowing";

export const mockData = {
  vocabulary: mockVocabulary,
  listening: mockListening,
  reading: mockReading,
  shadowing: mockShadowing,
};

export const getMockDataCount = () => ({
  vocabulary: mockVocabulary.length,
  listening: mockListening.length,
  reading: mockReading.length,
  shadowing: mockShadowing.length,
});

export const getMockDataByLevel = (level: JLPTLevel) => ({
  vocabulary: mockVocabulary.filter(item => item.jlptLevel === level),
  listening: mockListening.filter(item => item.jlptLevel === level),
  reading: mockReading.filter(item => item.jlptLevel === level),
  shadowing: mockShadowing.filter(item => item.jlptLevel === level),
});
