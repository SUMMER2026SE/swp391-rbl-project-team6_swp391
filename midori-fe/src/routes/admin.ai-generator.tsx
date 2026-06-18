import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, CheckCircle, XCircle, Sparkles,
  Loader2, X, ChevronLeft, BookOpen, Wand2,
  File, FileCheck, RefreshCw, Edit3, Trash2,
  Check, AlertCircle, Target, Plus
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type QuestionType = "vocabulary" | "grammar" | "reading" | "listening";

export type GeneratedQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  jlptLevel: string;
  skillType: QuestionType;
  isEdited?: boolean;
};

export type GeneratedExam = {
  id: string;
  title: string;
  sourceFile: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  version: string;
  questionTypes: QuestionType[];
  questions: GeneratedQuestion[];
  createdAt: string;
  sections: Array<{ id: string; type: string; title: string; questionCount: number }>;
};

// ─── JLPT Levels ─────────────────────────────────────────────────────────────

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
const QUESTION_COUNTS = [10, 20, 50] as const;

// ─── AI Mock Generation Functions ─────────────────────────────────────────────

function simulateAIDelay(ms: number = 2000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 1000));
}

function extractKeywordsFromFileName(fileName: string): string[] {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const words = baseName.split(/[\s_-]+/).filter(w => w.length > 2);
  return words.slice(0, 5);
}

function generateMockQuestions(
  fileName: string,
  level: string,
  count: number,
  types: QuestionType[]
): GeneratedQuestion[] {
  const keywords = extractKeywordsFromFileName(fileName);
  const questions: GeneratedQuestion[] = [];

  const vocabularyQuestions = [
    { text: "「{keyword}」の読み方正确的是：", opts: ["{kw}a", "{kw}i", "{kw}u", "{kw}e"], correct: 1, explanation: "「{keyword}」は「{kw}i」と読みます。" },
    { text: "「{keyword}」の意味正确的是：", opts: ["意味1", "意味2（正解）", "意味3", "意味4"], correct: 1, explanation: "「{keyword}」は「意味2」を意味します。" },
    { text: "「{keyword}」是哪一类词？", opts: ["名词", "动词", "形容词（正解）", "副词"], correct: 2, explanation: "「{keyword}」是形容词，表示..." },
    { text: "「{keyword}」的使用场景是：", opts: ["日常会话（正解）", "商务场合", "文学作品", "学术论文"], correct: 0, explanation: "「{keyword}」主要用于日常会话场景。" },
  ];

  const grammarQuestions = [
    { text: "「{keyword}」を使った正しい文は：", opts: ["文1", "文2", "文3（正解）", "文4"], correct: 2, explanation: "「{keyword}」は文脈において正しい用法です。" },
    { text: "「{keyword}」と「〜た」の組み合わせ正确的是：", opts: ["〜た {keyword}", "{keyword} 〜た（正解）", "〜て {keyword}", "{keyword} ながら"], correct: 1, explanation: "「{keyword}」の後には「〜た」が続きます。" },
    { text: "「{keyword}」はどのような文法ですか？", opts: ["逆接（正解）", "並列", "原因・理由", "条件"], correct: 0, explanation: "「{keyword}」は逆接を表す文法です。" },
    { text: "「{keyword}」に一番近い意味のものは：", opts: ["〜ので", "〜のに（正解）", "〜から", "〜ば"], correct: 1, explanation: "「{keyword}」は「〜のに」と同じ用法です。" },
  ];

  const readingQuestions = [
    { text: "本文の内容と一致するのはどれですか？「{keyword}」", opts: ["記述1", "記述2（正解）", "記述3", "記述4"], correct: 1, explanation: "本文には「{keyword}」について記述2が記載されています。" },
    { text: "筆者の主張として最も適切なのは：", opts: ["主張1", "主張2", "主張3（正解）", "主張4"], correct: 2, explanation: "筆者は「{keyword}」を通じて主張3を展開しています。" },
    { text: "「{keyword}」の段落の役割正确的是：", opts: ["導入", "展開（正解）", "結論", "補足"], correct: 1, explanation: "「{keyword}」を含む段落は、本論の展開部分です。" },
  ];

  const listeningQuestions = [
    { text: "女の人と男の人が話しています。男の人は{keyword}？", opts: ["応答1", "応答2", "応答3（正解）", "応答4"], correct: 2, explanation: "会話を听完すると、男的人は{keyword}と言っています。" },
    { text: "天気予報を聞いています。明日{keyword}は？", opts: ["晴れ", "雨（正解）", "曇り", "雪"], correct: 1, explanation: "天気予報によると、明日{keyword}とのことです。" },
    { text: "アナウンスを聞いてください。{keyword}はいつですか？", opts: ["午前中（正解）", "午後", "夜", "明日"], correct: 0, explanation: "アナウンスでは{keyword}は午前中と発表しています。" },
  ];

  const questionTemplates: Record<QuestionType, typeof vocabularyQuestions> = {
    vocabulary: vocabularyQuestions,
    grammar: grammarQuestions,
    reading: readingQuestions,
    listening: listeningQuestions,
  };

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const templates = questionTemplates[type];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)] || "日本語";

    questions.push({
      id: `q_${Date.now()}_${i}`,
      text: template.text.replace(/\{keyword\}/g, keyword).replace(/\{kw\}/g, keyword.slice(0, 2)),
      options: template.opts.map(o => o.replace(/\{keyword\}/g, keyword).replace(/\{kw\}/g, keyword.slice(0, 2))),
      correctIndex: template.correct,
      explanation: template.explanation.replace(/\{keyword\}/g, keyword),
      jlptLevel: level,
      skillType: type,
    });
  }

  return questions;
}

function generateQuestionsFromFile(
  fileName: string,
  level: string,
  count: number,
  types: QuestionType[]
): Promise<GeneratedQuestion[]> {
  return new Promise(async (resolve) => {
    await simulateAIDelay(2500);
    const questions = generateMockQuestions(fileName, level, count, types);
    resolve(questions);
  });
}

function buildExamFromAIResult(
  questions: GeneratedQuestion[],
  sourceFile: string,
  level: "N5" | "N4" | "N3" | "N2" | "N1",
  types: QuestionType[]
): GeneratedExam {
  const versionNumber = Math.floor(Math.random() * 10) + 1;
  return {
    id: `exam_${Date.now()}`,
    title: `JLPT ${level} AI Generated ${sourceFile.replace(/\.[^/.]+$/, "")}`,
    sourceFile,
    level,
    version: `Exam ${versionNumber}`,
    questionTypes: types,
    questions,
    createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    sections: types.map((type, i) => ({
      id: `section_${i}`,
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      questionCount: Math.ceil(questions.filter(q => q.skillType === type).length),
    })),
  };
}

// ─── Toast Component ───────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  visible,
}: {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
}) {
  const configs = {
    success: { bg: "bg-[var(--status-active)]/15", text: "text-[var(--status-active)]", border: "border-[var(--status-active)]/25", icon: CheckCircle },
    error: { bg: "bg-[var(--status-rejected)]/15", text: "text-[var(--status-rejected)]", border: "border-[var(--status-rejected)]/25", icon: XCircle },
    info: { bg: "bg-primary/15", text: "text-primary", border: "border-primary/25", icon: AlertCircle },
  };
  const config = configs[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border shadow-xl glass-modal ${config.bg} ${config.text} ${config.border}`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <Icon className="w-4 h-4" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Question Editor Modal ────────────────────────────────────────────────────

function QuestionEditorModal({
  question,
  onSave,
  onClose,
}: {
  question: GeneratedQuestion;
  onSave: (q: GeneratedQuestion) => void;
  onClose: () => void;
}) {
  const [edited, setEdited] = useState<GeneratedQuestion>({ ...question });

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...edited.options];
    newOptions[index] = value;
    setEdited({ ...edited, options: newOptions });
  };

  const handleSave = () => {
    onSave(edited);
    onClose();
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
        className="relative z-10 w-full max-w-2xl glass-modal rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center text-white">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-primary-col text-lg">Edit Question</h3>
              <p className="text-muted-col text-xs">{question.skillType} · {question.jlptLevel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              Question Text
            </label>
            <textarea
              value={edited.text}
              onChange={e => setEdited({ ...edited, text: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl input-glass text-sm resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              Options (A, B, C, D)
            </label>
            {edited.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary/15 text-primary text-sm font-bold flex items-center justify-center">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  value={opt}
                  onChange={e => handleOptionChange(i, e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl input-glass text-sm"
                />
                {i === edited.correctIndex && (
                  <CheckCircle className="w-5 h-5 text-[var(--status-active)]" />
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              Correct Answer
            </label>
            <div className="flex gap-2">
              {edited.options.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setEdited({ ...edited, correctIndex: i })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition ${
                    edited.correctIndex === i
                      ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/25"
                      : "glass-surface text-secondary-col"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              Explanation
            </label>
            <textarea
              value={edited.explanation}
              onChange={e => setEdited({ ...edited, explanation: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-xl input-glass text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
                JLPT Level
              </label>
              <select
                value={edited.jlptLevel}
                onChange={e => setEdited({ ...edited, jlptLevel: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl input-glass text-sm"
              >
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
                Skill Type
              </label>
              <select
                value={edited.skillType}
                onChange={e => setEdited({ ...edited, skillType: e.target.value as QuestionType })}
                className="w-full px-4 py-2.5 rounded-xl input-glass text-sm"
              >
                <option value="vocabulary">Vocabulary</option>
                <option value="grammar">Grammar</option>
                <option value="reading">Reading</option>
                <option value="listening">Listening</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  onEdit,
  onDelete,
  onRegenerate,
}: {
  question: GeneratedQuestion;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
}) {
  const typeColors: Record<QuestionType, { bg: string; text: string }> = {
    vocabulary: { bg: "bg-blue-500/10", text: "text-blue-500" },
    grammar: { bg: "bg-green-500/10", text: "text-green-500" },
    reading: { bg: "bg-purple-500/10", text: "text-purple-500" },
    listening: { bg: "bg-orange-500/10", text: "text-orange-500" },
  };
  const colors = typeColors[question.skillType];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border border-glass-border glass-surface overflow-hidden"
    >
      <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.bg} ${colors.text}`}>
                  {question.skillType.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                  {question.jlptLevel}
                </span>
              </div>
              <p className="text-primary-col text-sm leading-relaxed">{question.text}</p>
            </div>
          </div>

        <div className="space-y-1.5 mb-3">
          {question.options.map((opt, oi) => {
            const isCorrect = oi === question.correctIndex;
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
              </div>
            );
          })}
        </div>

        {question.explanation && (
          <div className="p-3 rounded-lg bg-primary/8 border border-primary/15">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BookOpen className="w-3 h-3 text-primary" />
              <span className="text-primary text-[10px] font-bold uppercase tracking-wider">Explanation</span>
            </div>
            <p className="text-secondary-col text-xs leading-relaxed">{question.explanation}</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t separator flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg glass-surface text-xs font-bold text-secondary-col hover:bg-[var(--accent)] transition"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          onClick={onRegenerate}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg glass-surface text-xs font-bold text-secondary-col hover:bg-[var(--accent)] transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--status-rejected)]/10 text-xs font-bold text-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/20 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/ai-generator")({
  component: AIGeneratorPage,
});

function AIGeneratorPage() {
  const [step, setStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("auto");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [customCount, setCustomCount] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(["vocabulary", "grammar", "reading", "listening"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<GeneratedExam | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<GeneratedQuestion | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [".pdf", ".docx", ".txt", ".md"];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!validTypes.includes(ext)) {
        showToast("Unsupported file type. Please upload PDF, DOCX, TXT, or Markdown.", "error");
        return;
      }
      setUploadedFile(file);
      showToast(`File "${file.name}" uploaded successfully!`, "success");
    }
  }, [showToast]);

  const toggleQuestionType = (type: QuestionType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (!uploadedFile) {
      showToast("Please upload a file first!", "error");
      return;
    }
    if (selectedTypes.length === 0) {
      showToast("Please select at least one question type!", "error");
      return;
    }

    const count = customCount ? parseInt(customCount) : questionCount;
    if (count < 1 || count > 100) {
      showToast("Question count must be between 1 and 100!", "error");
      return;
    }

    setIsGenerating(true);
    setStep(5);

    try {
      const level = selectedLevel === "auto" 
        ? (["N5", "N4", "N3"] as const)[Math.floor(Math.random() * 3)] 
        : selectedLevel as "N5" | "N4" | "N3" | "N2" | "N1";
      const questions = await generateQuestionsFromFile(
        uploadedFile.name,
        level,
        count,
        selectedTypes
      );
      const exam = buildExamFromAIResult(questions, uploadedFile.name, level, selectedTypes);
      setGeneratedExam(exam);
      showToast(`${questions.length} questions generated and saved to Exam Bank!`, "success");
    } catch {
      showToast("Failed to generate questions. Please try again.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteQuestion = (id: string) => {
    setGeneratedExam(prev => {
      if (!prev) return prev;
      return { ...prev, questions: prev.questions.filter(q => q.id !== id) };
    });
    showToast("Question deleted!", "info");
  };

  const handleEditQuestion = (question: GeneratedQuestion) => {
    setEditingQuestion(question);
  };

  const handleSaveQuestion = (updated: GeneratedQuestion) => {
    setGeneratedExam(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map(q => q.id === updated.id ? { ...updated, isEdited: true } : q),
      };
    });
    showToast("Question updated!", "success");
  };

  const handleRegenerateQuestion = async (id: string) => {
    if (!uploadedFile) return;
    const newQuestions = await generateQuestionsFromFile(
      uploadedFile.name,
      selectedLevel === "auto" ? "N3" : selectedLevel,
      1,
      [generatedExam?.questions.find(q => q.id === id)?.skillType || "vocabulary"]
    );
    const newQ = newQuestions[0];
    setGeneratedExam(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map(q => q.id === id ? newQ : q),
      };
    });
    showToast("Question regenerated!", "success");
  };

  const handleSaveDraft = () => {
    showToast("Exam saved to Exam Bank!", "success");
  };

  const handleReset = () => {
    setStep(1);
    setUploadedFile(null);
    setSelectedLevel("auto");
    setQuestionCount(10);
    setCustomCount("");
    setSelectedTypes(["vocabulary", "grammar", "reading", "listening"]);
    setGeneratedExam(null);
    showToast("Reset complete! Upload a new file to start.", "info");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">AI Question Generator</h1>
          <p className="text-sm text-secondary-col mt-0.5">Upload files and let AI generate JLPT questions automatically</p>
        </div>
        {generatedExam && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-surface text-sm font-bold text-secondary-col hover:bg-[var(--accent)] transition"
          >
            <Upload className="w-4 h-4" /> Generate New
          </button>
        )}
      </div>

      {/* Step Indicator */}
      {step < 5 && (
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: "Upload" },
            { num: 2, label: "Level" },
            { num: 3, label: "Count" },
            { num: 4, label: "Types" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                step >= s.num ? "bg-gradient-hero text-white" : "glass-surface text-secondary-col"
              }`}>
                {step > s.num ? <Check className="w-3 h-3" /> : s.num}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 3 && <ChevronLeft className="w-4 h-4 text-muted-col rotate-0" />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Upload File */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base p-8"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-hero/10 text-gradient-hero flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-display font-bold text-primary-col mb-2">Upload Source File</h2>
            <p className="text-secondary-col text-sm">Upload a file to extract content and generate questions</p>
          </div>

          <div className="border-2 border-dashed border-glass-border rounded-2xl p-8 text-center hover:border-primary/30 transition cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <File className="w-12 h-12 text-muted-col mx-auto mb-3" />
            <p className="text-primary-col font-semibold mb-1">Click to upload or drag and drop</p>
            <p className="text-muted-col text-xs">PDF, DOCX, TXT, Markdown (max 10MB)</p>
          </div>

          {uploadedFile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 rounded-xl bg-[var(--status-active)]/10 border border-[var(--status-active)]/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--status-active)]/20 text-[var(--status-active)] flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-primary-col font-semibold text-sm">{uploadedFile.name}</p>
                  <p className="text-muted-col text-xs">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => setUploadedFile(null)}
                  className="p-2 rounded-lg hover:bg-[var(--status-rejected)]/10 text-muted-col hover:text-[var(--status-rejected)] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!uploadedFile}
              className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next: Choose Level <ChevronLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Choose JLPT Level */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base p-8"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-hero/10 text-gradient-hero flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-display font-bold text-primary-col mb-2">Choose JLPT Level</h2>
            <p className="text-secondary-col text-sm">Select the target JLPT level for generated questions</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setSelectedLevel("auto")}
              className={`p-4 rounded-xl border text-left transition ${
                selectedLevel === "auto"
                  ? "bg-gradient-hero/10 border-primary/30 text-primary"
                  : "glass-surface text-secondary-col hover:border-primary/20"
              }`}
            >
              <Sparkles className={`w-5 h-5 mb-2 ${selectedLevel === "auto" ? "text-primary" : "text-muted-col"}`} />
              <p className="font-bold text-sm">Auto Detect</p>
              <p className="text-xs text-muted-col mt-1">AI will analyze content</p>
            </button>
            {JLPT_LEVELS.map(level => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`p-4 rounded-xl border text-left transition ${
                  selectedLevel === level
                    ? "bg-gradient-hero/10 border-primary/30 text-primary"
                    : "glass-surface text-secondary-col hover:border-primary/20"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-sm font-bold ${
                  selectedLevel === level ? "bg-primary text-white" : "bg-primary/10 text-primary"
                }`}>
                  {level}
                </div>
                <p className="font-bold text-sm">{level}</p>
                <p className="text-xs text-muted-col mt-1">
                  {level === "N5" ? "Beginner" : level === "N4" ? "Elementary" : level === "N3" ? "Intermediate" : level === "N2" ? "Upper-Intermediate" : "Advanced"}
                </p>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-xl glass-surface text-sm font-bold text-secondary-col hover:bg-[var(--accent)] transition flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center gap-2"
            >
              Next: Count <ChevronLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Choose Question Count */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base p-8"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-hero/10 text-gradient-hero flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-display font-bold text-primary-col mb-2">Choose Question Count</h2>
            <p className="text-secondary-col text-sm">Select how many questions to generate</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {QUESTION_COUNTS.map(count => (
              <button
                key={count}
                onClick={() => { setQuestionCount(count); setCustomCount(""); }}
                className={`p-6 rounded-xl border text-center transition ${
                  questionCount === count && !customCount
                    ? "bg-gradient-hero/10 border-primary/30 text-primary"
                    : "glass-surface text-secondary-col hover:border-primary/20"
                }`}
              >
                <p className="font-display font-black text-3xl mb-1">{count}</p>
                <p className="text-xs">questions</p>
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              Custom Count (1-100)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={customCount}
              onChange={e => { setCustomCount(e.target.value); setQuestionCount(10); }}
              placeholder="Enter custom number..."
              className="w-full px-4 py-3 rounded-xl input-glass text-sm"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl glass-surface text-sm font-bold text-secondary-col hover:bg-[var(--accent)] transition flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center gap-2"
            >
              Next: Types <ChevronLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Choose Question Types */}
      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base p-8"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-hero/10 text-gradient-hero flex items-center justify-center mx-auto mb-4">
              <Wand2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-display font-bold text-primary-col mb-2">Choose Question Types</h2>
            <p className="text-secondary-col text-sm">Select which types of questions to generate</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {([
              { type: "vocabulary" as QuestionType, icon: BookOpen, color: "blue", label: "Vocabulary", desc: "Kanji readings, word meanings" },
              { type: "grammar" as QuestionType, icon: FileText, color: "green", label: "Grammar", desc: "Grammar patterns and usage" },
              { type: "reading" as QuestionType, icon: File, color: "purple", label: "Reading", desc: "Comprehension passages" },
              { type: "listening" as QuestionType, icon: Loader2, color: "orange", label: "Listening", desc: "Audio transcript questions" },
            ]).map(item => {
              const isSelected = selectedTypes.includes(item.type);
              const colorMap: Record<string, { active: string; bg: string }> = {
                blue: { active: "text-blue-500", bg: "bg-blue-500" },
                green: { active: "text-green-500", bg: "bg-green-500" },
                purple: { active: "text-purple-500", bg: "bg-purple-500" },
                orange: { active: "text-orange-500", bg: "bg-orange-500" },
              };
              const colors = colorMap[item.color];
              const Icon = item.icon;

              return (
                <button
                  key={item.type}
                  onClick={() => toggleQuestionType(item.type)}
                  className={`p-5 rounded-xl border text-left transition ${
                    isSelected
                      ? `border-${item.color}-500/30 bg-${item.color}-500/10`
                      : "glass-surface hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl ${isSelected ? `${colors.bg}/20 ${colors.active}` : "bg-primary/10 text-primary"} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${isSelected ? colors.active : "text-primary-col"}`}>{item.label}</p>
                      <p className="text-xs text-muted-col">{item.desc}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? `${colors.bg} border-transparent` : "border-[var(--border)]"
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-xl glass-surface text-sm font-bold text-secondary-col hover:bg-[var(--accent)] transition flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={selectedTypes.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" /> Generate Questions
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 5: Generating / Results */}
      {step === 5 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {isGenerating ? (
            <div className="card-base p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-hero/10 flex items-center justify-center mx-auto mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <Sparkles className="w-10 h-10 text-gradient-hero" />
                </motion.div>
              </div>
              <h2 className="text-xl font-display font-bold text-primary-col mb-2">Generating Questions...</h2>
              <p className="text-secondary-col text-sm mb-4">AI is analyzing your file and creating questions</p>
              <div className="flex items-center justify-center gap-2 text-muted-col text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing {uploadedFile?.name}...
              </div>
            </div>
          ) : generatedExam && (
            <>
              {/* Summary */}
              <div className="card-base p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center text-white">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display font-bold text-primary-col text-lg">{generatedExam.title}</h2>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-col">
                      <span>{generatedExam.sourceFile}</span>
                      <span>·</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">{generatedExam.level}</span>
                      <span>·</span>
                      <span>{generatedExam.version}</span>
                      <span>·</span>
                      <span>{generatedExam.questions.length} questions</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap mb-4">
                  {generatedExam.questionTypes.map(type => (
                    <span key={type} className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                      {type}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveDraft}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/10 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Added to Exam Bank
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Generate More
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-primary-col">Generated Questions ({generatedExam.questions.length})</h3>
                {generatedExam.questions.length === 0 ? (
                  <div className="card-base p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-muted-col mx-auto mb-3" />
                    <p className="text-secondary-col">No questions generated yet.</p>
                  </div>
                ) : (
                  generatedExam.questions.map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      index={i}
                      onEdit={() => handleEditQuestion(q)}
                      onDelete={() => handleDeleteQuestion(q.id)}
                      onRegenerate={() => handleRegenerateQuestion(q.id)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Question Editor Modal */}
      <AnimatePresence>
        {editingQuestion && (
          <QuestionEditorModal
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onClose={() => setEditingQuestion(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast message={toast?.message ?? ""} type={toast?.type ?? "info"} visible={!!toast} />
    </div>
  );
}
