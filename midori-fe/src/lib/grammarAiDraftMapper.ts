/**
 * grammarAiDraftMapper.ts
 *
 * Pure, typed mapper from AI draft items → GrammarContentResponse shape.
 * GrammarBackendEditForm reads GrammarDetailResponse.contents (GrammarContentResponse[]).
 *
 * Mapping table:
 * ┌────────────────────────────────┬─────────────────────────────────────────────┐
 * │ AI draft field                 │ GrammarContentResponse field                │
 * ├────────────────────────────────┼─────────────────────────────────────────────┤
 * │ item.grammarPoint              │ pattern                                     │
 * │ item.meaningVietnamese         │ meaning                                     │
 * │ item.explanation               │ structure                                   │
 * │ item.meaningJapanese           │ usage                                       │
 * │ item.exampleSentence           │ examples[0].japanese                        │
 * │ item.notes (or empty)          │ examples[0].vietnameseMeaning               │
 * └────────────────────────────────┴─────────────────────────────────────────────┘
 */

import type { GrammarContentResponse } from "@/lib/api/grammarContent";
import type { AdminGrammarAiDraftItem } from "@/services/adminAiContentService";

/**
 * Maps a single AI draft item to a GrammarContentResponse suitable for
 * pre-populating GrammarBackendEditForm.
 *
 * Required fields (id, grammarLessonId, createdAt, updatedAt) are filled
 * with safe empty-string sentinels because the record does not exist yet.
 */
export function mapAiDraftItemToContentResponse(
  item: AdminGrammarAiDraftItem,
  contentOrder: number
): GrammarContentResponse {
  return {
    id: "",
    grammarLessonId: "",
    contentOrder,
    pattern: item.grammarPoint,
    meaning: item.meaningVietnamese,
    structure: item.explanation ?? "",
    usage: item.meaningJapanese ?? "",
    examples: [
      {
        id: "",
        grammarContentId: "",
        exampleOrder: 1,
        japanese: item.exampleSentence ?? "",
        vietnameseMeaning: item.notes ?? "",
        createdAt: "",
        updatedAt: "",
      },
    ],
    createdAt: "",
    updatedAt: "",
  };
}

/**
 * Maps all items of an AI grammar draft to GrammarContentResponse[].
 * Order is preserved (same index → same contentOrder, 1-based).
 */
export function mapGrammarAiDraftToFormContents(
  items: AdminGrammarAiDraftItem[]
): GrammarContentResponse[] {
  return items.map((item, idx) => mapAiDraftItemToContentResponse(item, idx + 1));
}
