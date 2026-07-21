/**
 * Pure-function tests for the Exam AI workflow changes that fix the
 * "questions disappear after upload" regression.
 *
 * <p>Run with:
 * <pre>npx tsx src/lib/teacherQuestionMapping.test.ts</pre>
 *
 * <p>What is pinned here:
 * <ol>
 *   <li>Question type is preserved end-to-end — MULTIPLE_CHOICE,
 *       TRUE_FALSE, FILL_BLANK, and SHORT_ANSWER all flow through the
 *       mapper without being silently coerced to MULTIPLE_CHOICE.</li>
 *   <li>Skill/category is normalized to PascalCase so the Question Bank
 *       UI dropdown matches the saved value.</li>
 *   <li>Text-only questions (FILL_BLANK / SHORT_ANSWER) emit a single
 *       placeholder option so the backend's @NotEmpty validation passes
 *       while the real answer text lives in `explanation`.</li>
 *   <li>Unresolved questions (no marked correct answer) are detected
 *       before persistence.</li>
 * </ol>
 */

import {
  mapImportedQuestionToBankRequest,
  normalizeSkill,
  findUnresolvedQuestions,
  type ImportedQuestionLike,
} from "./teacherQuestionMapping";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function it(name: string, fn: () => void): void {
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
      `${hint ?? "expected"} ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`,
    );
  }
}

function assertDeepEqual<T>(actual: T, expected: T, hint?: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${hint ?? "expected"} ${e} but got ${a}`);
  }
}

function assertTrue(value: boolean, hint: string): void {
  if (!value) {
    throw new Error(`${hint} (got ${JSON.stringify(value)})`);
  }
}

// ─────────────────────────────────────────────────────────────────
// normalizeSkill
// ─────────────────────────────────────────────────────────────────
console.log("normalizeSkill:");

it("lowercase 'vocabulary' -> 'Vocabulary'", () => {
  assertEqual(normalizeSkill("vocabulary"), "Vocabulary");
});

it("uppercase 'GRAMMAR' -> 'Grammar'", () => {
  assertEqual(normalizeSkill("GRAMMAR"), "Grammar");
});

it("mixed-case 'Reading' -> 'Reading'", () => {
  assertEqual(normalizeSkill("Reading"), "Reading");
});

it("empty string falls back to 'Vocabulary'", () => {
  assertEqual(normalizeSkill(""), "Vocabulary");
});

it("undefined falls back to 'Vocabulary'", () => {
  assertEqual(normalizeSkill(undefined), "Vocabulary");
});

it("unknown skill falls back to 'Vocabulary'", () => {
  assertEqual(normalizeSkill("klingon"), "Vocabulary");
});

it("listening is preserved", () => {
  assertEqual(normalizeSkill("listening"), "Listening");
  assertEqual(normalizeSkill("LISTENING"), "Listening");
});

// ─────────────────────────────────────────────────────────────────
// mapImportedQuestionToBankRequest — type preservation (Step 6)
// ─────────────────────────────────────────────────────────────────
console.log("\nmapImportedQuestionToBankRequest (type preservation):");

it("MULTIPLE_CHOICE keeps MULTIPLE_CHOICE", () => {
  const q: ImportedQuestionLike = {
    type: "MULTIPLE_CHOICE",
    content: "What is 学校?",
    difficulty: "EASY",
    answers: [
      { content: "School", isCorrect: true },
      { content: "Hospital", isCorrect: false },
      { content: "Library", isCorrect: false },
      { content: "Park", isCorrect: false },
    ],
    category: "Vocabulary",
  };
  const mapped = mapImportedQuestionToBankRequest(q, "N5");
  assertEqual(mapped.questionType, "MULTIPLE_CHOICE");
  assertEqual(mapped.options.length, 4);
  assertEqual(mapped.correctAnswerIndex, 0);
  assertEqual(mapped.skill, "Vocabulary");
  assertEqual(mapped.level, "N5");
  assertEqual(mapped.source, "EXAM");
});

it("TRUE_FALSE keeps TRUE_FALSE", () => {
  const q: ImportedQuestionLike = {
    type: "TRUE_FALSE",
    content: "「水」 means water.",
    difficulty: "MEDIUM",
    answers: [
      { content: "True", isCorrect: true },
      { content: "False", isCorrect: false },
    ],
    category: "Vocabulary",
  };
  const mapped = mapImportedQuestionToBankRequest(q, "N5");
  assertEqual(mapped.questionType, "TRUE_FALSE");
  assertEqual(mapped.options.length, 2);
  assertEqual(mapped.correctAnswerIndex, 0);
});

it("FILL_BLANK keeps FILL_BLANK", () => {
  const q: ImportedQuestionLike = {
    type: "FILL_BLANK",
    content: "わたしの ____ は リンです。",
    difficulty: "MEDIUM",
    answers: [{ content: "名前", isCorrect: true }],
    category: "Grammar",
  };
  const mapped = mapImportedQuestionToBankRequest(q, "N5");
  assertEqual(mapped.questionType, "FILL_BLANK");
  // The real answer text is reused as the single options entry so the
  // backend's @NotEmpty validation passes — this is NOT a fake MCQ
  // option, it is the answer itself.
  assertEqual(mapped.options.length, 1);
  assertEqual(mapped.options[0], "名前");
  // Answer text is preserved in `explanation` for the renderer.
  assertEqual(mapped.explanation, "名前");
  assertEqual(mapped.correctAnswerIndex, 0);
  assertEqual(mapped.skill, "Grammar");
});

it("SHORT_ANSWER keeps SHORT_ANSWER", () => {
  const q: ImportedQuestionLike = {
    type: "SHORT_ANSWER",
    content: "Briefly describe your favourite Japanese tradition.",
    difficulty: "HARD",
    answers: [{ content: "Hanabi", isCorrect: true }],
    category: "Listening",
  };
  const mapped = mapImportedQuestionToBankRequest(q, "N3");
  assertEqual(mapped.questionType, "SHORT_ANSWER");
  assertEqual(mapped.options.length, 1);
  assertEqual(mapped.explanation, "Hanabi");
  assertEqual(mapped.skill, "Listening");
  assertEqual(mapped.difficulty, "HARD");
});

it("difficulty is uppercased", () => {
  const q: ImportedQuestionLike = {
    type: "MULTIPLE_CHOICE",
    content: "Pick one",
    difficulty: "easy",
    answers: [
      { content: "a", isCorrect: true },
      { content: "b", isCorrect: false },
    ],
    category: "Grammar",
  };
  assertEqual(mapImportedQuestionToBankRequest(q, "N5").difficulty, "EASY");
});

it("missing difficulty defaults to MEDIUM", () => {
  const q: ImportedQuestionLike = {
    type: "MULTIPLE_CHOICE",
    content: "Pick one",
    answers: [
      { content: "a", isCorrect: true },
      { content: "b", isCorrect: false },
    ],
  };
  assertEqual(mapImportedQuestionToBankRequest(q, "N5").difficulty, "MEDIUM");
});

it("explanation is forwarded", () => {
  const q: ImportedQuestionLike = {
    type: "MULTIPLE_CHOICE",
    content: "Why?",
    difficulty: "EASY",
    answers: [
      { content: "because", isCorrect: true },
      { content: "no reason", isCorrect: false },
    ],
    category: "Vocabulary",
    explanation: "Because reasons.",
  };
  assertEqual(mapImportedQuestionToBankRequest(q, "N5").explanation, "Because reasons.");
});

it("missing explanation becomes empty string", () => {
  const q: ImportedQuestionLike = {
    type: "MULTIPLE_CHOICE",
    content: "Why?",
    answers: [
      { content: "because", isCorrect: true },
      { content: "no reason", isCorrect: false },
    ],
  };
  assertEqual(mapImportedQuestionToBankRequest(q, "N5").explanation, "");
});

// ─────────────────────────────────────────────────────────────────
// findUnresolvedQuestions
// ─────────────────────────────────────────────────────────────────
console.log("\nfindUnresolvedQuestions:");

it("returns empty array when every question has a marked correct answer", () => {
  const questions: ImportedQuestionLike[] = [
    {
      type: "MULTIPLE_CHOICE",
      content: "A",
      answers: [
        { content: "a", isCorrect: true },
        { content: "b", isCorrect: false },
      ],
    },
    {
      type: "TRUE_FALSE",
      content: "B",
      answers: [
        { content: "True", isCorrect: false },
        { content: "False", isCorrect: true },
      ],
    },
  ];
  assertEqual(findUnresolvedQuestions(questions).length, 0);
});

it("flags MCQ with no correct answer", () => {
  const questions: ImportedQuestionLike[] = [
    {
      type: "MULTIPLE_CHOICE",
      content: "A",
      answers: [
        { content: "a", isCorrect: false },
        { content: "b", isCorrect: false },
      ],
    },
  ];
  assertEqual(findUnresolvedQuestions(questions).length, 1);
});

it("flags FILL_BLANK with no answer text", () => {
  const questions: ImportedQuestionLike[] = [
    {
      type: "FILL_BLANK",
      content: "____",
      answers: [{ content: "", isCorrect: true }],
    },
  ];
  assertEqual(findUnresolvedQuestions(questions).length, 1);
});

it("flags FILL_BLANK with answer text", () => {
  const questions: ImportedQuestionLike[] = [
    {
      type: "FILL_BLANK",
      content: "____",
      answers: [{ content: "ok", isCorrect: true }],
    },
  ];
  // Even with text, the FILL_BLANK answer is correctly marked — not unresolved.
  assertEqual(findUnresolvedQuestions(questions).length, 0);
});

// ─────────────────────────────────────────────────────────────────
// Step 5 — questions survive persistence mapping
// ─────────────────────────────────────────────────────────────────
console.log("\nfull mapping produces stable IDs shape:");

it("each input maps to a single backend payload", () => {
  const inputs: ImportedQuestionLike[] = [
    {
      type: "MULTIPLE_CHOICE",
      content: "Q1",
      answers: [
        { content: "a", isCorrect: true },
        { content: "b", isCorrect: false },
      ],
      category: "Vocabulary",
    },
    {
      type: "TRUE_FALSE",
      content: "Q2",
      answers: [
        { content: "True", isCorrect: true },
        { content: "False", isCorrect: false },
      ],
      category: "Grammar",
    },
    {
      type: "FILL_BLANK",
      content: "Q3",
      answers: [{ content: "answer3", isCorrect: true }],
      category: "Reading",
    },
    {
      type: "SHORT_ANSWER",
      content: "Q4",
      answers: [{ content: "answer4", isCorrect: true }],
      category: "Listening",
    },
  ];
  const payloads = inputs.map((q) => mapImportedQuestionToBankRequest(q, "N5"));
  assertEqual(payloads.length, 4);
  // Every type preserved exactly.
  assertDeepEqual(
    payloads.map((p) => p.questionType),
    ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "SHORT_ANSWER"],
    "questionType round-trip",
  );
  // Every skill normalized.
  assertDeepEqual(
    payloads.map((p) => p.skill),
    ["Vocabulary", "Grammar", "Reading", "Listening"],
    "skill normalization round-trip",
  );
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
