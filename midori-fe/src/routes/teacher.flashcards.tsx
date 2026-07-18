import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  BookOpen,
  Layers,
  X,
  Save,
  BookText,
  Tag,
  Star,
  FlipHorizontal,
  GripVertical,
  AlertTriangle,
  EyeOff,
  ListChecks,
  Volume2,
  Loader2,
  Send,
  Upload,
} from "lucide-react";
import { teacherFlashcardApi } from "../lib/api/teacherFlashcard";
import {
  type FlashcardSetResponse,
  type FlashcardSetDetailResponse,
  type FlashcardCardResponse,
  type FlashcardSetCreateRequest,
  type FlashcardSetUpdateRequest,
  type FlashcardCardCreateRequest,
  type FlashcardCardUpdateRequest,
  type FlashcardSetStatus,
} from "../lib/api/flashcardMappers";
import { ApiError } from "../lib/api/client";
import { RejectReasonBox } from "@/components/reject-reason-box";

const JLPT_LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];
const PAGE_SIZE = 9;

// ─── Status badge ───────────────────────────────────────────────────────────────
function statusBadge(status: FlashcardSetStatus) {
  const map: Record<FlashcardSetStatus, { cls: string; label: string }> = {
    DRAFT: { cls: "bg-slate-100 text-slate-600 border-slate-200", label: "Draft" },
    PENDING: { cls: "bg-yellow-50 text-yellow-600 border-yellow-200", label: "Pending" },
    APPROVED: { cls: "bg-green-50 text-green-600 border-green-200", label: "Approved" },
    REJECTED: { cls: "bg-red-50 text-red-500 border-red-200", label: "Rejected" },
  };
  const s = map[status] ?? map.DRAFT;
  return { cls: `px-2 py-0.5 rounded-full text-[10px] font-black border ${s.cls}`, label: s.label };
}

// ─── Level badge ────────────────────────────────────────────────────────────────
function levelBadge(l: string | null | undefined) {
  const map: Record<string, string> = {
    N5: "bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    N4: "bg-green-50 text-green-500 dark:bg-green-950/30 dark:text-green-300 border-green-200 dark:border-green-800",
    N3: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    N2: "bg-orange-50 text-orange-500 dark:bg-orange-950/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    N1: "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-300 border-red-200 dark:border-red-800",
  };
  return map[l ?? ""] ?? "bg-slate-50 text-slate-500 border-slate-200";
}

function speakJapanese(text: string) {
  if (!text?.trim()) return;
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export const Route = createFileRoute("/teacher/flashcards")({
  component: TeacherFlashcardsPage,
});

// ─── Pagination ────────────────────────────────────────────────────────────────
function PaginationUI({
  current,
  total,
  onPage,
}: {
  current: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {Math.min((current - 1) * PAGE_SIZE + 1, total)}
        </span>
        {" – "}
        <span className="font-semibold text-foreground">
          {Math.min(current * PAGE_SIZE, total)}
        </span>
        {" / "}
        <span className="font-semibold text-foreground">{total}</span>
        {" sets"}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 transition"
        >
          ‹
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
              p === current
                ? "bg-gradient-hero text-white shadow"
                : "border border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(current + 1)}
          disabled={current === pages}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 transition"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ─── Card Form Component (shared) ───────────────────────────────────────────────
type CardFormState = { kanji: string; kana: string; meaning: string; example: string };

interface CardFormProps {
  mode: "add" | "edit";
  onSave: () => void;
  onCancel: () => void;
  form: CardFormState;
  setForm: React.Dispatch<React.SetStateAction<CardFormState>>;
}

function CardForm({ mode, onSave, onCancel, form, setForm }: CardFormProps) {
  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 dark:bg-primary/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-hero text-white flex items-center justify-center text-[10px] font-black">
            {mode === "add" ? "+" : "✎"}
          </div>
          <span className="text-sm font-bold text-foreground">
            {mode === "add" ? "Add new card" : "Edit card"}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg hover:bg-primary/10 transition text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
              Kanji <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              value={form.kanji}
              onChange={(e) => setForm((f) => ({ ...f, kanji: e.target.value }))}
              placeholder="e.g. 環境"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
              Hiragana / Kana <span className="text-red-400">*</span>
            </label>
            <input
              value={form.kana}
              onChange={(e) => setForm((f) => ({ ...f, kana: e.target.value }))}
              placeholder="e.g. かんきょう"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
            Meaning <span className="text-red-400">*</span>
          </label>
          <input
            value={form.meaning}
            onChange={(e) => setForm((f) => ({ ...f, meaning: e.target.value }))}
            placeholder="e.g. Môi trường"
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
            Example
          </label>
          <input
            value={form.example}
            onChange={(e) => setForm((f) => ({ ...f, example: e.target.value }))}
            placeholder="e.g. 今日は天気が很好です。"
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-muted-foreground hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!form.kana.trim() || !form.meaning.trim()}
            className="flex-1 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition flex items-center justify-center gap-2"
          >
            {mode === "add" ? (
              <>
                <Plus className="w-4 h-4" /> Add card
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Update
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Toast ───────────────────────────────────────────────────────────
interface ToastState {
  message: string;
  type: "success" | "error";
}

function Toast({ toasts }: { toasts: ToastState[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`px-4 py-3 rounded-xl text-sm font-semibold shadow-lg border ${
              t.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Bulk Import Modal ─────────────────────────────────────────────────────────
type BulkDelimiter = "\t" | " " | "|" | "," | ";";

interface ParsedCard {
  kanji: string;
  kana: string;
  meaning: string;
  example: string;
}

interface ParsedResult {
  cards: ParsedCard[];
  totalRows: number;
  invalidRows: number;
}

interface BulkImportModalProps {
  onClose: () => void;
  onImport: (cards: ParsedCard[]) => Promise<void>;
  currentCards: FlashcardCardResponse[];
}

const DELIMITER_CONFIGS: { key: BulkDelimiter; label: string; hint: string }[] = [
  { key: "\t", label: "Auto-detect", hint: "Best for PDFs, websites, Word" },
  { key: " ", label: "Multiple spaces", hint: "2+ spaces (JLPT docs, plain text)" },
  { key: "|", label: "Pipe (|)", hint: "Quizlet pipe exports" },
  { key: ",", label: "Comma (,)", hint: "CSV / Excel exports" },
  { key: ";", label: "Semicolon (;)", hint: "European CSV format" },
];

const DELIMITER_PATTERN: Record<Exclude<BulkDelimiter, "\t">, RegExp> = {
  " ": /\s{2,}/,
  "|": /\s*\|\s*/,
  ",": /\s*,\s*/,
  ";": /\s*;\s*/,
};

function parseLines(text: string, delimiter: BulkDelimiter): ParsedResult {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const cards: ParsedCard[] = [];
  let invalidRows = 0;

  for (const line of lines) {
    const parts =
      delimiter === "\t"
        ? autoSplit(line)
        : line
            .split(DELIMITER_PATTERN[delimiter as Exclude<BulkDelimiter, "\t">])
            .map((p) => p.trim());

    const part0 = parts[0]?.trim() || "";
    const part1 = parts[1]?.trim() || "";
    const part2 = parts[2]?.trim() || "";
    const part3 = parts[3]?.trim() || "";

    // 4 columns: kanji | kana | meaning | example
    if (parts.length >= 4 && part0 && part1 && part2) {
      cards.push({ kanji: part0, kana: part1, meaning: part2, example: part3 });
      continue;
    }

    // 3 columns: kana | meaning | example (kanji empty)
    if (parts.length >= 3 && part0 && part1) {
      cards.push({ kanji: "", kana: part0, meaning: part1, example: part2 });
      continue;
    }

    invalidRows++;
  }

  return { cards, totalRows: lines.length, invalidRows };
}

function autoSplit(line: string): string[] {
  if (line.includes("\t")) return line.split("\t").map((p) => p.trim());
  if (/\s{2,}/.test(line)) return line.split(/\s{2,}/).map((p) => p.trim());
  if (/\|/.test(line)) return line.split(/\s*\|\s*/).map((p) => p.trim());
  if (/,/.test(line)) return line.split(/\s*,\s*/).map((p) => p.trim());
  if (/;/.test(line)) return line.split(/\s*;\s*/).map((p) => p.trim());
  return line.split(/\s{2,}/).map((p) => p.trim());
}

function detectDelimiter(text: string): BulkDelimiter {
  const sample = text.split("\n").slice(0, 10).join("\n");
  if (/\t/.test(sample)) return "\t";
  if (/\s{2,}/.test(sample)) return " ";
  if (/\|/.test(sample)) return "|";
  if (/,/.test(sample)) return ",";
  if (/;/.test(sample)) return ";";
  return " ";
}

function BulkImportModal({ onClose, onImport, currentCards }: BulkImportModalProps) {
  const [text, setText] = useState("");
  const [delimiter, setDelimiter] = useState<BulkDelimiter>("\t");
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleTextChange = (val: string) => {
    setText(val);
    setParsedResult(null);
    setImportError(null);
    if (val.trim()) {
      const detected = detectDelimiter(val);
      setDelimiter(detected);
    }
  };

  const handlePreview = () => {
    const result = parseLines(text, delimiter);
    setParsedResult(result);
    if (result.invalidRows > 0) {
      setImportError(`${result.invalidRows} row(s) could not be parsed and will be skipped.`);
    } else {
      setImportError(null);
    }
  };

  const handleImport = async () => {
    if (!parsedResult || parsedResult.cards.length === 0) return;
    setImporting(true);
    try {
      await onImport(parsedResult.cards);
      onClose();
    } catch {
      setImportError("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const alreadyExists = (kana: string, meaning: string) =>
    editCards.some(
      (c) =>
        (c.kana || "").trim().toLowerCase() === kana.trim().toLowerCase() &&
        ((c as { meaning?: string }).meaning || c.backText || "").trim().toLowerCase() ===
          meaning.trim().toLowerCase(),
    );

  const newCount = parsedResult
    ? parsedResult.cards.filter((p) => !alreadyExists(p.kana, p.meaning)).length
    : 0;
  const dupCount = parsedResult
    ? parsedResult.cards.filter((p) => alreadyExists(p.kana, p.meaning)).length
    : 0;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full overflow-hidden"
        style={{ maxWidth: 760, maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-hero text-white flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Bulk Import Flashcards</h2>
              <p className="text-xs text-muted-foreground">
                Paste vocabulary from PDFs, websites, Quizlet, Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 130px)" }}>
          <div className="p-5 space-y-4">
            {/* Delimiter selector */}
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-2 tracking-wide">
                Separator
              </label>
              <div className="flex gap-2 flex-wrap">
                {DELIMITER_CONFIGS.map(({ key, label, hint }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setDelimiter(key);
                      setParsedResult(null);
                    }}
                    title={hint}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      delimiter === key
                        ? "bg-gradient-hero text-white border-transparent shadow"
                        : "bg-slate-50 dark:bg-slate-800 text-muted-foreground border-slate-200 dark:border-slate-700 hover:border-primary/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {delimiter === "\t" && (
                <p className="mt-1.5 text-[11px] text-primary font-medium">
                  Auto-detect: TAB, multiple spaces, pipe, comma, or semicolon
                </p>
              )}
            </div>

            {/* Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                  Flashcard data
                </label>
                {text.trim() && (
                  <span className="text-[11px] text-muted-foreground">
                    Detected:{" "}
                    <span className="font-semibold text-primary">
                      {delimiter === "\t"
                        ? "Auto-detect"
                        : DELIMITER_CONFIGS.find((d) => d.key === delimiter)?.label}
                    </span>
                  </span>
                )}
              </div>
              <textarea
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={`Paste your vocabulary list here, one card per line.\n\nExamples of supported formats:\n\n# 4 columns: Kanji | Kana | Meaning | Example\n学生    がくせい    học sinh    わたしは学生です。\n\n# 3 columns: Kana | Meaning | Example (no Kanji)\n食べる    たべる    ăn    ごはんを食べる。\n飲む    のむ    uống    水を飲みます。\n\n# Pipe format: Kanji|Kana|Meaning|Example\n|こんにちは|xin chào|こんにちは。\n食べる|たべる|ăn|ごはんを食べる。`}
                className="w-full h-52 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            {/* Error / warning */}
            {importError && (
              <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-700">
                {importError}
              </div>
            )}

            {/* Preview button */}
            <button
              onClick={handlePreview}
              disabled={!text.trim()}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary transition disabled:opacity-40"
            >
              Preview parsed cards
            </button>

            {/* Stats bar */}
            {parsedResult !== null && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-muted-foreground">
                    Total:{" "}
                    <span className="font-bold text-foreground">{parsedResult.totalRows}</span>
                  </span>
                </div>
                <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-muted-foreground">
                    Valid:{" "}
                    <span className="font-bold text-green-600">{parsedResult.cards.length}</span>
                  </span>
                </div>
                <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs text-muted-foreground">
                    Invalid:{" "}
                    <span className="font-bold text-red-500">{parsedResult.invalidRows}</span>
                  </span>
                </div>
                {dupCount > 0 && (
                  <>
                    <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-xs text-muted-foreground">
                        Duplicates in set:{" "}
                        <span className="font-bold text-amber-600">{dupCount}</span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Preview table */}
            {parsedResult !== null && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-foreground">
                    Preview — {parsedResult.cards.length} card
                    {parsedResult.cards.length !== 1 ? "s" : ""} to import
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                      <tr className="text-[10px] uppercase text-muted-foreground font-bold">
                        <th className="px-3 py-2 text-left w-8">#</th>
                        <th className="px-3 py-2 text-left min-w-[120px]">Kanji</th>
                        <th className="px-3 py-2 text-left min-w-[120px]">Hiragana/Kana</th>
                        <th className="px-3 py-2 text-left min-w-[120px]">Meaning</th>
                        <th className="px-3 py-2 text-left">Example</th>
                        <th className="px-3 py-2 text-left w-16">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedResult.cards.map((card, i) => {
                        const isDup = alreadyExists(card.kana, card.meaning);
                        return (
                          <tr
                            key={i}
                            className={`border-t border-slate-100 dark:border-slate-800 ${
                              isDup ? "opacity-50 bg-amber-50/30 dark:bg-amber-950/10" : ""
                            }`}
                          >
                            <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                            <td className="px-3 py-2 font-semibold text-foreground leading-relaxed">
                              {card.kanji || "—"}
                            </td>
                            <td className="px-3 py-2 text-foreground leading-relaxed">
                              {card.kana}
                            </td>
                            <td className="px-3 py-2 text-foreground leading-relaxed">
                              {card.meaning}
                            </td>
                            <td className="px-3 py-2 italic text-muted-foreground leading-relaxed">
                              {card.example || "—"}
                            </td>
                            <td className="px-3 py-2">
                              {isDup ? (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded-full">
                                  Duplicate
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-950 px-1.5 py-0.5 rounded-full">
                                  New
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {parsedResult !== null && (
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {newCount > 0
                  ? `${newCount} new card${newCount !== 1 ? "s" : ""} will be added to the set.`
                  : "No new cards to add."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setParsedResult(null);
                    setText("");
                    setImportError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-muted-foreground hover:bg-slate-200 transition"
                >
                  Clear
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || newCount === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition disabled:opacity-40"
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {importing
                    ? "Importing..."
                    : `Import ${newCount} card${newCount !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function TeacherFlashcardsPage() {
  // ── Data state ───────────────────────────────────────────────────────────────
  const [sets, setSets] = useState<FlashcardSetResponse[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [setsError, setSetsError] = useState<string | null>(null);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [page, setPage] = useState(1);

  // ── Add set modal ───────────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addLevel, setAddLevel] = useState("N5");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ── View set modal ──────────────────────────────────────────────────────────
  const [viewing, setViewing] = useState<FlashcardSetDetailResponse | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // ── Edit set modal ──────────────────────────────────────────────────────────
  const [editSetId, setEditSetId] = useState<string | null>(null);
  const [editSet, setEditSet] = useState<FlashcardSetDetailResponse | null>(null);
  const [editCards, setEditCards] = useState<FlashcardCardResponse[]>([]);
  const [editSetInfo, setEditSetInfo] = useState({ title: "", description: "", level: "N5" });
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Card forms ─────────────────────────────────────────────────────────────
  const [showAddCard, setShowAddCard] = useState(false);
  const [addCardForm, setAddCardForm] = useState({ kanji: "", kana: "", meaning: "", example: "" });
  const [addingCard, setAddingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardCardResponse | null>(null);
  const [editCardForm, setEditCardForm] = useState({
    kanji: "",
    kana: "",
    meaning: "",
    example: "",
  });
  const [savingCard, setSavingCard] = useState(false);
  const [deletingCard, setDeletingCard] = useState<FlashcardCardResponse | null>(null);
  const [deletingCardLoading, setDeletingCardLoading] = useState(false);

  // ── Bulk import modal ──────────────────────────────────────────────────────────
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkDelimiter, setBulkDelimiter] = useState<"\t" | "|" | "," | ";">("\t");
  const [bulkPreview, setBulkPreview] = useState<
    { kanji: string; kana: string; meaning: string; example: string }[] | null
  >(null);
  const [bulkImporting, setBulkImporting] = useState(false);

  // ── Delete set ──────────────────────────────────────────────────────────────
  const [deleting, setDeleting] = useState<FlashcardSetResponse | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // ── Submit set ──────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState<Set<string>>(new Set());

  // ── Toasts ─────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToasts((prev) => [...prev, { message, type }]);
    setTimeout(() => setToasts((prev) => prev.slice(1)), 3000);
  }, []);

  // ── Load sets on mount ─────────────────────────────────────────────────────
  const loadSets = useCallback(async () => {
    setLoadingSets(true);
    setSetsError(null);
    try {
      const data = await teacherFlashcardApi.getFlashcardSets();
      setSets(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load flashcard sets.";
      setSetsError(msg);
      showToast(msg, "error");
    } finally {
      setLoadingSets(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSets();
  }, [loadSets]);

  // ── Reset page on filter change ─────────────────────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [search, levelFilter]);

  // ── Filtered + paginated sets ────────────────────────────────────────────────
  const filtered = sets.filter((s) => {
    const mLvl = levelFilter === "All" || s.level === levelFilter;
    const mSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    return mLvl && mSearch;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalCards = sets.reduce((sum, s) => sum + (s.cardCount ?? 0), 0);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  // Add set
  const handleAddSet = async () => {
    if (!addName.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const payload: FlashcardSetCreateRequest = {
        title: addName.trim(),
        description: addDesc.trim() || undefined,
        level: addLevel || undefined,
      };
      const created = await teacherFlashcardApi.createFlashcardSet(payload);
      setSets((prev) => [created, ...prev]);
      setAddName("");
      setAddDesc("");
      setAddLevel("N5");
      setShowAdd(false);
      showToast("Flashcard set created successfully!", "success");
      // Open edit modal for the new set
      openEditSet(created.id);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create flashcard set.";
      setAddError(msg);
      showToast(msg, "error");
    } finally {
      setAdding(false);
    }
  };

  // Open edit set
  const openEditSet = async (setId: string) => {
    setEditSetId(setId);
    setEditLoading(true);
    setEditError(null);
    try {
      const detail = await teacherFlashcardApi.getFlashcardSetDetail(setId);
      setEditSet(detail);
      setEditCards(detail.cards ?? []);
      setEditSetInfo({
        title: detail.title,
        description: detail.description ?? "",
        level: detail.level ?? "N5",
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load flashcard set.";
      showToast(msg, "error");
      setEditSetId(null);
    } finally {
      setEditLoading(false);
    }
  };

  // Save edit set
  const handleSaveEditSet = async () => {
    if (!editSetId || !editSetInfo.title.trim()) return;
    setEditSaving(true);
    setEditError(null);
    try {
      // Auto-add draft card if form is filled but not added yet
      if (addCardForm.kana.trim() && addCardForm.meaning.trim()) {
        console.log("[Flashcards] Auto-adding draft card before save:", addCardForm);
        const draftPayload: FlashcardCardCreateRequest = {
          frontText: addCardForm.kanji.trim() || addCardForm.kana.trim(),
          kana: addCardForm.kana.trim(),
          meaning: addCardForm.meaning.trim(),
          backText: addCardForm.meaning.trim(),
          example: addCardForm.example.trim() || undefined,
          hint: "",
        };
        const draftCreated = await teacherFlashcardApi.createCard(editSetId, draftPayload);
        setEditCards((prev) => [...prev, draftCreated]);
        setAddCardForm({ kanji: "", kana: "", meaning: "", example: "" });
        setShowAddCard(false);
      }

      console.log("[Flashcards] cards before save:", editCards);
      const payload: FlashcardSetUpdateRequest = {
        title: editSetInfo.title.trim(),
        description: editSetInfo.description.trim() || undefined,
        level: editSetInfo.level || undefined,
      };
      console.log("[Flashcards] payload:", payload);
      console.log("[Flashcards] editCards count:", editCards.length);

      const updated = await teacherFlashcardApi.updateFlashcardSet(editSetId, payload);
      console.log("[Flashcards] updated set:", updated);

      // Update local sets list
      setSets((prev) => prev.map((s) => (s.id === editSetId ? updated : s)));

      // Close modal
      closeEditSet();

      // Refetch the entire list to get accurate cardCount from backend
      await loadSets();

      showToast("Flashcard set saved successfully!", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save flashcard set.";
      setEditError(msg);
      showToast(msg, "error");
    } finally {
      setEditSaving(false);
    }
  };

  // Add card
  const handleAddCard = async () => {
    if (!addCardForm.kana.trim() || !addCardForm.meaning.trim() || !editSetId) return;
    setAddingCard(true);
    try {
      const payload: FlashcardCardCreateRequest = {
        frontText: addCardForm.kanji.trim() || addCardForm.kana.trim(),
        kana: addCardForm.kana.trim(),
        meaning: addCardForm.meaning.trim(),
        backText: addCardForm.meaning.trim(),
        example: addCardForm.example.trim() || undefined,
        hint: "",
      };
      console.log("[Flashcards] Adding card with payload:", payload);
      const created = await teacherFlashcardApi.createCard(editSetId, payload);
      console.log("[Flashcards] Card created:", created);
      setEditCards((prev) => [...prev, created]);
      setAddCardForm({ kanji: "", kana: "", meaning: "", example: "" });
      setShowAddCard(false);
      showToast("Card added successfully!", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to add card.";
      showToast(msg, "error");
    } finally {
      setAddingCard(false);
    }
  };

  // Bulk import cards
  const handleBulkImport = async (
    parsedCards: { kanji: string; kana: string; meaning: string; example: string }[],
  ) => {
    if (!editSetId) return;
    const existing = editCards.map(
      (c) =>
        `${(c.kana || "").trim().toLowerCase()}||${(c.meaning || c.backText || "").trim().toLowerCase()}`,
    );
    const seen = new Set<string>(existing);
    const toCreate = parsedCards.filter((p) => {
      const key = `${p.kana.trim().toLowerCase()}||${p.meaning.trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (toCreate.length === 0) {
      showToast("No new cards to import (all duplicates).", "error");
      return;
    }

    setBulkImporting(true);
    let imported = 0;
    const failed = 0;

    try {
      for (const card of toCreate) {
        const payload: FlashcardCardCreateRequest = {
          frontText: card.kanji.trim() || card.kana.trim(),
          kana: card.kana.trim(),
          meaning: card.meaning.trim(),
          backText: card.meaning.trim(),
          example: card.example.trim() || undefined,
          hint: "",
        };
        const created = await teacherFlashcardApi.createCard(editSetId, payload);
        setEditCards((prev) => [...prev, created]);
        imported++;
      }
      showToast(
        `Imported ${imported} card${imported !== 1 ? "s" : ""} successfully!${failed > 0 ? ` ${failed} failed.` : ""}`,
        "success",
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Bulk import failed.";
      showToast(msg, "error");
    } finally {
      setBulkImporting(false);
    }
  };

  // Open edit card
  const openEditCard = (card: FlashcardCardResponse) => {
    setEditingCard(card);
    setEditCardForm({
      kanji: card.frontText || "",
      kana: card.kana || "",
      meaning: (card as { meaning?: string }).meaning || card.backText || "",
      example: card.example || "",
    });
    setShowAddCard(false);
  };

  // Save edit card
  const handleSaveEditCard = async () => {
    if (!editingCard || !editCardForm.kana.trim() || !editCardForm.meaning.trim()) return;
    setSavingCard(true);
    try {
      const payload: FlashcardCardUpdateRequest = {
        frontText: editCardForm.kanji.trim() || editCardForm.kana.trim(),
        kana: editCardForm.kana.trim(),
        meaning: editCardForm.meaning.trim(),
        backText: editCardForm.meaning.trim(),
        example: editCardForm.example.trim() || undefined,
        hint: "",
      };
      const updated = await teacherFlashcardApi.updateCard(editingCard.id, payload);
      setEditCards((prev) => prev.map((c) => (c.id === editingCard.id ? updated : c)));
      setEditingCard(null);
      showToast("Card updated!", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update card.";
      showToast(msg, "error");
    } finally {
      setSavingCard(false);
    }
  };

  // Delete card
  const handleDeleteCard = async () => {
    if (!deletingCard) return;
    setDeletingCardLoading(true);
    try {
      await teacherFlashcardApi.deleteCard(deletingCard.id);
      setEditCards((prev) => prev.filter((c) => c.id !== deletingCard.id));
      setDeletingCard(null);
      showToast("Card deleted!", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete card.";
      showToast(msg, "error");
    } finally {
      setDeletingCardLoading(false);
    }
  };

  // Delete set
  const handleDeleteSet = async () => {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await teacherFlashcardApi.deleteFlashcardSet(deleting.id);
      setSets((prev) => prev.filter((s) => s.id !== deleting.id));
      setDeleting(null);
      showToast("Flashcard set deleted!", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete flashcard set.";
      showToast(msg, "error");
    } finally {
      setDeletingLoading(false);
    }
  };

  // Submit set for review
  const handleSubmitSet = async (setId: string) => {
    setSubmitting((prev) => new Set([...prev, setId]));
    try {
      const updated = await teacherFlashcardApi.submitFlashcardSet(setId);
      setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)));
      showToast("Flashcard set submitted for review!", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to submit flashcard set.";
      showToast(msg, "error");
    } finally {
      setSubmitting((prev) => {
        const next = new Set(prev);
        next.delete(setId);
        return next;
      });
    }
  };

  // Open view modal
  const openView = async (setId: string) => {
    setViewLoading(true);
    try {
      const detail = await teacherFlashcardApi.getFlashcardSetDetail(setId);
      setViewing(detail);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load flashcard set.";
      showToast(msg, "error");
    } finally {
      setViewLoading(false);
    }
  };

  const closeEditSet = () => {
    setEditSetId(null);
    setEditSet(null);
    setEditCards([]);
    setShowAddCard(false);
    setEditingCard(null);
    setEditError(null);
  };

  // ════════════════════════════════════════════════════════════════════════════
  //  MAIN PAGE
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <Toast toasts={toasts} />

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Flashcard Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sets.length} sets · {totalCards} cards
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add flashcard set
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Flashcard sets", value: sets.length, icon: Layers, color: "text-blue-500" },
          { label: "Total cards", value: totalCards, icon: BookText, color: "text-green-500" },
          {
            label: "Pending review",
            value: sets.filter((s) => s.status === "PENDING").length,
            icon: Star,
            color: "text-yellow-500",
          },
          {
            label: "Approved",
            value: sets.filter((s) => s.status === "APPROVED").length,
            icon: Tag,
            color: "text-purple-500",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-700 ${stat.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-display font-black text-xl leading-none ${stat.color}`}>
                    {stat.label === "Levels" ? stat.value : stat.value.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-64 max-w-80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search flashcard sets..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
          {JLPT_LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setLevelFilter(lvl);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                levelFilter === lvl
                  ? "bg-gradient-hero text-white shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading / Error / Empty ─────────────────────────────────── */}
      {loadingSets ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading flashcard sets...</span>
        </div>
      ) : setsError ? (
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <p className="font-semibold text-base text-red-500">{setsError}</p>
          <button
            onClick={loadSets}
            className="mt-3 px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold text-base text-muted-foreground">No flashcard sets found</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-primary underline text-sm">
            + Create your first set
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map((s, i) => {
              const st = statusBadge(s.status);
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 overflow-hidden"
                >
                  <div className="h-1.5 bg-gradient-hero w-full" />
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-gradient-hero text-white font-black text-sm flex items-center justify-center">
                          {i + 1 + (page - 1) * PAGE_SIZE}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-display font-black text-sm text-foreground leading-tight truncate">
                            {s.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(s.level)}`}
                          >
                            {s.level ?? "—"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${st.cls}`}
                          >
                            {st.label}
                          </span>
                        </div>
                        {s.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {s.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookText className="w-3 h-3" />
                            {s.cardCount ?? 0} cards
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openView(s.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      {s.status === "DRAFT" || s.status === "REJECTED" ? (
                        <button
                          onClick={() => openEditSet(s.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-500 text-xs font-bold transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                      ) : (
                        <button
                          disabled
                          title={
                            s.status === "APPROVED"
                              ? "Approved content cannot be modified."
                              : "This content is currently under review."
                          }
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50/60 text-blue-300 text-xs font-bold transition-all opacity-40 cursor-not-allowed"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      {s.status === "DRAFT" || s.status === "REJECTED" ? (
                        <button
                          onClick={() => setDeleting(s)}
                          className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-400 text-xs font-bold transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          disabled
                          title={
                            s.status === "APPROVED"
                              ? "Approved content cannot be modified."
                              : "This content is currently under review."
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-red-50/60 text-red-300 text-xs font-bold transition-all opacity-40 cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <PaginationUI current={page} total={filtered.length} onPage={setPage} />
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          ADD SET MODAL
      ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAdd && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setShowAdd(false);
              setAddName("");
              setAddDesc("");
              setAddLevel("N5");
              setAddError(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5"
              style={{ maxWidth: 480 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-lg text-foreground">
                  Create new flashcard set
                </h2>
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setAddName("");
                    setAddDesc("");
                    setAddLevel("N5");
                    setAddError(null);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {addError && (
                <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-semibold">
                  {addError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                    Set name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Greetings N5"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={addDesc}
                    onChange={(e) => setAddDesc(e.target.value)}
                    placeholder="Short description for this flashcard set..."
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">
                    Level
                  </label>
                  <select
                    value={addLevel}
                    onChange={(e) => setAddLevel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {["N5", "N4", "N3", "N2", "N1"].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setAddName("");
                    setAddDesc("");
                    setAddLevel("N5");
                    setAddError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSet}
                  disabled={!addName.trim() || adding}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition flex items-center justify-center gap-2"
                >
                  {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                  {adding ? "Creating..." : "Create & manage cards"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════════
          DELETE SET MODAL
      ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deleting && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleting(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl text-center border border-slate-200 dark:border-slate-700"
              style={{ maxWidth: 420 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/20 grid place-items-center mx-auto mb-3">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="font-display font-black text-lg mb-1">Delete flashcard set?</h2>
              <p className="text-sm text-muted-foreground mb-1">
                <strong className="text-foreground">{deleting.title}</strong> will be permanently
                deleted.
              </p>
              <p className="text-xs text-red-400 mb-5">
                Includes {deleting.cardCount ?? 0} cards inside.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleting(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSet}
                  disabled={deletingLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow hover:bg-red-600 transition flex items-center justify-center gap-2"
                >
                  {deletingLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {deletingLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════════
          VIEW SET MODAL — READ-ONLY
      ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {viewing !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewing(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
              style={{ maxWidth: 800, maxHeight: "90vh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="font-display font-black text-lg text-foreground">
                      {viewing.title}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${levelBadge(viewing.level)}`}
                    >
                      {viewing.level ?? "—"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-black border ${statusBadge(viewing.status).cls}`}
                    >
                      {statusBadge(viewing.status).label}
                    </span>
                  </div>
                  {viewing.description && (
                    <p className="text-sm text-muted-foreground">{viewing.description}</p>
                  )}
                  {viewing.status === "REJECTED" && (
                    <RejectReasonBox reason={viewing.rejectReason} className="mt-2" />
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(viewing.cards ?? []).length} cards · Created{" "}
                    {new Date(viewing.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-muted-foreground font-semibold border border-slate-200 dark:border-slate-700">
                    <EyeOff className="w-3 h-3 inline mr-1" />
                    Read-only
                  </div>
                  <button
                    onClick={() => setViewing(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card list — read only */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1">
                {viewLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground text-sm">Loading cards...</span>
                  </div>
                ) : (viewing.cards ?? []).length === 0 ? (
                  <div className="py-20 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
                    <p className="font-semibold text-muted-foreground">No cards yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click Edit (✏️) to manage flashcards
                    </p>
                  </div>
                ) : (
                  viewing.cards.map((card, i) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden hover:border-primary/30 transition"
                    >
                      <div className="h-1 bg-gradient-hero w-full" />
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-lg bg-gradient-hero text-white font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                              <span className="font-display font-black text-xl text-foreground">
                                {card.frontText}
                              </span>
                              {(card as { meaning?: string }).meaning && (
                                <span className="text-sm font-semibold text-blue-600">
                                  ({(card as { meaning?: string }).meaning})
                                </span>
                              )}
                              {card.kana && card.kana !== card.frontText && (
                                <span className="text-sm text-muted-foreground">{card.kana}</span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakJapanese(card.frontText || card.kana || "");
                                }}
                                title="Play pronunciation"
                                className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-500 flex items-center justify-center transition flex-shrink-0"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-sm font-semibold text-foreground mb-2">
                              {(card as { meaning?: string }).meaning || card.backText}
                            </div>
                            {card.example && (
                              <div className="text-xs text-muted-foreground italic mb-2">
                                "{card.example}"
                              </div>
                            )}
                          </div>
                          <FlipHorizontal className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {(viewing.cards ?? []).length} cards
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setViewing(null);
                      openEditSet(viewing.id);
                    }}
                    disabled={viewing.status === "APPROVED" || viewing.status === "PENDING"}
                    title={
                      viewing.status === "APPROVED"
                        ? "Approved content cannot be modified."
                        : viewing.status === "PENDING"
                          ? "This content is currently under review."
                          : "Edit"
                    }
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      viewing.status === "APPROVED" || viewing.status === "PENDING"
                        ? "opacity-40 cursor-not-allowed bg-blue-50/60 text-blue-300"
                        : "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 text-blue-500"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {viewing.status === "DRAFT" || viewing.status === "REJECTED" ? (
                    <button
                      onClick={() => {
                        setViewing(null);
                        handleSubmitSet(viewing.id);
                      }}
                      disabled={submitting.has(viewing.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-50 dark:bg-green-950/30 hover:bg-green-100 text-green-600 text-sm font-bold transition-all disabled:opacity-50"
                    >
                      {submitting.has(viewing.id) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {viewing.status === "REJECTED" ? "Resubmit for review" : "Submit for review"}
                    </button>
                  ) : null}
                  <button
                    onClick={() => setViewing(null)}
                    className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════════
          EDIT SET MODAL — FULL CARD MANAGEMENT
      ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editSetId !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeEditSet}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
              style={{ maxWidth: 880, maxHeight: "92vh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded bg-gradient-hero text-white flex items-center justify-center text-xs font-black">
                      <ListChecks className="w-3 h-3" />
                    </div>
                    <h2 className="font-display font-black text-lg text-foreground">
                      Manage flashcards
                    </h2>
                  </div>
                  {editSet && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {editSetInfo.title || editSet.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(editSetInfo.level)}`}
                      >
                        {editSetInfo.level}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${statusBadge(editSet.status).cls}`}
                      >
                        {statusBadge(editSet.status).label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {editCards.length} cards
                      </span>
                      {editSet.status === "REJECTED" && (
                        <RejectReasonBox reason={editSet.rejectReason} className="w-full mt-2" />
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={closeEditSet}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Loading flashcard set...</span>
                </div>
              ) : (
                <>
                  {editError && (
                    <div className="mb-4 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-semibold flex-shrink-0">
                      {editError}
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {/* ── Set info mini-form ── */}
                    <div className="flex items-end gap-3 flex-shrink-0">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                          Set name
                        </label>
                        <input
                          value={editSetInfo.title}
                          onChange={(e) => setEditSetInfo((i) => ({ ...i, title: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                          Level
                        </label>
                        <select
                          value={editSetInfo.level}
                          onChange={(e) => setEditSetInfo((i) => ({ ...i, level: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          {["N5", "N4", "N3", "N2", "N1"].map((l) => (
                            <option key={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">
                          Description
                        </label>
                        <input
                          value={editSetInfo.description}
                          onChange={(e) =>
                            setEditSetInfo((i) => ({ ...i, description: e.target.value }))
                          }
                          placeholder="Short description..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <button
                        onClick={() => setShowAddCard(true)}
                        disabled={editSaving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition flex-shrink-0"
                      >
                        <Plus className="w-4 h-4" /> Add card
                      </button>
                      <button
                        onClick={() => setShowBulkImport(true)}
                        disabled={editSaving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex-shrink-0"
                        title="Import multiple flashcards at once"
                      >
                        <Upload className="w-4 h-4" /> Import Multiple
                      </button>
                    </div>

                    {/* ── Add/Edit card form ── */}
                    {(showAddCard || editingCard) && (
                      <div className="flex-shrink-0">
                        <CardForm
                          mode={editingCard ? "edit" : "add"}
                          onSave={editingCard ? handleSaveEditCard : handleAddCard}
                          onCancel={() => {
                            setShowAddCard(false);
                            setEditingCard(null);
                            setAddCardForm({ kanji: "", kana: "", meaning: "", example: "" });
                            setEditCardForm({ kanji: "", kana: "", meaning: "", example: "" });
                          }}
                          form={editingCard ? editCardForm : addCardForm}
                          setForm={editingCard ? setEditCardForm : setAddCardForm}
                        />
                      </div>
                    )}

                    {/* ── Card list ── */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
                      {editCards.length === 0 && !showAddCard && !editingCard ? (
                        <div className="py-16 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          <Layers className="w-10 h-10 mx-auto mb-2 text-muted-foreground/20" />
                          <p className="font-semibold text-muted-foreground text-sm mb-1">
                            No cards yet in this set
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Click "Add card" to get started
                          </p>
                          <button
                            onClick={() => setShowAddCard(true)}
                            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition"
                          >
                            <Plus className="w-4 h-4" /> Add first flashcard
                          </button>
                        </div>
                      ) : (
                        editCards.map((card, i) => (
                          <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition group"
                          >
                            <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0 cursor-grab" />
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-foreground">
                                  {card.frontText || card.kana}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakJapanese(card.frontText || card.kana || "");
                                  }}
                                  title="Play pronunciation"
                                  className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-500 flex items-center justify-center transition flex-shrink-0"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-xs text-muted-foreground">→</span>
                                <span className="text-xs font-semibold text-foreground">
                                  {(card as { meaning?: string }).meaning || card.backText}
                                </span>
                              </div>
                              {card.example && (
                                <div className="text-[9px] text-muted-foreground italic truncate max-w-[200px] mt-0.5">
                                  "{card.example}"
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => openEditCard(card)}
                                className="w-8 h-8 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center justify-center text-blue-400 hover:text-blue-600 transition"
                                title="Edit card"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingCard(card)}
                                className="w-8 h-8 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center text-red-400 hover:text-red-500 transition"
                                title="Delete card"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {editCards.length > 0 ? `${editCards.length} cards` : "No cards"}
                    </span>
                    <div className="flex gap-2">
                      {editSet?.status === "DRAFT" && (
                        <button
                          onClick={() => handleSubmitSet(editSetId!)}
                          disabled={submitting.has(editSetId!)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-950/30 hover:bg-green-100 text-green-600 text-sm font-bold transition-all disabled:opacity-50"
                        >
                          {submitting.has(editSetId!) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Submit for review
                        </button>
                      )}
                      {editSet?.status === "REJECTED" && (
                        <button
                          onClick={() => {
                            const nextTitle = editSetInfo.title.trim();
                            if (!nextTitle || !editSetId) {
                              showToast("Please enter a set name before resubmitting.", "error");
                              return;
                            }
                            if (editCards.length === 0) {
                              showToast(
                                "Please add at least one card before resubmitting.",
                                "error",
                              );
                              return;
                            }
                            handleSaveEditSet().then(() => {
                              if (editSetId) handleSubmitSet(editSetId);
                            });
                          }}
                          disabled={submitting.has(editSetId!)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {submitting.has(editSetId!) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Resubmit for Review
                        </button>
                      )}
                      <button
                        onClick={closeEditSet}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEditSet}
                        disabled={editSaving || !editSetInfo.title.trim()}
                        className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow flex items-center gap-2 hover:opacity-90 transition disabled:opacity-40"
                      >
                        {editSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" /> Save all
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════════
          BULK IMPORT MODAL
      ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showBulkImport && (
          <BulkImportModal
            onClose={() => {
              setShowBulkImport(false);
              setBulkText("");
              setBulkPreview(null);
            }}
            onImport={handleBulkImport}
            currentCards={editCards}
          />
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════════
          DELETE CARD CONFIRM MODAL
      ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deletingCard !== null && (
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeletingCard(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl text-center border border-slate-200 dark:border-slate-700"
              style={{ maxWidth: 400 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/20 grid place-items-center mx-auto mb-3">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="font-display font-black text-lg mb-1">Delete card?</h2>
              <p className="text-sm text-muted-foreground mb-1">
                Are you sure you want to delete{" "}
                <strong className="text-foreground">"{deletingCard.frontText}"</strong> (
                {deletingCard.backText})?
              </p>
              <p className="text-xs text-red-400 mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingCard(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCard}
                  disabled={deletingCardLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow hover:bg-red-600 transition flex items-center justify-center gap-2"
                >
                  {deletingCardLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {deletingCardLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
