// JLPT Exam Mock Data
// This file contains mock data for JLPT Exam Management

export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type ExamStatus = "Active" | "Draft" | "Archived";

export interface JLPTExam {
  id: string;
  level: JLPTLevel;
  name: string;
  status: ExamStatus;
  duration: number;
  questions: ExamQuestion[];
  updatedAt: string;
  createdAt: string;
}

// ============================================
// 1. TYPE DEFINITIONS (first)
// ============================================

// Exam Question Interface
export interface ExamQuestion {
  id: string;
  section: "Vocabulary" | "Grammar" | "Reading" | "Listening";
  questionNumber: number;
  type: "Multiple Choice" | "Fill in Blank" | "Listening Audio";
  question: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  audioUrl?: string;
  audioFileName?: string;
  passage?: string;
}

// ============================================
// 2. CONSTANTS (must be before usage)
// ============================================

// Default JLPT exam structure by level
export const DEFAULT_EXAM_CONFIG: Record<
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

// Level colors for consistent UI (unified palette matching Question Bank)
export const levelColors: Record<
  JLPTLevel,
  {
    bg: string;
    text: string;
    border: string;
    hover: string;
    icon: string;
  }
> = {
  N5: {
    bg: "bg-[oklch(0.62_0.18_270)]/12",
    text: "text-[oklch(0.62_0.18_270)]",
    border: "border-[oklch(0.62_0.18_270)]/20",
    hover: "hover:bg-[oklch(0.62_0.18_270)]/20",
    icon: "bg-[oklch(0.62_0.18_270)]/20",
  },
  N4: {
    bg: "bg-[oklch(0.62_0.18_270)]/12",
    text: "text-[oklch(0.62_0.18_270)]",
    border: "border-[oklch(0.62_0.18_270)]/20",
    hover: "hover:bg-[oklch(0.62_0.18_270)]/20",
    icon: "bg-[oklch(0.62_0.18_270)]/20",
  },
  N3: {
    bg: "bg-[oklch(0.62_0.18_270)]/12",
    text: "text-[oklch(0.62_0.18_270)]",
    border: "border-[oklch(0.62_0.18_270)]/20",
    hover: "hover:bg-[oklch(0.62_0.18_270)]/20",
    icon: "bg-[oklch(0.62_0.18_270)]/20",
  },
  N2: {
    bg: "bg-[oklch(0.62_0.18_270)]/12",
    text: "text-[oklch(0.62_0.18_270)]",
    border: "border-[oklch(0.62_0.18_270)]/20",
    hover: "hover:bg-[oklch(0.62_0.18_270)]/20",
    icon: "bg-[oklch(0.62_0.18_270)]/20",
  },
  N1: {
    bg: "bg-[oklch(0.62_0.18_270)]/12",
    text: "text-[oklch(0.62_0.18_270)]",
    border: "border-[oklch(0.62_0.18_270)]/20",
    hover: "hover:bg-[oklch(0.62_0.18_270)]/20",
    icon: "bg-[oklch(0.62_0.18_270)]/20",
  },
};

// ============================================
// 3. MOCK DATA (depends on constants above)
// ============================================

// Realistic Japanese vocabulary questions
const vocabularyData = [
  {
    q: "Triangle - what kanji?",
    opts: ["三角形", "四角形", "円形", "星形"],
    ans: 0,
    exp: "さんかく = triangle (三角形)",
  },
  {
    q: "Obvious - what meaning?",
    opts: ["Dark", "Bright", "Big", "Small"],
    ans: 1,
    exp: "あきらか = obvious, clear",
  },
  {
    q: "Same as 'until now'?",
    opts: ["From now", "At that time", "Until now", "Anytime"],
    ans: 2,
    exp: "いままで = until now, so far",
  },
  {
    q: "How to read おこなう?",
    opts: ["おこる", "おこなう", "おこす", "おこした"],
    ans: 1,
    exp: "おこなう = to perform, to do",
  },
  {
    q: "Kanji for きほん?",
    opts: ["基本", "貴本", "紀本", "木本"],
    ans: 0,
    exp: "きほん = basic, fundamentals",
  },
  {
    q: "Kanji for べんきょう?",
    opts: ["勉強", "勉学", "勉学", "勉校"],
    ans: 0,
    exp: "べんきょう = study",
  },
  {
    q: "Kanji for しけん?",
    opts: ["試験", "試権", "試見", "試験"],
    ans: 0,
    exp: "しけん = exam, test",
  },
  {
    q: "Kanji for がっこう?",
    opts: ["学校", "学向", "学校", "学行"],
    ans: 0,
    exp: "がっこう = school",
  },
  {
    q: "Opposite of 好き?",
    opts: ["愛する", "嫌い", "欲しい", "好き"],
    ans: 1,
    exp: "嫌い = dislike, hate",
  },
  {
    q: "Kanji for ともだち?",
    opts: ["友達", "友辺", "知人", "恋人"],
    ans: 0,
    exp: "ともだち = friend",
  },
  {
    q: "Meaning of 一番?",
    opts: ["Second", "Third", "First", "Last"],
    ans: 2,
    exp: "いちばん = first, best",
  },
  { q: "Kanji for ひと?", opts: ["人", "大", "小", "中"], ans: 0, exp: "ひと = person, people" },
  {
    q: "Meaning of 上手?",
    opts: ["Bad at", "Good at", "Medium", "Okay"],
    ans: 1,
    exp: "じょうず = skillful, good at",
  },
  { q: "Kanji for みず?", opts: ["水", "火", "木", "金"], ans: 0, exp: "みず = water" },
  {
    q: "Opposite of 新幹線?",
    opts: ["Fast train", "Slow train", "Bus", "Plane"],
    ans: 1,
    exp: "Slow train is not the opposite concept",
  },
  { q: "Kanji for やま?", opts: ["山", "川", "海", "空"], ans: 0, exp: "やま = mountain" },
  {
    q: "Meaning of 大丈夫?",
    opts: ["Big problem", "It's okay", "Dangerous", "Sure"],
    ans: 1,
    exp: "だいじょうぶ = It's okay, no problem",
  },
  {
    q: "Kanji for でんわ?",
    opts: ["電話", "電弱", "電話", "電波"],
    ans: 0,
    exp: "でんわ = telephone",
  },
  {
    q: "Opposite of 高い?",
    opts: ["Expensive", "Cheap", "Low", "Free"],
    ans: 1,
    exp: "やすい = cheap, inexpensive",
  },
  {
    q: "Kanji for くるま?",
    opts: ["車", "船", "電車", "バス"],
    ans: 0,
    exp: "くるま = car, vehicle",
  },
];

// Grammar patterns
const grammarData = [
  {
    q: "Maybe - which grammar pattern?",
    opts: ["ました", "でしょう", "かもしれない", "ながら"],
    ans: 2,
    exp: "かもしれない = maybe, perhaps",
  },
  {
    q: "Correct usage of ~ている?",
    opts: ["たべる", "たべている", "たべた", "たべたい"],
    ans: 1,
    exp: "~ている = progressive/continuous",
  },
  {
    q: "How to express desire 'want to'?",
    opts: ["はしる", "はしりたい", "はしった", "はしっている"],
    ans: 1,
    exp: "~たい = to want to do",
  },
  {
    q: "Meaning of ~てください?",
    opts: ["please do", "did", "want to", "used to"],
    ans: 0,
    exp: "~てください = please do (polite request)",
  },
  {
    q: "Must/have to - which pattern?",
    opts: ["してもいい", "しなければならない", "したくない", "したかった"],
    ans: 1,
    exp: "なければならない = must, have to",
  },
  {
    q: "Usage of ~でしょう?",
    opts: ["completed", "guess/speculation", "command", "hope"],
    ans: 1,
    exp: "でしょう = probably, I think",
  },
  {
    q: "Easy to do - which pattern?",
    opts: ["むずかしい", "やさしい", "しやすい", "しにくい"],
    ans: 2,
    exp: "~やすい = easy to do",
  },
  {
    q: "While doing - which pattern?",
    opts: ["simultaneously", "next", "before", "after"],
    ans: 0,
    exp: "~ながら = while doing",
  },
  {
    q: "Because - which pattern?",
    opts: ["から", "まで", "より", "でも"],
    ans: 0,
    exp: "から = because, reason",
  },
  {
    q: "But/however - which pattern?",
    opts: ["そして", "でも", "から", "まで"],
    ans: 1,
    exp: "でも = but, however",
  },
  {
    q: "If/when - which pattern?",
    opts: ["とき", "ば", "なら", "どちらも"],
    ans: 0,
    exp: "とき = when, if",
  },
  {
    q: "Although - which pattern?",
    opts: ["けど", "けれど", " although", "both"],
    ans: 2,
    exp: "でも = although",
  },
  {
    q: "Must not - which pattern?",
    opts: ["しなければ", "してはいけない", "しなくても", "してもいい"],
    ans: 1,
    exp: "てはいけない = must not",
  },
  {
    q: "Already done - which pattern?",
    opts: ["する", "した", "している", "したことがある"],
    ans: 1,
    exp: "た form = completed action",
  },
  {
    q: "Try doing - which pattern?",
    opts: ["する", "してみよう", "した", "している"],
    ans: 1,
    exp: "~してみよう = let's try doing",
  },
  {
    q: "Was going to - which pattern?",
    opts: ["するつもりだった", "するはずだった", "したかった", "どちら"],
    ans: 0,
    exp: "つもりだった = was planning to",
  },
  {
    q: "Not only ~ but also?",
    opts: ["だけ", "しか", "だけでなく", "ものか"],
    ans: 2,
    exp: "だけでなく = not only ~ but also",
  },
  {
    q: "Cannot - which pattern?",
    opts: ["できる", "できない", "できるように", "できれば"],
    ans: 1,
    exp: "できない = cannot, unable",
  },
  {
    q: "Before doing - which pattern?",
    opts: ["あとで", "前に", "間に", "間に合う"],
    ans: 1,
    exp: "前に = before doing",
  },
  {
    q: "It seems that - which pattern?",
    opts: ["ようだ", "そうだ", "らしい", "全部"],
    ans: 0,
    exp: "ようだ = it seems that",
  },
];

// Reading passages with questions
const readingData = [
  {
    passage:
      "田中さんは毎日会社に通勤します。朝早く起きて、夜遅く帰ります。周末には友達と映画を見たり、買い物に行ったりします。",
    questions: [
      {
        q: "How does Tanaka-san commute?",
        opts: ["Car", "Train", "Bicycle", "Bus"],
        ans: 1,
        exp: "会社に通勤します = commutes to company",
      },
      {
        q: "What does Tanaka-san do on weekends?",
        opts: ["Work", "Study", "Entertainment", "Sleep"],
        ans: 2,
        exp: "映画を見たり、買い物に行ったり = watches movies, goes shopping",
      },
    ],
  },
  {
    passage:
      "日本の季節は四季があります。春は花が咲き、夏は暑いです。秋は涼しくて、冬は雪が降ります。",
    questions: [
      {
        q: "How many seasons does Japan have?",
        opts: ["Two", "Three", "Four", "Five"],
        ans: 2,
        exp: "四季 = four seasons",
      },
      {
        q: "What is summer like?",
        opts: ["Cold", "Cool", "Warm", "Hot"],
        ans: 3,
        exp: "夏はあつい = summer is hot",
      },
    ],
  },
  {
    passage:
      "田中さんの家は駅に近いです。歩いて5分です。，周囲には店屋も多いため、 生活得很.]]便利]です。",
    questions: [
      {
        q: "How far is Tanaka's house from station?",
        opts: ["10 min walk", "5 min walk", "15 min walk", "1 min walk"],
        ans: 1,
        exp: "歩いて5分 = 5 minute walk",
      },
      {
        q: "What is the neighborhood like?",
        opts: ["Quiet", "Convenient", "Noisy", "Empty"],
        ans: 1,
        exp: " 生活很便利 = life is convenient",
      },
    ],
  },
  {
    passage:
      "今日は友達と日本語を練習しました。互いに教え合いながら、進歩を感じる楽しい時間でした。",
    questions: [
      {
        q: "What did they do today?",
        opts: ["Watched TV", "Studied Japanese", "Played games", "Cooked"],
        ans: 1,
        exp: "日本語を練習しました = practiced Japanese",
      },
      {
        q: "How was the experience?",
        opts: ["Boring", "Fun and productive", "Difficult", "Tiring"],
        ans: 1,
        exp: "楽しい時間でした = it was a fun time",
      },
    ],
  },
];

// Listening audio data
const listeningData = [
  {
    fileName: "n5_listening_part1_section1.mp3",
    question: "What time will they meet?",
    opts: ["9 o'clock", "10 o'clock", "11 o'clock", "12 o'clock"],
    ans: 1,
    exp: "10時に会いましょう = Let's meet at 10",
  },
  {
    fileName: "n5_listening_part1_section2.mp3",
    question: "What does the woman recommend?",
    opts: ["Movie", "Drama", "Book", "Game"],
    ans: 0,
    exp: "女の子は映画を見ると言っています = Girl says she'll watch a movie",
  },
  {
    fileName: "n5_listening_part2_section1.mp3",
    question: "How's the weather?",
    opts: ["Sunny", "Cloudy", "Rainy", "Snowy"],
    ans: 2,
    exp: "午後に雨が降ります = Rain in the afternoon",
  },
  {
    fileName: "n5_listening_part2_section2.mp3",
    question: "Where is the station?",
    opts: ["Left", "Right", "Front", "Back"],
    ans: 0,
    exp: "左に曲がってください = Turn left",
  },
  {
    fileName: "n5_listening_part3_section1.mp3",
    question: "What did the man buy?",
    opts: ["Food", "Clothes", "Books", "Electronics"],
    ans: 0,
    exp: "食べ物を買いました = Bought food",
  },
  {
    fileName: "n5_listening_part3_section2.mp3",
    question: "How was the test?",
    opts: ["Easy", "Difficult", "Okay", "No answer"],
    ans: 1,
    exp: "難しかった = It was difficult",
  },
  {
    fileName: "n5_listening_part4_section1.mp3",
    question: "Where should they go?",
    opts: ["Park", "Restaurant", "School", "Hospital"],
    ans: 1,
    exp: "レストランに行きましょう = Let's go to restaurant",
  },
  {
    fileName: "n5_listening_part4_section2.mp3",
    question: "When does the class start?",
    opts: ["9 AM", "10 AM", "11 AM", "2 PM"],
    ans: 1,
    exp: "10時から始まります = Starts from 10",
  },
];

// ============================================
// 4. GENERATE MOCK DATA
// ============================================

// ============================================
// Helper to generate questions for an exam
function generateExamQuestions(
  examId: string,
  vocabCount: number,
  grammarCount: number,
  readingCount: number,
  listeningCount: number,
): ExamQuestion[] {
  const questions: ExamQuestion[] = [];
  let questionNumber = 1;

  // Vocabulary questions
  for (let i = 0; i < Math.min(vocabCount, vocabularyData.length); i++) {
    const v = vocabularyData[i % vocabularyData.length];
    questions.push({
      id: `${examId}-vocab-${i + 1}`,
      section: "Vocabulary",
      questionNumber: questionNumber++,
      type: "Multiple Choice",
      question: v.q,
      options: v.opts,
      correctAnswer: v.ans,
      explanation: v.exp,
    });
  }

  // Grammar questions
  for (let i = 0; i < Math.min(grammarCount, grammarData.length); i++) {
    const g = grammarData[i % grammarData.length];
    questions.push({
      id: `${examId}-grammar-${i + 1}`,
      section: "Grammar",
      questionNumber: questionNumber++,
      type: "Multiple Choice",
      question: g.q,
      options: g.opts,
      correctAnswer: g.ans,
      explanation: g.exp,
    });
  }

  // Reading questions
  for (let i = 0; i < Math.min(readingCount, 4); i++) {
    const r = readingData[i % readingData.length];
    const rq = r.questions[i % r.questions.length];
    questions.push({
      id: `${examId}-reading-${i + 1}`,
      section: "Reading",
      questionNumber: questionNumber++,
      type: "Multiple Choice",
      question: rq.q,
      options: rq.opts,
      correctAnswer: rq.ans,
      explanation: rq.exp,
      passage: r.passage,
    });
  }

  // Listening questions
  for (let i = 0; i < Math.min(listeningCount, listeningData.length); i++) {
    const l = listeningData[i % listeningData.length];
    questions.push({
      id: `${examId}-listening-${i + 1}`,
      section: "Listening",
      questionNumber: questionNumber++,
      type: "Listening Audio",
      question: l.question,
      options: l.opts,
      correctAnswer: l.ans,
      explanation: l.exp,
      audioFileName: l.fileName,
    });
  }

  return questions;
}

// Generate mock exams for each level
function generateMockExams(): JLPTExam[] {
  const exams: JLPTExam[] = [];
  const examCounts: Record<JLPTLevel, number> = {
    N5: 8,
    N4: 7,
    N3: 8,
    N2: 7,
    N1: 6,
  };

  const levels: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

  levels.forEach((level) => {
    const count = examCounts[level];
    const config = DEFAULT_EXAM_CONFIG[level];

    for (let i = 1; i <= count; i++) {
      let status: ExamStatus;
      if (i <= Math.floor(count * 0.6)) {
        status = "Active";
      } else if (i <= Math.floor(count * 0.85)) {
        status = "Draft";
      } else {
        status = "Archived";
      }

      const vocabVariation = Math.floor(Math.random() * 5) - 2;
      const grammarVariation = Math.floor(Math.random() * 5) - 2;
      const readingVariation = Math.floor(Math.random() * 5) - 2;
      const listeningVariation = Math.floor(Math.random() * 5) - 2;

      const examId = `${level.toLowerCase()}-exam-${String(i).padStart(2, "0")}`;

      const vocabCount = Math.max(10, config.vocabulary + vocabVariation);
      const grammarCount = Math.max(10, config.grammar + grammarVariation);
      const readingCount = Math.max(10, config.reading + readingVariation);
      const listeningCount = Math.max(10, config.listening + listeningVariation);

      const exam: JLPTExam = {
        id: examId,
        level,
        name: `JLPT ${level} Mock Test ${String(i).padStart(2, "0")}`,
        status,
        duration: config.duration,
        questions: generateExamQuestions(
          examId,
          vocabCount,
          grammarCount,
          readingCount,
          listeningCount,
        ),
        updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      };

      exams.push(exam);
    }
  });

  return exams;
}

// ============================================
// 5. MUTABLE IN-MEMORY STORE (shared across all pages)
// ============================================
let examStore: JLPTExam[] = generateMockExams();

// ============ CRUD Helper Functions ============

/**
 * Get all exams from the store
 */
export function getExams(): JLPTExam[] {
  return [...examStore];
}

/**
 * Get exams by JLPT level
 */
export function getExamsByLevel(level: JLPTLevel): JLPTExam[] {
  return examStore.filter((exam) => exam.level === level);
}

/**
 * Get a single exam by ID
 */
export function getExamById(id: string): JLPTExam | undefined {
  return examStore.find((exam) => exam.id === id);
}

/**
 * Update an existing exam in the store
 */
export function updateExam(updatedExam: JLPTExam): JLPTExam {
  const index = examStore.findIndex((e) => e.id === updatedExam.id);
  if (index === -1) {
    throw new Error(`Exam with id ${updatedExam.id} not found`);
  }
  examStore[index] = {
    ...updatedExam,
    updatedAt: new Date().toISOString(),
  };
  return examStore[index];
}

/**
 * Delete an exam (mark as archived)
 */
export function deleteExam(id: string): boolean {
  const exam = getExamById(id);
  if (!exam) return false;
  updateExam({ ...exam, status: "Archived" });
  return true;
}

/**
 * Create a new exam
 */
export function addExam(examData: {
  level: JLPTLevel;
  name: string;
  status: ExamStatus;
  duration: number;
  questions?: ExamQuestion[];
}): JLPTExam {
  const examId = `${examData.level.toLowerCase()}-exam-${String(examStore.length + 1).padStart(2, "0")}`;
  const newExam: JLPTExam = {
    id: examId,
    level: examData.level,
    name: examData.name,
    status: examData.status,
    duration: examData.duration,
    questions: examData.questions ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  examStore.push(newExam);
  return newExam;
}

/**
 * Get statistics for a level
 */
export function getLevelStats(level: JLPTLevel): {
  totalExams: number;
  activeExams: number;
  draftExams: number;
  archivedExams: number;
} {
  const levelExams = getExamsByLevel(level);
  return {
    totalExams: levelExams.length,
    activeExams: levelExams.filter((e) => e.status === "Active").length,
    draftExams: levelExams.filter((e) => e.status === "Draft").length,
    archivedExams: levelExams.filter((e) => e.status === "Archived").length,
  };
}

/**
 * Get total exam counts
 */
export function getTotalExams(): number {
  return examStore.length;
}

export function getActiveExams(): number {
  return examStore.filter((e) => e.status === "Active").length;
}

export function getArchivedExams(): number {
  return examStore.filter((e) => e.status === "Archived").length;
}

// ============================================
// 6. LEGACY EXPORTS (for backward compatibility)
// ============================================
export const mockExams: JLPTExam[] = []; // Deprecated - use getExams()

// Backward compatibility functions
export function getExamByIdLegacy(id: string): JLPTExam | undefined {
  return getExamById(id);
}

// ============================================
// 7. QUESTION GETTERS (depends on data above)
// ============================================

export function getExamQuestions(exam: JLPTExam): ExamQuestion[] {
  return exam.questions ?? [];
}

// ============================================
// 8. QUESTION COUNT HELPERS (computed, not stored)
// ============================================

export function getExamQuestionCounts(exam: JLPTExam): {
  vocabulary: number;
  grammar: number;
  reading: number;
  listening: number;
  total: number;
} {
  const questions = exam.questions ?? [];
  return {
    vocabulary: questions.filter((q) => q.section === "Vocabulary").length,
    grammar: questions.filter((q) => q.section === "Grammar").length,
    reading: questions.filter((q) => q.section === "Reading").length,
    listening: questions.filter((q) => q.section === "Listening").length,
    total: questions.length,
  };
}

// ============================================
// 9. QUESTION CRUD OPERATIONS
// ============================================

export function addQuestionToExam(examId: string, question: ExamQuestion): JLPTExam {
  const index = examStore.findIndex((e) => e.id === examId);
  if (index === -1) {
    throw new Error(`Exam with id ${examId} not found`);
  }
  examStore[index] = {
    ...examStore[index],
    questions: [...examStore[index].questions, question],
    updatedAt: new Date().toISOString(),
  };
  return examStore[index];
}

export function updateQuestionInExam(
  examId: string,
  questionId: string,
  updates: Partial<ExamQuestion>,
): JLPTExam {
  const index = examStore.findIndex((e) => e.id === examId);
  if (index === -1) {
    throw new Error(`Exam with id ${examId} not found`);
  }
  examStore[index] = {
    ...examStore[index],
    questions: examStore[index].questions.map((q) =>
      q.id === questionId ? { ...q, ...updates } : q,
    ),
    updatedAt: new Date().toISOString(),
  };
  return examStore[index];
}

export function deleteQuestionFromExam(examId: string, questionId: string): JLPTExam {
  const index = examStore.findIndex((e) => e.id === examId);
  if (index === -1) {
    throw new Error(`Exam with id ${examId} not found`);
  }
  examStore[index] = {
    ...examStore[index],
    questions: examStore[index].questions.filter((q) => q.id !== questionId),
    updatedAt: new Date().toISOString(),
  };
  return examStore[index];
}
