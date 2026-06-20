import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import {
  ChevronRight,
  CheckCircle,
  Loader2,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  FileText,
  Headphones,
  Upload,
  FileSpreadsheet,
  Trash2,
  Download,
  HelpCircle,
} from "lucide-react";
import {
  type JLPTLevel,
  type ExamStatus,
  DEFAULT_EXAM_CONFIG,
  addExam,
} from "@/mocks/jlptExamMock";

export const Route = createFileRoute("/admin/jlpt-exam/$level/create")({
  component: CreateExamPage,
});

type JLPTLevelUpper = "N5" | "N4" | "N3" | "N2" | "N1";

const VALID_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

interface ParsedQuestion {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  audioFileName?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  missingColumns: string[];
}

const SECTION_COLORS: Record<string, { bg: string; text: string }> = {
  Vocabulary: { bg: "bg-[oklch(0.62_0.18_270)]/10", text: "text-[oklch(0.62_0.18_270)]" },
  Grammar: { bg: "bg-[oklch(0.72_0.15_230)]/10", text: "text-[oklch(0.72_0.15_230)]" },
  Reading: { bg: "bg-[var(--status-pending)]/10", text: "text-[var(--status-pending)]" },
  Listening: { bg: "bg-[oklch(0.6_0.22_25)]/10", text: "text-[oklch(0.6_0.22_25)]" },
};

const REQUIRED_COLUMNS = ["TYPE", "QUESTION", "ANSWERA", "ANSWERB", "ANSWERC", "ANSWERD", "CORRECTANSWER"];

function JLPTBadge({ level }: { level: JLPTLevel }) {
  const colors: Record<string, string> = {
    N5: "bg-[oklch(0.62_0.18_270)]/12 text-[oklch(0.62_0.18_270)] border-[oklch(0.62_0.18_270)]/20",
    N4: "bg-[oklch(0.72_0.15_230)]/12 text-[oklch(0.72_0.15_230)] border-[oklch(0.72_0.15_230)]/20",
    N3: "bg-[var(--status-pending)]/12 text-[var(--status-pending)] border-[var(--status-pending)]/20",
    N2: "bg-[oklch(0.6_0.22_25)]/12 text-[oklch(0.6_0.22_25)] border-[oklch(0.6_0.22_25)]/20",
    N1: "bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] border-[var(--status-rejected)]/20",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors[level] || colors["N5"]}`}>
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: ExamStatus }) {
  const configs: Record<ExamStatus, { label: string; color: string; bg: string }> = {
    Active: { label: "Active", color: "text-[var(--status-active)]", bg: "bg-[var(--status-active)]" },
    Draft: { label: "Draft", color: "text-[var(--status-pending)]", bg: "bg-[var(--status-pending)]" },
    Archived: { label: "Archived", color: "text-[var(--status-suspended)]", bg: "bg-[var(--status-suspended)]" },
  };
  const cfg = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
      {cfg.label}
    </span>
  );
}

function QuestionPreviewRow({
  question,
  index,
  onDelete,
}: {
  question: ParsedQuestion;
  index: number;
  onDelete: () => void;
}) {
  const colors = SECTION_COLORS[question.type] || SECTION_COLORS.Vocabulary;
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition">
      <td className="py-3 px-3 text-sm text-muted-col w-12">{index + 1}</td>
      <td className="py-3 px-3">
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors.bg} ${colors.text}`}>
          {question.type}
        </span>
      </td>
      <td className="py-3 px-3 text-sm text-primary-col max-w-md truncate">{question.question}</td>
      <td className="py-3 px-3 text-sm">
        <span className="font-medium text-[var(--status-active)]">
          {optionLabels[question.correctAnswer] || "-"}
        </span>
      </td>
      <td className="py-3 px-3 w-16">
        {question.audioFileName ? (
          <span className="text-xs text-[var(--status-active)] flex items-center gap-1">
            <Headphones className="w-3 h-3" />
          </span>
        ) : question.type === "Listening" ? (
          <span className="text-xs text-[var(--status-pending)]">-</span>
        ) : null}
      </td>
      <td className="py-3 px-3 w-16">
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function ExcelTemplateDownload() {
  const handleDownload = () => {
    const template = [
      {
        TYPE: "Vocabulary",
        QUESTION: "「山」の読み方正确的是？",
        ANSWERA: "やま",
        ANSWERB: "さめ",
        ANSWERC: "たけ",
        ANSWERD: "たかさ",
        CORRECTANSWER: "A",
        EXPLANATION: "「山」は「やま」と読みます",
        AUDIOFILENAME: "",
      },
      {
        TYPE: "Grammar",
        QUESTION: "「これ」は何读みますか？",
        ANSWERA: "これ",
        ANSWERB: "それ",
        ANSWERC: "あれ",
        ANSWERD: "どれ",
        CORRECTANSWER: "A",
        EXPLANATION: "「これ」は「これ」と読みます",
        AUDIOFILENAME: "",
      },
      {
        TYPE: "Listening",
        QUESTION: "Listen and select the correct response",
        ANSWERA: "Good morning",
        ANSWERB: "Good afternoon",
        ANSWERC: "Good evening",
        ANSWERD: "Goodbye",
        CORRECTANSWER: "B",
        EXPLANATION: "The audio contains こんにちは (konnichiwa)",
        AUDIOFILENAME: "greeting_dialogue.mp3",
      },
      {
        TYPE: "Reading",
        QUESTION: "本文の内容と一致するのはどれですか？",
        ANSWERA: "記述1",
        ANSWERB: "記述2",
        ANSWERC: "記述3",
        ANSWERD: "記述4",
        CORRECTANSWER: "B",
        EXPLANATION: "本文の内容と一致するのは記述2です",
        AUDIOFILENAME: "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);

    ws["!cols"] = [
      { wch: 12 },  // TYPE
      { wch: 40 },  // QUESTION
      { wch: 15 },  // ANSWERA
      { wch: 15 },  // ANSWERB
      { wch: 15 },  // ANSWERC
      { wch: 15 },  // ANSWERD
      { wch: 15 },  // CORRECTANSWER
      { wch: 30 },  // EXPLANATION
      { wch: 20 },  // AUDIOFILENAME
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "JLPT_Exam_Questions_Template.xlsx");
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-sm text-secondary-col hover:bg-[var(--border)] transition"
    >
      <Download className="w-4 h-4" />
      Download Template
    </button>
  );
}

function ExcelFormatGuide() {
  return (
    <div className="mt-4 p-4 rounded-lg bg-[var(--accent)] border border-[var(--border)]">
      <div className="flex items-start gap-2 mb-3">
        <HelpCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-primary-col">Excel Format Guide</h4>
          <p className="text-xs text-muted-col">Required columns for import</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="py-2 px-2 text-left font-bold text-secondary-col">Column</th>
              <th className="py-2 px-2 text-left font-bold text-secondary-col">Description</th>
              <th className="py-2 px-2 text-left font-bold text-secondary-col">Example</th>
            </tr>
          </thead>
          <tbody className="text-muted-col">
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 px-2 font-mono">TYPE</td>
              <td className="py-2 px-2">Vocabulary, Grammar, Reading, Listening</td>
              <td className="py-2 px-2 font-mono">Vocabulary</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 px-2 font-mono">QUESTION</td>
              <td className="py-2 px-2">Question text</td>
              <td className="py-2 px-2 font-mono">「山」の読み方は？</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 px-2 font-mono">ANSWERA-D</td>
              <td className="py-2 px-2">Answer options</td>
              <td className="py-2 px-2 font-mono">やま, さめ, たけ, たかさ</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 px-2 font-mono">CORRECTANSWER</td>
              <td className="py-2 px-2">A, B, C, or D</td>
              <td className="py-2 px-2 font-mono">A</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 px-2 font-mono">EXPLANATION</td>
              <td className="py-2 px-2">Answer explanation (optional)</td>
              <td className="py-2 px-2 font-mono">正答えは...</td>
            </tr>
            <tr>
              <td className="py-2 px-2 font-mono">AUDIOFILENAME</td>
              <td className="py-2 px-2">Audio file for Listening (optional)</td>
              <td className="py-2 px-2 font-mono">audio.mp3</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateExamPage() {
  const { level } = Route.useParams();
  const navigate = useNavigate();
  const upperLevel = level.toUpperCase() as JLPTLevelUpper;

  const isValidLevel = VALID_LEVELS.includes(upperLevel as JLPTLevel);
  const defaultConfig = DEFAULT_EXAM_CONFIG[upperLevel as JLPTLevel] || DEFAULT_EXAM_CONFIG.N5;

  const [examName, setExamName] = useState(`JLPT ${upperLevel} Mock Test`);
  const [status, setStatus] = useState<ExamStatus>("Draft");
  const [duration, setDuration] = useState(defaultConfig.duration);

  const [importedQuestions, setImportedQuestions] = useState<ParsedQuestion[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [importStats, setImportStats] = useState<{
    total: number;
    vocabulary: number;
    grammar: number;
    reading: number;
    listening: number;
  } | null>(null);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateColumns = useCallback((headers: string[]): string[] => {
    const missing: string[] = [];
    REQUIRED_COLUMNS.forEach((col) => {
      if (!headers.some((h) => h.toUpperCase() === col)) {
        missing.push(col);
      }
    });
    return missing;
  }, []);

  const parseExcelFile = useCallback((file: File): Promise<{ questions: ParsedQuestion[]; missingColumns: string[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);

          if (jsonData.length === 0) {
            reject(new Error("Excel file is empty"));
            return;
          }

          const headers = Object.keys(jsonData[0]);
          const missing = validateColumns(headers);

          const questions: ParsedQuestion[] = jsonData.map((row, index) => {
            const type = (row["TYPE"] || row["type"] || "Vocabulary") as string;
            const correctAnswerStr = row["CORRECTANSWER"] || row["correctAnswer"] || "A";
            const correctAnswerIndex = ["A", "B", "C", "D"].indexOf(correctAnswerStr.toString().toUpperCase().trim());

            return {
              id: `imported-${Date.now()}-${index}`,
              type,
              question: row["QUESTION"] || row["question"] || "",
              options: [
                row["ANSWERA"] || row["answera"] || "",
                row["ANSWERB"] || row["answerb"] || "",
                row["ANSWERC"] || row["answerc"] || "",
                row["ANSWERD"] || row["answerd"] || "",
              ].filter((o) => o.trim()),
              correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
              explanation: row["EXPLANATION"] || row["explanation"] || undefined,
              audioFileName: row["AUDIOFILENAME"] || row["audioFileName"] || row["audiofilename"] || undefined,
            };
          });

          resolve({ questions, missingColumns: missing });
        } catch (err) {
          reject(new Error("Failed to parse Excel file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  }, [validateColumns]);

  const validateQuestions = useCallback((questions: ParsedQuestion[]): string[] => {
    const errors: string[] = [];
    const validTypes = ["Vocabulary", "Grammar", "Reading", "Listening"];

    questions.forEach((q, i) => {
      if (!q.question.trim()) {
        errors.push(`Row ${i + 2}: Missing question text`);
      }
      if (!validTypes.includes(q.type)) {
        errors.push(`Row ${i + 2}: Invalid TYPE "${q.type}"`);
      }
      if (q.options.length < 2) {
        errors.push(`Row ${i + 2}: Need at least 2 options`);
      }
    });

    return errors;
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);
    setMissingColumns([]);

    try {
      const { questions, missingColumns: missing } = await parseExcelFile(file);

      if (missing.length > 0) {
        setMissingColumns(missing);
        setImportError(`Invalid Excel format. Missing columns: ${missing.join(", ")}`);
        return;
      }

      const errors = validateQuestions(questions);

      if (errors.length > 0) {
        setImportError(errors[0]);
        return;
      }

      setImportedQuestions(questions);

      const stats = {
        total: questions.length,
        vocabulary: questions.filter((q) => q.type.toLowerCase() === "vocabulary").length,
        grammar: questions.filter((q) => q.type.toLowerCase() === "grammar").length,
        reading: questions.filter((q) => q.type.toLowerCase() === "reading").length,
        listening: questions.filter((q) => q.type.toLowerCase() === "listening").length,
      };
      setImportStats(stats);
    } catch (err: any) {
      setImportError(err.message || "Failed to import questions");
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteQuestion = (id: string) => {
    const updated = importedQuestions.filter((q) => q.id !== id);
    setImportedQuestions(updated);
    if (updated.length > 0) {
      setImportStats({
        total: updated.length,
        vocabulary: updated.filter((q) => q.type.toLowerCase() === "vocabulary").length,
        grammar: updated.filter((q) => q.type.toLowerCase() === "grammar").length,
        reading: updated.filter((q) => q.type.toLowerCase() === "reading").length,
        listening: updated.filter((q) => q.type.toLowerCase() === "listening").length,
      });
    } else {
      setImportStats(null);
    }
  };

  const handleClearImport = () => {
    setImportedQuestions([]);
    setImportStats(null);
    setImportError(null);
    setMissingColumns([]);
  };

  const handleSubmit = async () => {
    if (!examName.trim()) {
      setError("Exam name is required");
      return;
    }
    if (importedQuestions.length === 0) {
      setError("Please import at least one question");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const vocabCount = importedQuestions.filter((q) => q.type.toLowerCase() === "vocabulary").length;
      const grammarCount = importedQuestions.filter((q) => q.type.toLowerCase() === "grammar").length;
      const readingCount = importedQuestions.filter((q) => q.type.toLowerCase() === "reading").length;
      const listeningCount = importedQuestions.filter((q) => q.type.toLowerCase() === "listening").length;

      addExam({
        level: upperLevel as JLPTLevel,
        name: examName,
        status,
        vocabularyQuestions: vocabCount,
        grammarQuestions: grammarCount,
        readingQuestions: readingCount,
        listeningQuestions: listeningCount,
        duration,
      });

      setSuccessMessage("Exam created successfully!");

      setTimeout(() => {
        navigate({ to: "/admin/jlpt-exam/$level", params: { level } });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create exam");
    } finally {
      setCreating(false);
    }
  };

  if (!isValidLevel) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="w-16 h-16 text-[var(--status-rejected)]/50 mb-4" />
        <h2 className="text-xl font-bold text-primary-col mb-2">Invalid Level</h2>
        <p className="text-sm text-secondary-col mb-4">The level "{level}" is not a valid JLPT level.</p>
        <Link to="/admin/jlpt-exam" className="px-4 py-2 rounded-xl bg-primary/12 text-primary text-sm font-bold hover:bg-primary/20 transition">
          Back to JLPT Exam Management
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/admin/jlpt-exam" className="text-muted-col hover:text-primary transition">JLPT Exam</Link>
        <ChevronRight className="w-4 h-4 text-muted-col" />
        <Link to="/admin/jlpt-exam/$level" params={{ level }} className="text-muted-col hover:text-primary transition">JLPT {upperLevel}</Link>
        <ChevronRight className="w-4 h-4 text-muted-col" />
        <span className="text-primary-col font-medium">Create Exam</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-black text-primary-col">Create Exam</h1>
          <JLPTBadge level={upperLevel as JLPTLevel} />
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/jlpt-exam/$level"
            params={{ level }}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-secondary-col text-sm font-bold hover:bg-[var(--border)] transition"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={creating || importedQuestions.length === 0}
            className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Create Exam
          </button>
        </div>
      </div>

      {/* Exam Information Card */}
      <div className="card-base p-5">
        <h2 className="font-display font-bold text-primary-col mb-4">Exam Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Exam Name</label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:border-primary/40 transition"
              placeholder="Enter exam name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Level</label>
            <div className="px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)]">
              <JLPTBadge level={upperLevel as JLPTLevel} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Duration (min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
              min={1}
              max={300}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:border-primary/40 transition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ExamStatus)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:border-primary/40 transition cursor-pointer"
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
            </select>
          </div>
        </div>
      </div>

      {/* Excel Import Card */}
      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-primary-col">Import Questions from Excel</h2>
          </div>
          <ExcelTemplateDownload />
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
            importing ? "border-primary bg-primary/5" : "border-[var(--border)] hover:border-primary/40"
          }`}
        >
          {importedQuestions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-[var(--status-active)]">
                <CheckCircle className="w-6 h-6" />
                <span className="font-bold text-lg">{importedQuestions.length} questions imported</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-md mx-auto">
                <div className="p-2 rounded-lg bg-[var(--accent)]">
                  <p className="text-lg font-black text-[oklch(0.62_0.18_270)]">{importStats?.vocabulary || 0}</p>
                  <p className="text-[10px] text-muted-col">Vocabulary</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--accent)]">
                  <p className="text-lg font-black text-[oklch(0.72_0.15_230)]">{importStats?.grammar || 0}</p>
                  <p className="text-[10px] text-muted-col">Grammar</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--accent)]">
                  <p className="text-lg font-black text-[var(--status-pending)]">{importStats?.reading || 0}</p>
                  <p className="text-[10px] text-muted-col">Reading</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--accent)]">
                  <p className="text-lg font-black text-[oklch(0.6_0.22_25)]">{importStats?.listening || 0}</p>
                  <p className="text-[10px] text-muted-col">Listening</p>
                </div>
              </div>
              <button
                onClick={handleClearImport}
                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-bold hover:bg-red-500/20 transition"
              >
                Clear All
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-col mx-auto mb-3" />
              <p className="text-sm text-secondary-col mb-2">
                Drop your Excel file here or click to browse
              </p>
              <p className="text-xs text-muted-col mb-4">Accepts .xlsx, .xls files</p>
              <input
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className="inline-block px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition cursor-pointer"
              >
                {importing ? "Importing..." : "Select File"}
              </label>
            </>
          )}
        </div>

        {/* Format Guide */}
        <ExcelFormatGuide />

        {/* Error Messages */}
        {importError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 px-4 py-3 rounded-lg bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] text-sm flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Import Error</p>
              <p className="text-xs opacity-80">{importError}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Question Preview Table */}
      {importedQuestions.length > 0 && (
        <div className="card-base overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-display font-bold text-primary-col">Question Preview</h2>
            <span className="text-xs text-muted-col">{importedQuestions.length} total questions</span>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-[var(--accent)] sticky top-0">
                <tr className="text-left text-xs font-bold text-secondary-col uppercase tracking-wider">
                  <th className="py-3 px-3 w-12">#</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Question</th>
                  <th className="py-3 px-3">Answer</th>
                  <th className="py-3 px-3">Audio</th>
                  <th className="py-3 px-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {importedQuestions.map((q, i) => (
                  <QuestionPreviewRow
                    key={q.id}
                    question={q}
                    index={i}
                    onDelete={() => handleDeleteQuestion(q.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] text-sm flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-50 px-5 py-3 rounded-xl bg-[var(--status-active)] text-white shadow-lg flex items-center gap-2 font-medium"
          >
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
