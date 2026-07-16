import { api } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GrammarPatternSummary {
  id: string;
  pattern: string;
  jlptLevel: string | null;
  meaningVi: string | null;
  meaningEn: string | null;
  meaningViAvailable: boolean;
}

export interface GrammarPatternDetail {
  id: string;
  pattern: string;
  jlptLevel: string | null;
  // English (always present)
  meaningEn: string | null;
  descriptionEn: string | null;
  // Vietnamese (null until Gemini translates)
  meaningVi: string | null;
  descriptionVi: string | null;
  // Structure & Examples
  structure: string | null;
  exampleJapanese: string | null;
  exampleEnglish: string | null;
  exampleVietnamese: string | null;
  // Video-specific example sentence from transcript
  videoExampleSentence: string | null;
  note: string | null;
  // Metadata
  status: string | null;
  translatedAt: string | null;
  /**
   * true when Gemini failed or hasn't run yet — show English
   * with "Dịch tiếng Việt đang được tạo." notice.
   */
  translationPending: boolean;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const studentGrammarPatternApi = {
  /**
   * GET /api/student/grammar-patterns/video/{videoId}
   * Returns all grammar patterns detected in the given shadowing video.
   */
  getForVideo: (videoId: string): Promise<GrammarPatternSummary[]> =>
    api.get<GrammarPatternSummary[]>(`/student/grammar-patterns/video/${videoId}`),

  /**
   * GET /api/student/grammar-patterns/{grammarId}?videoId={videoId}
   * Returns full grammar detail, lazily translating via Gemini on first request.
   */
  getDetail: (grammarId: string, videoId?: string): Promise<GrammarPatternDetail> => {
    const qs = videoId ? `?videoId=${videoId}` : "";
    return api.get<GrammarPatternDetail>(`/student/grammar-patterns/${grammarId}${qs}`);
  },
};
