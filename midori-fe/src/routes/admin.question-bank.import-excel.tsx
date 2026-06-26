import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  ChevronRight,
  Loader2,
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Trash2,
  ArrowLeft,
  FileText,
  Download,
  X,
  CheckCircle2,
  Music,
  Clock,
  HelpCircle,
} from "lucide-react";
import { questionBankService } from "../services/questionBankService";
import { QuestionBankStickyHeader } from "../components/question-bank-sticky-header";

// ─── Routes ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/question-bank/import-excel")({
  component: ImportExcelPage,
});

// Types
type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
type QuestionType = "Vocabulary" | "Grammar" | "Reading" | "Listening";
type Difficulty = "Easy" | "Medium" | "Hard";

interface ImportedQuestion {
  type: QuestionType;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  // Listening-specific
  audioFileName?: string;
  audioUrl?: string;
  audioDuration?: number;
  isValid: boolean;
  errors: string[];
}

// Expected columns in Excel
const EXCEL_COLUMNS = [
  "type",
  "difficulty",
  "question",
  "answerA",
  "answerB",
  "answerC",
  "answerD",
  "correctAnswer",
  "explanation",
  "audioFileName",
];

function ExcelTemplateDownload() {
  const handleDownload = () => {
    const template = [
      {
        TYPE: "Vocabulary",
        DIFFICULTY: "Easy",
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
        DIFFICULTY: "Easy",
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
        DIFFICULTY: "Medium",
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
        DIFFICULTY: "Medium",
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
      { wch: 12 }, // TYPE
      { wch: 10 }, // DIFFICULTY
      { wch: 40 }, // QUESTION
      { wch: 15 }, // ANSWERA
      { wch: 15 }, // ANSWERB
      { wch: 15 }, // ANSWERC
      { wch: 15 }, // ANSWERD
      { wch: 15 }, // CORRECTANSWER
      { wch: 30 }, // EXPLANATION
      { wch: 20 }, // AUDIOFILENAME
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "Question_Bank_Import_Template.xlsx");
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
    <div className="card-base overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-primary-col text-sm">Excel Format Guide</h3>
        </div>
        <ExcelTemplateDownload />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-3 py-2 text-left font-medium text-muted-col text-xs uppercase tracking-wider">
                Column
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-col text-xs uppercase tracking-wider">
                Description
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-col text-xs uppercase tracking-wider">
                Example
              </th>
            </tr>
          </thead>
          <tbody className="text-muted-col text-xs">
            <tr className="border-b border-[var(--border)]">
              <td className="px-3 py-2 font-mono">TYPE</td>
              <td className="px-3 py-2">Vocabulary, Grammar, Reading, Listening</td>
              <td className="px-3 py-2 font-mono">Vocabulary</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="px-3 py-2 font-mono">DIFFICULTY</td>
              <td className="px-3 py-2">Easy, Medium, Hard</td>
              <td className="px-3 py-2 font-mono">Easy</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="px-3 py-2 font-mono">QUESTION</td>
              <td className="px-3 py-2">Question text</td>
              <td className="px-3 py-2 font-mono">「山」の読み方は？</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="px-3 py-2 font-mono">ANSWERA-D</td>
              <td className="px-3 py-2">Answer options</td>
              <td className="px-3 py-2 font-mono">やま, さめ, たけ, たかさ</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="px-3 py-2 font-mono">CORRECTANSWER</td>
              <td className="px-3 py-2">A, B, C, or D</td>
              <td className="px-3 py-2 font-mono">A</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="px-3 py-2 font-mono">EXPLANATION</td>
              <td className="px-3 py-2">Answer explanation (optional)</td>
              <td className="px-3 py-2 font-mono">正答えは...</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-mono">AUDIOFILENAME</td>
              <td className="px-3 py-2">Audio file for Listening (optional)</td>
              <td className="px-3 py-2 font-mono">audio.mp3</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ImportExcelPage() {
  const search = useSearch({ from: "/admin/question-bank/import-excel" }) as {
    level?: string;
    lessonId?: string;
  };
  const navigate = useNavigate();

  const level = (search.level?.toUpperCase() || "N5") as JLPTLevel;
  const lessonId = parseInt(search.lessonId || "1");

  // Get lesson data from service
  const lesson = questionBankService.getLesson(level, lessonId);
  const lessonName = lesson?.lessonName || `Lesson ${lessonId}`;

  // State
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "complete">("upload");
  const [fileName, setFileName] = useState<string>("");
  const [questions, setQuestions] = useState<ImportedQuestion[]>([]);
  const [importCount, setImportCount] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateQuestion = (row: Record<string, unknown>): ImportedQuestion => {
    const errors: string[] = [];

    // Validate type
    const validTypes = ["Vocabulary", "Grammar", "Reading", "Listening"];
    const type = (row.type as string) || (row.Type as string) || (row.TYPE as string);
    if (!validTypes.includes(type)) {
      errors.push(`Invalid type: "${type}"`);
    }

    // Validate difficulty
    const validDifficulties = ["Easy", "Medium", "Hard"];
    const difficulty =
      (row.difficulty as string) ||
      (row.Difficulty as string) ||
      (row.DIFFICULTY as string) ||
      "Easy";
    if (!validDifficulties.includes(difficulty)) {
      errors.push(`Invalid difficulty: "${difficulty}"`);
    }

    // Validate question
    const questionText =
      (row.question as string) ||
      (row.Question as string) ||
      (row.QUESTION as string) ||
      (row.q as string) ||
      (row.Q as string);
    if (!questionText?.trim()) {
      errors.push("Missing question text");
    }

    // Validate options
    const options = [
      row.answerA || row.AnswerA || row.ANSWERA || row.optionA,
      row.answerB || row.AnswerB || row.ANSWERB || row.optionB,
      row.answerC || row.AnswerC || row.ANSWERC || row.optionC,
      row.answerD || row.AnswerD || row.ANSWERD || row.optionD,
    ] as string[];

    if (options.some((opt) => !opt?.trim())) {
      errors.push("Missing one or more options");
    }

    // Validate correct answer
    const correctAnswer =
      (row.correctAnswer as string) ||
      (row.correctanswer as string) ||
      (row.CorrectAnswer as string) ||
      (row.CORRECTANSWER as string) ||
      (row.answer as string);
    const correctIndexMap: Record<string, number> = {
      A: 0,
      a: 0,
      "1": 0,
      "Answer A": 0,
      answerA: 0,
      B: 1,
      b: 1,
      "2": 1,
      "Answer B": 1,
      answerB: 1,
      C: 2,
      c: 2,
      "3": 2,
      "Answer C": 2,
      answerC: 2,
      D: 3,
      d: 3,
      "4": 3,
      "Answer D": 3,
      answerD: 3,
    };
    const correctIndex = correctIndexMap[correctAnswer] ?? -1;
    if (correctIndex === -1) {
      errors.push(`Invalid correct answer: "${correctAnswer}"`);
    }

    // Validate audio for Listening questions
    const audioFileName =
      (row.audioFileName as string) ||
      (row.audiofilename as string) ||
      (row.AudioFileName as string) ||
      (row.AudioFilename as string);
    if (type === "Listening" && !audioFileName?.trim()) {
      errors.push("Listening questions require audioFileName");
    }

    return {
      type: (type || "Vocabulary") as QuestionType,
      difficulty: (difficulty || "Easy") as Difficulty,
      questionText: questionText || "",
      options: options.map((opt) => opt || ""),
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation:
        (row.explanation as string) ||
        (row.Explanation as string) ||
        (row.EXPLANATION as string) ||
        "",
      audioFileName: audioFileName || "",
      audioUrl: audioFileName ? `https://example.com/audio/${audioFileName}` : undefined, // Mock URL for demo
      audioDuration: audioFileName ? Math.floor(Math.random() * 180) + 30 : undefined,
      isValid: errors.length === 0,
      errors,
    };
  };

  const parseExcelFile = (file: File) => {
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        // Demo data for preview - includes Listening questions
        const sampleData = [
          {
            type: "Vocabulary",
            difficulty: "Easy",
            question: "「山」の読み方正确的是？",
            answerA: "やま",
            answerB: "さめ",
            answerC: "たけ",
            answerD: "たかさ",
            correctAnswer: "A",
            explanation: "「山」は「やま」と読みます",
          },
          {
            type: "Grammar",
            difficulty: "Easy",
            question: "「これ」は何读みますか？",
            answerA: "これ",
            answerB: "それ",
            answerC: "あれ",
            answerD: "どれ",
            correctAnswer: "A",
            explanation: "「これ」は「これ」と読みます",
          },
          {
            type: "Listening",
            difficulty: "Medium",
            question: "Listen and select the correct response",
            answerA: "Good morning",
            answerB: "Good afternoon",
            answerC: "Good evening",
            answerD: "Goodbye",
            correctAnswer: "B",
            explanation: "The audio contains こんにちは (konnichiwa)",
            audioFileName: "greeting_dialogue.mp3",
          },
          {
            type: "Reading",
            difficulty: "Medium",
            question: "本文の内容と一致するのはどれですか？",
            answerA: "記述1",
            answerB: "記述2",
            answerC: "記述3",
            answerD: "記述4",
            correctAnswer: "B",
            explanation: "本文の内容と一致するのは記述2です",
          },
        ];

        const validated = sampleData.map((row) => validateQuestion(row as Record<string, unknown>));
        setQuestions(validated);
        setStep("preview");
      } catch {
        alert("Error parsing file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (
      file &&
      (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))
    ) {
      parseExcelFile(file);
    } else {
      alert("Please upload an Excel file (.xlsx, .xls, or .csv)");
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    setStep("importing");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const validQuestions = questions.filter((q) => q.isValid);

    validQuestions.forEach((q) => {
      if (q.type === "Listening" && q.audioUrl) {
        questionBankService.createQuestion(level, lessonId, {
          type: q.type,
          difficulty: q.difficulty,
          questionText: q.questionText,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          audio: {
            audioUrl: q.audioUrl!,
            audioFileName: q.audioFileName!,
            audioDuration: q.audioDuration || 60,
          },
        });
      } else {
        questionBankService.createQuestion(level, lessonId, {
          type: q.type,
          difficulty: q.difficulty,
          questionText: q.questionText,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        });
      }
    });

    setImportCount(validQuestions.length);
    setStep("complete");
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case "Easy":
        return "bg-green-500/12 text-green-600 border-green-500/20";
      case "Medium":
        return "bg-yellow-500/12 text-yellow-600 border-yellow-500/20";
      case "Hard":
        return "bg-red-500/12 text-red-600 border-red-500/20";
    }
  };

  const getTypeColor = (type: QuestionType) => {
    switch (type) {
      case "Vocabulary":
        return "bg-blue-500/12 text-blue-600 border-blue-500/20";
      case "Grammar":
        return "bg-purple-500/12 text-purple-600 border-purple-500/20";
      case "Reading":
        return "bg-orange-500/12 text-orange-600 border-orange-500/20";
      case "Listening":
        return "bg-pink-500/12 text-pink-600 border-pink-500/20";
    }
  };

  const validCount = questions.filter((q) => q.isValid).length;
  const invalidCount = questions.filter((q) => !q.isValid).length;

  return (
    <div className="space-y-6">
      {/* Sticky Header with Breadcrumb */}
      <QuestionBankStickyHeader
        backHref="/admin/question-bank/lesson-detail"
        backLabel="Back"
        level={level}
        lessonId={lessonId}
        breadcrumbs={[
          { label: "Question Bank", href: "/admin/question-bank" },
          { label: level, href: `/admin/question-bank/${level.toLowerCase()}` },
          {
            label: lessonName,
            href: `/admin/question-bank/lesson-detail?level=${level.toLowerCase()}&lessonId=${lessonId}`,
          },
          { label: "Import Excel" },
        ]}
        title="Import Questions from Excel"
        subtitle="Upload an Excel file to bulk import questions"
        stats={
          <div className="card-base p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/12 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-primary-col">{lessonName}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-primary/12 text-primary text-xs font-semibold">
                    {level}
                  </span>
                </div>
                <p className="text-sm text-muted-col">Lesson {lessonId}</p>
              </div>
            </div>
          </div>
        }
      />

      {/* Step Indicator */}
      <div className="card-base p-4">
        <div className="flex items-center justify-center gap-2">
          {(
            [
              { key: "upload", label: "Upload" },
              { key: "preview", label: "Preview" },
              { key: "complete", label: "Complete" },
            ] as const
          ).map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === s.key
                    ? "bg-gradient-hero text-white"
                    : (step === "importing" && s.key === "preview") ||
                        (step === "complete" && i < 2)
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-sm font-medium ${step === s.key ? "text-primary-col" : "text-muted-col"}`}
              >
                {s.label}
              </span>
              {i < 2 && <ChevronRight className="w-4 h-4 text-muted-col mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Step */}
      {step === "upload" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Upload Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className="card-base p-12 border-2 border-dashed cursor-pointer transition text-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-green-500/12 flex items-center justify-center mx-auto mb-5">
              <Upload className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-primary-col text-lg mb-2">
              Drop your Excel file here
            </h3>
            <p className="text-sm text-muted-col mb-4">or click to browse files</p>
            <p className="text-xs text-muted-foreground mb-5">
              Supports .xlsx, .xls, and .csv files
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Select File
            </button>
          </div>

          {/* Excel Format Guide */}
          <ExcelFormatGuide />
        </motion.div>
      )}

      {/* Preview Step */}
      {step === "preview" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* File Info */}
          <div className="card-base p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/12 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-primary-col">{fileName}</p>
                <p className="text-xs text-muted-col">{questions.length} questions found</p>
              </div>
            </div>
            <button
              onClick={() => {
                setStep("upload");
                setQuestions([]);
                setFileName("");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-col hover:text-primary hover:bg-muted transition"
            >
              <X className="w-4 h-4" />
              Change File
            </button>
          </div>

          {/* Validation Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-base p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/12 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{validCount}</p>
                <p className="text-xs text-muted-col">Valid questions</p>
              </div>
            </div>
            <div className="card-base p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/12 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
                <p className="text-xs text-muted-col">Invalid questions</p>
              </div>
            </div>
          </div>

          {/* Questions Preview Table */}
          <div className="card-base overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] bg-muted/30">
              <h3 className="font-semibold text-primary-col text-sm">Questions Preview</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--card)]">
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-col uppercase tracking-wider w-12">
                      #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-col uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-col uppercase tracking-wider w-24">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-col uppercase tracking-wider w-20">
                      Difficulty
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-col uppercase tracking-wider w-16">
                      Answer
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-col uppercase tracking-wider w-32">
                      Audio
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-col uppercase tracking-wider w-20">
                      Status
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted-col uppercase tracking-wider w-16">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {questions.map((q, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition">
                      <td className="px-4 py-3 font-mono text-muted-col text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-sm line-clamp-2">
                        {q.questionText}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium border ${getTypeColor(q.type)}`}
                        >
                          {q.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium border ${getDifficultyColor(q.difficulty)}`}
                        >
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {String.fromCharCode(65 + q.correctIndex)}
                      </td>
                      <td className="px-4 py-3">
                        {q.type === "Listening" ? (
                          <span className="flex items-center gap-1.5 text-xs text-pink-600">
                            <Music className="w-3.5 h-3.5" />
                            {q.audioFileName || "No audio"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {q.isValid ? (
                          <span className="px-2 py-1 rounded-lg bg-green-500/12 text-green-600 text-xs font-medium border border-green-500/20">
                            Valid
                          </span>
                        ) : (
                          <span
                            className="px-2 py-1 rounded-lg bg-red-500/12 text-red-600 text-xs font-medium border border-red-500/20"
                            title={q.errors.join(", ")}
                          >
                            Invalid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removeQuestion(i)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-col hover:text-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() =>
                navigate({
                  to: `/admin/question-bank/lesson-detail?level=${level.toLowerCase()}&lessonId=${lessonId}`,
                })
              }
              className="px-5 py-2.5 rounded-xl bg-muted text-muted-col text-sm font-semibold hover:bg-muted/80 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={validCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              Import {validCount} Question{validCount !== 1 ? "s" : ""}
            </button>
          </div>
        </motion.div>
      )}

      {/* Importing Step */}
      {step === "importing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-base p-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/12 flex items-center justify-center mx-auto mb-5">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h3 className="font-semibold text-primary-col text-lg mb-2">Importing Questions...</h3>
          <p className="text-sm text-muted-col">Please wait while we process your file</p>
        </motion.div>
      )}

      {/* Complete Step */}
      {step === "complete" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-base p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/12 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-display font-bold text-primary-col text-xl mb-2">Import Complete!</h3>
          <p className="text-muted-col mb-6">
            Successfully imported {importCount} question{importCount !== 1 ? "s" : ""} to{" "}
            {lessonName}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() =>
                navigate({
                  to: `/admin/question-bank/lesson-detail?level=${level.toLowerCase()}&lessonId=${lessonId}`,
                })
              }
              className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
            >
              View Questions
            </button>
            <button
              onClick={() => {
                setStep("upload");
                setQuestions([]);
                setFileName("");
              }}
              className="px-6 py-2.5 rounded-xl bg-muted text-muted-col text-sm font-semibold hover:bg-muted/80 transition"
            >
              Import More
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
