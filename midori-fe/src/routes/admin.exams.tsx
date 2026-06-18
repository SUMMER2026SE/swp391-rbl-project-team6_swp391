import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  ClipboardCheck, Eye, Plus, Edit3, Trash2,
  X, ChevronLeft, BookOpen, Timer, List, Loader2,
  CheckCircle, FileText, FolderOpen, Settings, ChevronRight,
  Upload, Wand2, Clock, Save, FileCheck, AlertCircle, Tag
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Section = {
  id: string;
  type: "vocabulary" | "listening" | "grammar" | "reading";
  title: string;
  questionCount: number;
};

export type Question = {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

export type Exam = {
  id: string;
  title: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  version: string;
  duration: number;
  sections: Section[];
  questions: Question[];
  createdAt: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockExams: Exam[] = [
  {
    id: "n5-exam-1",
    title: "JLPT N5 Vocabulary Test",
    level: "N5",
    version: "Exam 1",
    duration: 30,
    createdAt: "Jan 15, 2024",
    sections: [
      { id: "n5-vocab-1", type: "vocabulary", title: "Vocabulary", questionCount: 15 },
      { id: "n5-reading-1", type: "reading", title: "Reading Comprehension", questionCount: 10 },
    ],
    questions: [
      { id: 1, text: "「山」の読み方正确的是：", options: ["やま", "さめ", "たけ", "たかさ"], correctIndex: 0, explanation: "「山」の読み方は「やま」です。" },
      { id: 2, text: "「水」の読み方正确的是：", options: ["みず", "すい", "みずず", "みる"], correctIndex: 0, explanation: "「水」の読み方は「みず」です。" },
    ],
  },
  {
    id: "n5-exam-2",
    title: "JLPT N5 Grammar Basics",
    level: "N5",
    version: "Exam 2",
    duration: 25,
    createdAt: "Feb 20, 2024",
    sections: [
      { id: "n5-gram-1", type: "grammar", title: "Basic Grammar", questionCount: 20 },
    ],
    questions: [
      { id: 1, text: "これは____です。", options: ["томодати", "ともだち", "ともだ", "ともたち"], correctIndex: 1, explanation: "「ともだち」は「友達」と書き「朋友」を意味します。" },
    ],
  },
  {
    id: "n4-exam-1",
    title: "JLPT N4 Listening Practice",
    level: "N4",
    version: "Exam 1",
    duration: 40,
    createdAt: "Mar 10, 2024",
    sections: [
      { id: "n4-list-1", type: "listening", title: "Listening Comprehension", questionCount: 25 },
      { id: "n4-gram-1", type: "grammar", title: "Grammar", questionCount: 15 },
    ],
    questions: [
      { id: 1, text: "女の人と男の人が話しています。男の人は今日何をしますか？", options: ["会議に出て、資料を配る", "資料を準備して、会议に出る", "先に帰って、明日資料を作る", "部下に資料を作させる"], correctIndex: 1, explanation: "男の人は「資料を準備してから会議に出る」と言っています。" },
    ],
  },
  {
    id: "n3-exam-1",
    title: "JLPT N3 Grammar Mock Exam",
    level: "N3",
    version: "Exam 1",
    duration: 60,
    createdAt: "Apr 5, 2024",
    sections: [
      { id: "n3-gram-1", type: "grammar", title: "Grammar", questionCount: 20 },
      { id: "n3-reading-1", type: "reading", title: "Reading Comprehension", questionCount: 15 },
    ],
    questions: [
      { id: 1, text: "明日会議____、欠席する場合は事前に連絡してください。", options: ["のある", "がある場合", "がある場合に", "のあるとき"], correctIndex: 1, explanation: "「〜がある場合は、…」は仮定、条件を表す文法です。" },
      { id: 2, text: "彼は忙し____、電話に出てくれない。", options: ["そうで", "そうでも", "そうな", "そうなのに"], correctIndex: 2, explanation: "「〜そうで」は様態の意味で「〜の様子で」を表します。" },
      { id: 3, text: "雨に____、試合は中止になります。", options: ["なれば", "なっても", "なったら", "なって"], correctIndex: 2, explanation: "「〜たら」は条件を表し、未来の確定条件に使います。" },
    ],
  },
  {
    id: "n3-exam-2",
    title: "JLPT N3 Reading Comprehension",
    level: "N3",
    version: "Exam 2",
    duration: 65,
    createdAt: "May 12, 2024",
    sections: [
      { id: "n3-reading-2", type: "reading", title: "Reading Comprehension", questionCount: 25 },
      { id: "n3-vocab-1", type: "vocabulary", title: "Vocabulary", questionCount: 10 },
    ],
    questions: [
      { id: 1, text: "本文の内容と一致するのはどれですか？", options: ["記述1", "記述2", "記述3", "記述4"], correctIndex: 1, explanation: "本文には記述2が記載されています。" },
    ],
  },
  {
    id: "n2-exam-1",
    title: "JLPT N2 Advanced Grammar",
    level: "N2",
    version: "Exam 1",
    duration: 90,
    createdAt: "Jun 1, 2024",
    sections: [
      { id: "n2-gram-1", type: "grammar", title: "Advanced Grammar", questionCount: 30 },
      { id: "n2-reading-1", type: "reading", title: "Reading Comprehension", questionCount: 20 },
    ],
    questions: [
      { id: 1, text: "この本は____、とても勉強になった。", options: ["面白いのに", "面白いので", "面白いで", "面白いでは"], correctIndex: 1, explanation: "「〜ので」は原因・理由を表します。" },
    ],
  },
  {
    id: "n1-exam-1",
    title: "JLPT N1 Complete Practice",
    level: "N1",
    version: "Exam 1",
    duration: 120,
    createdAt: "Jul 20, 2024",
    sections: [
      { id: "n1-gram-1", type: "grammar", title: "Advanced Grammar", questionCount: 25 },
      { id: "n1-reading-1", type: "reading", title: "Reading Comprehension", questionCount: 30 },
      { id: "n1-list-1", type: "listening", title: "Listening", questionCount: 20 },
    ],
    questions: [
      { id: 1, text: "彼の説明は____、理解できなかった。", options: ["complexion", "complex", "complicated", "simplify"], correctIndex: 2, explanation: "「complexed」（複雑な）はN1レベルの語彙です。" },
    ],
  },
];

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  visible,
}: {
  message: string;
  type: "success" | "error";
  visible: boolean;
}) {
  const isSuccess = type === "success";
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border shadow-xl glass-modal ${
            isSuccess
              ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/25"
              : "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
          }`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {isSuccess ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Exam View Drawer ────────────────────────────────────────────────────────

function ExamViewDrawer({
  exam,
  onClose,
}: {
  exam: Exam;
  onClose: () => void;
}) {
  const getSectionIcon = (type: string) => {
    switch (type) {
      case "listening": return <List className="w-3 h-3" />;
      case "grammar": return <BookOpen className="w-3 h-3" />;
      case "reading": return <FileText className="w-3 h-3" />;
      default: return <List className="w-3 h-3" />;
    }
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      </motion.div>

      <motion.div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl glass-modal rounded-l-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-muted-col uppercase tracking-wider">Exam Details</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/12 text-primary border border-primary/20">
            {exam.level}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {/* Exam Title & Meta */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="font-display font-black text-primary-col text-xl leading-tight">{exam.title}</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { icon: List, value: exam.version },
                { icon: Tag, value: exam.level },
                { icon: Timer, value: `${exam.duration} min` },
                { icon: List, value: `${exam.questions.length} questions` },
              ].map(({ icon: Icon, value }) => (
                <div key={value} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass-surface text-muted-col text-xs">
                  <Icon className="w-3 h-3 text-primary" />
                  <span>{value}</span>
                </div>
              ))}
            </div>

            {/* Sections */}
            <div className="mt-4">
              <h4 className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">Sections</h4>
              <div className="flex flex-wrap gap-2">
                {exam.sections.map(section => (
                  <div key={section.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                    {getSectionIcon(section.type)}
                    {section.title} ({section.questionCount})
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="px-6 pb-6">
            <h4 className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-3">
              Question List ({exam.questions.length})
            </h4>
            <div className="space-y-4">
              {exam.questions.map((q, qi) => (
                <div key={q.id} className="rounded-xl border border-glass-border glass-surface overflow-hidden">
                  {/* Question header */}
                  <div className="flex items-start gap-3 p-4">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {qi + 1}
                    </div>
                    <p className="text-primary-col text-sm leading-relaxed flex-1">{q.text}</p>
                  </div>

                  {/* Options */}
                  <div className="px-4 pb-3 grid grid-cols-1 gap-1.5">
                    {q.options.map((opt, oi) => {
                      const isCorrect = oi === q.correctIndex;
                      return (
                        <div
                          key={oi}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
                            isCorrect
                              ? "bg-[var(--status-active)]/10 border-[var(--status-active)]/25 text-[var(--status-active)]"
                              : "glass-surface text-secondary-col"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 text-[9px] font-bold ${
                            isCorrect ? "bg-[var(--status-active)] border-[var(--status-active)] text-white" : "border-[var(--border)]"
                          }`}>
                            {isCorrect ? "✓" : String.fromCharCode(65 + oi)}
                          </div>
                          <span className={isCorrect ? "font-bold" : ""}>{opt}</span>
                          {isCorrect && <span className="ml-auto text-[var(--status-active)] font-bold text-[10px]">Correct</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="mx-4 mb-3 p-3 rounded-lg bg-primary/8 border border-primary/15">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <BookOpen className="w-3 h-3 text-primary" />
                        <span className="text-primary text-[10px] font-bold uppercase tracking-wider">Explanation</span>
                      </div>
                      <p className="text-secondary-col text-xs leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 border-t separator">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition">
            Close
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Exam Level Card ─────────────────────────────────────────────────────────

function ExamLevelCard({
  level,
  exams,
  onViewExam,
  onCreateExam,
}: {
  level: string;
  exams: Exam[];
  onViewExam: (exam: Exam) => void;
  onCreateExam: (level: string) => void;
}) {
  const totalQuestions = exams.reduce((sum, e) => sum + e.questions.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base overflow-hidden"
    >
      {/* Level Header */}
      <div className="px-5 py-4 border-b separator bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center text-white text-sm font-bold">
              {level}
            </div>
            <div>
              <h3 className="font-display font-bold text-primary-col">JLPT {level}</h3>
              <p className="text-xs text-muted-col">{exams.length} exam{exams.length !== 1 ? "s" : ""} · {totalQuestions} questions</p>
            </div>
          </div>
          <button 
            onClick={() => onCreateExam(level)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
        </div>
      </div>

      {/* Exam List */}
      {exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FolderOpen className="w-8 h-8 text-muted-col/40 mb-2" />
          <p className="text-sm text-muted-col">No exams yet</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {exams.map((exam, index) => (
            <div
              key={exam.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--accent)] transition cursor-pointer group"
              onClick={() => onViewExam(exam)}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary-col truncate">{exam.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">{exam.version}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-col">
                  <span>{exam.questions.length} questions</span>
                  <span>·</span>
                  <span>{exam.duration} min</span>
                  <span>·</span>
                  <span>{exam.createdAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  {exam.sections.slice(0, 3).map(section => (
                    <span key={section.id} className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/8 text-primary">
                      {section.type}
                    </span>
                  ))}
                </div>
                <button className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary opacity-0 group-hover:opacity-100 transition">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Create Exam Modal ────────────────────────────────────────────────────────

type QuestionType = "vocabulary" | "grammar" | "reading" | "listening";
const QUESTION_TYPES: { type: QuestionType; label: string; icon: string }[] = [
  { type: "vocabulary", label: "Vocabulary", icon: "あ" },
  { type: "grammar", label: "Grammar", icon: "文" },
  { type: "reading", label: "Reading", icon: "読" },
  { type: "listening", label: "Listening", icon: "聴" },
];

const JLPT_DURATIONS: Record<string, number> = {
  N5: 25,
  N4: 30,
  N3: 40,
  N2: 50,
  N1: 60,
};

function CreateExamModal({
  onClose,
  onCreated,
  defaultLevel,
}: {
  onClose: () => void;
  onCreated: (exam: Exam) => void;
  defaultLevel?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"config" | "generating" | "review">(defaultLevel ? "config" : "config");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [examLevel, setExamLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">(defaultLevel as "N5" | "N4" | "N3" | "N2" | "N1" || "N5");
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(["vocabulary"]);
  const [questionCount, setQuestionCount] = useState(10);
  const [duration, setDuration] = useState(JLPT_DURATIONS[examLevel]);
  const [generatedExam, setGeneratedExam] = useState<Exam | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const toggleType = (type: QuestionType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
    } else {
      showToast("Please upload a PDF file", "error");
    }
  };

  const handleLevelChange = (level: "N5" | "N4" | "N3" | "N2" | "N1") => {
    setExamLevel(level);
    setDuration(JLPT_DURATIONS[level]);
  };

  const handleGenerate = async () => {
    if (!uploadedFile) {
      showToast("Please upload a PDF file first!", "error");
      return;
    }
    if (selectedTypes.length === 0) {
      showToast("Please select at least one question type!", "error");
      return;
    }

    setIsGenerating(true);
    setStep("generating");

    // Simulate AI generation
    await new Promise(r => setTimeout(r, 2500));

    // Generate mock questions
    const questions: Question[] = [];
    let qId = 1;
    selectedTypes.forEach(type => {
      const countForType = Math.ceil(questionCount / selectedTypes.length);
      for (let i = 0; i < countForType && questions.length < questionCount; i++) {
        questions.push({
          id: qId++,
          text: `${type === "vocabulary" ? "「言葉」の読み方正确的是：" : type === "grammar" ? "正しい文法構造はどれですか：" : type === "reading" ? "本文の内容と一致するのはどれですか：" : "会話を聞いて、正しく答えるのはどれですか："}${uploadedFile.name}`,
          options: ["選択肢 1", "選択肢 2", "選択肢 3", "選択肢 4"],
          correctIndex: Math.floor(Math.random() * 4),
          explanation: "この質問の解説文です。",
        });
      }
    });

    const sections: Section[] = selectedTypes.map((type, i) => ({
      id: `section_${i}`,
      type: type as "vocabulary" | "grammar" | "reading" | "listening",
      title: type.charAt(0).toUpperCase() + type.slice(1),
      questionCount: questions.filter(q => {
        const typeIndex = selectedTypes.indexOf(type);
        return q.id <= (typeIndex + 1) * Math.ceil(questionCount / selectedTypes.length) && q.id > typeIndex * Math.ceil(questionCount / selectedTypes.length);
      }).length,
    }));

    const versionNum = Math.floor(Math.random() * 20) + 1;
    const exam: Exam = {
      id: `exam_${Date.now()}`,
      title: `JLPT ${examLevel} ${uploadedFile.name.replace(/\.pdf$/i, "")}`,
      level: examLevel,
      version: `Exam ${versionNum}`,
      duration,
      sections,
      questions,
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    setGeneratedExam(exam);
    setIsGenerating(false);
    setStep("review");
    showToast("Questions generated successfully!", "success");
  };

  const handleSaveExam = () => {
    if (generatedExam) {
      onCreated(generatedExam);
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div>
            <h2 className="font-display font-bold text-primary-col text-lg">Create New Exam</h2>
            <p className="text-xs text-muted-col mt-0.5">
              {step === "config" && "Configure exam settings"}
              {step === "generating" && "AI is generating questions..."}
              {step === "review" && "Review and save exam"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === "config" && (
            <div className="space-y-6">
              {/* Upload PDF */}
              <div>
                <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
                  Upload PDF Source
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                    uploadedFile
                      ? "border-[var(--status-active)]/30 bg-[var(--status-active)]/5"
                      : "border-[var(--border)] hover:border-primary/30 hover:bg-[var(--accent)]"
                  }`}
                >
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileCheck className="w-8 h-8 text-[var(--status-active)]" />
                      <div className="text-left">
                        <p className="text-primary-col font-semibold">{uploadedFile.name}</p>
                        <p className="text-muted-col text-xs">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-muted-col/50 mx-auto mb-3" />
                      <p className="text-secondary-col font-medium">Click to upload PDF</p>
                      <p className="text-muted-col text-xs mt-1">or drag and drop your file here</p>
                    </>
                  )}
                </div>
              </div>

              {/* JLPT Level */}
              <div>
                <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
                  JLPT Level
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {JLPT_LEVELS_CREATE.map(level => (
                    <button
                      key={level}
                      onClick={() => handleLevelChange(level)}
                      className={`py-3 rounded-xl text-sm font-bold transition ${
                        examLevel === level
                          ? "bg-gradient-hero text-white shadow-md"
                          : "glass-surface text-secondary-col hover:text-primary"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Types */}
              <div>
                <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
                  Question Types
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {QUESTION_TYPES.map(({ type, label, icon }) => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                        selectedTypes.includes(type)
                          ? "bg-primary/15 text-primary border border-primary/25"
                          : "glass-surface text-secondary-col border border-transparent hover:border-[var(--border)]"
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        selectedTypes.includes(type) ? "bg-primary text-white" : "bg-primary/10 text-primary"
                      }`}>
                        {icon}
                      </span>
                      {label}
                      {selectedTypes.includes(type) && <CheckCircle className="w-4 h-4 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={questionCount}
                    onChange={e => setQuestionCount(Math.max(5, Math.min(50, parseInt(e.target.value) || 10)))}
                    className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={duration}
                    onChange={e => setDuration(Math.max(10, Math.min(180, parseInt(e.target.value) || 30)))}
                    className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                  />
                  <p className="text-muted-col text-xs mt-1">JLPT {examLevel} standard: {JLPT_DURATIONS[examLevel]} min</p>
                </div>
              </div>

              {/* JLPT Exam Time Info */}
              <div className="p-4 rounded-xl bg-primary/8 border border-primary/15">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-primary font-semibold text-sm">JLPT Exam Structure</p>
                    <p className="text-secondary-col text-xs mt-1">
                      This exam will follow the official JLPT {examLevel} structure:
                    </p>
                    <ul className="mt-2 space-y-1">
                      <li className="text-xs text-muted-col flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Language Knowledge (Vocabulary/Grammar): {examLevel === "N5" || examLevel === "N4" ? "25 min" : examLevel === "N3" ? "30 min" : "35 min"}
                      </li>
                      <li className="text-xs text-muted-col flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Reading: {examLevel === "N5" || examLevel === "N4" ? "25 min" : examLevel === "N3" ? "40 min" : examLevel === "N2" ? "70 min" : "75 min"}
                      </li>
                      <li className="text-xs text-muted-col flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Listening: {examLevel === "N5" ? "30 min" : examLevel === "N4" ? "35 min" : examLevel === "N3" ? "35 min" : examLevel === "N2" ? "50 min" : "60 min"}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-20 h-20 rounded-full bg-gradient-hero/10 flex items-center justify-center mb-6"
              >
                <Wand2 className="w-10 h-10 text-gradient-hero" />
              </motion.div>
              <h3 className="text-xl font-display font-bold text-primary-col mb-2">AI is Creating Your Exam</h3>
              <p className="text-secondary-col text-sm mb-4">Analyzing PDF and generating questions...</p>
              <div className="flex items-center gap-2 text-muted-col text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing {uploadedFile?.name}...
              </div>
            </div>
          )}

          {step === "review" && generatedExam && (
            <div className="space-y-6">
              {/* Exam Summary */}
              <div className="p-4 rounded-xl bg-gradient-hero/5 border border-gradient-hero/15">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center text-white">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-primary-col">{generatedExam.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-col">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">{generatedExam.level}</span>
                      <span>{generatedExam.version}</span>
                      <span>·</span>
                      <span>{generatedExam.duration} min</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {generatedExam.sections.map(section => (
                    <span key={section.id} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {section.title} ({section.questionCount})
                    </span>
                  ))}
                </div>
              </div>

              {/* Questions Preview */}
              <div>
                <h4 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
                  Generated Questions ({generatedExam.questions.length})
                </h4>
                <div className="space-y-3 max-h-64 overflow-auto">
                  {generatedExam.questions.slice(0, 5).map((q, i) => (
                    <div key={q.id} className="p-3 rounded-xl glass-surface">
                      <div className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-primary-col text-sm line-clamp-2">{q.text}</p>
                      </div>
                    </div>
                  ))}
                  {generatedExam.questions.length > 5 && (
                    <p className="text-center text-muted-col text-xs py-2">
                      + {generatedExam.questions.length - 5} more questions
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t separator flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          {step === "config" && (
            <button
              onClick={handleGenerate}
              disabled={!uploadedFile}
              className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" /> Generate with AI
            </button>
          )}
          {step === "review" && (
            <>
              <button
                onClick={() => setStep("config")}
                className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
              >
                Regenerate
              </button>
              <button
                onClick={handleSaveExam}
                className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save to Exam Bank
              </button>
            </>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-bold border shadow-lg ${
              toast.type === "success"
                ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/25"
                : "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/exams")({
  component: ExamBankPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      level: search.level as string | undefined,
    };
  },
});

type SearchParams = {
  level?: string;
};

function ExamBankPage() {
  const navigate = useNavigate({ from: "/admin/exams" });
  const searchParams = useSearch({ from: "/admin/exams" }) as SearchParams;
  const selectedLevel = searchParams.level?.toUpperCase() as "N5" | "N4" | "N3" | "N2" | "N1" | undefined;
  
  const [exams, setExams] = useState<Exam[]>(mockExams);
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleExamCreated = useCallback((newExam: Exam) => {
    setExams(prev => [newExam, ...prev]);
    showToast("Exam created and saved to Exam Bank!", "success");
  }, [showToast]);

  // Group exams by level
  const examsByLevel = JLPT_LEVELS.reduce((acc, level) => {
    acc[level] = exams.filter(e => e.level === level);
    return acc;
  }, {} as Record<string, Exam[]>);

  // Filter exams based on selected level
  const displayedLevels = selectedLevel ? [selectedLevel] : JLPT_LEVELS;
  const filteredExams = selectedLevel ? examsByLevel[selectedLevel] || [] : exams;
  
  const totalExams = filteredExams.length;
  const totalQuestions = filteredExams.reduce((sum, e) => sum + e.questions.length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">
            {selectedLevel ? `JLPT ${selectedLevel} Exams` : "JLPT Exam Bank"}
          </h1>
          <p className="text-sm text-secondary-col mt-0.5">
            {selectedLevel ? `${totalExams} exam${totalExams !== 1 ? "s" : ""} available` : "Manage your JLPT exam library"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedLevel && (
            <button 
              onClick={() => navigate({ search: { level: undefined } })}
              className="flex items-center gap-2 px-3 py-2 rounded-xl glass-surface text-sm font-medium text-secondary-col hover:text-primary transition"
            >
              <ChevronRight className="w-4 h-4 rotate-180" /> Back to All
            </button>
          )}
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl glass-surface text-xs">
            <div className="text-center">
              <p className="text-primary font-bold text-lg">{totalExams}</p>
              <p className="text-muted-col">Exams</p>
            </div>
            <div className="w-px h-8 bg-[var(--border)]" />
            <div className="text-center">
              <p className="text-primary font-bold text-lg">{totalQuestions}</p>
              <p className="text-muted-col">Questions</p>
            </div>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Create Exam
          </button>
        </div>
      </div>

      {/* Level Quick Filters (only show when not filtered) */}
      {!selectedLevel && (
        <div className="flex gap-2 flex-wrap">
          {JLPT_LEVELS.map(level => {
            const count = examsByLevel[level]?.length || 0;
            return (
              <div key={level} className="flex items-center gap-2 px-4 py-2 rounded-xl glass-surface">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                  {level}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-primary-col">{count} exam{count !== 1 ? "s" : ""}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exam Bank by Level */}
      <div className="space-y-6">
        {displayedLevels.map(level => {
          const levelExams = examsByLevel[level] || [];
          if (levelExams.length === 0) return null;
          
          return (
            <ExamLevelCard
              key={level}
              level={level}
              exams={levelExams}
              onViewExam={setViewingExam}
              onCreateExam={() => setShowCreateModal(true)}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {totalExams === 0 && (
        <div className="card-base p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-bold text-primary-col text-lg mb-2">
            {selectedLevel ? `No ${selectedLevel} Exams Yet` : "No Exams Yet"}
          </h3>
          <p className="text-secondary-col text-sm mb-6">
            {selectedLevel 
              ? `Create your first JLPT ${selectedLevel} exam or use AI to generate questions`
              : "Create your first JLPT exam or use AI to generate questions"
            }
          </p>
          <div className="flex justify-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition">
              <Plus className="w-4 h-4" /> Create Exam
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition">
              AI Generate
            </button>
          </div>
        </div>
      )}

      {/* View Drawer */}
      <AnimatePresence>
        {viewingExam && (
          <ExamViewDrawer
            exam={viewingExam}
            onClose={() => setViewingExam(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast message={toast?.message ?? ""} type={toast?.type ?? "success"} visible={!!toast} />

      {/* Create Exam Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateExamModal
            onClose={() => setShowCreateModal(false)}
            onCreated={handleExamCreated}
            defaultLevel={selectedLevel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
