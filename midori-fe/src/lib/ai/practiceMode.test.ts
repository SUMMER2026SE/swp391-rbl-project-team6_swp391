/**
 * Behavioral tests for the PracticeMode logic that the new
 * <code>quizNormalize.ts</code> module supports.
 *
 * <p>Why this file exists: the project does not currently ship a React
 * or DOM test framework. Rather than pulling in vitest + jsdom, this
 * test simulates the per-question fill-blank state machinery so we can
 * verify the round-trip:
 *
 * <ul>
 *   <li>multiple-choice answers stay independent of fill-blank
 *       answers even inside a MIXED quiz;</li>
 *   <li>typing into one fill-blank input does not leak into another;</li>
 *   <li>reset / regenerate wipes every fill-blank entry, including
 *       entries the user typed but never submitted;</li>
 *   <li>the score counts fill-blank answers using
 *       <code>isFreeTextAnswerCorrect</code>, including the
 *       whitespace / Unicode edge cases.</li>
 * </ul>
 *
 * <p>Run with:
 * <pre>npx tsx src/lib/ai/practiceMode.test.ts</pre>
 */

import {
  fillBlankResultState,
  isFreeTextAnswerCorrect,
  normalizeFreeTextAnswer,
  normalizeQuestion,
  normalizeQuestionType,
  UNSUPPORTED,
} from "./quizNormalize";

interface QuizQuestion {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  userAnswer?: number | string;
}

interface PracticeModeState {
  quizData: QuizQuestion[];
  fillBlankAnswers: Record<string, string>;
  submitted: boolean;
}

function initialState(): PracticeModeState {
  return { quizData: [], fillBlankAnswers: {}, submitted: false };
}

function setFillBlankAnswer(state: PracticeModeState, id: string, text: string): PracticeModeState {
  return {
    ...state,
    fillBlankAnswers: { ...state.fillBlankAnswers, [id]: text },
  };
}

function setOptionAnswer(state: PracticeModeState, id: string, optionIndex: number): PracticeModeState {
  const idx = state.quizData.findIndex((q) => q.id === id);
  if (idx < 0) return state;
  const newQuiz = [...state.quizData];
  newQuiz[idx] = { ...newQuiz[idx], userAnswer: optionIndex };
  return { ...state, quizData: newQuiz };
}

/**
 * Mirrors the real <code>handleSubmit</code>: blocks submission when
 * the quiz contains an UNSUPPORTED question so the user is forced to
 * regenerate. The caller sees a structured result so tests can assert
 * on either branch.
 */
function trySubmit(state: PracticeModeState): { ok: true; state: PracticeModeState } | { ok: false; reason: "unsupported" | "unanswered"; unanswered: number; unsupported: number } {
  const unsupported = state.quizData.filter((q) => normalizeQuestionType(q.type) === UNSUPPORTED).length;
  if (unsupported > 0) {
    return { ok: false, reason: "unsupported", unanswered: 0, unsupported };
  }
  const unanswered = state.quizData.filter((q) => {
    const t = normalizeQuestionType(q.type);
    if (t === "FILL_BLANK") return (state.fillBlankAnswers[q.id] ?? "").trim() === "";
    return q.userAnswer === undefined || q.userAnswer === null || q.userAnswer === "";
  }).length;
  if (unanswered > 0) {
    return { ok: false, reason: "unanswered", unanswered, unsupported: 0 };
  }
  return { ok: true, state: submit(state) };
}

function submit(state: PracticeModeState): PracticeModeState {
  return { ...state, submitted: true };
}

function reset(): PracticeModeState {
  return initialState();
}

/**
 * Mirrors the production <code>isAnswered</code>: UNSUPPORTED questions
 * are excluded — the user cannot answer them, so blocking submit on
 * them would be unfair.
 */
function isAnswered(q: QuizQuestion, state: PracticeModeState): boolean {
  const t = normalizeQuestionType(q.type);
  if (t === UNSUPPORTED) return true;
  if (t === "FILL_BLANK") {
    return (state.fillBlankAnswers[q.id] ?? "").trim() !== "";
  }
  const ua = q.userAnswer;
  return ua !== undefined && ua !== null && ua !== "";
}

/**
 * Mirrors the production <code>computeScore</code>: UNSUPPORTED
 * questions are excluded from the score denominator.
 */
function computeScore(state: PracticeModeState): { score: number; percent: number; scored: number; skipped: number } {
  if (state.quizData.length === 0) return { score: 0, percent: 0, scored: 0, skipped: 0 };
  let correct = 0;
  let scored = 0;
  let skipped = 0;
  for (const q of state.quizData) {
    const t = normalizeQuestionType(q.type);
    if (t === UNSUPPORTED) {
      skipped++;
      continue;
    }
    scored++;
    if (t === "FILL_BLANK") {
      const typed = state.fillBlankAnswers[q.id] ?? "";
      if (isFreeTextAnswerCorrect(typed, q.correctAnswer)) correct++;
    } else if (typeof q.userAnswer === "number") {
      const opts = q.options || [];
      if (opts[q.userAnswer] === q.correctAnswer) correct++;
    }
  }
  return {
    score: correct,
    percent: scored === 0 ? 0 : Math.round((correct / scored) * 100),
    scored,
    skipped,
  };
}

// ─────────────────────────────────────────────────────────────────
// Tiny test harness
// ─────────────────────────────────────────────────────────────────

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
// Fixture: MIXED quiz with 1 MC, 1 TRUE_FALSE, 2 FILL_BLANK
// ─────────────────────────────────────────────────────────────────
const mixedQuiz: QuizQuestion[] = [
  {
    id: "q_mc_1",
    type: "MULTIPLE_CHOICE",
    question: "Choose the correct meaning of 食べる",
    options: ["ăn", "uống", "ngủ", "đi"],
    correctAnswer: "ăn",
  },
  {
    id: "q_tf_1",
    type: "TRUE_FALSE",
    question: "「ありがとう」 means \"thank you\".",
    options: ["Đúng", "Sai"],
    correctAnswer: "Đúng",
  },
  {
    id: "q_fb_1",
    type: "FILL_BLANK",
    question: "Translate to Japanese: \"Good morning\".",
    options: [],
    correctAnswer: "おはよう",
  },
  {
    id: "q_fb_2",
    type: "FILL_BLANK",
    question: "Yesterday I ___ to the store.",
    options: [],
    correctAnswer: "went",
  },
];

const fillBlankOnlyQuiz: QuizQuestion[] = [
  {
    id: "q_fb_a",
    type: "FILL_BLANK",
    question: "Điền nghĩa của 「学校」",
    options: [],
    correctAnswer: "trường học",
  },
  {
    id: "q_fb_b",
    type: "FILL_BLANK",
    question: "Điền: 「ありがとう ___」 (use ___ for \"polite thank you\")",
    options: [],
    correctAnswer: "ございます",
  },
];

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────
console.log("Mixed mode independence:");

it("each fill-blank answer is stored independently", () => {
  let s = initialState();
  s = { ...s, quizData: mixedQuiz };
  s = setFillBlankAnswer(s, "q_fb_1", "おはよう");
  s = setFillBlankAnswer(s, "q_fb_2", "go");
  assertEqual(s.fillBlankAnswers["q_fb_1"], "おはよう");
  assertEqual(s.fillBlankAnswers["q_fb_2"], "go");
});

it("typing into fill-blank does not overwrite multiple-choice answer", () => {
  let s = initialState();
  s = { ...s, quizData: mixedQuiz };
  s = setOptionAnswer(s, "q_mc_1", 0);
  s = setFillBlankAnswer(s, "q_fb_1", "おはよう");
  const mcQ = s.quizData.find((q) => q.id === "q_mc_1")!;
  assertEqual(mcQ.userAnswer, 0, "MC userAnswer preserved");
  assertEqual(s.fillBlankAnswers["q_fb_1"], "おはよう", "FB answer stored");
});

it("typing one fill-blank does not overwrite another", () => {
  let s = initialState();
  s = { ...s, quizData: mixedQuiz };
  s = setFillBlankAnswer(s, "q_fb_1", "おはよう");
  s = setFillBlankAnswer(s, "q_fb_2", "went");
  // Re-edit one — the other must stay.
  s = setFillBlankAnswer(s, "q_fb_1", "おはようございます");
  assertEqual(s.fillBlankAnswers["q_fb_1"], "おはようございます");
  assertEqual(s.fillBlankAnswers["q_fb_2"], "went");
});

it("isAnswered reflects per-question state independently", () => {
  let s = initialState();
  s = { ...s, quizData: mixedQuiz };
  s = setFillBlankAnswer(s, "q_fb_1", "おはよう");
  const [mc, tf, fb1, fb2] = mixedQuiz;
  assertEqual(isAnswered(mc, s), false);
  assertEqual(isAnswered(tf, s), false);
  assertEqual(isAnswered(fb1, s), true);
  assertEqual(isAnswered(fb2, s), false);
});

console.log("\nMixed-mode score:");

it("score includes multiple-choice answers", () => {
  let s = initialState();
  s = { ...s, quizData: mixedQuiz };
  s = setOptionAnswer(s, "q_mc_1", 0);
  const { score, percent } = computeScore(s);
  assertEqual(score, 1);
  assertEqual(percent, 25);
});

it("score includes fill-blank answers via normalization", () => {
  let s = initialState();
  s = { ...s, quizData: mixedQuiz };
  s = setFillBlankAnswer(s, "q_fb_1", "おはよう");
  s = setFillBlankAnswer(s, "q_fb_2", "WENT"); // uppercase Latin is tolerated
  const { score, percent } = computeScore(s);
  assertEqual(score, 2);
  assertEqual(percent, 50);
});

it("score does not count empty fill-blank as correct", () => {
  let s = initialState();
  s = { ...s, quizData: mixedQuiz };
  s = setFillBlankAnswer(s, "q_fb_1", "");
  s = setFillBlankAnswer(s, "q_fb_2", "   "); // whitespace-only
  const { score } = computeScore(s);
  assertEqual(score, 0);
});

it("score counts correct Japanese fill-blank answer", () => {
  let s = initialState();
  s = { ...s, quizData: mixedQuiz };
  s = setFillBlankAnswer(s, "q_fb_1", "おはよう");
  const { score } = computeScore(s);
  assertEqual(score, 1);
});

console.log("\nReset and regeneration:");

it("reset() clears all fill-blank answers", () => {
  let s = initialState();
  s = { ...s, quizData: mixedQuiz };
  s = setFillBlankAnswer(s, "q_fb_1", "おはよう");
  s = setFillBlankAnswer(s, "q_fb_2", "went");
  const cleared = reset();
  assertEqual(Object.keys(cleared.fillBlankAnswers).length, 0);
  assertEqual(cleared.quizData.length, 0);
  assertEqual(cleared.submitted, false);
});

it("submit() does not erase typed answers", () => {
  let s = initialState();
  s = { ...s, quizData: mixedQuiz };
  s = setFillBlankAnswer(s, "q_fb_1", "おはよう");
  const after = submit(s);
  assertEqual(after.submitted, true);
  assertEqual(after.fillBlankAnswers["q_fb_1"], "おはよう");
});

console.log("\nResult state of fill-blank after submission:");

it("empty answer is unanswered", () => {
  assertEqual(fillBlankResultState("", "anything"), "unanswered");
});

it("correct answer is correct", () => {
  assertEqual(fillBlankResultState("おはよう", "おはよう"), "correct");
});

it("wrong answer is incorrect", () => {
  assertEqual(fillBlankResultState("こんにちは", "おはよう"), "incorrect");
});

console.log("\nFill-blank-only quiz:");

it("all fill-blank quiz supports independent input per question", () => {
  let s = initialState();
  s = { ...s, quizData: fillBlankOnlyQuiz };
  s = setFillBlankAnswer(s, "q_fb_a", "trường học");
  s = setFillBlankAnswer(s, "q_fb_b", "ございます");
  const { score } = computeScore(s);
  assertEqual(score, 2);
});

it("fill-blank question without underscore still scores", () => {
  const q: QuizQuestion = {
    id: "q_x",
    type: "FILL_BLANK",
    question: "Điền nghĩa của 「学校」", // no ___ marker
    options: [],
    correctAnswer: "trường học",
  };
  const s = { quizData: [q], fillBlankAnswers: { q_x: "trường học" }, submitted: true };
  assertTrue(isAnswered(q, s));
  assertEqual(computeScore(s).score, 1);
});

// ─────────────────────────────────────────────────────────────────
// Fixture: quiz with one UNSUPPORTED question (MIXED + MC + UNSUPPORTED)
// ─────────────────────────────────────────────────────────────────
const quizWithUnsupported: QuizQuestion[] = [
  {
    id: "q_mc_2",
    type: "MULTIPLE_CHOICE",
    question: "Pick the correct reading of 「水」",
    options: ["みず", "すい", "さけ", "ゆ"],
    correctAnswer: "みず",
  },
  {
    id: "q_unknown_1",
    type: "MATCHING",
    question: "Match the pair",
    options: [],
    correctAnswer: "",
  },
  {
    id: "q_fb_3",
    type: "FILL_BLANK",
    question: "Translate: \"hello\".",
    options: [],
    correctAnswer: "こんにちは",
  },
];

console.log("\nUNSUPPORTED question handling:");

it("UNSUPPORTED question is not interpreted as fill-blank", () => {
  const q = quizWithUnsupported[1];
  assertEqual(normalizeQuestionType(q.type), UNSUPPORTED);
  assertEqual(normalizeQuestionType(q.type) === "FILL_BLANK", false);
  assertEqual(normalizeQuestionType(q.type) === "MULTIPLE_CHOICE", false);
  assertEqual(normalizeQuestionType(q.type) === "TRUE_FALSE", false);
});

it("UNSUPPORTED question is excluded from score denominator", () => {
  let s = initialState();
  s = { ...s, quizData: quizWithUnsupported };
  s = setOptionAnswer(s, "q_mc_2", 0);
  s = setFillBlankAnswer(s, "q_fb_3", "こんにちは");
  const { score, percent, scored, skipped } = computeScore(s);
  // Two scoreable questions (MC + FB), both correct
  assertEqual(score, 2);
  assertEqual(scored, 2);
  assertEqual(skipped, 1);
  assertEqual(percent, 100);
});

it("UNSUPPORTED question never counts as correct even with empty answer", () => {
  let s = initialState();
  s = { ...s, quizData: quizWithUnsupported };
  s = setOptionAnswer(s, "q_mc_2", 0);
  // Do NOT answer fill-blank
  const { score, scored, skipped } = computeScore(s);
  assertEqual(score, 1);
  assertEqual(scored, 2);
  assertEqual(skipped, 1);
});

it("isAnswered returns true for UNSUPPORTED (so it does not block answeredCount)", () => {
  const q = quizWithUnsupported[1];
  const s = { quizData: quizWithUnsupported, fillBlankAnswers: {}, submitted: false };
  assertEqual(isAnswered(q, s), true);
});

it("trySubmit blocks when any UNSUPPORTED question is present", () => {
  let s = initialState();
  s = { ...s, quizData: quizWithUnsupported };
  s = setOptionAnswer(s, "q_mc_2", 0);
  s = setFillBlankAnswer(s, "q_fb_3", "こんにちは");
  const r = trySubmit(s);
  assertEqual(r.ok, false);
  if (!r.ok) {
    assertEqual(r.reason, "unsupported");
    assertEqual(r.unsupported, 1);
  }
  assertEqual(s.submitted, false);
});

it("trySubmit succeeds once UNSUPPORTED is removed (regenerate path)", () => {
  let s = initialState();
  s = { ...s, quizData: mixedQuiz };
  s = setOptionAnswer(s, "q_mc_1", 0);
  s = setOptionAnswer(s, "q_tf_1", 0);
  s = setFillBlankAnswer(s, "q_fb_1", "おはよう");
  s = setFillBlankAnswer(s, "q_fb_2", "went");
  const r = trySubmit(s);
  assertEqual(r.ok, true);
});

it("raw MATCHING type is not coerced to a canonical type", () => {
  assertEqual(normalizeQuestionType("MATCHING"), UNSUPPORTED);
  assertEqual(normalizeQuestionType("ESSAY"), UNSUPPORTED);
  assertEqual(normalizeQuestionType("ESSAY") === "FILL_BLANK", false);
});

it("raw object value is not coerced to a canonical type", () => {
  assertEqual(normalizeQuestionType({ type: "FILL_BLANK" }), UNSUPPORTED);
  assertEqual(normalizeQuestionType({ type: "FILL_BLANK" }) === "FILL_BLANK", false);
});

console.log("\nExisting multiple-choice still works:");

it("MC question state machine treats it as multiple choice", () => {
  const q = mixedQuiz[0];
  assertEqual(normalizeQuestionType(q.type), "MULTIPLE_CHOICE");
});

it("TRUE_FALSE question state machine treats it as true-false", () => {
  const q = mixedQuiz[1];
  assertEqual(normalizeQuestionType(q.type), "TRUE_FALSE");
});

it("canonical FILL_BLANK behavior unchanged", () => {
  const q = mixedQuiz[2];
  assertEqual(normalizeQuestionType(q.type), "FILL_BLANK");
  let s = initialState();
  s = { ...s, quizData: [q] };
  assertEqual(isAnswered(q, s), false);
  s = setFillBlankAnswer(s, q.id, "おはよう");
  assertEqual(isAnswered(q, s), true);
  assertEqual(computeScore(s).score, 1);
});

it("known FILL_BLANK aliases still normalize correctly", () => {
  assertEqual(normalizeQuestionType("FILL_IN_THE_BLANK"), "FILL_BLANK");
  assertEqual(normalizeQuestionType("fill-in-the-blank"), "FILL_BLANK");
  assertEqual(normalizeQuestionType("FILL_IN_BLANK"), "FILL_BLANK");
  assertEqual(normalizeQuestionType("CLOZE"), "FILL_BLANK");
  assertEqual(normalizeQuestionType("FILL"), "FILL_BLANK");
});

it("normalizeFreeTextAnswer is Unicode-safe", () => {
  assertEqual(normalizeFreeTextAnswer("食べる"), "食べる");
  assertEqual(normalizeFreeTextAnswer("  HELLO  "), "hello");
  assertEqual(normalizeFreeTextAnswer("Đúng"), "đúng");
});

// ─────────────────────────────────────────────────────────────────
// MIXED mode answer independence — MC selection and Fill Blank input
// must not erase each other across Previous/Next navigation.
// ─────────────────────────────────────────────────────────────────
console.log("\nMIXED mode answer independence (malformed payload resilience):");

/**
 * Simulates the per-question normalisation step the production
 * <code>handleGenerateQuestions</code> performs after the API call.
 * Each raw entry is normalised using {@link normalizeQuestion}, then
 * the answer state is mutated and we assert nothing leaks across
 * questions.
 */
function normalizeForRenderer(rawList: Array<Record<string, unknown>>): QuizQuestion[] {
  return rawList.map((q, i) => {
    const normalized = normalizeQuestion(q);
    let options = Array.isArray(q.options) ? (q.options as string[]) : [];
    if (normalized === "TRUE_FALSE") options = ["Đúng", "Sai"];
    if (normalized === "FILL_BLANK") options = [];
    return {
      id: typeof q.id === "string" ? (q.id as string) : `q_${i}`,
      type: normalized,
      question: String(q.question ?? q.questionText ?? ""),
      options,
      correctAnswer: String(q.correctAnswer ?? "").trim(),
      explanation: typeof q.explanation === "string" ? (q.explanation as string) : "",
    };
  });
}

it("realistic MIXED payload (MC + MC-as-FB + TF + FB) normalises and answers stay independent", () => {
  // The exact user-reported payload shape.
  const rawQuiz: Array<Record<string, unknown>> = [
    {
      id: "q0",
      type: "MULTIPLE_CHOICE",
      question: "わたしの ____ は リンです。",
      options: [],
      correctAnswer: "名前",
    },
    {
      id: "q1",
      type: "MULTIPLE_CHOICE",
      question: "「学校」の読み方は?",
      options: ["がっこう", "がくこう", "まなび", "けんきゅう"],
      correctAnswer: "がっこう",
    },
    {
      id: "q2",
      type: "MULTIPLE_CHOICE",
      question: "「水」means water.",
      options: ["Đúng", "Sai"],
      correctAnswer: "Đúng",
    },
    {
      id: "q3",
      type: "FILL_BLANK",
      question: "Điền nghĩa của 「走る」",
      options: [],
      correctAnswer: "chạy",
    },
  ];

  const normalized = normalizeForRenderer(rawQuiz);
  assertEqual(normalized[0].type, "FILL_BLANK"); // MC + ____ marker + no options → FILL_BLANK
  assertEqual(normalized[1].type, "MULTIPLE_CHOICE");
  // q2 is labelled MULTIPLE_CHOICE in this payload; the spec keeps the
  // MC label verbatim when options + answer look valid, so it stays MC.
  // The [Đúng, Sai] option shape is what the TRUE_FALSE branch reads
  // when the label is missing, not when the label says MC.
  assertEqual(normalized[2].type, "MULTIPLE_CHOICE");
  assertEqual(normalized[3].type, "FILL_BLANK");

  // Answer them, then navigate Previous/Next — every answer must stay.
  let s = initialState();
  s = { ...s, quizData: normalized };
  s = setFillBlankAnswer(s, "q0", "名前");
  s = setOptionAnswer(s, "q1", 0);
  s = setOptionAnswer(s, "q2", 0);
  s = setFillBlankAnswer(s, "q3", "chạy");

  // Simulate navigating to q3 and back.
  const mc = s.quizData.find((q) => q.id === "q1")!;
  assertEqual(mc.userAnswer, 0, "MC selection preserved");
  assertEqual(s.fillBlankAnswers["q0"], "名前", "FB answer preserved");
  assertEqual(s.fillBlankAnswers["q3"], "chạy", "second FB answer preserved");

  // Scoring: q0 + q1 + q3 are answerable in their canonical forms. q2
  // stays as MULTIPLE_CHOICE in this test (we kept the type label
  // verbatim per the user spec) but its [Đúng, Sai] options still match
  // "Đúng" at index 0, so the user can pick and score correctly.
  const { score, scored, skipped } = computeScore(s);
  assertEqual(scored, 4);
  assertEqual(skipped, 0);
  assertEqual(score, 4);
});

it("MC + no options + no marker never renders — promoted to UNSUPPORTED and submission blocked", () => {
  const rawQuiz: Array<Record<string, unknown>> = [
    {
      id: "q0",
      type: "MULTIPLE_CHOICE",
      question: "Pick the correct answer.",
      options: [],
      correctAnswer: "x",
    },
  ];
  const normalized = normalizeForRenderer(rawQuiz);
  assertEqual(normalized[0].type, UNSUPPORTED);

  // Submission must be blocked because of the UNSUPPORTED entry.
  let s = initialState();
  s = { ...s, quizData: normalized };
  const r = trySubmit(s);
  assertEqual(r.ok, false);
  if (!r.ok) {
    assertEqual(r.reason, "unsupported");
  }
});

it("realistic MC + FB navigation: Previous/Next does not erase either answer", () => {
  const rawQuiz: Array<Record<string, unknown>> = [
    {
      id: "mc",
      type: "MULTIPLE_CHOICE",
      question: "「食べる」means what?",
      options: ["ăn", "uống", "ngủ", "đi"],
      correctAnswer: "ăn",
    },
    {
      id: "fb",
      type: "FILL_BLANK",
      question: "I ___ to the store yesterday.",
      options: [],
      correctAnswer: "went",
    },
  ];
  const normalized = normalizeForRenderer(rawQuiz);

  let s = initialState();
  s = { ...s, quizData: normalized };
  // Visit MC first, choose, navigate to FB.
  s = setOptionAnswer(s, "mc", 0);
  s = setFillBlankAnswer(s, "fb", "went");
  // Navigate back to MC — MC selection must persist.
  const mc = s.quizData.find((q) => q.id === "mc")!;
  assertEqual(mc.userAnswer, 0, "MC selection survived navigation");
  assertEqual(s.fillBlankAnswers["fb"], "went", "FB answer survived navigation");
});

it("MC + FB renderable: MC has options, FB has empty options for input", () => {
  const rawQuiz: Array<Record<string, unknown>> = [
    {
      id: "mc",
      type: "MULTIPLE_CHOICE",
      question: "「食べる」means what?",
      options: ["ăn", "uống", "ngủ", "đi"],
      correctAnswer: "ăn",
    },
    {
      id: "fb",
      type: "FILL_BLANK",
      question: "I ___ to the store yesterday.",
      options: [],
      correctAnswer: "went",
    },
  ];
  const normalized = normalizeForRenderer(rawQuiz);
  const mc = normalized.find((q) => q.id === "mc")!;
  const fb = normalized.find((q) => q.id === "fb")!;
  assertEqual(mc.type, "MULTIPLE_CHOICE");
  assertTrue(mc.options.length >= 2, "MC question must have visible options");
  assertEqual(fb.type, "FILL_BLANK");
  assertTrue(fb.options.length === 0, "FB question must have no option buttons (input only)");
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