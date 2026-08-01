/**
 * Unit tests for grammarAiDraftMapper.ts
 *
 * Run with: npx tsx src/lib/grammarAiDraftMapper.test.ts
 * (No external test runner required — uses console assertions)
 */

import {
  mapAiDraftItemToContentResponse,
  mapGrammarAiDraftToFormContents,
} from "./grammarAiDraftMapper";
import type { AdminGrammarAiDraftItem } from "@/services/adminAiContentService";

// ─── helpers ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  assert(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

// ─── fixture builders ─────────────────────────────────────────────────────────

function makeItem(overrides: Partial<AdminGrammarAiDraftItem> = {}): AdminGrammarAiDraftItem {
  return {
    grammarPoint: "〜ている",
    meaningVietnamese: "đang làm gì đó / trạng thái hiện tại",
    meaningJapanese: "進行中または状態を表す",
    explanation: "V(て形) + いる — dùng để diễn đạt hành động đang diễn ra hoặc trạng thái",
    exampleSentence: "今、勉強しています。",
    notes: "Hiện tại tôi đang học.",
    ...overrides,
  };
}

// ─── test: field mapping ──────────────────────────────────────────────────────

console.log("\n[grammarAiDraftMapper] field mapping");

{
  const item = makeItem();
  const result = mapAiDraftItemToContentResponse(item, 1);

  // 4. grammarPoint → pattern
  assertEqual(result.pattern, item.grammarPoint, "grammarPoint → pattern");

  // 5. meaningVietnamese → meaning
  assertEqual(result.meaning, item.meaningVietnamese, "meaningVietnamese → meaning");

  // 6. explanation → structure
  assertEqual(result.structure, item.explanation, "explanation → structure");

  // 7. meaningJapanese → usage
  assertEqual(result.usage, item.meaningJapanese, "meaningJapanese → usage");

  // 8. exampleSentence → examples[0].japanese
  assertEqual(result.examples[0]?.japanese, item.exampleSentence, "exampleSentence → example japanese");

  // 9. notes → examples[0].vietnameseMeaning
  assertEqual(result.examples[0]?.vietnameseMeaning, item.notes, "notes → example vietnameseMeaning");

  // contentOrder
  assertEqual(result.contentOrder, 1, "contentOrder is set to given order");
}

// ─── test: optional field fallbacks ──────────────────────────────────────────

console.log("\n[grammarAiDraftMapper] optional field fallbacks");

{
  const item = makeItem({ meaningJapanese: undefined, explanation: undefined, exampleSentence: undefined, notes: undefined });
  const result = mapAiDraftItemToContentResponse(item, 1);

  assertEqual(result.structure, "", "explanation undefined → structure empty string");
  assertEqual(result.usage, "", "meaningJapanese undefined → usage empty string");
  assertEqual(result.examples[0]?.japanese, "", "exampleSentence undefined → example japanese empty string");
  assertEqual(result.examples[0]?.vietnameseMeaning, "", "notes undefined → example vietnameseMeaning empty string");
}

// ─── test: 1 item → 1 form item ──────────────────────────────────────────────

console.log("\n[grammarAiDraftMapper] 1 draft item → 1 form content row");

{
  const items = [makeItem()];
  const result = mapGrammarAiDraftToFormContents(items);

  // 1. 1 grammar point → 1 form item
  assertEqual(result.length, 1, "1 AI item produces exactly 1 form content");

  // 3. No extra blank item
  assert(result.length === 1, "No extra blank item added");
}

// ─── test: 10 items → 10 form items, order preserved ─────────────────────────

console.log("\n[grammarAiDraftMapper] 10 draft items → 10 form content rows, order preserved");

{
  const items = Array.from({ length: 10 }, (_, i) =>
    makeItem({ grammarPoint: `pattern-${i + 1}`, meaningVietnamese: `meaning-${i + 1}` })
  );
  const result = mapGrammarAiDraftToFormContents(items);

  // 2. 10 grammar points → 10 form items
  assertEqual(result.length, 10, "10 AI items produce exactly 10 form contents");

  // 3. No extra blank item
  assert(result.length === 10, "No extra blank item added");

  // 10. Order preserved
  for (let i = 0; i < 10; i++) {
    assertEqual(result[i].contentOrder, i + 1, `item[${i}] contentOrder === ${i + 1}`);
    assertEqual(result[i].pattern, `pattern-${i + 1}`, `item[${i}] pattern matches input`);
  }
}

// ─── test: examples array always has exactly 1 entry ─────────────────────────

console.log("\n[grammarAiDraftMapper] examples array structure");

{
  const item = makeItem();
  const result = mapAiDraftItemToContentResponse(item, 1);

  assertEqual(result.examples.length, 1, "Mapped content has exactly 1 example entry");
  assert(result.examples[0] !== undefined, "Example entry is defined");
}

// ─── summary ──────────────────────────────────────────────────────────────────

console.log(`\n─── Results: ${passed} passed, ${failed} failed ───\n`);
if (failed > 0) process.exit(1);
