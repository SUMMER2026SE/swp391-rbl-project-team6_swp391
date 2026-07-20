import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle } from "lucide-react";
import { examsApi } from "@/lib/api/exams";
import { AiPdfImportWorkflow } from "@/components/admin/AiPdfImportWorkflow";
import { ImportedQuestion } from "@/components/admin/pdf-import/QuestionEditor";

type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
type ExamStatus = "Active" | "Draft" | "Archived";

const DEFAULT_EXAM_CONFIG: Record<
  JLPTLevel,
  {
    vocabulary: number;
    grammar: number;
    reading: number;
    listening: number;
    total: number;
    duration: number;
  }
> = {
  N5: { vocabulary: 20, grammar: 25, reading: 25, listening: 30, total: 100, duration: 105 },
  N4: { vocabulary: 25, grammar: 25, reading: 25, listening: 25, total: 100, duration: 100 },
  N3: { vocabulary: 25, grammar: 25, reading: 25, listening: 25, total: 100, duration: 100 },
  N2: { vocabulary: 30, grammar: 25, reading: 25, listening: 25, total: 105, duration: 105 },
  N1: { vocabulary: 30, grammar: 30, reading: 25, listening: 25, total: 110, duration: 110 },
};

export const Route = createFileRoute("/admin/jlpt-exam/$level/create")({
  component: CreateExamPage,
});

type JLPTLevelUpper = "N5" | "N4" | "N3" | "N2" | "N1";
const VALID_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

function CreateExamPage() {
  const { level } = Route.useParams();
  const navigate = useNavigate();
  const upperLevel = level.toUpperCase() as JLPTLevelUpper;

  const isValidLevel = VALID_LEVELS.includes(upperLevel as JLPTLevel);
  const defaultConfig = DEFAULT_EXAM_CONFIG[upperLevel as JLPTLevel] || DEFAULT_EXAM_CONFIG.N5;

  const [examName, setExamName] = useState(`JLPT ${upperLevel} Mock Test`);
  const [status, setStatus] = useState<ExamStatus>("Draft");
  const [duration, setDuration] = useState(defaultConfig.duration);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const handleCreateExam = async (importedQuestions: ImportedQuestion[]) => {
    if (!examName.trim()) {
      throw new Error("Exam name is required");
    }
    if (importedQuestions.length === 0) {
      throw new Error("Please import at least one question");
    }

    const hasUnresolved = importedQuestions.some(q => q.answers.findIndex(ans => ans.isCorrect) === -1);
    if (hasUnresolved) {
      throw new Error("One or more questions are missing a correct answer. Please resolve them first.");
    }

    const backendStatus = status === "Active" ? "PUBLISHED" : "DRAFT";
    const examRes = await examsApi.createExam({
      title: examName,
      level: upperLevel,
      totalQuestions: importedQuestions.length,
      timeLimit: duration,
      category: "JLPT",
      status: backendStatus,
    });

    if (!examRes?.id) {
      throw new Error("Failed to create exam shell");
    }

    await examsApi.updateExamQuestions(examRes.id, {
      questions: importedQuestions.map((q, index) => ({
        prompt: `[${q.category || q.type}] ${q.content}`,
        options: q.answers.map((ans) => ans.content),
        correctAnswerIndex: q.answers.findIndex((ans) => ans.isCorrect),
        points: 1,
        displayOrder: index + 1,
      })),
    });

    queryClient.invalidateQueries({ queryKey: ["exam-bank", upperLevel] });
    queryClient.invalidateQueries({ queryKey: ["exam-bank"] });

    setSuccessMessage("Exam created successfully!");

    setTimeout(() => {
      navigate({ to: "/admin/jlpt-exam/$level", params: { level } });
    }, 1500);
  };

  if (!isValidLevel) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="w-16 h-16 text-[var(--status-rejected)]/50 mb-4" />
        <h2 className="text-xl font-bold text-primary-col mb-2">Invalid Level</h2>
        <p className="text-sm text-secondary-col mb-4">
          The level "{level}" is not a valid JLPT level.
        </p>
        <Link
          to="/admin/jlpt-exam"
          className="px-4 py-2.5 rounded-xl bg-primary/12 text-primary text-sm font-bold hover:bg-primary/20 transition"
        >
          Back to JLPT Exam Management
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back Button */}
      <Link
        to="/admin/jlpt-exam/$level"
        params={{ level: level.toLowerCase() }}
        className="inline-flex items-center gap-2 text-sm text-muted-col hover:text-primary-col transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {upperLevel} JLPT Exam
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-black text-primary-col">Create Exam</h1>
        <p className="text-sm text-secondary-col mt-0.5">
          Configure test metadata and upload PDF to import questions
        </p>
      </div>

      {/* Exam Information Card */}
      <div className="card-base p-5 border border-[var(--border)]">
        <h2 className="font-display font-bold text-primary-col mb-4">Exam Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
              Exam Name
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              placeholder="Enter exam name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
              Duration (min)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
              min={1}
              max={300}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ExamStatus)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition cursor-pointer"
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
            </select>
          </div>
        </div>
      </div>

      {/* PDF Import Coordinator */}
      <div className="card-base p-5 border border-[var(--border)]">
        <AiPdfImportWorkflow
          onCreate={handleCreateExam}
          title="Import Exam Questions"
          subtitle="Select PDF file to extract exam questions automatically"
          backHref={`/admin/jlpt-exam/${level.toLowerCase()}`}
          backLabel={`Back to ${upperLevel} Exams`}
        />
      </div>

      {successMessage && (
        <div className="fixed bottom-4 right-4 z-50 px-5 py-3 rounded-xl bg-[var(--status-active)] text-white shadow-lg flex items-center gap-2 font-medium">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}
    </div>
  );
}
