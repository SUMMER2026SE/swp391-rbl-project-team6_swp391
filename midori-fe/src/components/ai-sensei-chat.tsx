import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import {
  Send,
  BookOpen,
  GraduationCap,
  Headphones,
  Mic2,
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
} from "lucide-react";
import { aiApi } from "@/lib/api/ai";
import type { AiConversation, AiMessage, ConversationMessagesResponse } from "@/types/ai";

// ═══════════════════════════════════════════════════════════════════
// MOCK STUDY MATERIALS (FRONTEND ONLY)
// ═══════════════════════════════════════════════════════════════════

interface VocabItem {
  jp: string;
  reading: string;
  vi: string;
  example?: string;
}

interface GrammarItem {
  pattern: string;
  meaning: string;
  formation: string;
  examples: { ja: string; vi: string }[];
  notes?: string;
}

interface MaterialContent {
  id: string;
  type: "vocabulary" | "grammar" | "reading" | "listening" | "shadowing";
  title: string;
  level: string;
  content: VocabItem[] | GrammarItem[] | string;
}

const studyMaterials: MaterialContent[] = [
  {
    id: "n5_vocab_01",
    type: "vocabulary",
    title: "N5 Vocabulary - Bài 1",
    level: "N5",
    content: [
      { jp: "食べる", reading: "たべる", vi: "ăn", example: "日本食を食べる (ăn thức ăn Nhật)" },
      { jp: "飲む", reading: "のむ", vi: "uống", example: "水を飲む (uống nước)" },
      { jp: "行く", reading: "いく", vi: "đi", example: "学校に行く (đi học)" },
      { jp: "来る", reading: "くる", vi: "đến", example: "友達が来る (bạn đến)" },
      { jp: "見る", reading: "みる", vi: "xem", example: "映画を見る (xem phim)" },
      { jp: "聞く", reading: "きく", vi: "nghe/hỏi", example: "音楽を聞く (nghe nhạc)" },
      { jp: "読む", reading: "よむ", vi: "đọc", example: "本を読む (đọc sách)" },
      { jp: "書く", reading: "かく", vi: "viết", example: "手紙を書く (viết thư)" },
      { jp: "話す", reading: "はなす", vi: "nói", example: "日本語を話す (nói tiếng Nhật)" },
      { jp: "寝る", reading: "ねる", vi: "ngủ", example: "早く寝る (đi ngủ sớm)" },
    ] as VocabItem[],
  },
  {
    id: "n5_grammar_01",
    type: "grammar",
    title: "N5 Grammar - です",
    level: "N5",
    content: [
      {
        pattern: "〜です",
        meaning: "Diễn đạt sự lịch sự, phép lịch sự",
        formation: "[Danh từ/Tính từ] + です",
        examples: [
          { ja: "私は学生です", vi: "Tôi là sinh viên" },
          { ja: "今日は暑いです", vi: "Hôm nay nóng" },
        ],
        notes: "Đuôi です dùng để biểu thị thái độ lịch sự khi nói chuyện",
      },
      {
        pattern: "〜ではありません",
        meaning: "Phủ định của です",
        formation: "[Danh từ/Tính từ] + ではありません",
        examples: [
          { ja: "私は先生ではありません", vi: "Tôi không phải là giáo viên" },
          { ja: "今日は寒くではありません", vi: "Hôm nay không lạnh" },
        ],
        notes: "Dạng phủ định lịch sự",
      },
      {
        pattern: "〜ですか",
        meaning: "Câu hỏi",
        formation: "[Câu] + か",
        examples: [
          { ja: "あなたは学生ですか", vi: "Bạn là sinh viên à?" },
          { ja: "これは何ですか", vi: "Cái này là gì?" },
        ],
      },
    ] as GrammarItem[],
  },
  {
    id: "n5_reading_01",
    type: "reading",
    title: "N5 Reading - Bài đọc 1",
    level: "N5",
    content: `私の名前は田中です。今日は九月十八日です。
私は日本の大学生です。毎朝、六時半に起きます。
学校は九時に始まります。五時に終わります。
放課後、图书馆で勉强します。
周末和朋友打篮球。`,
  },
  {
    id: "n5_listening_01",
    type: "listening",
    title: "N5 Listening - Dialog 1",
    level: "N5",
    content: `A: すみません、图书馆はどこですか。
B: 图书馆は二階です。
A: ありがとうございます。
B: どういたしまして。`,
  },
  {
    id: "n5_shadowing_01",
    type: "shadowing",
    title: "N5 Shadowing - Greeting",
    level: "N5",
    content: `おはようございます (6-12h)
こんにちは (12-18h)
こんばんは (18h trở đi)
おやすみなさい (trước khi ngủ)
はじめまして (gặp lần đầu)
よろしくおねがいします (rất vui được làm quen)`,
  },
];

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
}

const BACKEND_ROLE_MAP: Record<AiMessage["role"], MessageRole> = {
  USER: "user",
  ASSISTANT: "ai",
};

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  userAnswer?: number;
  answered?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function highlightJapanese(text: string): React.ReactNode {
  const parts = text.split(/([\u3040-\u309F\u30A0-\u30FF]+)/g);
  return parts.map((part, i) =>
    /[\u3040-\u309F\u30A0-\u30FF]/.test(part) ? (
      <span key={i} className="text-primary font-bold">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

// ═══════════════════════════════════════════════════════════════════
// AI ENGINE - Only uses selected material
// ═══════════════════════════════════════════════════════════════════

function searchInMaterial(material: MaterialContent, query: string): string | null {
  const q = query.toLowerCase();

  if (material.type === "vocabulary") {
    const vocabList = material.content as VocabItem[];
    for (const item of vocabList) {
      if (
        item.jp.includes(query) ||
        item.reading.includes(query) ||
        item.vi.toLowerCase().includes(q) ||
        item.example?.toLowerCase().includes(q)
      ) {
        return (
          item.jp +
          "（" +
          item.reading +
          "） = " +
          item.vi +
          "\n\n" +
          "Ví dụ: " +
          (item.example || "Không có ví dụ") +
          "\n\n" +
          "Source: " +
          material.title
        );
      }
    }
  }

  if (material.type === "grammar") {
    const grammarList = material.content as GrammarItem[];
    for (const item of grammarList) {
      if (item.pattern.includes(query) || item.meaning.toLowerCase().includes(q)) {
        const examples = item.examples
          .map((ex, i) => i + 1 + ". " + ex.ja + " - " + ex.vi)
          .join("\n");

        return (
          item.pattern +
          "\n\n" +
          "Nghĩa: " +
          item.meaning +
          "\n\n" +
          "Cách dùng: " +
          item.formation +
          "\n\n" +
          "Ví dụ:\n" +
          examples +
          "\n\n" +
          (item.notes ? "Ghi chú: " + item.notes + "\n\n" : "") +
          "Source: " +
          material.title
        );
      }
    }
  }

  if (material.type === "reading") {
    const content = material.content as string;
    if (content.toLowerCase().includes(q)) {
      return "Nội dung bài đọc\n\n" + content + "\n\nSource: " + material.title;
    }
  }

  if (material.type === "listening") {
    const content = material.content as string;
    if (content.toLowerCase().includes(q)) {
      return "Script bài nghe\n\n" + content + "\n\nSource: " + material.title;
    }
  }

  if (material.type === "shadowing") {
    const content = material.content as string;
    if (content.toLowerCase().includes(q)) {
      return "Script shadowing\n\n" + content + "\n\nSource: " + material.title;
    }
  }

  return null;
}

function generateQuizFromMaterial(material: MaterialContent): QuizQuestion[] {
  const quizzes: QuizQuestion[] = [];

  if (material.type === "vocabulary") {
    const vocabList = material.content as VocabItem[];
    vocabList.slice(0, 4).forEach((item) => {
      const otherWords = vocabList.filter((v) => v.jp !== item.jp).map((v) => v.vi);
      const wrongOptions = otherWords.slice(0, 3);

      quizzes.push({
        question: `${item.jp}（${item.reading}） nghĩa là gì?`,
        options: shuffleArray([item.vi, ...wrongOptions]),
        correctIndex: 0,
      });
    });
  }

  if (material.type === "grammar") {
    const grammarList = material.content as GrammarItem[];
    grammarList.slice(0, 3).forEach((item) => {
      quizzes.push({
        question: `${item.pattern} có nghĩa là gì?`,
        options: shuffleArray([item.meaning, "Không rõ", "Sai", "Khác"]),
        correctIndex: 0,
      });
    });
  }

  return quizzes.slice(0, 4);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateAIResponse(
  query: string,
  material: MaterialContent | null,
  mode: Mode,
): { content: string; source?: string; isQuiz?: boolean; quizData?: QuizQuestion[] } {
  if (!material) {
    return {
      content:
        "Chưa chọn tài liệu học tập\n\nBạn có thể chọn tài liệu để AI trả lời đúng trọng tâm bài học.\n\nChọn loại tài liệu: Vocabulary, Grammar, Reading, Listening, hoặc Shadowing",
    };
  }

  if (mode === "practice") {
    const quizzes = generateQuizFromMaterial(material);
    return {
      content: "Practice Quiz - " + material.title + "\n\nHãy trả lời các câu hỏi sau:",
      isQuiz: true,
      quizData: quizzes,
      source: material.title,
    };
  }

  const result = searchInMaterial(material, query);

  if (result) {
    return {
      content: result,
      source: material.title,
    };
  }

  return {
    content:
      "Thông tin này không có trong tài liệu bạn đã chọn.\n\nBạn đang sử dụng: " +
      material.title +
      '\n\nTài liệu này không chứa thông tin về "' +
      query +
      '".\n\nGợi ý:\n• Hãy thử hỏi về từ vựng hoặc ngữ pháp có trong bài\n• Hoặc chọn tài liệu khác phù hợp với câu hỏi của bạn',
    source: material.title,
  };
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

  const typeIcons = {
    vocabulary: BookOpen,
    grammar: GraduationCap,
    reading: FileText,
    listening: Headphones,
    shadowing: Mic2,
  };

  const TypeIcon = selected ? typeIcons[selected.type] : BookOpen;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
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
            className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs text-muted-foreground font-medium">
                Chọn tài liệu để AI trả lời
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {studyMaterials.map((material) => {
                const Icon = typeIcons[material.type];
                return (
                  <button
                    key={material.id}
                    onClick={() => {
                      onSelect(material);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      selected?.id === material.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selected?.id === material.id
                          ? "bg-primary text-white"
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{material.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {material.type} · {material.level}
                      </p>
                    </div>
                    {selected?.id === material.id && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
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
    <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookMarked className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold">Material Preview</h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Title</span>
          <span className="text-sm font-medium">{material.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Type</span>
          <span className="text-sm font-medium capitalize">{material.type}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Level</span>
          <span className="text-sm font-medium">{material.level}</span>
        </div>

        {material.type === "vocabulary" && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-muted-foreground mb-1">Preview:</p>
            <div className="space-y-1">
              {(material.content as VocabItem[]).slice(0, 3).map((item, i) => (
                <p key={i} className="text-sm">
                  <span className="font-bold text-primary">{item.jp}</span>
                  <span className="text-muted-foreground">（{item.reading}）</span>
                  <span className="ml-1">= {item.vi}</span>
                </p>
              ))}
              <p className="text-xs text-muted-foreground">
                ...và {(material.content as VocabItem[]).length - 3} từ khác
              </p>
            </div>
          </div>
        )}

        {material.type === "grammar" && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-muted-foreground mb-1">Patterns:</p>
            <div className="space-y-1">
              {(material.content as GrammarItem[]).slice(0, 3).map((item, i) => (
                <p key={i} className="text-sm">
                  <span className="font-bold text-primary">{item.pattern}</span>
                  <span className="ml-1">= {item.meaning}</span>
                </p>
              ))}
            </div>
          </div>
        )}
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
              ? "bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700"
              : "bg-gradient-hero text-white"
          }`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {msg.content.split("\n").map((line, i) => (
              <p key={i} className="mb-1 last:mb-0">
                {line.startsWith("## ") ? (
                  <span className="font-bold text-base">{line.replace("## ", "")}</span>
                ) : line.startsWith("**") ? (
                  <span className="font-semibold">{line.replace(/\*\*/g, "")}</span>
                ) : line.startsWith("❌") || line.startsWith("⚠️") ? (
                  <span className={line.startsWith("❌") ? "text-red-500" : "text-amber-500"}>
                    {line}
                  </span>
                ) : (
                  highlightJapanese(line)
                )}
              </p>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 mt-1 mr-1">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
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

function QuizCard({
  quiz,
  onAnswer,
  onClose,
}: {
  quiz: QuizQuestion[];
  onAnswer: (index: number, answer: number) => void;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>(
    new Array(quiz.length).fill(undefined),
  );
  const [submitted, setSubmitted] = useState(false);

  const current = quiz[currentIndex];
  const answeredCount = answers.filter((a) => a !== undefined).length;
  const correctCount = answers.filter((a, i) => a === quiz[i].correctIndex).length;
  const score = quiz.length > 0 ? Math.round((correctCount / quiz.length) * 100) : 0;

  const handleSelect = (optionIndex: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold">Practice Quiz</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>
            Câu {currentIndex + 1}/{quiz.length}
          </span>
          <span>
            {answeredCount}/{quiz.length} answered
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(answeredCount / quiz.length) * 100}%` }}
          />
        </div>
      </div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-4 p-3 rounded-xl text-center ${
            score >= 75
              ? "bg-green-50 border border-green-200"
              : "bg-amber-50 border border-amber-200"
          }`}
        >
          <div className="text-2xl font-bold">{score}%</div>
          <div className="text-xs">
            {correctCount}/{quiz.length} correct
          </div>
        </motion.div>
      )}

      <div className="mb-4">
        <p className="text-sm font-medium mb-3">{current.question}</p>
        <div className="space-y-2">
          {current.options.map((option, i) => {
            let className =
              "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600";

            if (submitted) {
              if (i === current.correctIndex) {
                className = "bg-green-50 border-green-300 text-green-700 font-medium";
              } else if (answers[currentIndex] === i) {
                className = "bg-red-50 border-red-300 text-red-700";
              }
            } else if (answers[currentIndex] === i) {
              className = "bg-primary/10 border-primary/30";
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={submitted}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${className}`}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700/50"
        >
          Previous
        </button>

        {currentIndex < quiz.length - 1 ? (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            disabled={answers[currentIndex] === undefined}
            className="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-xl disabled:opacity-50 hover:bg-primary/90 transition"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={answeredCount < quiz.length || submitted}
            className="flex-1 px-4 py-2 text-sm bg-gradient-hero text-white rounded-xl disabled:opacity-50 hover:opacity-90 transition"
          >
            Submit Quiz
          </button>
        )}
      </div>
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
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);

  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setLoadingConversations] = useState(false);
  const [isSendingMessage, setSendingMessage] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Boot state to prevent flicker during reload restore
  const [chatBootState, setChatBootState] = useState<"loading" | "ready" | "error">("loading");

  // Edit mode state
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
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
      const mapped: Message[] = data.messages.map((msg) => ({
        id: msg.id,
        role: BACKEND_ROLE_MAP[msg.role],
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));
      setMessages(mapped);
      // Set active conversation ID when messages load successfully
      setActiveConversationId(conversationId);
      return true;
    } catch (error) {
      console.error("Failed to load messages", error);
      setApiError("Không tải được tin nhắn của conversation.");
      // Clear active conversation on error to show proper state
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
    setQuizData(null);
    setEditingMessage(null);
    setEditInput("");
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
          setQuizData(null);
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
    setEditingMessage({ id: msg.id, content: msg.content });
    setEditInput(msg.content);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setEditInput("");
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingMessage) return;
    const trimmed = editInput.trim();
    if (!trimmed) return;
    if (!activeConversationId) return;

    setSavingEdit(true);
    setApiError(null);
    try {
      const data = await aiApi.updateUserMessage(activeConversationId, editingMessage.id, {
        content: trimmed,
      });
      const mapped: Message[] = data.messages.map((msg) => ({
        id: msg.id,
        role: BACKEND_ROLE_MAP[msg.role],
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));
      setMessages(mapped);
      setEditingMessage(null);
      setEditInput("");
    } catch (error) {
      console.error("Failed to edit message", error);
      setApiError("Không sửa được tin nhắn. Vui lòng thử lại.");
    } finally {
      setSavingEdit(false);
    }
  }, [editingMessage, editInput, activeConversationId]);

  const handleSend = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed || isSendingMessage) return;

      const optimisticUserMsg: Message = {
        id: genId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      // Add optimistic user message for immediate UI feedback
      setMessages((m) => [...m, optimisticUserMsg]);
      setInput("");
      setApiError(null);
      setEditingMessage(null);
      setEditInput("");
      setIsTyping(true);

      try {
        const response = await aiApi.chat({
          message: trimmed,
          conversationId: activeConversationId ?? undefined,
        });

        // Reload messages to get real backend IDs (replaces optimistic messages with real ones)
        const success = await loadMessages(response.conversationId);

        if (success) {
          sessionStorage.setItem("midori_ai_active_conversation_id", response.conversationId);
        }

        await loadConversations();
      } catch (error) {
        console.error("Failed to send message", error);
        setApiError("Gửi tin nhắn thất bại. Vui lòng thử lại.");
        // Remove the optimistic user message since send failed
        setMessages((m) => m.slice(0, -1));
      } finally {
        setIsTyping(false);
      }
    },
    [input, isSendingMessage, activeConversationId, loadConversations],
  );

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    if (!quizData) return;
    const newQuiz = [...quizData];
    newQuiz[questionIndex] = { ...newQuiz[questionIndex], userAnswer: answerIndex, answered: true };
    setQuizData(newQuiz);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === "practice") {
      handleSend("Tạo quiz từ tài liệu");
    }
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
    // Only proceed when conversations are loaded and boot hasn't been initialized
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
      // Reload case: restore active conversation
      // Note: we trust the stored ID from sessionStorage.
      // loadMessages will fail gracefully if the ID is invalid or doesn't belong to user.
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
      // Fresh open or no stored id: show New Chat
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
    <div className="h-[calc(100vh-7rem)] flex gap-4">
      {/* Left Panel - Material Selection & Preview */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">Conversations</h3>
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
                  className={`flex items-center gap-1 p-2 rounded-xl text-xs transition-all group ${
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <button
                    onClick={() => handleSelectConversation(conversation)}
                    className="flex-1 text-left truncate"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{conversation.title || "New chat"}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
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

        <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold">Material Selection</h3>
          </div>

          <MaterialSelector selected={selectedMaterial} onSelect={setSelectedMaterial} />

          <div className="mt-4">
            <ModeToggle mode={mode} onChange={handleModeChange} />
            <p className="text-[10px] text-muted-foreground mt-2">{materialHelper}</p>
          </div>
        </div>

        <MaterialPreview material={selectedMaterial} />

        {/* Source Indicator */}
        {selectedMaterial && (
          <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-3 border border-primary/20">
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

      {/* Right Panel - Chat */}
      <div className="flex-1 flex flex-col min-w-0 rounded-2xl overflow-hidden bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-hero flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold">AI Sensei</h2>
              <p className="text-[10px] text-muted-foreground">
                NotebookLM-style learning assistant
              </p>
            </div>
          </div>

          {selectedMaterial && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs">
              <BookMarked className="w-3 h-3" />
              <span className="font-medium">{selectedMaterial.type}</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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

          {isTyping && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              <span>AI Sensei đang trả lời...</span>
            </div>
          )}

          {quizData && quizData.length > 0 && (
            <QuizCard
              quiz={quizData}
              onAnswer={handleQuizAnswer}
              onClose={() => setQuizData(null)}
            />
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
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
                value={editInput}
                onChange={(e) => setEditInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                }}
                className="w-full resize-none rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/50 px-3 py-2 text-sm outline-none focus:border-amber-400"
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
              className="flex-1 resize-none rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
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
      </div>
    </div>
  );
}
