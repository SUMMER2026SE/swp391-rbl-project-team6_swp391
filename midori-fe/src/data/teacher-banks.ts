// JLPT Levels
export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type Skill = "Vocabulary" | "Grammar" | "Listening" | "Reading" | "Kanji";
export type Difficulty = "Easy" | "Medium" | "Hard";

// Question topics (from the Lovable reference's mock-data.ts)
export interface QuestionTopic {
  id: string;
  name: string;
  jpName: string;
  level: JLPTLevel;
  skill: Skill;
  questionCount: number;
  availableCount: number;
  easy: number;
  medium: number;
  hard: number;
}

export interface Question {
  id: string;
  topicId: string;
  level: JLPTLevel;
  skill: Skill;
  difficulty: Difficulty;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  points?: number;
}

export interface JlptExamSet {
  id: string;
  name: string;
  level: JLPTLevel;
  description: string;
  duration: number; // minutes
  totalQuestions: number;
  sections: { name: string; questions: number }[];
  difficulty: Difficulty;
  questionsAvailable: number;
  year: number;
  mix: { easy: number; medium: number; hard: number };
}

// Realistic mock data
export const QUESTION_TOPICS: QuestionTopic[] = [
  {
    id: "topic-001",
    name: "N5 Core Vocabulary",
    jpName: "N5 基本語彙",
    level: "N5",
    skill: "Vocabulary",
    questionCount: 120,
    availableCount: 120,
    easy: 60,
    medium: 40,
    hard: 20,
  },
  {
    id: "topic-002",
    name: "N5 Grammar Patterns",
    jpName: "N5 文法",
    level: "N5",
    skill: "Grammar",
    questionCount: 90,
    availableCount: 90,
    easy: 45,
    medium: 30,
    hard: 15,
  },
  {
    id: "topic-003",
    name: "N4 Vocabulary – Daily Life",
    jpName: "N4 語彙：日常",
    level: "N4",
    skill: "Vocabulary",
    questionCount: 60,
    availableCount: 55,
    easy: 25,
    medium: 25,
    hard: 10,
  },
  {
    id: "topic-004",
    name: "N4 Grammar (Te-form etc.)",
    jpName: "N4 文法",
    level: "N4",
    skill: "Grammar",
    questionCount: 110,
    availableCount: 110,
    easy: 40,
    medium: 50,
    hard: 20,
  },
  {
    id: "topic-005",
    name: "N4 Kanji 300",
    jpName: "N4 漢字 300",
    level: "N4",
    skill: "Kanji",
    questionCount: 150,
    availableCount: 150,
    easy: 60,
    medium: 60,
    hard: 30,
  },
  {
    id: "topic-006",
    name: "N3 Reading Comprehension",
    jpName: "N3 読解",
    level: "N3",
    skill: "Reading",
    questionCount: 80,
    availableCount: 80,
    easy: 20,
    medium: 40,
    hard: 20,
  },
  {
    id: "topic-007",
    name: "N3 Listening Practice",
    jpName: "N3 聴解",
    level: "N3",
    skill: "Listening",
    questionCount: 60,
    availableCount: 60,
    easy: 18,
    medium: 28,
    hard: 14,
  },
  {
    id: "topic-008",
    name: "N2 Grammar Advanced",
    jpName: "N2 文法",
    level: "N2",
    skill: "Grammar",
    questionCount: 140,
    availableCount: 120,
    easy: 35,
    medium: 65,
    hard: 40,
  },
  {
    id: "topic-009",
    name: "N2 Vocabulary – Business",
    jpName: "N2 語彙：ビジネス",
    level: "N2",
    skill: "Vocabulary",
    questionCount: 100,
    availableCount: 85,
    easy: 25,
    medium: 45,
    hard: 30,
  },
  {
    id: "topic-010",
    name: "N1 Academic Reading",
    jpName: "N1 学術読解",
    level: "N1",
    skill: "Reading",
    questionCount: 70,
    availableCount: 60,
    easy: 12,
    medium: 30,
    hard: 28,
  },
  {
    id: "topic-011",
    name: "N1 Kanji – Advanced",
    jpName: "N1 漢字",
    level: "N1",
    skill: "Kanji",
    questionCount: 120,
    availableCount: 100,
    easy: 24,
    medium: 48,
    hard: 48,
  },
];

export const QUESTIONS: Question[] = [
  {
    id: "q-001",
    topicId: "topic-001",
    level: "N5",
    skill: "Vocabulary",
    difficulty: "Easy",
    prompt: "What is the meaning of 一 (いち)?",
    options: ["One", "Two", "Three", "Four"],
    correctIndex: 0,
    explanation: "一 (ichi) means 'one' in Japanese.",
    points: 2,
  },
  {
    id: "q-002",
    topicId: "topic-001",
    level: "N5",
    skill: "Vocabulary",
    difficulty: "Easy",
    prompt: "What is the meaning of 二 (に)?",
    options: ["One", "Two", "Three", "Four"],
    correctIndex: 1,
    explanation: "二 (ni) means 'two' in Japanese.",
    points: 2,
  },
  {
    id: "q-003",
    topicId: "topic-002",
    level: "N5",
    skill: "Grammar",
    difficulty: "Medium",
    prompt: "Choose the correct particle: 猫 __ 魚を食べた。",
    options: ["が", "を", "に", "で"],
    correctIndex: 1,
    explanation: "を marks the direct object of the verb.",
    points: 3,
  },
  {
    id: "q-004",
    topicId: "topic-004",
    level: "N4",
    skill: "Vocabulary",
    difficulty: "Medium",
    prompt: "What does 食べる (taberu) mean?",
    options: ["To drink", "To eat", "To cook", "To buy"],
    correctIndex: 1,
    explanation: "食べる means 'to eat' in Japanese.",
    points: 3,
  },
  {
    id: "q-005",
    topicId: "topic-004",
    level: "N4",
    skill: "Grammar",
    difficulty: "Medium",
    prompt: "Which is the correct te-form of 行く (iku)?",
    options: ["行いて", "行って", "行いて", "行きって"],
    correctIndex: 1,
    explanation: "The te-form of 行く is 行って (itte).",
    points: 3,
  },
  {
    id: "q-006",
    topicId: "topic-008",
    level: "N3",
    skill: "Vocabulary",
    difficulty: "Hard",
    prompt: "What is the meaning of 面倒 (mendō)?",
    options: ["Convenient", "Troublesome", "Easy", "Difficult"],
    correctIndex: 1,
    explanation: "面倒 means 'troublesome' or 'bothersome'.",
    points: 5,
  },
  {
    id: "q-007",
    topicId: "topic-009",
    level: "N2",
    skill: "Vocabulary",
    difficulty: "Hard",
    prompt: "What does 挨拶 (aisatsu) mean?",
    options: ["Business", "Greeting", "Meeting", "Agreement"],
    correctIndex: 1,
    explanation: "挨拶 means 'greeting' or 'salutation'.",
    points: 4,
  },
  {
    id: "q-008",
    topicId: "topic-011",
    level: "N1",
    skill: "Kanji",
    difficulty: "Hard",
    prompt: "What reading does 曖昧 have?",
    options: ["あいまい", "げんみつ", "そっちょく", "ねっかん"],
    correctIndex: 0,
    explanation: "曖昧 is read as あいまい (aimai), meaning vague/ambiguous.",
    points: 5,
  },
];

export const JLPT_EXAM_SETS: JlptExamSet[] = [];

// Helper functions
export function getTopicsByLevel(level: JLPTLevel): QuestionTopic[] {
  return QUESTION_TOPICS.filter((t) => t.level === level);
}

export function getQuestionsByTopic(topicId: string): Question[] {
  return QUESTIONS.filter((q) => q.topicId === topicId);
}

export function getQuestionTopics() {
  return QUESTION_TOPICS;
}

export function getAvailableForTopics(topicIds: string[]): number {
  return QUESTION_TOPICS.filter((t) => topicIds.includes(t.id)).reduce(
    (sum, t) => sum + t.availableCount,
    0,
  );
}

export function getJlptByLevel(level: JLPTLevel): JlptExamSet[] {
  return [];
}

// ─── Data Bank Resources (mirrors Lovable mock-data.ts) ────────────────────────

export type ResourceType =
  | "Vocabulary Set"
  | "Grammar Note"
  | "Kanji List"
  | "Listening File"
  | "Reading Passage"
  | "Worksheet"
  | "Lesson Template";

export interface DataBankResource {
  id: string;
  title: string;
  jpTitle: string;
  type: ResourceType;
  level: JLPTLevel;
  category: string;
  duration: number; // minutes
  usage: number;
  rating: number;
  description: string;
  updatedAt: string;
}

export const DATA_BANK_RESOURCES: DataBankResource[] = [
  {
    id: "db-1",
    title: "N5 Core Vocabulary Pack",
    jpTitle: "N5 基本語彙",
    type: "Vocabulary Set",
    level: "N5",
    category: "Vocabulary",
    duration: 60,
    usage: 248,
    rating: 4.8,
    description: "800 essential N5 vocabulary words with example sentences and audio.",
    updatedAt: "2026-05-12",
  },
  {
    id: "db-2",
    title: "Te-form Grammar Deep Dive",
    jpTitle: "て形 文法",
    type: "Grammar Note",
    level: "N4",
    category: "Grammar",
    duration: 45,
    usage: 187,
    rating: 4.7,
    description: "Complete reference for te-form conjugation and usage patterns.",
    updatedAt: "2026-04-22",
  },
  {
    id: "db-3",
    title: "Joyo Kanji – Nature Set",
    jpTitle: "常用漢字：自然",
    type: "Kanji List",
    level: "N4",
    category: "Kanji",
    duration: 90,
    usage: 156,
    rating: 4.6,
    description: "120 kanji related to nature: weather, animals, plants.",
    updatedAt: "2026-06-01",
  },
  {
    id: "db-4",
    title: "Listening: At a Restaurant",
    jpTitle: "リスニング：レストランで",
    type: "Listening File",
    level: "N4",
    category: "Listening",
    duration: 25,
    usage: 132,
    rating: 4.9,
    description: "Native audio with role-play dialogues at restaurants.",
    updatedAt: "2026-05-30",
  },
  {
    id: "db-5",
    title: "Reading: Short Stories N3",
    jpTitle: "読解：短編 N3",
    type: "Reading Passage",
    level: "N3",
    category: "Reading",
    duration: 40,
    usage: 98,
    rating: 4.5,
    description: "Five graded short stories with comprehension questions.",
    updatedAt: "2026-03-18",
  },
  {
    id: "db-6",
    title: "Business Japanese Worksheet",
    jpTitle: "ビジネス日本語 練習",
    type: "Worksheet",
    level: "N2",
    category: "Business",
    duration: 60,
    usage: 74,
    rating: 4.7,
    description: "Email templates, keigo practice, meeting phrases.",
    updatedAt: "2026-06-08",
  },
  {
    id: "db-7",
    title: "Lesson Template: First Day",
    jpTitle: "授業テンプレート：初日",
    type: "Lesson Template",
    level: "N5",
    category: "Template",
    duration: 90,
    usage: 210,
    rating: 4.9,
    description: "Ready-to-use first-day lesson plan with activities.",
    updatedAt: "2026-02-10",
  },
  {
    id: "db-8",
    title: "Advanced Reading: News N1",
    jpTitle: "上級読解：ニュース N1",
    type: "Reading Passage",
    level: "N1",
    category: "Reading",
    duration: 50,
    usage: 42,
    rating: 4.6,
    description: "Authentic news articles with vocabulary and questions.",
    updatedAt: "2026-06-15",
  },
];
