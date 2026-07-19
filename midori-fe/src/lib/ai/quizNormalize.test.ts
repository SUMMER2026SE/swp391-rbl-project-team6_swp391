/**
 * Pure-function tests for {@link ./quizNormalize}.
 *
 * <p>Run with:
 * <pre>npx tsx src/lib/ai/quizNormalize.test.ts</pre>
 *
 * <p>The module is framework-free so it can be exercised directly with
 * Node. We avoid any DOM, React, or vitest dependency to keep the
 * test footprint tiny.
 */

import {
  fillBlankResultState,
  hasBlankMarker,
  isFreeTextAnswerCorrect,
  isSupportedQuestionType,
  normalizeFreeTextAnswer,
  normalizeQuestion,
  normalizeQuestionType,
  UNSUPPORTED,
} from "./quizNormalize";

type TestFn = () => void;

let passed = 0;
let failed = 0;
const failures: string[] = [];

function it(name: string, fn: TestFn): void {
  try {
    fn();
    passed++;
    // eslint-disable-next-line no-console
    console.log(`  \u2713 ${name}`);
  } catch (err: any) {
    failed++;
    const msg = err?.message ?? String(err);
    failures.push(`${name}: ${msg}`);
    // eslint-disable-next-line no-console
    console.log(`  \u2717 ${name}\n      ${msg}`);
  }
}

function assertEqual<T>(actual: T, expected: T, hint?: string): void {
  if (actual !== expected) {
    throw new Error(
      `${hint ?? "expected"} ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
    );
  }
}

function assertTrue(value: boolean, hint: string): void {
  if (!value) {
    throw new Error(`${hint} (got ${JSON.stringify(value)})`);
  }
}

// ─────────────────────────────────────────────────────────────────
// normalizeQuestionType
// ─────────────────────────────────────────────────────────────────
console.log("normalizeQuestionType:");

it("canonical MULTIPLE_CHOICE", () => {
  assertEqual(normalizeQuestionType("MULTIPLE_CHOICE"), "MULTIPLE_CHOICE");
});
it("canonical TRUE_FALSE", () => {
  assertEqual(normalizeQuestionType("TRUE_FALSE"), "TRUE_FALSE");
});
it("canonical FILL_BLANK", () => {
  assertEqual(normalizeQuestionType("FILL_BLANK"), "FILL_BLANK");
});

it("lowercase fill_blank is normalized", () => {
  assertEqual(normalizeQuestionType("fill_blank"), "FILL_BLANK");
});
it("fill-in-the-blank alias is normalized to FILL_BLANK", () => {
  assertEqual(normalizeQuestionType("FILL_IN_THE_BLANK"), "FILL_BLANK");
});
it("fill-in-blank alias is normalized to FILL_BLANK", () => {
  assertEqual(normalizeQuestionType("FILL_IN_BLANK"), "FILL_BLANK");
});
it("cloze alias is normalized to FILL_BLANK", () => {
  assertEqual(normalizeQuestionType("CLOZE"), "FILL_BLANK");
});
it("FILL alias is normalized to FILL_BLANK", () => {
  assertEqual(normalizeQuestionType("FILL"), "FILL_BLANK");
});
it("MCQ alias is normalized to MULTIPLE_CHOICE", () => {
  assertEqual(normalizeQuestionType("MCQ"), "MULTIPLE_CHOICE");
});
it("T_F alias is normalized to TRUE_FALSE", () => {
  assertEqual(normalizeQuestionType("T_F"), "TRUE_FALSE");
});
it("type with leading/trailing whitespace is handled", () => {
  assertEqual(normalizeQuestionType("  fill_blank  "), "FILL_BLANK");
});
it("type with hyphen is normalized", () => {
  assertEqual(normalizeQuestionType("FILL-IN-THE-BLANK"), "FILL_BLANK");
});
it("unknown type returns UNSUPPORTED", () => {
  assertEqual(normalizeQuestionType("MATCHING"), UNSUPPORTED);
  assertEqual(normalizeQuestionType("ESSAY"), UNSUPPORTED);
  assertEqual(normalizeQuestionType("RANDOM_TYPE"), UNSUPPORTED);
  assertEqual(normalizeQuestionType("UNKNOWN"), UNSUPPORTED);
});
it("non-string input returns UNSUPPORTED", () => {
  assertEqual(normalizeQuestionType(undefined), UNSUPPORTED);
  assertEqual(normalizeQuestionType(null), UNSUPPORTED);
  assertEqual(normalizeQuestionType(123), UNSUPPORTED);
  assertEqual(normalizeQuestionType({}), UNSUPPORTED);
  assertEqual(normalizeQuestionType([]), UNSUPPORTED);
  assertEqual(normalizeQuestionType(true), UNSUPPORTED);
});
it("MIXED returns UNSUPPORTED at the per-question level", () => {
  assertEqual(normalizeQuestionType("MIXED"), UNSUPPORTED);
  assertEqual(normalizeQuestionType("mixed"), UNSUPPORTED);
});
it("empty / whitespace string returns UNSUPPORTED", () => {
  assertEqual(normalizeQuestionType(""), UNSUPPORTED);
  assertEqual(normalizeQuestionType("   "), UNSUPPORTED);
});
it("UNSUPPORTED is never equal to any canonical type", () => {
  assertTrue(UNSUPPORTED !== "MULTIPLE_CHOICE");
  assertTrue(UNSUPPORTED !== "TRUE_FALSE");
  assertTrue(UNSUPPORTED !== "FILL_BLANK");
});

// isSupportedQuestionType
it("isSupportedQuestionType accepts canonical types", () => {
  assertTrue(isSupportedQuestionType("MULTIPLE_CHOICE"));
  assertTrue(isSupportedQuestionType("FILL_BLANK"));
  assertTrue(isSupportedQuestionType("TRUE_FALSE"));
});
it("isSupportedQuestionType accepts aliases", () => {
  assertTrue(isSupportedQuestionType("FILL_IN_BLANK"));
  assertTrue(isSupportedQuestionType("cloze"));
});
it("isSupportedQuestionType rejects MIXED (request mode)", () => {
  assertEqual(isSupportedQuestionType("MIXED"), false);
});
it("isSupportedQuestionType rejects unknown", () => {
  assertEqual(isSupportedQuestionType("UNKNOWN"), false);
});

// ─────────────────────────────────────────────────────────────────
// normalizeFreeTextAnswer
// ─────────────────────────────────────────────────────────────────
console.log("\nnormalizeFreeTextAnswer:");

it("trims whitespace", () => {
  assertEqual(normalizeFreeTextAnswer("  hello  "), "hello");
});
it("collapses internal whitespace", () => {
  assertEqual(normalizeFreeTextAnswer("hello   world"), "hello world");
});
it("lower-cases Latin letters only", () => {
  assertEqual(normalizeFreeTextAnswer("Đúng"), "đúng");
  assertEqual(normalizeFreeTextAnswer("HELLO"), "hello");
});
it("does not mangle Japanese characters", () => {
  // CJK code points have no case so they must be preserved verbatim.
  assertEqual(normalizeFreeTextAnswer("食べる"), "食べる");
  assertEqual(normalizeFreeTextAnswer("ありがとう"), "ありがとう");
});
it("does not mangle hiragana with dakuten", () => {
  assertEqual(normalizeFreeTextAnswer("がんばって"), "がんばって");
});
it("returns empty for null / undefined / empty", () => {
  assertEqual(normalizeFreeTextAnswer(null), "");
  assertEqual(normalizeFreeTextAnswer(undefined), "");
  assertEqual(normalizeFreeTextAnswer(""), "");
});

// ─────────────────────────────────────────────────────────────────
// isFreeTextAnswerCorrect
// ─────────────────────────────────────────────────────────────────
console.log("\nisFreeTextAnswerCorrect:");

it("identical strings are correct", () => {
  assertTrue(isFreeTextAnswerCorrect("食べる", "食べる"));
});
it("whitespace-tolerant match", () => {
  assertTrue(isFreeTextAnswerCorrect("  hello  ", "hello"));
  assertTrue(isFreeTextAnswerCorrect("hello world", "hello   world"));
});
it("Latin case-tolerant match", () => {
  assertTrue(isFreeTextAnswerCorrect("HELLO", "hello"));
});
it("Vietnamese diacritics case match", () => {
  assertTrue(isFreeTextAnswerCorrect("Đúng", "đúng"));
});
it("empty user answer is NEVER correct", () => {
  assertEqual(isFreeTextAnswerCorrect("", "hello"), false);
});
it("empty expected answer is NEVER correct", () => {
  assertEqual(isFreeTextAnswerCorrect("hello", ""), false);
});
it("different answers are incorrect", () => {
  assertEqual(isFreeTextAnswerCorrect("食べる", "飲む"), false);
  assertEqual(isFreeTextAnswerCorrect("hello", "world"), false);
});
it("Unicode NFC normalization handles combining marks", () => {
  // Café: precomposed 'é' (U+00E9) vs 'e' + combining acute (U+0301)
  const precomposed = "Café";
  const decomposed = "Cafe\u0301";
  assertTrue(isFreeTextAnswerCorrect(precomposed, decomposed));
});

// ─────────────────────────────────────────────────────────────────
// fillBlankResultState
// ─────────────────────────────────────────────────────────────────
console.log("\nfillBlankResultState:");

it("empty user answer is unanswered", () => {
  assertEqual(fillBlankResultState("", "食べる"), "unanswered");
});
it("whitespace-only answer is unanswered", () => {
  assertEqual(fillBlankResultState("   ", "食べる"), "unanswered");
});
it("matching answer is correct", () => {
  assertEqual(fillBlankResultState("食べる", "食べる"), "correct");
});
it("different answer is incorrect", () => {
  assertEqual(fillBlankResultState("飲む", "食べる"), "incorrect");
});

// ─────────────────────────────────────────────────────────────────
// hasBlankMarker
// ─────────────────────────────────────────────────────────────────
console.log("\nhasBlankMarker:");

it("detects underscore marker", () => {
  assertTrue(hasBlankMarker("Yesterday I ___ to the store."));
  assertTrue(hasBlankMarker("Reading: ___ was a hero."));
});
it("detects [BLANK] marker (case-insensitive)", () => {
  assertTrue(hasBlankMarker("Translate [BLANK] into English."));
  assertTrue(hasBlankMarker("Translate [blank] into English."));
});
it("detects {{blank}} marker (case-insensitive)", () => {
  assertTrue(hasBlankMarker("Fill: {{blank}} please."));
  assertTrue(hasBlankMarker("Fill: {{BLANK}} please."));
});
it("returns false for plain fill-blank without marker", () => {
  assertEqual(hasBlankMarker("Điền nghĩa của 「食べる」"), false);
});
it("returns false for null / empty", () => {
  assertEqual(hasBlankMarker(null), false);
  assertEqual(hasBlankMarker(undefined), false);
  assertEqual(hasBlankMarker(""), false);
});

// ─────────────────────────────────────────────────────────────────
// normalizeQuestion — object-based MIXED-mode normalization
// ─────────────────────────────────────────────────────────────────
console.log("\nnormalizeQuestion (object-based MIXED normalization):");

it("standalone FILL_BLANK remains FILL_BLANK", () => {
  assertEqual(
    normalizeQuestion({
      type: "FILL_BLANK",
      question: "Điền nghĩa của 「食べる」",
      options: [],
      correctAnswer: "ăn",
    }),
    "FILL_BLANK"
  );
});

it("MIXED: MC label + ____ marker + options=[] becomes FILL_BLANK", () => {
  // The exact malformed question from the user's report:
  //   わたしの ____ は リンです。
  assertEqual(
    normalizeQuestion({
      type: "MULTIPLE_CHOICE",
      question: "わたしの ____ は リンです。",
      options: [],
      correctAnswer: "名前",
    }),
    "FILL_BLANK"
  );
});

it("MIXED: MC label + ____ marker + options=null becomes FILL_BLANK", () => {
  assertEqual(
    normalizeQuestion({
      type: "MULTIPLE_CHOICE",
      question: "日本語を勉強____。",
      options: null as unknown as string[],
      correctAnswer: "する",
    }),
    "FILL_BLANK"
  );
});

it("MIXED: MC label + 4 options + matching answer stays MULTIPLE_CHOICE", () => {
  assertEqual(
    normalizeQuestion({
      type: "MULTIPLE_CHOICE",
      question: "「学校」の読み方は?",
      options: ["がっこう", "がくこう", "まなび", "けんきゅう"],
      correctAnswer: "がっこう",
    }),
    "MULTIPLE_CHOICE"
  );
});

it("MIXED: MC label + options=[] + no marker becomes UNSUPPORTED", () => {
  assertEqual(
    normalizeQuestion({
      type: "MULTIPLE_CHOICE",
      question: "Pick the correct answer.",
      options: [],
      correctAnswer: "x",
    }),
    UNSUPPORTED
  );
});

it("MIXED: empty type + ____ marker becomes FILL_BLANK", () => {
  assertEqual(
    normalizeQuestion({
      type: "",
      question: "日本語を勉強____。",
      options: [],
      correctAnswer: "する",
    }),
    "FILL_BLANK"
  );
});

it("MIXED: missing type + Đúng/Sai pair becomes TRUE_FALSE", () => {
  assertEqual(
    normalizeQuestion({
      type: undefined,
      question: "「水」means water.",
      options: ["Đúng", "Sai"],
      correctAnswer: "Đúng",
    }),
    "TRUE_FALSE"
  );
});

it("MIXED: MC label + options but answer not on list + marker → FILL_BLANK", () => {
  assertEqual(
    normalizeQuestion({
      type: "MULTIPLE_CHOICE",
      question: "I went ___ the store yesterday.",
      options: ["rarely", "never", "always"],
      correctAnswer: "to",
    }),
    "FILL_BLANK"
  );
});

it("MIXED: MC label + options but answer not on list + no marker → UNSUPPORTED", () => {
  assertEqual(
    normalizeQuestion({
      type: "MULTIPLE_CHOICE",
      question: "Pick a color.",
      options: ["red", "blue", "green"],
      correctAnswer: "yellow",
    }),
    UNSUPPORTED
  );
});

it("MIXED: TRUE_FALSE label + Đúng/Sai options stays TRUE_FALSE", () => {
  assertEqual(
    normalizeQuestion({
      type: "TRUE_FALSE",
      question: "「水」means water.",
      options: ["Đúng", "Sai"],
      correctAnswer: "Đúng",
    }),
    "TRUE_FALSE"
  );
});

it("MIXED: TRUE_FALSE label + wrong options → UNSUPPORTED", () => {
  assertEqual(
    normalizeQuestion({
      type: "TRUE_FALSE",
      question: "Some statement.",
      options: ["Yes", "No"],
      correctAnswer: "Yes",
    }),
    UNSUPPORTED
  );
});

it("MIXED: FILL_BLANK label preserved regardless of options shape", () => {
  assertEqual(
    normalizeQuestion({
      type: "FILL_BLANK",
      question: "Translate this.",
      options: [],
      correctAnswer: "answer",
    }),
    "FILL_BLANK"
  );
});

it("normalizeQuestion handles null / non-object input", () => {
  assertEqual(normalizeQuestion(null), UNSUPPORTED);
  assertEqual(normalizeQuestion(undefined), UNSUPPORTED);
  assertEqual(normalizeQuestion(42), UNSUPPORTED);
  assertEqual(normalizeQuestion("string"), UNSUPPORTED);
});

it("Vietnamese 'Điền' fill instruction promotes MC to FILL_BLANK", () => {
  assertEqual(
    normalizeQuestion({
      type: "MULTIPLE_CHOICE",
      question: "Điền từ thích hợp vào chỗ trống.",
      options: [],
      correctAnswer: "x",
    }),
    "FILL_BLANK"
  );
});

it("no Mixed question can render with type=MULTIPLE_CHOICE and zero non-empty options", () => {
  // All paths that produce MULTIPLE_CHOICE must include at least two
  // non-empty options.
  const cases = [
    { type: "MULTIPLE_CHOICE", question: "Pick one", options: [], correctAnswer: "a" },
    { type: "MULTIPLE_CHOICE", question: "Pick one", options: null, correctAnswer: "a" },
    { type: "MULTIPLE_CHOICE", question: "Pick one", options: ["", "  "], correctAnswer: "a" },
  ];
  for (const c of cases) {
    const t = normalizeQuestion(c);
    assertTrue(
      t !== "MULTIPLE_CHOICE",
      `Got MULTIPLE_CHOICE for ${JSON.stringify(c)} but expected UNSUPPORTED or FILL_BLANK`
    );
  }
});

// ─────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  // eslint-disable-next-line no-console
  console.log("\nFailures:");
  for (const f of failures) {
    // eslint-disable-next-line no-console
    console.log("  " + f);
  }
  process.exit(1);
}
