import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import {
  Send,
  BookOpen,
  GraduationCap,
  Headphones,
  FileText,
  Bot,
  X,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Lightbulb,
  Search,
  Info,
  BookMarked,
  Check,
  Trash2,
  Plus,
  Pencil,
  Edit3,
  Brain,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { aiApi } from "@/lib/api/ai";
import type {
  AiConversation,
  AiMaterialDetail,
  AiMaterialSummary,
  AiMaterialType,
  AiMessage,
  ConversationMessagesResponse,
} from "@/types/ai";
import {
  fillBlankResultState,
  hasBlankMarker,
  isFreeTextAnswerCorrect,
  normalizeQuestion,
  UNSUPPORTED,
  type QuizQuestionType,
} from "@/lib/ai/quizNormalize";

// ═══════════════════════════════════════════════════════════════════
// AI SENSEI MATERIAL MODEL
// The frontend no longer carries any hardcoded study material. All
// material data is fetched at runtime from /api/ai/materials, which in
// turn reads only published, active, non-deleted lessons.
// ═══════════════════════════════════════════════════════════════════

interface MaterialContent {
  id: string;
  type: AiMaterialType;
  title: string;
  level: string;
  /**
   * Server-formatted plain text. Loaded lazily when the user selects a
   * material. Empty string until the detail call returns.
   */
  content: string;
  /**
   * Short preview shown in the selector. Always available.
   */
  shortDescription?: string | null;
  lessonNumber?: number;
  /**
   * True when the server truncated the formatted content to fit the
   * 12000-character limit.
   */
  truncated?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type Mode = "study" | "practice";
type MessageRole = "user" | "ai";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  source?: string;
  isQuiz?: boolean;
  quizData?: QuizQuestion[];
  materialContext?: MaterialContent;
}

const BACKEND_ROLE_MAP: Record<AiMessage["role"], MessageRole> = {
  USER: "user",
  ASSISTANT: "ai",
};

interface QuizQuestion {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  /**
   * User-supplied answer. For option-based questions (MULTIPLE_CHOICE /
   * TRUE_FALSE) this is the index of the chosen option. For FILL_BLANK
   * questions it is the typed string. The renderer and scorer both key on
   * the normalized question type to know which form to expect.
   */
  userAnswer?: number | string;
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Build the ChatRequest.selectedMaterial payload.
 *
 * <p><strong>Phase 2 final trust boundary:</strong> when a real database
 * material is selected, we send only <code>id</code> and <code>type</code>.
 * The backend re-resolves the material through <code>AiMaterialService</code>
 * and ignores <code>title</code> / <code>content</code>. We still attach
 * <code>title</code> for instant UI display (the sidebar chip does not need
 * to wait for a network round-trip to show the lesson name).
 *
 * <p>The 12000-char <code>content</code> is intentionally <strong>not</strong>
 * sent on the wire — the backend already has it.
 */
function toMaterialContextPayload(material: MaterialContent | null | undefined) {
  if (!material) return undefined;
  return {
    id: material.id,
    type: material.type,
    title: material.title,
    level: material.level,
    // content is omitted: the backend loads it from the DB by id+type
  };
}

function buildChatRequest(messageText: string, material: MaterialContent | null | undefined, conversationId: string | null) {
  return {
    message: messageText,
    conversationId: conversationId || undefined,
    selectedMaterial: toMaterialContextPayload(material),
  };
}

function highlightJapanese(text: string, tone: "user" | "ai" = "ai"): React.ReactNode {
  const className =
    tone === "user"
      ? "font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
      : "font-bold text-slate-900 dark:text-white";
  return (
    <span key={`jp-${text.substring(0, 10)}`}>
      {text.split(/([\u3040-\u309F\u30A0-\u30FF]+)/g).map((part, i) =>
        /[\u3040-\u309F\u30A0-\u30FF]/.test(part) ? (
          <span key={`jpe-${i}`} className={className}>
            {part}
          </span>
        ) : (
          <span key={`jpt-${i}`}>{part}</span>
        ),
      )}
    </span>
  );
}

// The legacy `materialToText` helper was removed in Phase 2. The backend
// now returns server-formatted plain-text material content (capped at
// 12000 characters) via GET /api/ai/materials/{type}/{id}. The frontend
// simply forwards that string to the chat / quiz endpoints — it no longer
// parses the material shape client-side.

// Safe markdown lite renderer for assistant messages.
// No raw HTML, no new dependencies, supports tables requested by user prompts.

// Decode common HTML entities. React text nodes do NOT auto-decode entities
// like &quot; — they would render as the literal "&quot;". We also escape the
// minimum set of characters that could break JSX/text rendering (<, >) so
// the content stays safe to inject as React text without dangerouslySetInnerHTML.
const HTML_ENTITY_DECODE_MAP: Record<string, string> = {
  "&quot;": "\"",
  "&apos;": "'",
  "&#39;": "'",
  "&#x27;": "'",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&#039;": "'",
};

function decodeHtmlEntities(value: string): string {
  if (!value || value.indexOf("&") < 0) return value;
  return value.replace(/&(?:quot|apos|amp|lt|gt|#39|#x27|#039);/g, (m) => HTML_ENTITY_DECODE_MAP[m] ?? m);
}

function escapeHtml(value: string): string {
  // Escape < and > for safety; do NOT touch " or ' because React renders them
  // as literal characters and any escape would leak "&quot;" into the UI.
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderInline(inline: string, tone: "user" | "ai" = "ai"): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(inline)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`inline-${key++}`}>{highlightJapanese(escapeHtml(inline.slice(lastIndex, match.index)), tone)}</span>);
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      const strongClass =
        tone === "user"
          ? "font-bold text-white"
          : "font-bold text-slate-900 dark:text-slate-50";
      parts.push(
        <strong key={`inline-${key++}`} className={strongClass}>
          {highlightJapanese(escapeHtml(token.slice(2, -2)), tone)}
        </strong>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      const codeClass =
        tone === "user"
          ? "rounded bg-white/20 text-white px-1 py-0.5 text-xs font-mono border border-white/25"
          : "rounded bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-50 px-1 py-0.5 text-xs font-mono";
      parts.push(
        <code
          key={`inline-${key++}`}
          className={codeClass}
        >
          {escapeHtml(token.slice(1, -1))}
        </code>,
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < inline.length || parts.length === 0) {
    parts.push(<span key={`inline-${key++}`}>{highlightJapanese(escapeHtml(inline.slice(lastIndex)), tone)}</span>);
  }
  return parts;
}

function isTableSeparatorLine(trimmed: string): boolean {
  // A line that matches a GFM/CommonMark table separator:
  //   | --- | :--- | :---: |     (pipe-style)
  //   --- :--- :---:              (space-aligned style, no leading/trailing pipes)
  if (!trimmed) return false;
  // More permissive: accept any sequence of - : | with spaces
  const stripped = trimmed.replace(/^\|\s*/, "").replace(/\s*\|$/, "");
  // Must contain mostly dashes/colons/pipes with optional spaces
  const dashOnly = stripped.replace(/[\s|:]/g, "");
  if (!dashOnly || dashOnly.replace(/-/g, "").length > 0) return false; // must be all dashes after removing colons and pipes
  // Accept if it has at least 2 dashes (common min for tables)
  return dashOnly.length >= 2;
}

// Returns true for a line that looks like a space-aligned table separator
// (no pipe characters at all).
function isSpaceAlignedSeparator(trimmed: string): boolean {
  if (!trimmed || trimmed.includes("|")) return false;
  // Must contain at least one ---, :---, ---:, or :---: separated by whitespace.
  return /^(:?-{3,}|:?-{3,}:?)\s+(:?-{3,}|:?-{3,}:?)((\s+)(:?-{3,}|:?-{3,}:?))*(\s*:|-:)?$/.test(trimmed);
}

function splitTableRow(line: string): string[] {
  // Trim surrounding whitespace, strip leading/trailing pipes, then split.
  const trimmed = line.trim();
  let body = trimmed;
  if (body.startsWith("|")) body = body.substring(1);
  if (body.endsWith("|")) body = body.substring(0, body.length - 1);
  return body.split("|").map((cell) => cell.trim());
}

function renderTable(rows: string[][], tableIndex: number, tone: "user" | "ai" = "ai"): React.ReactNode {
  if (rows.length === 0) return null;
  const header = rows[0];
  const body = rows.slice(1);
  const baseText =
    tone === "user"
      ? "text-white"
      : "text-slate-900 dark:text-slate-100";
  const thBg =
    tone === "user"
      ? "bg-white/15"
      : "bg-slate-100 dark:bg-slate-800";
  const thClass =
    tone === "user"
      ? "px-3 py-2 text-left text-xs font-semibold border-b border-white/25 text-white whitespace-nowrap"
      : "px-3 py-2 text-left text-xs font-semibold border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 whitespace-nowrap";
  const rowClass =
    tone === "user"
      ? "bg-white/10 even:bg-white/5 border-b border-white/15"
      : "odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700";
  const tdClass =
    tone === "user"
      ? `px-3 py-2 text-sm border-b border-white/15 align-top text-white`
      : "px-3 py-2 text-sm border-b border-slate-100 dark:border-slate-700 align-top text-slate-900 dark:text-slate-100";
  const tableClass =
    tone === "user"
      ? "min-w-full border-collapse rounded-lg overflow-hidden border border-white/25"
      : "min-w-full border-collapse rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700";
  return (
    <div className="my-3 overflow-x-auto last:mb-0" key={`table-wrapper-${tableIndex}`}>
      <table className={tableClass}>
        <thead className={thBg}>
          <tr>
            {header.map((cell, idx) => (
              <th
                key={`${tableIndex}-h-${idx}`}
                className={thClass}
              >
                {renderInline(cell, tone)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={baseText}>
          {body.map((row, rowIdx) => (
            <tr
              key={`${tableIndex}-r-${rowIdx}`}
              className={rowClass}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={`${tableIndex}-${rowIdx}-${cellIdx}`}
                  className={tdClass}
                >
                  {renderInline(cell, tone)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderMarkdown(markdown: string, tone: "user" | "ai" = "ai"): React.ReactNode[] {
  // Some LLM providers HTML-escape parts of their output (e.g. "聞く").
  // React text nodes do NOT auto-decode entities, so we normalize them here
  // before parsing/escaping the markdown.
  const normalized = decodeHtmlEntities(markdown);
  const lines = normalized.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  // Use block-index-based keys so they are stable across re-renders
  // (no shared mutable counter captured by inner closures).
  let blockIdx = 0;

  const pushParagraph = (text: string) => {
    if (!text.trim()) return;
    const k = `p-${blockIdx++}`;
    elements.push(
      <p key={k} className="mb-2 last:mb-0">
        {renderInline(text, tone)}
      </p>,
    );
  };

  const pushListItems = (items: string[], ordered: boolean) => {
    const Tag = ordered ? "ol" : "ul";
    const k = `l-${blockIdx++}`;
    elements.push(
      <Tag key={k} className="mb-3 list-inside space-y-1 last:mb-0">
        {items.map((item, idx) => {
          const itemKey = `li-${blockIdx}-${idx}`;
          return (
            <li key={itemKey} className={ordered ? "list-decimal" : "list-disc"}>
              {renderInline(item, tone)}
            </li>
          );
        })}
      </Tag>,
    );
  };

  // Try to parse a markdown table starting at index i.
  // Returns the index after the table block, or -1 if no table was found.
  // Rules:
  //   1. The block must contain at least one pipe character ("|") per row in header.
  //   2. The second logical row (skipping blank lines) must be a separator row.
  //   3. Blank lines between rows are tolerated.
  //   4. The block ends at the first non-pipe, non-blank line after the header+separator.
  const tryParseTable = (start: number): { nextIndex: number; rows: string[][] } | null => {
    if (start >= lines.length) return null;
    const firstTrimmed = lines[start].trim();

    // Must have pipe in header row
    if (!firstTrimmed.includes("|")) return null;

    // Collect consecutive non-empty rows (pipe rows OR content rows that look like table data)
    const pipeRows: { index: number; text: string }[] = [];
    let j = start;
    let foundSeparator = false;
    let dataRowsAfterSeparator = 0;

    while (j < lines.length) {
      const t = lines[j].trim();

      // Empty line - allow and continue if next line is pipe row
      if (t === "") {
        if (j + 1 < lines.length && lines[j + 1].trim().includes("|")) {
          j++;
          continue;
        }
        break;
      }

      // Not a pipe row - check if it looks like table data (Japanese/characters with spaces)
      if (!t.includes("|")) {
        // Allow up to 3 data rows after separator without pipes
        if (foundSeparator && dataRowsAfterSeparator < 3) {
          // Check if it looks like table data (has Japanese chars or common table patterns)
          if (/[\u3040-\u309F\u30A0-\u30FF]/.test(t) || /^\s*[^\s]+\s+[^\s]+/.test(t)) {
            pipeRows.push({ index: j, text: t });
            dataRowsAfterSeparator++;
            j++;
            continue;
          }
        }
        break;
      }

      pipeRows.push({ index: j, text: t });

      // Check if this is the separator row
      if (!foundSeparator && isTableSeparatorLine(t)) {
        foundSeparator = true;
      }

      j++;
    }

    if (pipeRows.length < 2) return null;

    // The separator must exist (should be the second collected row if using pipes)
    // But be more permissive - if we have 3+ rows, treat the second as separator
    const second = pipeRows[1];
    if (!isTableSeparatorLine(second.text)) {
      // Try to find separator at position 1-3
      let separatorIdx = -1;
      for (let k = 0; k < Math.min(3, pipeRows.length); k++) {
        if (isTableSeparatorLine(pipeRows[k].text)) {
          separatorIdx = k;
          break;
        }
      }
      if (separatorIdx === -1) return null;
    }

    // Use splitTableRow for pipe rows, simple split for non-pipe rows
    const parseRow = (text: string): string[] => {
      if (text.includes("|")) {
        return splitTableRow(text);
      }
      // For non-pipe rows, try to split by 2+ spaces
      return text.split(/\s{2,}/).map(c => c.trim()).filter(Boolean);
    };

    const header = parseRow(pipeRows[0].text);
    if (header.length < 1 || header.every((c) => c === "")) return null;

    const bodyRows: string[][] = [];
    // Start from row 1, skip any separator rows
    for (let k = 1; k < pipeRows.length; k++) {
      const rowText = pipeRows[k].text;
      if (isTableSeparatorLine(rowText)) continue; // skip separator rows
      bodyRows.push(parseRow(rowText));
    }

    if (bodyRows.length === 0) return null;

    const rows = [header, ...bodyRows];
    return { nextIndex: j, rows };
  };

  // Detect space-aligned tables (no pipe characters, separator via 2+ spaces).
  // Input example:
  //   Kanji   Hiragana   Romaji   Nghĩa
  //   :---    :---       :---     :---
  //   食べる  たべる     taberu   ăn
  const tryParseSpaceAlignedTable = (start: number): { nextIndex: number; rows: string[][] } | null => {
    if (start >= lines.length) return null;
    const firstTrimmed = lines[start].trim();
    if (!firstTrimmed) return null;
    // Must NOT contain a pipe character (otherwise tryParseTable would have caught it).
    if (firstTrimmed.includes("|")) return null;
    // Header must have at least 2 columns separated by 2+ whitespace chars.
    if (!/\s{2,}/.test(firstTrimmed)) return null;

    // Collect consecutive non-blank, non-pipe rows.
    const rows: string[] = [];
    let j = start;
    while (j < lines.length) {
      const t = lines[j].trim();
      if (t === "") {
        // Allow blank line; if next line is also a candidate, continue.
        if (j + 1 < lines.length && lines[j + 1].trim() && !lines[j + 1].trim().includes("|")) {
          j++;
          continue;
        }
        break;
      }
      if (t.includes("|")) break;
      rows.push(t);
      j++;
    }

    if (rows.length < 2) return null;

    // Second row must be the separator.
    if (!isSpaceAlignedSeparator(rows[1])) return null;

    const headerCells = rows[0].split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
    if (headerCells.length < 1) return null;

    const bodyRows: string[][] = [];
    for (let k = 2; k < rows.length; k++) {
      const cells = rows[k].split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
      if (cells.length > 0) bodyRows.push(cells);
    }

    return { nextIndex: j, rows: [headerCells, ...bodyRows] };
  };

  while (i < lines.length) {
    const line = lines[i];
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^(#{1,6})\s/)?.[1]?.length ?? 1;
      const text = line.replace(/^#{1,6}\s+/, "");
      const size = level <= 2 ? "text-base font-bold" : "text-sm font-semibold";
      const headingColor = tone === "user" ? "text-white" : "text-slate-900 dark:text-slate-50";
      elements.push(
        <p key={`h-${blockIdx++}`} className={`${size} mb-2 last:mb-0 ${headingColor}`}>
          {renderInline(text, tone)}
        </p>,
      );
      i++;
      continue;
    }

    if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      pushListItems(items, false);
      continue;
    }

    if (/^\s*\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      pushListItems(items, true);
      continue;
    }

    // Table detection
    const tableResult = tryParseTable(i);
    if (tableResult) {
      const tableEl = renderTable(tableResult.rows, blockIdx, tone);
      if (tableEl) {
        elements.push(tableEl);
        blockIdx++;
        i = tableResult.nextIndex;
        continue;
      }
    }

    // Space-aligned table fallback (no pipe characters).
    const spaceTableResult = tryParseSpaceAlignedTable(i);
    if (spaceTableResult) {
      const tableEl = renderTable(spaceTableResult.rows, blockIdx, tone);
      if (tableEl) {
        elements.push(tableEl);
        blockIdx++;
        i = spaceTableResult.nextIndex;
        continue;
      }
    }

    pushParagraph(line);
    i++;
  }

  if (elements.length === 0 && markdown.trim()) {
    elements.push(
      <p key={`fb-${blockIdx++}`} className="mb-2 last:mb-0">
        {renderInline(escapeHtml(decodeHtmlEntities(markdown)), tone)}
      </p>,
    );
  }

  return elements;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function MaterialSelector({
  selected,
  onSelect,
}: {
  selected: MaterialContent | null;
  onSelect: (m: MaterialContent) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AiMaterialType | "ALL">("ALL");
  const [materials, setMaterials] = useState<AiMaterialSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Reset detail error whenever the selector opens.
  useEffect(() => {
    if (isOpen) setDetailError(null);
  }, [isOpen]);

  // Lightweight list — no full content. Fetched only when the user opens
  // the selector so we don't pay for content we don't need.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    aiApi
      .listMaterials({ type: typeFilter === "ALL" ? undefined : typeFilter })
      .then((data) => {
        if (!cancelled) setMaterials(data);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load AI materials", err);
          setLoadError(err?.message || "Không tải được danh sách tài liệu.");
          setMaterials([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, typeFilter]);

  const typeIcons: Record<AiMaterialType, typeof BookOpen> = {
    VOCABULARY: BookOpen,
    GRAMMAR: GraduationCap,
    READING: FileText,
    LISTENING: Headphones,
  };

  const TypeIcon = selected ? typeIcons[selected.type] : BookOpen;

  const filteredMaterials = materials.filter((material) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const haystack = [material.title, material.type, material.level, material.shortDescription ?? ""]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  const handlePick = async (material: AiMaterialSummary) => {
    setDetailError(null);
    const id = `${material.type}:${material.id}`;
    setDetailLoadingId(id);
    try {
      const detail: AiMaterialDetail = await aiApi.getMaterialDetail(material.type, material.id);
      onSelect({
        id: detail.id,
        type: detail.type,
        title: detail.title,
        level: detail.level,
        content: detail.content,
        shortDescription: material.shortDescription,
        lessonNumber: detail.lessonNumber,
        truncated: detail.truncated,
      });
      setIsOpen(false);
      setSearch("");
    } catch (err: any) {
      console.error("Failed to load material detail", err);
      setDetailError(err?.message || "Không tải được chi tiết tài liệu.");
    } finally {
      setDetailLoadingId(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm hover:bg-white dark:hover:bg-slate-800 transition-all"
      >
        <TypeIcon className="w-4 h-4 text-primary" />
        <span className="font-medium">
          {selected ? selected.title : "Chọn tài liệu học tập..."}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 dark:border-slate-700 space-y-2">
              <div className="flex gap-1 flex-wrap">
                {(["ALL", "VOCABULARY", "GRAMMAR", "READING", "LISTENING"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      typeFilter === t
                        ? "bg-primary text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {t === "ALL" ? "Tất cả" : t.charAt(0) + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-700/60 px-2 py-1.5">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm tài liệu..."
                  className="w-full bg-transparent text-xs outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                />
              </div>
            </div>

            {detailError && (
              <div className="px-3 py-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-800 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                {detailError}
              </div>
            )}

            <div className="max-h-64 overflow-y-auto p-2">
              {isLoading ? (
                <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Đang tải tài liệu...
                </div>
              ) : loadError ? (
                <div className="py-6 text-center text-xs text-red-600">
                  {loadError}
                  <button
                    onClick={() => setTypeFilter((prev) => prev)}
                    className="block mx-auto mt-2 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-[11px]"
                  >
                    Thử lại
                  </button>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Không tìm thấy tài liệu phù hợp.
                </div>
              ) : (
                filteredMaterials.map((material) => {
                  const Icon = typeIcons[material.type];
                  const id = `${material.type}:${material.id}`;
                  const isLoadingThis = detailLoadingId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handlePick(material)}
                      disabled={detailLoadingId !== null}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                        selected?.id === material.id
                          ? "bg-primary/15 text-primary font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200"
                      } ${detailLoadingId !== null && !isLoadingThis ? "opacity-60" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          selected?.id === material.id
                            ? "bg-primary text-white"
                            : "bg-slate-100 dark:bg-slate-700"
                        }`}
                      >
                        {isLoadingThis ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{material.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {material.type.toLowerCase()} · {material.level}
                          {material.lessonNumber ? ` · Bài ${material.lessonNumber}` : ""}
                        </p>
                      </div>
                      {selected?.id === material.id && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MaterialPreview({ material }: { material: MaterialContent | null }) {
  if (!material) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex-1 min-h-0 overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <BookMarked className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold">Material Preview</h3>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
          {material.type}
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Title</span>
          <span className="text-sm font-medium text-right">{material.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Level</span>
          <span className="text-sm font-medium">{material.level}</span>
        </div>
        {material.lessonNumber != null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Lesson</span>
            <span className="text-sm font-medium">{material.lessonNumber}</span>
          </div>
        )}
        {material.shortDescription && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm whitespace-pre-wrap break-words">
              {material.shortDescription}
            </p>
          </div>
        )}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Content (server-formatted)</p>
            {material.truncated && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                Đã cắt bớt
              </span>
            )}
          </div>
          <pre className="text-[11px] leading-relaxed whitespace-pre-wrap break-words font-sans text-slate-700 dark:text-slate-300 max-h-40 overflow-y-auto">
            {material.content || "Đang tải nội dung..."}
          </pre>
        </div>
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
      <button
        onClick={() => onChange("study")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          mode === "study"
            ? "bg-white dark:bg-slate-600 shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Lightbulb className="w-3 h-3" />
        Study
      </button>
      <button
        onClick={() => onChange("practice")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          mode === "practice"
            ? "bg-white dark:bg-slate-600 shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <RotateCcw className="w-3 h-3" />
        Practice
      </button>
    </div>
  );
}

function MessageBubble({
  msg,
  canEdit,
  onEdit,
}: {
  msg: Message;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const isAI = msg.role === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isAI ? "" : "justify-end"}`}
    >
      <div className={`max-w-[85%] ${isAI ? "" : "items-end flex flex-col"}`}>
        {isAI && (
          <div className="flex items-center gap-2 mb-1 ml-1">
            <div className="w-6 h-6 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">AI Sensei</span>
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-3 ${
            isAI
              ? "bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              : "bg-gradient-hero text-white border border-white/20 shadow-sm [&_*]:!text-white [&_strong]:!font-bold"
          }`}
        >
          {isAI ? (
            <div className="text-sm leading-relaxed break-words min-w-0 text-slate-900 dark:text-slate-100">
              {renderMarkdown(msg.content, "ai")}
            </div>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words min-w-0 text-white">
              {msg.content.split("\n").map((line, lineIdx) => {
                // Use a hash-free stable key: the line index is stable because
                // msg.content (the full DB text) does not reorder mid-render.
                // Prefixing with role avoids collisions if two bubbles somehow
                // share a render pass (not possible here but defensive).
                const stableKey = `u-${lineIdx}-${line.length}`;
                return (
                  <p key={stableKey} className="mb-1 last:mb-0">
                    {highlightJapanese(line, "user")}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-1 mt-1 mr-1">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              data-testid="ai-edit-message-button"
              aria-label="Sửa tin nhắn đã gửi"
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-foreground transition-all"
              title="Sửa tin nhắn đã gửi"
            >
              <Edit3 className="w-3 h-3" />
              Sửa
            </button>
          )}
        </div>

        {msg.source && (
          <div className="flex items-center gap-1 mt-1 ml-1 text-xs text-muted-foreground">
            <Info className="w-3 h-3" />
            <span>Source: {msg.source}</span>
          </div>
        )}

        <span className="text-[10px] text-muted-foreground/50 mt-1 block ml-1">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
}

// Practice Mode Quiz UI
function PracticeMode({
  selectedMaterial,
  onMaterialChange,
}: {
  selectedMaterial: MaterialContent | null;
  onMaterialChange: (m: MaterialContent | null) => void;
}) {
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState("MULTIPLE_CHOICE");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [usedFallback, setUsedFallback] = useState(false);
  /**
   * Per-question typed answer for fill-blank questions, keyed by the
   * question's stable id. This replaces the previous single
   * <code>fillBlankInput</code> state that lost its value when the user
   * navigated between questions, especially under MIXED mode where the
   * input state was shared with multiple-choice questions.
   *
   * <p>Multiple-choice / true-false answers continue to be stored on
   * <code>quizData[i].userAnswer</code> as an option index; only the
   * free-text answer for fill-blank lives here.
   */
  const [fillBlankAnswers, setFillBlankAnswers] = useState<Record<string, string>>({});

  const handleGenerate = async () => {
    if (!selectedMaterial) {
      setError("Vui lòng chọn tài liệu để tạo quiz.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setQuizData(null);
    setSubmitted(false);
    setCurrentIndex(0);
    setUsedFallback(false);
    setFillBlankAnswers({});

    try {
      // Phase 2 final trust boundary: send materialId + materialType so the
      // backend resolves content from the DB. We do NOT send materialContent
      // (the 12000-char lesson body) — that would defeat the trust boundary.
      // materialTitle is kept as a fallback topic label; the backend will
      // replace it with the authoritative DB title once it resolves the
      // material.
      const response = await aiApi.generateQuestions({
        topic: selectedMaterial.title,
        materialId: selectedMaterial.id,
        materialType: selectedMaterial.type,
        materialTitle: selectedMaterial.title,
        level: difficulty,
        count: questionCount,
        type: questionType,
      });

      if (response.errorMessage) {
        setError(response.errorMessage);
        setIsGenerating(false);
        return;
      }

      if (response.questions && response.questions.length > 0) {
        // Validate and normalize each question. The renderer and scorer
        // both key off the normalized type. Unknown types are NOT
        // silently coerced to FILL_BLANK any more — they are kept in
        // the quiz with type="UNSUPPORTED" so the renderer can show a
        // safe Vietnamese fallback and so submission can be blocked
        // until the user regenerates.
        const validQuestions: QuizQuestion[] = response.questions
          .map((q, i) => {
            const rawType = q.type || "";
            // Object-based normalization: inspect the WHOLE question
            // (type + text + options + correctAnswer), not just the type
            // string. This is what catches the MIXED-mode bug where the
            // provider emits a fill-blank question labelled MULTIPLE_CHOICE
            // with an empty options array.
            const normalized = normalizeQuestion(q);
            if (normalized === UNSUPPORTED && rawType !== "") {
              // Log only non-sensitive diagnostic info (the raw type,
              // not the question text or the answer).
              // eslint-disable-next-line no-console
              console.warn(`[Quiz] Question ${q.id || i}: unsupported type "${rawType}", rendering as unsupported`);
            }
            const question = (q.question || q.questionText || "").trim();
            let correctAnswer = q.correctAnswer || "";
            let options = Array.isArray(q.options) ? q.options : [];

            if (!correctAnswer && typeof q.correctAnswerIndex === "number" && options[q.correctAnswerIndex]) {
              correctAnswer = options[q.correctAnswerIndex];
            }

            if (normalized === "TRUE_FALSE") {
              options = ["Đúng", "Sai"];
            }

            if (normalized === "FILL_BLANK") {
              options = [];
            }

            // For unsupported questions the backend never provided a
            // meaningful correctAnswer / options; the renderer will
            // simply hide them.
            return {
              id: q.id || `q_${i}`,
              type: normalized,
              question,
              options,
              correctAnswer: (correctAnswer || "").trim(),
              explanation: q.explanation || "",
            };
          })
          .filter((q) => {
            if (!q.question) {
              // eslint-disable-next-line no-console
              console.warn(`[Quiz] Skipping question ${q.id}: empty question text`);
              return false;
            }
            // Unsupported questions can stay so the renderer can show
            // the fallback and block submission, but they are not
            // counted toward the score.
            return true;
          });

        if (validQuestions.length === 0) {
          setError("Không tạo được câu hỏi hợp lệ. Vui lòng thử lại.");
        } else {
          setQuizData(validQuestions);
          if (response.isFallback) setUsedFallback(true);
        }
      } else {
        setError("Không tạo được câu hỏi. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      const errorMsg = err?.response?.data?.errorMessage || err?.message || "";
      if (errorMsg.includes("not configured") || errorMsg.includes("OPENROUTER_API_KEY")) {
        setError("AI provider chưa được cấu hình. Vui lòng cấu hình OpenRouter API key.");
      } else if (errorMsg.includes("quota") || errorMsg.includes("429")) {
        setError("AI đang quá tải. Vui lòng thử lại sau khoảng 1 phút.");
      } else if (errorMsg.includes("401") || errorMsg.includes("403")) {
        setError("API key AI không hợp lệ. Vui lòng liên hệ quản trị viên.");
      } else {
        setError("Tạo quiz thất bại: " + (errorMsg || "Vui lòng thử lại."));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (!quizData || submitted) return;
    const newQuiz = [...quizData];
    newQuiz[currentIndex] = { ...newQuiz[currentIndex], userAnswer: optionIndex };
    setQuizData(newQuiz);
    setError((prev) => (prev ? null : prev));
  };

  /**
   * Persist the user's typed answer for a fill-blank question, keyed by
   * the question's stable id. The input stays mounted across navigation
   * because the answer is stored per-question, not in a sibling
   * component-level state. We deliberately do not mirror the value onto
   * <code>q.userAnswer</code> so the renderer and scorer always read
   * fill-blank answers from one canonical place.
   */
  const handleFillBlankAnswer = (questionId: string, text: string) => {
    if (!quizData || submitted) return;
    setFillBlankAnswers((prev) => ({ ...prev, [questionId]: text }));
    setError((prev) => (prev ? null : prev));
  };

  /**
   * Whether every question in the current quiz has an answer recorded.
  /**
   * Whether every question has an answer recorded. UNSUPPORTED
   * questions are intentionally excluded: the user cannot answer
   * them, so blocking submit on them would be unfair. Submission is
   * independently blocked when an unsupported question exists (see
   * {@link hasUnsupportedQuestions}).
   */
  const answeredCount = quizData
    ? quizData.filter((q) => {
        const t = q.type;
        if (t === UNSUPPORTED) return true; // already "answered" by the renderer
        if (t === "FILL_BLANK") {
          return (fillBlankAnswers[q.id] ?? "").trim() !== "";
        }
        const ua = q.userAnswer;
        return ua !== undefined && ua !== null && ua !== "";
      }).length
    : 0;

  /**
   * True when at least one question in the quiz is unsupported.
   * Submission is blocked and the user is asked to regenerate.
   */
  const hasUnsupportedQuestions = !!quizData
    && quizData.some((q) => q.type === UNSUPPORTED);

  /**
   * Count of unsupported questions in the quiz. Surfaced in the UI so
   * the user knows why submission is blocked.
   */
  const unsupportedCount = quizData
    ? quizData.filter((q) => q.type === UNSUPPORTED).length
    : 0;

  /**
   * For fill-blank questions the answer is read from the per-question
   * map; for option-based questions the answer is on the question
   * object itself. UNSUPPORTED questions are excluded from the
   * answered-count denominator above; for an UNSUPPORTED question
   * we don't render an input, so isAnswered deliberately returns
   * true so it does not block "all answered" semantics.
   */
  const allQuestionsAnswered = !!quizData && answeredCount === quizData.length;

  const handleSubmit = () => {
    if (!quizData) return;
    if (hasUnsupportedQuestions) {
      setError(
        `Bộ câu hỏi chứa ${unsupportedCount} câu không hỗ trợ. Vui lòng tạo lại bộ câu hỏi để tiếp tục.`
      );
      return;
    }
    if (!allQuestionsAnswered) {
      const unanswered = quizData.length - answeredCount;
      setError(`Vui lòng trả lời tất cả câu hỏi trước khi nộp. Còn ${unanswered} câu chưa trả lời.`);
      return;
    }
    setError(null);
    setSubmitted(true);
    setCurrentIndex(0);
  };

  const handleRetry = () => {
    setQuizData(null);
    setSubmitted(false);
    setCurrentIndex(0);
    setUsedFallback(false);
    setError(null);
    setFillBlankAnswers({});
    // Leave selectedMaterial, questionCount, questionType, difficulty as-is so
    // the user can immediately re-tap Generate with the same settings.
  };

  const computeScore = (): { score: number; percent: number; scored: number; skipped: number } => {
    if (!quizData || quizData.length === 0) return { score: 0, percent: 0, scored: 0, skipped: 0 };
    let correct = 0;
    let scored = 0;
    let skipped = 0;
    for (const q of quizData) {
      const t = q.type;
      if (t === UNSUPPORTED) {
        // Provider returned a type the renderer does not understand.
        // Skip from the denominator so the user is not penalized for
        // a malformed provider response. Submission is independently
        // blocked by handleSubmit so the user regenerates.
        skipped++;
        continue;
      }
      scored++;
      if (t === "FILL_BLANK") {
        const typed = fillBlankAnswers[q.id] ?? "";
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
  };

  const { score, percent } = computeScore();

  const currentQuestion = quizData && quizData.length > 0 ? quizData[currentIndex] : null;
  const isCurrentAnswered = currentQuestion
    ? (() => {
        const t = currentQuestion.type;
        if (t === UNSUPPORTED) return true; // not answerable
        if (t === "FILL_BLANK") {
          return (fillBlankAnswers[currentQuestion.id] ?? "").trim() !== "";
        }
        const ua = currentQuestion.userAnswer;
        return ua !== undefined && ua !== null && ua !== "";
      })()
    : false;

  const typeOptions = [
    { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm" },
    { value: "FILL_BLANK", label: "Điền từ" },
    { value: "TRUE_FALSE", label: "Đúng/Sai" },
    { value: "MIXED", label: "Hỗn hợp" },
  ];

  const difficultyOptions = [
    { value: "EASY", label: "Dễ" },
    { value: "MEDIUM", label: "Trung bình" },
    { value: "HARD", label: "Khó" },
  ];

  // Determine if an option is correct/wrong for display
  const getOptionState = (option: string, index: number): "correct" | "wrong" | "selected" | "default" => {
    if (!submitted || !currentQuestion) return "default";
    const correct = currentQuestion.correctAnswer;
    if (option === correct) return "correct";
    if (currentQuestion.userAnswer === index && option !== correct) return "wrong";
    return "default";
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Quiz Settings Form */}
      {!quizData && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0 overflow-y-auto">
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Practice Quiz</h2>
                <p className="text-xs text-muted-foreground">Tạo câu hỏi từ tài liệu</p>
              </div>
            </div>

            {!selectedMaterial ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Vui lòng chọn tài liệu ở panel bên trái để tạo quiz.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="text-xs text-muted-foreground">Tài liệu đã chọn</p>
                  <p className="text-sm font-medium">{selectedMaterial.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {selectedMaterial.type.toLowerCase()} · {selectedMaterial.level}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Số câu hỏi</label>
                    <div className="flex gap-2">
                      {[5, 10, 15].map((n) => (
                        <button
                          key={n}
                          onClick={() => setQuestionCount(n)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            questionCount === n
                              ? "bg-primary text-white"
                              : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Loại câu hỏi</label>
                    <div className="flex flex-wrap gap-2">
                      {typeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setQuestionType(opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            questionType === opt.value
                              ? "bg-primary text-white"
                              : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Độ khó</label>
                    <div className="flex gap-2">
                      {difficultyOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setDifficulty(opt.value)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                            difficulty === opt.value
                              ? "bg-primary text-white"
                              : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full mt-6 py-3 rounded-xl bg-gradient-hero text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang tạo quiz...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      Generate Quiz
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quiz Questions Panel */}
      {quizData && quizData.length > 0 && currentQuestion && (
        <div className="flex-1 overflow-y-auto p-4 min-h-0 flex flex-col gap-3">
          {/* Fallback notice */}
          {usedFallback && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2 flex-shrink-0">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>Quiz được tạo từ dữ liệu bài học (local fallback).</span>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex-shrink-0">
              {error}
            </div>
          )}

          {/* Score banner */}
          {submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-2xl text-center flex-shrink-0 border ${
                percent >= 75
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800"
                  : percent >= 50
                  ? "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800"
                  : "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-100 dark:border-red-800"
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy
                  className={`w-6 h-6 ${
                    percent >= 75
                      ? "text-emerald-600 dark:text-emerald-400"
                      : percent >= 50
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                />
                <span className="text-3xl font-bold">{percent}%</span>
              </div>
              <p className="text-sm font-medium">
                {score}/{(() => {
                  const skippedCount = quizData.filter((q) => q.type === UNSUPPORTED).length;
                  return quizData.length - skippedCount;
                })()} câu đúng
                {(() => {
                  const skippedCount = quizData.filter((q) => q.type === UNSUPPORTED).length;
                  if (skippedCount > 0) {
                    return <span className="text-xs text-muted-foreground ml-1">({skippedCount} không hỗ trợ)</span>;
                  }
                  return null;
                })()}
              </p>
              <p
                className={`text-xs mt-1 ${
                  percent >= 75
                    ? "text-emerald-700 dark:text-emerald-300"
                    : percent >= 50
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {percent >= 75 ? "Xuất sắc!" : percent >= 50 ? "Khá tốt!" : "Cố gắng hơn nhé!"}
              </p>
            </motion.div>
          )}

          {/* Progress bar */}
          <div className="flex-shrink-0">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>
                Câu {currentIndex + 1}/{quizData.length} ·{" "}
                <span className="font-medium">{(() => {
                  const t = currentQuestion.type;
                  if (t === UNSUPPORTED) return "không hỗ trợ";
                  return t.replace("_", " ");
                })()}</span>
              </span>
              <span>
                {answeredCount}/{quizData.length} đã trả lời
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / quizData.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question card */}
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex-shrink-0">
            {/* Question text - always visible */}
            <p className="text-sm font-medium mb-4 break-words leading-relaxed">
              {currentQuestion.question}
            </p>

            {/* MULTIPLE_CHOICE rendering */}
            {currentQuestion.type === "MULTIPLE_CHOICE" && currentQuestion.options && currentQuestion.options.length > 0 && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, i) => {
                  const state = getOptionState(option, i);
                  let className = "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100";
                  let icon: React.ReactNode = null;

                  if (state === "correct") {
                    className = "bg-green-50 border-green-300 text-green-700 dark:bg-green-950/40 dark:border-green-700 dark:text-green-300";
                    icon = <CheckCircle2 className="w-4 h-4 text-green-500" />;
                  } else if (state === "wrong") {
                    className = "bg-red-50 border-red-300 text-red-700 dark:bg-red-950/40 dark:border-red-700 dark:text-red-300";
                    icon = <X className="w-4 h-4 text-red-500" />;
                  } else if (!submitted && currentQuestion.userAnswer === i) {
                    className = "bg-primary/10 border-primary/30 text-primary";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={submitted}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all flex items-center justify-between ${className}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-bold w-5 shrink-0 text-center">{String.fromCharCode(65 + i)}.</span>
                        <span>{option}</span>
                      </span>
                      {icon}
                    </button>
                  );
                })}
              </div>
            )}

            {/* TRUE_FALSE rendering */}
            {currentQuestion.type === "TRUE_FALSE" && (
              <div className="grid grid-cols-2 gap-3">
                {["Đúng", "Sai"].map((opt, i) => {
                  const isCorrect = opt === currentQuestion.correctAnswer;
                  const isSelected = currentQuestion.userAnswer === i;
                  let className = "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100";
                  let icon: React.ReactNode = null;

                  if (submitted) {
                    if (isCorrect) {
                      className = "bg-green-50 border-green-300 text-green-700 dark:bg-green-950/40 dark:border-green-700 dark:text-green-300";
                      icon = <CheckCircle2 className="w-5 h-5 text-green-500" />;
                    } else if (isSelected && !isCorrect) {
                      className = "bg-red-50 border-red-300 text-red-700 dark:bg-red-950/40 dark:border-red-700 dark:text-red-300";
                      icon = <X className="w-5 h-5 text-red-500" />;
                    }
                  } else if (isSelected) {
                    className = "bg-primary/10 border-primary/30 text-primary";
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(i)}
                      disabled={submitted}
                      className={`py-4 rounded-xl border text-sm font-medium transition-all flex flex-col items-center justify-center gap-1 ${className}`}
                    >
                      <span className="text-base">{opt}</span>
                      {icon}
                    </button>
                  );
                })}
              </div>
            )}

            {/* FILL_BLANK rendering — always shows a free-text input */}
            {currentQuestion.type === "FILL_BLANK" && (() => {
              const typed = fillBlankAnswers[currentQuestion.id] ?? "";
              const hasMarker = hasBlankMarker(currentQuestion.question);
              const resultState = submitted
                ? fillBlankResultState(typed, currentQuestion.correctAnswer)
                : "unanswered";
              const isCorrect = resultState === "correct";
              const isIncorrect = resultState === "incorrect";
              return (
                <div data-testid="practice-fill-blank-block">
                  {hasMarker && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Gợi ý: điền vào chỗ trống <span className="font-mono">____</span> trong câu hỏi.
                    </p>
                  )}
                  <input
                    key={currentQuestion.id}
                    data-testid="practice-fill-blank-input"
                    aria-label="Nhập đáp án điền từ"
                    type="text"
                    value={typed}
                    onChange={(e) => handleFillBlankAnswer(currentQuestion.id, e.target.value)}
                    onKeyDown={(e) => {
                      // Enter on the last unanswered question triggers
                      // submit so the user can review without using the mouse.
                      if (e.key === "Enter" && !submitted && currentIndex === quizData.length - 1) {
                        e.preventDefault();
                        if (allQuestionsAnswered) handleSubmit();
                      }
                    }}
                    disabled={submitted}
                    placeholder="Nhập đáp án..."
                    autoComplete="off"
                    spellCheck={false}
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-slate-400 ${
                      submitted
                        ? isCorrect
                          ? "bg-green-50 border-green-300 text-green-700 dark:bg-green-950/40 dark:border-green-700"
                          : isIncorrect
                          ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-950/40 dark:border-red-700"
                          : "bg-slate-50 border-slate-300 dark:bg-slate-700/40 dark:border-slate-600"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                    }`}
                  />
                  {submitted && (
                    <div className="mt-2 flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : isIncorrect ? (
                        <X className="w-4 h-4 text-red-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-xs">
                        Đáp án đúng: <strong>{currentQuestion.correctAnswer}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* UNSUPPORTED question rendering — provider returned a type
                the frontend does not know how to render. The user is
                shown a Vietnamese warning, NOT given a fill-blank input
                or any option buttons, and submission is independently
                blocked at the quiz level so the score is not skewed. */}
            {currentQuestion.type === UNSUPPORTED && (
              <div
                data-testid="practice-unsupported-block"
                role="alert"
                className="rounded-xl border border-amber-200 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 p-3"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Không thể hiển thị loại câu hỏi này. Vui lòng tạo lại bộ câu hỏi.
                    </p>
                    {currentQuestion.type && typeof currentQuestion.type === "string" && currentQuestion.type !== UNSUPPORTED && (
                      <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1 break-all">
                        Loại câu hỏi: <span className="font-mono">{currentQuestion.type}</span>
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tạo lại câu hỏi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Explanation after submit */}
            {submitted && currentQuestion.explanation && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-medium text-blue-700 mb-1">Giải thích:</p>
                <p className="text-xs text-blue-600">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>

          {/* Navigation + Submit buttons */}
          <div className="flex gap-2 flex-shrink-0 mt-auto">
            <button
              type="button"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
            >
              ← Previous
            </button>

            {currentIndex < quizData.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 transition"
              >
                Next →
              </button>
            ) : !submitted ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 text-sm bg-gradient-hero text-white rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Submit Quiz
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRetry}
                className="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Generate Another
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz data invalid state */}
      {quizData && quizData.length === 0 && !isGenerating && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Quiz không có câu hỏi hợp lệ. Vui lòng tạo lại.
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 transition"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}

function WelcomeState({ onExampleClick }: { onExampleClick: (q: string) => void }) {
  const examples = [
    { q: "食べる nghĩa là gì?", icon: BookOpen },
    { q: "Giải thích ～です", icon: GraduationCap },
    { q: "Cho ví dụ về 行く", icon: Headphones },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center text-3xl mb-4 shadow-lg"
      >
        🌸
      </motion.div>

      <h2 className="text-xl font-bold mb-2">AI Sensei</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Trợ lý học tập Nhật ngữ. Bạn có thể chọn tài liệu để AI trả lời đúng trọng tâm bài học.
      </p>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 mb-6 max-w-sm">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300 text-left">
            <strong>Lưu ý:</strong> Bạn có thể chọn tài liệu để AI trả lời đúng trọng tâm bài học.
            Nếu câu hỏi không có trong tài liệu đã chọn, AI sẽ thông báo cho bạn.
          </p>
        </div>
      </div>

      <div className="space-y-2 w-full max-w-xs">
        <p className="text-xs text-muted-foreground mb-2">Thử hỏi:</p>
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => onExampleClick(ex.q)}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm hover:bg-white dark:hover:bg-slate-800 transition-all text-left"
          >
            <ex.icon className="w-4 h-4 text-primary flex-shrink-0" />
            {ex.q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function AISenseiPage() {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialContent | null>(null);
  const [mode, setMode] = useState<Mode>("study");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setLoadingConversations] = useState(false);
  const [isSendingMessage, setSendingMessage] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Boot state to prevent flicker during reload restore
  const [chatBootState, setChatBootState] = useState<"loading" | "ready" | "error">("loading");

  // Edit mode state
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string; materialContext?: MaterialContent } | null>(null);
  const [editInput, setEditInput] = useState("");
  const [isSavingEdit, setSavingEdit] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat container only
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Reset page scroll on mount
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setApiError(null);
    try {
      const data = await aiApi.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations", error);
      setApiError("Không tải được danh sách conversation.");
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string): Promise<boolean> => {
    setApiError(null);
    try {
      const data: ConversationMessagesResponse = await aiApi.getMessages(conversationId);
      const mapped: Message[] = data.messages.map((msg) => {
        const rawContent = msg.content;
        const normalizedContent =
          rawContent == null ||
          rawContent === "null" ||
          rawContent === "undefined" ||
          rawContent.trim() === ""
            ? "Xin lỗi, câu trả lời này không hợp lệ. Vui lòng thử lại."
            : rawContent;
        return {
          id: msg.id,
          role: BACKEND_ROLE_MAP[msg.role],
          content: normalizedContent,
          timestamp: new Date(msg.createdAt),
        };
      });
      setMessages(mapped);
      setActiveConversationId(conversationId);
      return true;
    } catch (error) {
      console.error("Failed to load messages", error);
      setApiError("Không tải được tin nhắn của conversation.");
      setActiveConversationId(null);
      sessionStorage.removeItem("midori_ai_active_conversation_id");
      setMessages([]);
      return false;
    }
  }, []);

  const handleSelectConversation = useCallback(
    async (conversation: AiConversation) => {
      setEditingMessage(null);
      setEditInput("");
      const success = await loadMessages(conversation.id);
      if (success) {
        sessionStorage.setItem("midori_ai_active_conversation_id", conversation.id);
      }
    },
    [loadMessages],
  );

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    sessionStorage.removeItem("midori_ai_active_conversation_id");
    setMessages([]);
    setApiError(null);
    setEditingMessage(null);
    setEditInput("");
    setSelectedMaterial(null);
    setMode("study");
  }, []);

  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      const confirmed = window.confirm(
        "Bạn có chắc muốn xóa đoạn chat này không? Hành động này không thể hoàn tác.",
      );
      if (!confirmed) return;

      setApiError(null);
      try {
        await aiApi.deleteConversation(conversationId);
        setConversations((prev) => prev.filter((item) => item.id !== conversationId));
        if (activeConversationId === conversationId) {
          setActiveConversationId(null);
          sessionStorage.removeItem("midori_ai_active_conversation_id");
          setMessages([]);
          setEditingMessage(null);
          setEditInput("");
        }
      } catch (error) {
        console.error("Failed to delete conversation", error);
        setApiError("Không xóa được conversation.");
      }
    },
    [activeConversationId],
  );

  const handleRenameConversation = useCallback(
    async (conversation: AiConversation) => {
      const newTitle = window.prompt("Nhập tên mới cho đoạn chat:", conversation.title);
      if (newTitle === null) return;
      const trimmed = newTitle.trim();
      if (!trimmed) return;

      setApiError(null);
      try {
        const updated = await aiApi.updateConversationTitle(conversation.id, { title: trimmed });
        setConversations((prev) =>
          prev.map((c) => (c.id === conversation.id ? { ...c, title: updated.title } : c)),
        );
      } catch (error) {
        console.error("Failed to rename conversation", error);
        setApiError("Không đổi được tên conversation.");
      }
    },
    [],
  );

  const handleEditMessage = useCallback((msg: Message) => {
    setEditingMessage({ id: msg.id, content: msg.content, materialContext: msg.materialContext });
    setEditInput(msg.content);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setEditInput("");
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingMessage || !activeConversationId) return;
    const trimmed = editInput.trim();
    if (!trimmed) return;
    if (isSavingEdit) return;

    const materialContext = editingMessage.materialContext ?? selectedMaterial;
    setSavingEdit(true);
    setApiError(null);

    const userIndex = messages.findIndex((m) => m.id === editingMessage.id);
    if (userIndex < 0) {
      setApiError("Không tìm thấy tin nhắn cần sửa.");
      setSavingEdit(false);
      return;
    }

    const updatedMessages = messages.map((m) =>
      m.id === editingMessage.id ? { ...m, content: trimmed } : m,
    );

    const nextIsAssistant =
      userIndex + 1 < updatedMessages.length && updatedMessages[userIndex + 1].role === "ai";
    const afterRemoval = nextIsAssistant
      ? updatedMessages.filter((_, idx) => idx !== userIndex + 1)
      : updatedMessages;

    setMessages(afterRemoval);
    setEditingMessage(null);
    setEditInput("");
    setIsTyping(true);
    setChatLoadingText("Đang tạo câu trả lời...");

    try {
      const data = await aiApi.updateUserMessage(activeConversationId, editingMessage.id, {
        content: trimmed,
        selectedMaterial: materialContext ? toMaterialContextPayload(materialContext) : undefined,
      });

      const refreshed: Message[] = data.messages.map((msg) => {
        const rawContent = msg.content;
        const normalizedContent =
          rawContent == null ||
          rawContent === "null" ||
          rawContent === "undefined" ||
          rawContent.trim() === ""
            ? "Xin lỗi, câu trả lời này không hợp lệ. Vui lòng thử lại."
            : rawContent;
        return {
          id: msg.id,
          role: BACKEND_ROLE_MAP[msg.role],
          content: normalizedContent,
          timestamp: new Date(msg.createdAt),
          materialContext: editingMessage.materialContext ?? selectedMaterial,
        };
      });

      setMessages(refreshed);
      await loadConversations();
    } catch (error: any) {
      console.error("Failed to regenerate message", error);
      setApiError("Không thể tạo lại câu trả lời. Vui lòng thử lại.");
    } finally {
      setSavingEdit(false);
      setIsTyping(false);
      setChatLoadingText(null);
    }
  }, [editingMessage, editInput, activeConversationId, messages, selectedMaterial, loadConversations]);

  const [chatLoadingText, setChatLoadingText] = useState<string | null>(null);
  const aiLoadingMessages = [
    "AI Sensei đang phân tích câu hỏi...",
    selectedMaterial ? "Đang tham chiếu tài liệu đã chọn..." : "Đang tổng hợp kiến thức liên quan...",
    "Đang soạn câu trả lời...",
  ];

  const handleSend = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed || isSendingMessage) return;

      const materialContext = selectedMaterial;
      const optimisticUserMsg: Message = {
        id: genId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
        materialContext,
      };

      setMessages((m) => [...m, optimisticUserMsg]);
      setInput("");
      setApiError(null);
      setEditingMessage(null);
      setEditInput("");
      setSendingMessage(true);
      setIsTyping(true);
      setChatLoadingText(aiLoadingMessages[0]);

      let step = 1;
      const loadingTimer = window.setInterval(() => {
        step = (step + 1) % aiLoadingMessages.length;
        setChatLoadingText(aiLoadingMessages[step]);
      }, 1200);

      try {
        const response = await aiApi.chat(buildChatRequest(trimmed, materialContext, activeConversationId));

        const success = await loadMessages(response.conversationId);

        if (success) {
          sessionStorage.setItem("midori_ai_active_conversation_id", response.conversationId);
        }

        await loadConversations();
      } catch (error: any) {
        console.error("Failed to send message", error);
        if (error?.message?.includes("not configured") || error?.message?.includes("OPENROUTER_API_KEY") || error?.message?.includes("GEMINI_API_KEY")) {
          setApiError("AI provider chưa được cấu hình. Vui lòng liên hệ quản trị viên.");
        } else if (error?.message?.includes("429")) {
          setApiError("AI đang quá tải. Vui lòng thử lại sau khoảng 1 phút.");
        } else {
          setApiError("Gửi tin nhắn thất bại. Vui lòng thử lại.");
        }
        setMessages((m) => m.slice(0, -1));
      } finally {
        window.clearInterval(loadingTimer);
        setSendingMessage(false);
        setIsTyping(false);
        setChatLoadingText(null);
      }
    },
    [input, isSendingMessage, activeConversationId, loadConversations, loadMessages, selectedMaterial],
  );

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
  };

  // Determine which USER message (if any) is the last one - only that can be edited
  const lastUserMessageId = (() => {
    let lastId: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastId = messages[i].id;
        break;
      }
    }
    return lastId;
  })();

  // Ref to track if boot has been initialized
  const bootInitializedRef = useRef(false);

  // Boot logic: distinguish fresh open vs reload, restore state appropriately
  useEffect(() => {
    if (isLoadingConversations || bootInitializedRef.current) return;

    const isReload = () => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      return nav?.type === "reload";
    };

    const storedId = sessionStorage.getItem("midori_ai_active_conversation_id");
    const shouldRestore = isReload() && storedId;

    bootInitializedRef.current = true;
    setChatBootState("loading");

    if (shouldRestore) {
      loadMessages(storedId!).then((success) => {
        if (success) {
          setActiveConversationId(storedId!);
        } else {
          sessionStorage.removeItem("midori_ai_active_conversation_id");
          setMessages([]);
        }
        setChatBootState("ready");
      });
    } else {
      sessionStorage.removeItem("midori_ai_active_conversation_id");
      setMessages([]);
      setChatBootState("ready");
    }
  }, [conversations, isLoadingConversations, loadMessages]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // showWelcome only when there are no messages AND we are not in a conversation AND boot is complete
  const showWelcome = chatBootState === "ready" && messages.length === 0 && !activeConversationId;

  // Show loading state during boot
  const showBootLoading = chatBootState === "loading";

  const materialHelper = selectedMaterial
    ? "AI Sensei sẽ ưu tiên giải thích theo tài liệu đã chọn."
    : "Bạn có thể chọn tài liệu để AI trả lời đúng trọng tâm bài học.";

  return (
    <div className="h-[calc(100dvh-7rem)] md:h-[calc(100vh-7rem)] min-h-0 flex flex-col lg:flex-row gap-3 lg:gap-4 min-w-0 max-w-full overflow-x-hidden">
      {/* Left Panel - Material Selection & Preview */}
      {/* Mobile/tablet: stacked above chat, full width, scrollable internally.
          Desktop lg+: fixed 320px sidebar. */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-3 lg:gap-4 min-h-0 min-w-0 max-w-full overflow-y-auto lg:overflow-hidden max-h-[45dvh] lg:max-h-full overflow-x-hidden">
        <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex-shrink-0 overflow-x-hidden">
          <div className="flex items-center justify-between mb-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="w-4 h-4 text-primary flex-shrink-0" />
              <h3 className="text-sm font-bold truncate min-w-0">Conversations</h3>
            </div>
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 transition"
            >
              <Plus className="w-3 h-3" />
              New chat
            </button>
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {isLoadingConversations && (
              <p className="text-xs text-muted-foreground">Loading...</p>
            )}
            {!isLoadingConversations && conversations.length === 0 && (
              <p className="text-xs text-muted-foreground">No conversations yet.</p>
            )}
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-1 p-2 rounded-xl text-xs transition-all group min-w-0 overflow-x-hidden ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <button
                    onClick={() => handleSelectConversation(conversation)}
                    className="flex-1 text-left truncate min-w-0 overflow-x-hidden"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Bot className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate min-w-0">{conversation.title || "New chat"}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {new Date(conversation.updatedAt).toLocaleString()}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameConversation(conversation);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all"
                    title="Đổi tên"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conversation.id);
                    }}
                    className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="Xóa đoạn chat"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold">Material Selection</h3>
            {selectedMaterial && (
              <button
                onClick={() => setSelectedMaterial(null)}
                className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                title="Bỏ chọn tài liệu"
              >
                <X className="w-3 h-3" /> Bỏ chọn
              </button>
            )}
          </div>

          <MaterialSelector selected={selectedMaterial} onSelect={setSelectedMaterial} />

          <div className="mt-4">
            <ModeToggle mode={mode} onChange={handleModeChange} />
            <p className="text-[10px] text-muted-foreground mt-2">{materialHelper}</p>
          </div>
        </div>

        <div className="flex-shrink-0 overflow-hidden">
          <MaterialPreview material={selectedMaterial} />
        </div>

        {selectedMaterial && (
          <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-3 border border-primary/20 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span className="font-medium">Chế độ nguồn ưu tiên</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Các câu trả lời sẽ ưu tiên dựa trên: {selectedMaterial.title}
            </p>
          </div>
        )}
      </div>

      {/* Right Panel - Chat / Practice. Always visible.
          On desktop it shares the row with the left panel; on mobile/tablet
          it occupies the remaining vertical space below the left panel. */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col rounded-2xl overflow-hidden bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 overflow-x-hidden">
        {/* Header */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0 gap-2 min-w-0 overflow-x-hidden">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-hidden">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-hero flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1 overflow-x-hidden">
              <h2 className="text-sm font-bold truncate">
                {mode === "study" ? "AI Sensei" : "Practice Quiz"}
              </h2>
              <p className="text-[10px] text-muted-foreground truncate">
                {mode === "study" ? "Study chat with AI" : "Generate quizzes from materials"}
              </p>
            </div>
          </div>

          {selectedMaterial && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs flex-shrink-0">
              <BookMarked className="w-3 h-3" />
              <span className="font-medium">{selectedMaterial.type.toLowerCase()}</span>
            </div>
          )}
        </div>

        {/* Content */}
        {mode === "practice" ? (
          <PracticeMode
            selectedMaterial={selectedMaterial}
            onMaterialChange={setSelectedMaterial}
          />
        ) : (
          <>
            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 pb-24 lg:pb-0">
              {apiError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {apiError}
                </div>
              )}

              {showBootLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-8 h-8 rounded-xl bg-gradient-hero flex items-center justify-center mb-3 animate-pulse">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-muted-foreground">Đang tải đoạn chat...</p>
                </div>
              )}

              {!showBootLoading && showWelcome && <WelcomeState onExampleClick={handleSend} />}

              {!showBootLoading &&
                !showWelcome &&
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    canEdit={msg.id === lastUserMessageId}
                    onEdit={() => handleEditMessage(msg)}
                  />
                ))}

              {isTyping && chatLoadingText && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex">
                  <div className="max-w-[85%]">
                    <div className="flex items-center gap-2 mb-1 ml-1">
                      <div className="w-6 h-6 rounded-lg bg-gradient-hero flex items-center justify-center">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-muted-foreground">AI Sensei</span>
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700">
                      <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                        {chatLoadingText}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {!isTyping && apiError && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex">
                  <div className="max-w-[85%]">
                    <div className="flex items-center gap-2 mb-1 ml-1">
                      <div className="w-6 h-6 rounded-lg bg-gradient-hero flex items-center justify-center">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-muted-foreground">AI Sensei</span>
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                      <div className="text-sm text-red-600 dark:text-red-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {apiError}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input — extra bottom padding on mobile so it clears the bottom nav */}
            <div className="p-4 pb-24 lg:pb-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
              {editingMessage && (
                <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-3 h-3 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        Đang sửa tin nhắn đã gửi
                      </span>
                    </div>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                    >
                      <X className="w-3 h-3 text-amber-500" />
                    </button>
                  </div>
                  <textarea
                    data-testid="ai-edit-textarea"
                    aria-label="Sửa nội dung tin nhắn"
                    value={editInput}
                    onChange={(e) => setEditInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                    }}
                    placeholder="Sửa tin nhắn của bạn..."
                    className="w-full resize-none rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/50 px-3 py-2 text-sm outline-none focus:border-amber-400 placeholder:text-slate-500 dark:placeholder:text-slate-400 min-w-0 break-words overflow-wrap-anywhere"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                    >
                      Hủy
                    </button>
                    <button
                      data-testid="ai-edit-save-button"
                      onClick={handleSaveEdit}
                      disabled={!editInput.trim() || isSavingEdit}
                      className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
                    >
                      {isSavingEdit ? "Đang lưu..." : "Lưu và gửi lại"}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    selectedMaterial
                      ? `Hỏi về ${selectedMaterial.title}...`
                      : "Hỏi AI Sensei về tiếng Nhật..."
                  }
                  rows={1}
                  className="flex-1 resize-none rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm outline-none focus:border-primary/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 min-w-0 break-words overflow-wrap-anywhere"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isSendingMessage || !!editingMessage}
                  className="px-4 py-3 rounded-xl bg-gradient-hero text-white disabled:opacity-50 hover:opacity-90 transition shadow-md"
                  title={
                    editingMessage
                      ? "Lưu hoặc hủy sửa tin nhắn trước"
                      : "Gửi tin nhắn (Enter)"
                  }
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center mt-2">
                <Sparkles className="w-3 h-3 inline mr-1" />
                Enter gửi · Shift+Enter xuống dòng · AI Sensei có thể ưu tiên tài liệu đã chọn khi trả lời.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
