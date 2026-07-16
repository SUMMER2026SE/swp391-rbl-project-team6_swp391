// Centralized mock data + service layer for MIDORI Teacher LMS.
// Backend-ready: every function is async-friendly and returns plain objects.

export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type Skill =
  | "Vocabulary"
  | "Grammar"
  | "Kanji"
  | "Reading"
  | "Listening"
  | "Speaking"
  | "Writing"
  | "Mixed";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  status: "Active" | "On leave";
  classesCount: number;
  joinedAt: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  level: JLPTLevel;
  progress: number;
  attendance: number;
  lastActive: string;
  status: "active" | "invited" | "at-risk";
  weakSkill?: Skill;
  averageScore: number;
}

export interface ClassItem {
  id: string;
  name: string;
  jpName: string;
  level: JLPTLevel;
  schedule: string;
  studentCount: number;
  capacity: number;
  status: "Active" | "Upcoming" | "Archived";
  progress: number;
  openHomework: number;
  upcomingExams: number;
  attention: number;
  description: string;
  startDate: string;
}

export interface Lesson {
  id: string;
  classId: string | null;
  title: string;
  jpTitle: string;
  skill: Skill;
  level: JLPTLevel;
  topic: string;
  objective: string;
  duration: number;
  status: "Draft" | "Published" | "Archived";
  updatedAt: string;
  source: "manual" | "data-bank";
  resourceId?: string;
}

export interface Homework {
  id: string;
  classId: string;
  lessonId?: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  attempts: number;
  status: "Draft" | "Assigned" | "Closed";
  submissions: number;
  totalStudents: number;
  pendingGrading: number;
  source: "manual" | "lesson" | "data-bank" | "question-bank";
}

export interface Exam {
  id: string;
  classId: string;
  title: string;
  level: JLPTLevel;
  duration: number;
  attempts: number;
  totalQuestions: number;
  scheduledAt: string;
  status: "Draft" | "Scheduled" | "Completed" | "Archived";
  averageScore?: number;
  source: "manual" | "question-bank" | "jlpt-bank";
}

export interface DataBankResource {
  id: string;
  title: string;
  jpTitle: string;
  type:
    | "Vocabulary Set"
    | "Grammar Note"
    | "Kanji List"
    | "Listening File"
    | "Reading Passage"
    | "Worksheet"
    | "Lesson Template";
  level: JLPTLevel;
  category: string;
  duration: number;
  usage: number;
  rating: number;
  description: string;
  updatedAt: string;
}

export interface QuestionTopic {
  id: string;
  name: string;
  jpName: string;
  level: JLPTLevel;
  skill: Skill;
  totalQuestions: number;
  easy: number;
  medium: number;
  hard: number;
  updatedAt: string;
}

export interface Question {
  id: string;
  topicId: string;
  prompt: string;
  jpPrompt?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
  skill: Skill;
  points: number;
}

export interface JLPTSet {
  id: string;
  title: string;
  level: JLPTLevel;
  duration: number;
  totalQuestions: number;
  sections: { name: string; questions: number }[];
  mix: { easy: number; medium: number; hard: number };
  year: number;
  description: string;
}

export interface Report {
  id: string;
  title: string;
  classId?: string;
  studentId?: string;
  category: "Attendance" | "Behavior" | "Progress" | "Other";
  status: "Open" | "In review" | "Resolved";
  createdAt: string;
  summary: string;
  thread: { author: string; time: string; message: string }[];
}

export interface Notification {
  id: string;
  type: "homework" | "exam" | "student" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=c7e3d3,d4e7f5,f5d4e0,f5e9d4`;

export const teacherProfile: TeacherProfile = {
  id: "t-001",
  name: "Aiko Tanaka",
  email: "aiko.tanaka@midori.jp",
  role: "Senior Japanese Instructor",
  avatar: avatar("Aiko Tanaka"),
  status: "Active",
  classesCount: 6,
  joinedAt: "2022-04-10",
};

export const classes: ClassItem[] = [
  {
    id: "n5-beginner-a",
    name: "N5 Beginner – Group A",
    jpName: "初級 N5 グループA",
    level: "N5",
    schedule: "Mon · Wed · Fri · 18:00–19:30",
    studentCount: 22,
    capacity: 25,
    status: "Active",
    progress: 64,
    openHomework: 3,
    upcomingExams: 1,
    attention: 2,
    description:
      "Foundational Japanese for absolute beginners. Hiragana, Katakana, basic grammar, daily vocabulary.",
    startDate: "2026-04-08",
  },
  {
    id: "n4-elementary-b",
    name: "N4 Elementary – Group B",
    jpName: "初中級 N4 グループB",
    level: "N4",
    schedule: "Tue · Thu · 19:00–20:30",
    studentCount: 18,
    capacity: 20,
    status: "Active",
    progress: 72,
    openHomework: 2,
    upcomingExams: 2,
    attention: 1,
    description:
      "Strengthen grammar patterns, expand vocabulary to ~1500 words, improve listening.",
    startDate: "2026-03-15",
  },
  {
    id: "n3-intermediate",
    name: "N3 Intermediate Intensive",
    jpName: "中級 N3 集中",
    level: "N3",
    schedule: "Mon · Wed · 20:00–21:30",
    studentCount: 14,
    capacity: 16,
    status: "Active",
    progress: 58,
    openHomework: 4,
    upcomingExams: 1,
    attention: 3,
    description: "Reading comprehension, intermediate kanji (~650), conversation fluency.",
    startDate: "2026-02-20",
  },
  {
    id: "n2-advanced",
    name: "N2 Advanced Track",
    jpName: "上級 N2",
    level: "N2",
    schedule: "Sat · 10:00–13:00",
    studentCount: 10,
    capacity: 12,
    status: "Active",
    progress: 81,
    openHomework: 1,
    upcomingExams: 1,
    attention: 0,
    description: "Business Japanese, advanced reading, JLPT N2 exam preparation.",
    startDate: "2026-01-12",
  },
  {
    id: "n5-beginner-c",
    name: "N5 Beginner – Weekend C",
    jpName: "初級 N5 週末C",
    level: "N5",
    schedule: "Sat · Sun · 09:00–11:00",
    studentCount: 16,
    capacity: 20,
    status: "Upcoming",
    progress: 0,
    openHomework: 0,
    upcomingExams: 0,
    attention: 0,
    description: "Weekend beginner class starting next month.",
    startDate: "2026-07-05",
  },
  {
    id: "n1-mastery",
    name: "N1 Mastery Seminar",
    jpName: "最上級 N1",
    level: "N1",
    schedule: "Fri · 19:00–21:00",
    studentCount: 8,
    capacity: 10,
    status: "Active",
    progress: 76,
    openHomework: 2,
    upcomingExams: 1,
    attention: 1,
    description: "Highest level — literature, news, academic Japanese.",
    startDate: "2025-11-04",
  },
];

const firstNames = [
  "Hiroshi",
  "Yuki",
  "Sakura",
  "Daiki",
  "Mei",
  "Ren",
  "Kenji",
  "Aoi",
  "Sora",
  "Hana",
  "Takeshi",
  "Rin",
  "Kaito",
  "Nao",
  "Emi",
  "Riku",
  "Yui",
  "Haruto",
  "Mio",
  "Sho",
  "Akari",
  "Tomo",
  "Yuna",
  "Itsuki",
];
const lastNames = [
  "Sato",
  "Suzuki",
  "Takahashi",
  "Tanaka",
  "Watanabe",
  "Ito",
  "Yamamoto",
  "Nakamura",
  "Kobayashi",
  "Kato",
  "Yoshida",
  "Yamada",
];
const skills: Skill[] = ["Vocabulary", "Grammar", "Kanji", "Reading", "Listening"];

function buildStudents(): Student[] {
  const out: Student[] = [];
  classes.forEach((c) => {
    for (let i = 0; i < c.studentCount; i++) {
      const idx = (c.id.charCodeAt(0) + i) % firstNames.length;
      const lidx = (i * 3 + c.id.length) % lastNames.length;
      const name = `${firstNames[idx]} ${lastNames[lidx]}`;
      const progress = Math.max(15, Math.min(100, c.progress + ((i * 7) % 30) - 15));
      const score = Math.max(40, Math.min(100, progress + ((i * 5) % 20) - 8));
      const atRisk = progress < 50;
      out.push({
        id: `${c.id}-s${i + 1}`,
        name,
        email: `${name.toLowerCase().replace(" ", ".")}@student.midori.jp`,
        avatar: avatar(name + c.id),
        level: c.level,
        progress,
        attendance: 70 + ((i * 11) % 30),
        lastActive: ["2h ago", "yesterday", "3 days ago", "1 week ago"][i % 4],
        status:
          i === c.studentCount - 1 && c.status === "Active"
            ? "invited"
            : atRisk
              ? "at-risk"
              : "active",
        weakSkill: skills[i % skills.length],
        averageScore: score,
      });
    }
  });
  return out;
}
const allStudents = buildStudents();

const lessonTitles = [
  ["Hiragana Foundations", "ひらがな入門", "Vocabulary"],
  ["Self-Introduction", "自己紹介", "Speaking"],
  ["Numbers and Time", "数字と時間", "Vocabulary"],
  ["Daily Routines", "毎日の生活", "Grammar"],
  ["Te-form Basics", "て形の基本", "Grammar"],
  ["Kanji: Nature", "漢字：自然", "Kanji"],
  ["Listening: At the Station", "リスニング：駅で", "Listening"],
  ["Reading: News Headlines", "読解：ニュース見出し", "Reading"],
  ["Polite vs Casual", "丁寧語とカジュアル", "Grammar"],
  ["Conditional Forms", "条件形", "Grammar"],
] as const;

export const lessons: Lesson[] = classes.flatMap((c, ci) =>
  lessonTitles.slice(0, 5 + (ci % 3)).map((t, i) => ({
    id: `${c.id}-l${i + 1}`,
    classId: c.id,
    title: t[0],
    jpTitle: t[1],
    skill: t[2] as Skill,
    level: c.level,
    topic: t[0],
    objective: `Students will be able to use ${t[0].toLowerCase()} in real conversation.`,
    duration: 45 + (i % 3) * 15,
    status: i < 2 ? "Published" : i === 2 ? "Draft" : "Published",
    updatedAt: `2026-06-${10 + i}`,
    source: i % 3 === 0 ? "data-bank" : "manual",
    resourceId: i % 3 === 0 ? `db-${(i % 6) + 1}` : undefined,
  })),
);

export const homework: Homework[] = classes.flatMap((c, ci) =>
  Array.from({ length: c.openHomework + 2 }, (_, i) => ({
    id: `${c.id}-hw${i + 1}`,
    classId: c.id,
    lessonId: `${c.id}-l${(i % 3) + 1}`,
    title: `${lessonTitles[i % lessonTitles.length][0]} – Practice`,
    instructions:
      "Complete the exercises in the workbook. Submit your audio recording for the speaking portion.",
    dueDate: `2026-06-${22 + i}`,
    maxScore: 100,
    attempts: 2,
    status: i < c.openHomework ? "Assigned" : i === c.openHomework ? "Draft" : "Closed",
    submissions: Math.floor(c.studentCount * (0.4 + (i % 3) * 0.2)),
    totalStudents: c.studentCount,
    pendingGrading: Math.floor(c.studentCount * 0.2),
    source: (["manual", "lesson", "data-bank", "question-bank"] as const)[(ci + i) % 4],
  })),
);

export const exams: Exam[] = classes.flatMap((c, ci) =>
  Array.from({ length: c.upcomingExams + 1 }, (_, i) => ({
    id: `${c.id}-ex${i + 1}`,
    classId: c.id,
    title: i === 0 ? `${c.level} Mid-term Assessment` : `${c.level} Mock JLPT ${i}`,
    level: c.level,
    duration: 60 + i * 30,
    attempts: 1,
    totalQuestions: 30 + i * 10,
    scheduledAt: `2026-07-${5 + i * 3}`,
    status: i === 0 ? "Scheduled" : i === 1 ? "Completed" : "Draft",
    averageScore: i === 1 ? 70 + ((ci * 3) % 20) : undefined,
    source: (["manual", "question-bank", "jlpt-bank"] as const)[(ci + i) % 3],
  })),
);

export const dataBankResources: DataBankResource[] = [
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

export const questionTopics: QuestionTopic[] = [
  {
    id: "qt-n5-vocab",
    name: "N5 Core Vocabulary",
    jpName: "N5 基本語彙",
    level: "N5",
    skill: "Vocabulary",
    totalQuestions: 120,
    easy: 60,
    medium: 40,
    hard: 20,
    updatedAt: "2026-06-10",
  },
  {
    id: "qt-n5-grammar",
    name: "N5 Grammar Patterns",
    jpName: "N5 文法",
    level: "N5",
    skill: "Grammar",
    totalQuestions: 90,
    easy: 45,
    medium: 30,
    hard: 15,
    updatedAt: "2026-06-08",
  },
  {
    id: "qt-n4-grammar",
    name: "N4 Grammar (Te-form etc.)",
    jpName: "N4 文法",
    level: "N4",
    skill: "Grammar",
    totalQuestions: 110,
    easy: 40,
    medium: 50,
    hard: 20,
    updatedAt: "2026-05-30",
  },
  {
    id: "qt-n4-kanji",
    name: "N4 Kanji 300",
    jpName: "N4 漢字",
    level: "N4",
    skill: "Kanji",
    totalQuestions: 150,
    easy: 60,
    medium: 60,
    hard: 30,
    updatedAt: "2026-06-12",
  },
  {
    id: "qt-n3-reading",
    name: "N3 Reading Comprehension",
    jpName: "N3 読解",
    level: "N3",
    skill: "Reading",
    totalQuestions: 80,
    easy: 20,
    medium: 40,
    hard: 20,
    updatedAt: "2026-06-05",
  },
  {
    id: "qt-n3-listening",
    name: "N3 Listening Practice",
    jpName: "N3 聴解",
    level: "N3",
    skill: "Listening",
    totalQuestions: 60,
    easy: 18,
    medium: 28,
    hard: 14,
    updatedAt: "2026-05-28",
  },
  {
    id: "qt-n2-grammar",
    name: "N2 Grammar Advanced",
    jpName: "N2 文法",
    level: "N2",
    skill: "Grammar",
    totalQuestions: 140,
    easy: 35,
    medium: 65,
    hard: 40,
    updatedAt: "2026-06-01",
  },
  {
    id: "qt-n1-reading",
    name: "N1 Academic Reading",
    jpName: "N1 学術読解",
    level: "N1",
    skill: "Reading",
    totalQuestions: 70,
    easy: 12,
    medium: 30,
    hard: 28,
    updatedAt: "2026-06-18",
  },
];

const sampleQuestions: Omit<Question, "id" | "topicId">[] = [
  {
    prompt: "What is the meaning of 「学校」?",
    jpPrompt: "学校",
    options: ["Hospital", "School", "Station", "Library"],
    correctIndex: 1,
    explanation: "学校 (gakkou) means school.",
    difficulty: "Easy",
    skill: "Vocabulary",
    points: 2,
  },
  {
    prompt: "Choose the correct te-form of 食べる.",
    options: ["食べた", "食べて", "食べる", "食べない"],
    correctIndex: 1,
    explanation: "Ichidan verbs drop る and add て.",
    difficulty: "Medium",
    skill: "Grammar",
    points: 3,
  },
  {
    prompt: "Which kanji reading is correct for 「水曜日」?",
    options: ["げつようび", "かようび", "すいようび", "もくようび"],
    correctIndex: 2,
    explanation: "水 (sui) + 曜日 = Wednesday.",
    difficulty: "Easy",
    skill: "Kanji",
    points: 2,
  },
  {
    prompt: "Pick the most natural particle: 母___ 料理を作りました。",
    options: ["を", "が", "に", "で"],
    correctIndex: 1,
    explanation: "Subject marker が is correct here.",
    difficulty: "Medium",
    skill: "Grammar",
    points: 3,
  },
  {
    prompt: "What does the speaker imply by 「考えておきます」?",
    options: [
      "I will think about it now",
      "I have decided",
      "I will think about it for later",
      "I disagree",
    ],
    correctIndex: 2,
    explanation: "ておく indicates preparation for later.",
    difficulty: "Hard",
    skill: "Listening",
    points: 5,
  },
  {
    prompt: "Choose the best reading: 「経済」.",
    options: ["けいざい", "けいけん", "せいけい", "けんざい"],
    correctIndex: 0,
    explanation: "経済 = keizai (economy).",
    difficulty: "Hard",
    skill: "Kanji",
    points: 4,
  },
];

function buildQuestions(): Question[] {
  const out: Question[] = [];
  questionTopics.forEach((t) => {
    const n = Math.min(t.totalQuestions, 12);
    for (let i = 0; i < n; i++) {
      const s = sampleQuestions[i % sampleQuestions.length];
      const diff: Difficulty =
        i < t.easy / 10 ? "Easy" : i < (t.easy + t.medium) / 10 ? "Medium" : "Hard";
      out.push({ ...s, id: `${t.id}-q${i + 1}`, topicId: t.id, difficulty: diff, skill: t.skill });
    }
  });
  return out;
}
const allQuestions = buildQuestions();

export const jlptSets: any[] = [];

export const reports: Report[] = [
  {
    id: "r-1",
    title: "Recurring absences — Hiroshi Sato",
    classId: "n5-beginner-a",
    studentId: "n5-beginner-a-s1",
    category: "Attendance",
    status: "Open",
    createdAt: "2026-06-15",
    summary: "Student missed 3 consecutive sessions. Need to follow up with family.",
    thread: [
      { author: "Aiko Tanaka", time: "2026-06-15 09:12", message: "Filed report for review." },
    ],
  },
  {
    id: "r-2",
    title: "Significant progress — N4 Group B",
    classId: "n4-elementary-b",
    category: "Progress",
    status: "Resolved",
    createdAt: "2026-06-10",
    summary: "Class average improved by 12% after intensive grammar week.",
    thread: [
      { author: "Aiko Tanaka", time: "2026-06-10 14:30", message: "Submitted progress highlight." },
      {
        author: "Center Admin",
        time: "2026-06-11 10:00",
        message: "Great work — adding to monthly newsletter.",
      },
    ],
  },
  {
    id: "r-3",
    title: "Material request: N3 reading passages",
    category: "Other",
    status: "In review",
    createdAt: "2026-06-18",
    summary: "Requesting additional graded readers for N3 intermediate students.",
    thread: [
      {
        author: "Aiko Tanaka",
        time: "2026-06-18 16:00",
        message: "Current materials feel too easy for top half of class.",
      },
    ],
  },
];

export const notifications: Notification[] = [
  {
    id: "n-1",
    type: "homework",
    title: "12 new submissions to grade",
    message: "N5 Beginner – Group A submitted Te-form Practice.",
    time: "10 min ago",
    read: false,
    link: "/teacher/classes/n5-beginner-a/homework",
  },
  {
    id: "n-2",
    type: "exam",
    title: "Exam scheduled tomorrow",
    message: "N4 Mid-term Assessment is scheduled for tomorrow 19:00.",
    time: "1 hour ago",
    read: false,
    link: "/teacher/classes/n4-elementary-b/exams",
  },
  {
    id: "n-3",
    type: "student",
    title: "Student at risk",
    message: "Hiroshi Sato has missed 3 sessions in a row.",
    time: "2 hours ago",
    read: false,
    link: "/teacher/classes/n5-beginner-a/students",
  },
  {
    id: "n-4",
    type: "system",
    title: "New JLPT exam set published",
    message: "Center added: JLPT N3 — July 2025 Mock.",
    time: "yesterday",
    read: true,
    link: "/teacher/jlpt-bank",
  },
  {
    id: "n-5",
    type: "homework",
    title: "Reminder sent",
    message: "Reminder sent to 4 students with overdue work.",
    time: "yesterday",
    read: true,
  },
  {
    id: "n-6",
    type: "system",
    title: "Welcome to MIDORI Teacher",
    message: "Your teacher workspace is ready. Explore your dashboard.",
    time: "3 days ago",
    read: true,
  },
];

// --- Service helpers (backend-ready signatures) ---

export const getClasses = () => classes;
export const getClassById = (id: string) => classes.find((c) => c.id === id);
export const getStudentsByClass = (classId: string) =>
  allStudents.filter((s) => s.id.startsWith(classId + "-"));
export const getAllStudents = () => allStudents;

export const getLessons = () => lessons;
export const getLessonsByClass = (classId: string) => lessons.filter((l) => l.classId === classId);
export const getLessonById = (id: string) => lessons.find((l) => l.id === id);

export const getHomework = () => homework;
export const getHomeworkByClass = (classId: string) =>
  homework.filter((h) => h.classId === classId);

export const getExams = () => exams;
export const getExamsByClass = (classId: string) => exams.filter((e) => e.classId === classId);

export const getDataBankResources = () => dataBankResources;
export const getDataBankResourceById = (id: string) => dataBankResources.find((r) => r.id === id);

export const getQuestionTopics = () => questionTopics;
export const getQuestionTopicById = (id: string) => questionTopics.find((t) => t.id === id);
export const getQuestionsByTopic = (topicId: string) =>
  allQuestions.filter((q) => q.topicId === topicId);

export interface RandomGenParams {
  topicIds: string[];
  total: number;
  easyPct: number;
  mediumPct: number;
  hardPct: number;
}
export function getQuestionsForRandomGeneration(p: RandomGenParams): Question[] {
  const pool = allQuestions.filter((q) => p.topicIds.includes(q.topicId));
  const pick = (diff: Difficulty, count: number) => {
    const list = pool.filter((q) => q.difficulty === diff).sort(() => Math.random() - 0.5);
    return list.slice(0, count);
  };
  const easyN = Math.round((p.easyPct / 100) * p.total);
  const mediumN = Math.round((p.mediumPct / 100) * p.total);
  const hardN = p.total - easyN - mediumN;
  return [...pick("Easy", easyN), ...pick("Medium", mediumN), ...pick("Hard", hardN)];
}
export function getAvailableCounts(topicIds: string[]) {
  const pool = allQuestions.filter((q) => topicIds.includes(q.topicId));
  return {
    easy: pool.filter((q) => q.difficulty === "Easy").length,
    medium: pool.filter((q) => q.difficulty === "Medium").length,
    hard: pool.filter((q) => q.difficulty === "Hard").length,
    total: pool.length,
  };
}
export function getAggregatedTopicCounts(topicIds: string[]) {
  const ts = questionTopics.filter((t) => topicIds.includes(t.id));
  return {
    easy: ts.reduce((s, t) => s + t.easy, 0),
    medium: ts.reduce((s, t) => s + t.medium, 0),
    hard: ts.reduce((s, t) => s + t.hard, 0),
    total: ts.reduce((s, t) => s + t.totalQuestions, 0),
  };
}

export const getJlptExamSets = () => [];
export const getJlptSetById = (id: string) => undefined;

export const getReports = () => reports;
export const getNotifications = () => notifications;

export const getProgressOverview = () => ({
  averageProgress: Math.round(classes.reduce((s, c) => s + c.progress, 0) / classes.length),
  totalStudents: allStudents.length,
  atRisk: allStudents.filter((s) => s.status === "at-risk").length,
  classesActive: classes.filter((c) => c.status === "Active").length,
});
export const getProgressByClass = (classId: string) => {
  const cls = getClassById(classId);
  const students = getStudentsByClass(classId);
  if (!cls) return null;
  return {
    class: cls,
    averageProgress: cls.progress,
    homeworkCompletion: 65 + ((cls.name.length * 3) % 30),
    examAverage: 70 + ((cls.id.length * 5) % 25),
    skills: {
      Vocabulary: 60 + ((cls.id.length * 2) % 35),
      Grammar: 55 + ((cls.id.length * 4) % 40),
      Kanji: 50 + ((cls.id.length * 6) % 45),
      Reading: 58 + ((cls.id.length * 3) % 35),
      Listening: 62 + ((cls.id.length * 7) % 30),
    },
    students,
    atRisk: students.filter((s) => s.status === "at-risk"),
  };
};
