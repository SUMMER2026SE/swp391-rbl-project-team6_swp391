/**
 * Helpers for splitting a Reading question's `content` field into a
 * (passage, question) pair without changing the API/DB schema.
 *
 * <p>AI-extracted Reading questions often arrive as a single string like
 * "Read the passage: <passage> Question: <question>" (or Vietnamese
 * equivalents). Showing the whole blob in a single textarea makes the
 * editor hard to read when the passage is long or shared across
 * questions. These helpers let the UI split the two parts on the fly
 * and recompose them back into `content` before save.
 */

export interface ReadingSplit {
  /** Whether the content was split into a passage + question pair. */
  split: boolean;
  /** Detected passage text. Empty when no passage was found. */
  passage: string;
  /** The actual question text (passage removed). */
  question: string;
  /**
   * Which language-family label started the passage block, so the
   * recompose step can write back the same prefix.
   * Values: "en-passage" | "en-read" | "vi-doc" | "vi-theo" | "ja" | null
   */
  labelKey: string | null;
}

const EMPTY: ReadingSplit = {
  split: false,
  passage: "",
  question: "",
  labelKey: null,
};

/**
 * Case-insensitive, multiline-aware patterns. The first capture group is
 * the passage body, the second is the question body. We tolerate either
 * `Question:` / `Câu hỏi:` / `Q:` as the question delimiter and at
 * least one whitespace (space, tab, newline) between the two.
 */
const PATTERNS: Array<{ key: string; regex: RegExp }> = [
  // "Read the passage: <passage> Question: <question>"
  {
    key: "en-read",
    regex:
      /^\s*Read\s+the\s+passage\s*[:\-]\s*([\s\S]*?)\s+Question\s*[:\-]\s*([\s\S]+)$/i,
  },
  // "Passage: <passage> Question: <question>"
  {
    key: "en-passage",
    regex: /^\s*Passage\s*[:\-]\s*([\s\S]*?)\s+Question\s*[:\-]\s*([\s\S]+)$/i,
  },
  // "Đọc đoạn văn: <passage> Câu hỏi: <question>"
  {
    key: "vi-doc",
    regex:
      /^\s*Đọc\s+đoạn\s+văn\s*[:\-]\s*([\s\S]*?)\s+Câu\s+hỏi\s*[:\-]\s*([\s\S]+)$/i,
  },
  // "Đọc bài đọc: <passage> Câu hỏi: <question>"
  {
    key: "vi-doc",
    regex:
      /^\s*Đọc\s+bài\s+đọc\s*[:\-]\s*([\s\S]*?)\s+Câu\s+hỏi\s*[:\-]\s*([\s\S]+)$/i,
  },
  // "Theo bài đọc, ... Câu hỏi: ..." — passage already inline, keep whole preamble
  {
    key: "vi-theo",
    regex:
      /^\s*Theo\s+bài\s+đọc[\s\S]*?Câu\s+hỏi\s*[:\-]\s*([\s\S]+)$/i,
  },
];

/**
 * Try to split a Reading question's `content` into a (passage, question)
 * pair. If no pattern matches, returns `split: false` with the original
 * text echoed in `question`.
 */
export function parseReadingQuestionText(raw: string | undefined | null): ReadingSplit {
  if (!raw) return { ...EMPTY, question: "" };
  const text = raw.trim();
  if (!text) return { ...EMPTY, question: "" };

  for (const { key, regex } of PATTERNS) {
    const m = text.match(regex);
    if (!m) continue;
    if (key === "vi-theo") {
      // Pattern keeps the whole preamble as passage — split just before "Câu hỏi:"
      const idx = text.search(/Câu\s+hỏi\s*[:\-]/i);
      if (idx <= 0) continue;
      const passage = text.slice(0, idx).trim();
      const question = text.slice(idx).replace(/^Câu\s+hỏi\s*[:\-]\s*/i, "").trim();
      if (!passage || !question) continue;
      return { split: true, passage, question, labelKey: key };
    }
    const passage = (m[1] || "").trim();
    const question = (m[2] || "").trim();
    if (!passage || !question) continue;
    return { split: true, passage, question, labelKey: key };
  }

  return { split: false, passage: "", question: text, labelKey: null };
}

/**
 * Recompose (passage, question) back into a single `content` string in
 * the same format the AI produced. Returns the question text alone when
 * there's no passage.
 */
export function composeReadingQuestionText(
  passage: string,
  question: string,
  labelKey: string | null = "en-read",
): string {
  const q = (question || "").trim();
  const p = (passage || "").trim();
  if (!p) return q;

  const header = (() => {
    switch (labelKey) {
      case "en-passage":
        return "Passage:";
      case "vi-doc":
        return "Đọc đoạn văn:";
      case "vi-theo":
        return "Theo bài đọc,";
      case "ja":
        return "文章:";
      case "en-read":
      default:
        return "Read the passage:";
    }
  })();

  // vi-theo doesn't append a separate "Câu hỏi:" header — passage already
  // ends with a comma. For all other labels we explicitly delimit the
  // question part so round-trip parse works.
  if (labelKey === "vi-theo") {
    return `${p} Câu hỏi: ${q}`;
  }
  return `${header} ${p}\n\nQuestion: ${q}`;
}

/**
 * Whether the editor should render the split passage/question UI for a
 * given question. Currently: only when the question's category is
 * "Reading".
 */
export function shouldSplitReadingForQuestion(
  category: string | undefined | null,
): boolean {
  return !!category && category.toLowerCase() === "reading";
}