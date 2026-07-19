/**
 * Pure helpers for normalizing and checking AI-generated quiz questions.
 *
 * <p>This module is intentionally framework-free so it can be unit-tested
 * under Node (via tsx) without setting up React, vitest, or any DOM.
 *
 * <p><strong>Backend contract:</strong> the AI Sensei backend emits one of
 * three canonical types per question:
 * <ul>
 *   <li><code>MULTIPLE_CHOICE</code></li>
 *   <li><code>TRUE_FALSE</code></li>
 *   <li><code>FILL_BLANK</code></li>
 * </ul>
 * <code>MIXED</code> is a generation request mode, not an individual
 * question type — questions returned under MIXED carry their own
 * per-question type.
 *
 * <p><strong>Trust boundary:</strong> the backend has already
 * upper-cased and filtered unknown types in
 * {@code AiServiceImpl.parseQuestionsFromJson}. This helper is a
 * defensive second line so the renderer never silently falls back to
 * any canonical type for an unrecognized question.
 */

/**
 * Canonical question types the frontend knows how to render.
 */
export type QuizQuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK";

/**
 * A raw question payload as it arrives from the AI Sensei backend.
 *
 * <p>Intentionally permissive: any field may be missing or malformed
 * because the backend has only done a best-effort pass — the frontend
 * is the last line of defence.
 */
export interface RawQuizQuestion {
  id?: string;
  type?: string;
  question?: string;
  questionText?: string;
  options?: string[] | null;
  correctAnswer?: string;
  explanation?: string;
}

/**
 * Sentinel returned by {@link normalizeQuestionType} when the raw
 * value is not a recognized alias of any canonical type. The renderer
 * must NOT treat UNSUPPORTED like a FILL_BLANK / MC / TF question —
 * it must show a safe Vietnamese fallback message and exclude the
 * question from the score denominator while blocking submission so the
 * user regenerates the quiz.
 */
export const UNSUPPORTED = "UNSUPPORTED" as const;

/**
 * Aliases the frontend may receive from older / external quiz payloads.
 * Each entry maps a possibly-mis-cased or synonym string to its canonical
 * form. Comparisons are case-insensitive after trimming.
 */
const TYPE_ALIASES: Record<string, QuizQuestionType> = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  MULTIPLE: "MULTIPLE_CHOICE",
  MCQ: "MULTIPLE_CHOICE",
  CHOICE: "MULTIPLE_CHOICE",

  TRUE_FALSE: "TRUE_FALSE",
  TRUEFALSE: "TRUE_FALSE",
  TRUE_OR_FALSE: "TRUE_FALSE",
  T_F: "TRUE_FALSE",

  FILL_BLANK: "FILL_BLANK",
  FILLBLANK: "FILL_BLANK",
  FILL_IN_THE_BLANK: "FILL_BLANK",
  FILL_IN_BLANK: "FILL_BLANK",
  FILL: "FILL_BLANK",
  CLOZE: "FILL_BLANK",
};

/**
 * Normalize any incoming question type string into either a canonical
 * {@link QuizQuestionType} or the {@link UNSUPPORTED} sentinel.
 *
 * <p>Known aliases (e.g. <code>FILL_IN_THE_BLANK</code>,
 * <code>fill-in-the-blank</code>, <code>CLOZE</code>,
 * <code>MCQ</code>, <code>T_F</code>) map to their canonical form.
 *
 * <p>Completely unknown values, the empty string, <code>null</code>,
 * <code>undefined</code>, and non-string objects resolve to
 * {@link UNSUPPORTED}. Callers MUST NOT treat the result as
 * <code>FILL_BLANK</code>, <code>MULTIPLE_CHOICE</code>, or
 * <code>TRUE_FALSE</code> in this case.
 *
 * @param raw the raw type string from the backend / provider
 * @returns canonical type or the UNSUPPORTED sentinel
 */
export function normalizeQuestionType(raw: unknown): QuizQuestionType | typeof UNSUPPORTED {
  if (typeof raw !== "string") {
    return UNSUPPORTED;
  }
  const key = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (key === "") {
    return UNSUPPORTED;
  }
  // MIXED is a request mode, not a per-question type. Treat it as
  // unsupported at the per-question level so the renderer does not
  // accidentally fall through to one of the canonical renderers.
  if (key === "MIXED") {
    return UNSUPPORTED;
  }
  const mapped = TYPE_ALIASES[key];
  if (mapped) {
    return mapped;
  }
  return UNSUPPORTED;
}

/**
 * Whether the raw value maps to a known canonical question type.
 * Returns <code>false</code> for any value that
 * {@link normalizeQuestionType} would resolve to the
 * {@link UNSUPPORTED} sentinel.
 */
export function isSupportedQuestionType(raw: unknown): boolean {
  return normalizeQuestionType(raw) !== UNSUPPORTED;
}

/**
 * Normalize a free-text answer for comparison.
 *
 * <p>Rules:
 * <ul>
 *   <li>Trim leading / trailing whitespace</li>
 *   <li>Collapse internal whitespace runs to a single ASCII space</li>
 *   <li>Unicode-normalize (NFC) so combining marks compare equal</li>
 *   <li>Lower-case using <code>String.prototype.toLocaleLowerCase()</code>
 *       so non-ASCII Latin letters (e.g. Vietnamese <code>Đ</code>) compare
 *       equal to their lower-case form. CJK, kana, kanji, and other scripts
 *       that have no case are preserved verbatim.</li>
 * </ul>
 *
 * @param value any input
 * @returns the comparison form, or empty string if input is empty
 */
export function normalizeFreeTextAnswer(value: unknown): string {
  if (value == null) return "";
  const raw = String(value);
  // NFC so that visually-identical characters built from
  // precomposed vs decomposed sequences compare equal.
  const nfc = raw.normalize ? raw.normalize("NFC") : raw;
  const trimmed = nfc.replace(/^\s+|\s+$/g, "");
  const collapsed = trimmed.replace(/\s+/g, " ");
  // Locale-aware lower-case. CJK / kana / kanji are unaffected because
  // they have no case; Latin-extended letters (Đ, ı, etc.) fold to
  // their lower-case equivalents.
  return collapsed.toLocaleLowerCase();
}

/**
 * Default check used by the renderer for free-text fill-blank answers.
 *
 * <p>Both sides are normalized via {@link normalizeFreeTextAnswer} so
 * whitespace and case differences are tolerated but real character
 * differences are not.
 *
 * <p>An empty answer is NEVER considered correct — callers must check
 * that the answer was provided first.
 */
export function isFreeTextAnswerCorrect(userAnswer: unknown, expectedAnswer: unknown): boolean {
  const user = normalizeFreeTextAnswer(userAnswer);
  const expected = normalizeFreeTextAnswer(expectedAnswer);
  if (user === "" || expected === "") return false;
  return user === expected;
}

/**
 * State of a single fill-blank question after submission. The renderer
 * uses this to pick a visual treatment.
 */
export type FillBlankResultState = "unanswered" | "correct" | "incorrect";

/**
 * Compute the post-submit state of a fill-blank answer.
 */
export function fillBlankResultState(
  userAnswer: unknown,
  expectedAnswer: unknown
): FillBlankResultState {
  const user = typeof userAnswer === "string" ? userAnswer.trim() : "";
  if (user === "") return "unanswered";
  return isFreeTextAnswerCorrect(user, expectedAnswer) ? "correct" : "incorrect";
}

/**
 * Whether the question text contains a blank marker that the renderer
 * should highlight. Recognized markers:
 * <ul>
 *   <li><code>___</code> / <code>____</code> (any run of three or more
 *       underscores)</li>
 *   <li><code>[BLANK]</code></li>
 *   <li><code>{{blank}}</code> / <code>{{BLANK}}</code></li>
 * </ul>
 */
export function hasBlankMarker(questionText: string | undefined | null): boolean {
  if (!questionText) return false;
  return (
    /_{3,}/.test(questionText) ||
    /\[BLANK\]/i.test(questionText) ||
    /\{\{\s*blank\s*\}\}/i.test(questionText)
  );
}

/**
 * A fill-blank question needs a free-text input regardless of whether
 * the provider included a blank marker in the question text. The
 * marker is just a hint; the renderer must always show the input so
 * the user can record an answer.
 */
export const FILL_BLANK_REQUIRES_INPUT = true;

/**
 * Strip null / blank entries from a raw options array and return only
 * the non-empty trimmed values. The MIXED renderer needs to know whether
 * a question actually has renderable option buttons, not just whether
 * the array exists.
 */
function nonEmptyOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v === "string" && v.trim() !== "") {
      out.push(v.trim());
    }
  }
  return out;
}

/**
 * Detect Vietnamese "fill the blank" instructions so the renderer can
 * infer FILL_BLANK from the question body when the provider's type
 * label is wrong. Mirrors the backend
 * {@code AiServiceImpl.resolveQuestionType}.
 */
function hasFillInstruction(questionText: string): boolean {
  if (!questionText) return false;
  const lower = questionText.toLowerCase();
  return (
    questionText.includes("Điền") ||
    lower.includes("điền") ||
    lower.includes("fill in") ||
    lower.includes("hoàn thành")
  );
}

/**
 * Object-based per-question normalization.
 *
 * <p>Replaces the previous
 * {@code normalizeQuestionType(question.type)} pattern. The old
 * helper only saw the type string — when the AI provider emitted a
 * fill-blank question labelled {@code MULTIPLE_CHOICE} with an empty
 * options array, the renderer received
 * {@code type: "MULTIPLE_CHOICE", options: []} and had nothing to draw.
 *
 * <p>This function inspects the <em>whole</em> question object (type,
 * question text, options, correctAnswer) and returns a canonical
 * {@link QuizQuestionType} or the {@link UNSUPPORTED} sentinel.
 *
 * <p>Rules, in priority order:
 * <ol>
 *   <li>If the type label is one of the canonical types AND its
 *       structural pre-conditions are satisfied, return that type.</li>
 *   <li>If the type label is missing or unknown, infer from the
 *       question body (blank marker, Vietnamese fill instruction, or
 *       option shape).</li>
 *   <li>If the type label says {@code MULTIPLE_CHOICE} but there are
 *       fewer than two non-empty options, promote to
 *       {@code FILL_BLANK} when the body has a blank marker or fill
 *       instruction, otherwise return {@link UNSUPPORTED} so the
 *       renderer shows the safe Vietnamese fallback instead of an
 *       empty answer area.</li>
 *   <li>If the type label says {@code TRUE_FALSE} but the options are
 *       not the canonical [Đúng, Sai] pair, return {@link UNSUPPORTED}.</li>
 * </ol>
 *
 * <p>NEVER returns {@code MULTIPLE_CHOICE} for a question with no
 * renderable options — that is the exact condition that produced the
 * bug reported on the frontend.
 */
export function normalizeQuestion(raw: unknown): QuizQuestionType | typeof UNSUPPORTED {
  if (raw == null || typeof raw !== "object") {
    return UNSUPPORTED;
  }
  const q = raw as RawQuizQuestion;
  const rawType = typeof q.type === "string" ? q.type : "";
  const text = (q.question ?? q.questionText ?? "").trim();
  const opts = nonEmptyOptions(q.options);
  const answer = typeof q.correctAnswer === "string" ? q.correctAnswer.trim() : "";
  const marker = hasBlankMarker(text);
  const instruction = hasFillInstruction(text);
  const looksTrueFalse =
    opts.length === 2 &&
    (/^(đúng|true|t)$/i.test(opts[0])) &&
    (/^(sai|false|f)$/i.test(opts[1]));

  const upper = rawType.trim().toUpperCase();

  switch (upper) {
    case "MULTIPLE_CHOICE":
      if (opts.length >= 2) {
        // Answer must be on the option list. If not, fall back to FB /
        // UNSUPPORTED instead of silently keeping a broken MC.
        if (answer !== "" && opts.includes(answer)) {
          return "MULTIPLE_CHOICE";
        }
        return marker || instruction ? "FILL_BLANK" : UNSUPPORTED;
      }
      // MC label but no options: promote to FB if the body says so.
      return marker || instruction ? "FILL_BLANK" : UNSUPPORTED;
    case "TRUE_FALSE":
      if (looksTrueFalse) return "TRUE_FALSE";
      if (
        answer !== "" &&
        /^(đúng|sai|true|false)$/i.test(answer)
      ) {
        return "TRUE_FALSE";
      }
      return UNSUPPORTED;
    case "FILL_BLANK":
      return "FILL_BLANK";
    case "":
    default:
      // Unknown / missing — infer from the body.
      if (looksTrueFalse) return "TRUE_FALSE";
      if (marker || instruction) return "FILL_BLANK";
      if (opts.length >= 2) return "MULTIPLE_CHOICE";
      return UNSUPPORTED;
  }
}
