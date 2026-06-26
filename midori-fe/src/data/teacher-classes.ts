export interface StudentInvitation {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Invited" | "Rejected" | "Removed";
  progress: number;
  averageScore: number | null;
  joinedAt?: string;
  invitedAt?: string;
  lastActive: string;
  progressDetails?: {
    vocabularyProgress: number;
    grammarProgress: number;
    listeningProgress: number;
    shadowingProgress: number;
    homeworkProgress: number;
    examProgress: number;
    overallProgress: number;
    averageScore: number | null;
    lastActive: string;
    warnings: string[];
  };
}

export interface Lesson {
  id: string;
  title: string;
  topic: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  status: "Draft" | "Published" | "Archived";
  description: string;
  vocabularyCount: number;
  grammarCount: number;
  listeningCount: number;
  shadowingCount: number;
  averageCompletion: number;
  lastUpdated: string;
  skills: ("Vocabulary" | "Grammar" | "Listening" | "Shadowing")[];
}

export interface Homework {
  id: string;
  title: string;
  lessonId: string;
  lessonTitle: string;
  type: "Vocabulary" | "Grammar" | "Listening" | "Mixed";
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  status: "Draft" | "Open" | "Closed" | "Graded";
  description: string;
  deadline: string;
  submittedCount: number;
  totalStudents: number;
  missingCount: number;
  averageScore: number | null;
  lateSubmissions: number;
}

export interface Exam {
  id: string;
  title: string;
  lessonId: string;
  lessonTitle: string;
  sections: ("Vocabulary" | "Grammar" | "Listening" | "Mixed")[];
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  status: "Draft" | "Scheduled" | "Open" | "Closed" | "Graded";
  description: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  attemptLimit: number;
  submittedCount: number;
  totalStudents: number;
  averageScore: number | null;
}

export interface TeacherClass {
  id: string;
  name: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  status: "Draft" | "Active" | "Archived";
  description: string;
  schedule?: string;
  students: number;
  lessons: number;
  averageProgress: number;
  openHomework: number;
  openExams: number;
  pendingInvitations: number;
  recentActivity: { id: string; text: string; time: string }[];
  upcomingWork: {
    id: string;
    title: string;
    due: string;
    type: string;
    priority: "High" | "Medium" | "Low";
  }[];
  invitations: StudentInvitation[];
  lessonList: Lesson[];
  homeworkList: Homework[];
  examList: Exam[];
}

export const MOCK_CLASSES: TeacherClass[] = [
  {
    id: "n5-beginner-a",
    name: "N5 Beginner A",
    level: "N5",
    status: "Active",
    description: "Beginner Japanese class for new students.",
    schedule: "Mon / Wed / Fri",
    students: 25,
    lessons: 8,
    averageProgress: 72,
    openHomework: 2,
    openExams: 1,
    pendingInvitations: 3,
    recentActivity: [
      { id: "a1", text: "Nguyen Van A accepted invitation", time: "2 hours ago" },
      { id: "a2", text: "Lesson 8: 〜てください published", time: "5 hours ago" },
      { id: "a3", text: "Tran Thi B submitted Homework 7", time: "Yesterday" },
      { id: "a4", text: "Midterm Exam scheduled for Dec 20", time: "2 days ago" },
      { id: "a5", text: "Admin replied to your content report", time: "3 days ago" },
    ],
    upcomingWork: [
      {
        id: "u1",
        title: "Homework 8 due",
        due: "Dec 18, 2025",
        type: "Homework",
        priority: "High",
      },
      {
        id: "u2",
        title: "Midterm Exam opens",
        due: "Dec 20, 2025",
        type: "Exam",
        priority: "Medium",
      },
      {
        id: "u3",
        title: "Lesson 9 draft needs review",
        due: "Dec 22, 2025",
        type: "Lesson",
        priority: "Low",
      },
    ],
    invitations: [
      {
        id: "s1",
        name: "Nguyen Minh Anh",
        email: "minh.anh@student.midori.vn",
        status: "Active",
        progress: 82,
        averageScore: 8.4,
        joinedAt: "2026-06-01",
        lastActive: "Today",
        progressDetails: {
          vocabularyProgress: 90,
          grammarProgress: 84,
          listeningProgress: 76,
          shadowingProgress: 70,
          homeworkProgress: 88,
          examProgress: 82,
          overallProgress: 82,
          averageScore: 8.4,
          lastActive: "Today",
          warnings: [],
        },
      },
      {
        id: "s2",
        name: "Tran Hoang Nam",
        email: "hoang.nam@student.midori.vn",
        status: "Active",
        progress: 65,
        averageScore: 7.2,
        joinedAt: "2026-06-03",
        lastActive: "Yesterday",
        progressDetails: {
          vocabularyProgress: 68,
          grammarProgress: 62,
          listeningProgress: 45,
          shadowingProgress: 40,
          homeworkProgress: 55,
          examProgress: 58,
          overallProgress: 65,
          averageScore: 7.2,
          lastActive: "Yesterday",
          warnings: ["Weak listening"],
        },
      },
      {
        id: "s3",
        name: "Le Gia Bao",
        email: "gia.bao@student.midori.vn",
        status: "Active",
        progress: 36,
        averageScore: 5.2,
        joinedAt: "2026-06-05",
        lastActive: "5 days ago",
        progressDetails: {
          vocabularyProgress: 40,
          grammarProgress: 38,
          listeningProgress: 35,
          shadowingProgress: 20,
          homeworkProgress: 30,
          examProgress: 42,
          overallProgress: 36,
          averageScore: 5.2,
          lastActive: "5 days ago",
          warnings: ["Low progress", "Missing homework", "Inactive"],
        },
      },
      {
        id: "s3",
        name: "Pending Student",
        email: "pending.student@gmail.com",
        status: "Invited",
        progress: 0,
        averageScore: null,
        invitedAt: "2026-06-15",
        lastActive: "Not joined yet",
      },
      {
        id: "s4",
        name: "Rejected Student",
        email: "rejected.student@gmail.com",
        status: "Rejected",
        progress: 0,
        averageScore: null,
        invitedAt: "2026-06-10",
        lastActive: "Not joined",
      },
    ],
    lessonList: [
      {
        id: "lesson-1-greetings",
        title: "Lesson 1: あいさつ",
        topic: "Greetings",
        level: "N5",
        status: "Published",
        description: "Basic greetings and self-introduction.",
        vocabularyCount: 18,
        grammarCount: 2,
        listeningCount: 1,
        shadowingCount: 3,
        averageCompletion: 78,
        lastUpdated: "2026-06-15",
        skills: ["Vocabulary", "Grammar", "Listening", "Shadowing"],
      },
      {
        id: "lesson-2-classroom",
        title: "Lesson 2: きょうしつ",
        topic: "Classroom",
        level: "N5",
        status: "Draft",
        description: "Classroom objects and simple classroom expressions.",
        vocabularyCount: 22,
        grammarCount: 2,
        listeningCount: 1,
        shadowingCount: 2,
        averageCompletion: 0,
        lastUpdated: "2026-06-16",
        skills: ["Vocabulary", "Grammar", "Listening", "Shadowing"],
      },
    ],
    homeworkList: [
      {
        id: "hw-n5-greetings-vocab",
        title: "Vocabulary Practice - Greetings",
        lessonId: "lesson-1-greetings",
        lessonTitle: "Lesson 1: あいさつ",
        type: "Vocabulary",
        level: "N5",
        status: "Open",
        description: "Practice greeting vocabulary using quiz questions.",
        deadline: "2026-06-20",
        submittedCount: 18,
        totalStudents: 25,
        missingCount: 7,
        averageScore: 8.1,
        lateSubmissions: 2,
      },
      {
        id: "hw-n5-grammar-intro",
        title: "Grammar Practice - Self Introduction",
        lessonId: "lesson-1-greetings",
        lessonTitle: "Lesson 1: あいさつ",
        type: "Grammar",
        level: "N5",
        status: "Graded",
        description: "Practice basic sentence patterns for self-introduction.",
        deadline: "2026-06-14",
        submittedCount: 23,
        totalStudents: 25,
        missingCount: 2,
        averageScore: 7.8,
        lateSubmissions: 1,
      },
      {
        id: "hw-n5-listening-dictation",
        title: "Listening Dictation - Classroom Words",
        lessonId: "lesson-2-classroom",
        lessonTitle: "Lesson 2: きょうしつ",
        type: "Listening",
        level: "N5",
        status: "Draft",
        description: "Listen and write classroom vocabulary.",
        deadline: "2026-06-25",
        submittedCount: 0,
        totalStudents: 25,
        missingCount: 0,
        averageScore: null,
        lateSubmissions: 0,
      },
    ],
    examList: [
      {
        id: "exam-n5-mini-1",
        title: "N5 Mini Test - Lesson 1",
        lessonId: "lesson-1-greetings",
        lessonTitle: "Lesson 1: あいさつ",
        sections: ["Vocabulary", "Grammar", "Listening"],
        level: "N5",
        status: "Open",
        description: "Short assessment for greeting vocabulary, basic grammar and listening.",
        durationMinutes: 30,
        startTime: "2026-06-18 08:00",
        endTime: "2026-06-20 23:59",
        attemptLimit: 1,
        submittedCount: 16,
        totalStudents: 25,
        averageScore: 7.9,
      },
      {
        id: "exam-n5-vocab-review",
        title: "N5 Vocabulary Review",
        lessonId: "lesson-2-classroom",
        lessonTitle: "Lesson 2: きょうしつ",
        sections: ["Vocabulary"],
        level: "N5",
        status: "Scheduled",
        description: "Vocabulary review exam for classroom words.",
        durationMinutes: 20,
        startTime: "2026-06-24 08:00",
        endTime: "2026-06-25 23:59",
        attemptLimit: 1,
        submittedCount: 0,
        totalStudents: 25,
        averageScore: null,
      },
    ],
  },
  {
    id: "n4-kaiwa-practice",
    name: "N4 Kaiwa Practice",
    level: "N4",
    status: "Active",
    description: "Conversation practice class for N4 students.",
    schedule: "Tue / Thu",
    students: 18,
    lessons: 6,
    averageProgress: 64,
    openHomework: 1,
    openExams: 0,
    pendingInvitations: 1,
    recentActivity: [
      { id: "b1", text: "Lesson 6: Shopping dialogue published", time: "1 day ago" },
      { id: "b2", text: "Le Van C submitted Homework 5", time: "2 days ago" },
      { id: "b3", text: "New student invitation pending: pham@example.com", time: "3 days ago" },
    ],
    upcomingWork: [
      {
        id: "u4",
        title: "Homework 6 due",
        due: "Dec 19, 2025",
        type: "Homework",
        priority: "High",
      },
      {
        id: "u5",
        title: "Lesson 7 draft",
        due: "Dec 21, 2025",
        type: "Lesson",
        priority: "Medium",
      },
    ],
    invitations: [
      {
        id: "b1",
        name: "Le Van C",
        email: "le.vanc@student.midori.vn",
        status: "Active",
        progress: 58,
        averageScore: 7.0,
        joinedAt: "2026-05-28",
        lastActive: "Yesterday",
        progressDetails: {
          vocabularyProgress: 62,
          grammarProgress: 55,
          listeningProgress: 52,
          shadowingProgress: 48,
          homeworkProgress: 60,
          examProgress: 55,
          overallProgress: 58,
          averageScore: 7.0,
          lastActive: "Yesterday",
          warnings: [],
        },
      },
      {
        id: "b2",
        name: "Pending Student",
        email: "pending.student@gmail.com",
        status: "Invited",
        progress: 0,
        averageScore: null,
        invitedAt: "2026-06-15",
        lastActive: "Not joined yet",
      },
    ],
    lessonList: [
      {
        id: "lesson-n4-opinion",
        title: "Lesson 1: いけんを言う",
        topic: "Giving opinions",
        level: "N4",
        status: "Published",
        description: "Practice giving simple opinions in conversation.",
        vocabularyCount: 16,
        grammarCount: 3,
        listeningCount: 2,
        shadowingCount: 4,
        averageCompletion: 61,
        lastUpdated: "2026-06-14",
        skills: ["Vocabulary", "Grammar", "Listening", "Shadowing"],
      },
    ],
    homeworkList: [
      {
        id: "hw-n4-opinion-mixed",
        title: "Mixed Practice - Giving Opinions",
        lessonId: "lesson-n4-opinion",
        lessonTitle: "Lesson 1: いけんを言う",
        type: "Mixed",
        level: "N4",
        status: "Open",
        description: "Vocabulary and grammar practice for giving opinions.",
        deadline: "2026-06-22",
        submittedCount: 11,
        totalStudents: 18,
        missingCount: 7,
        averageScore: 7.4,
        lateSubmissions: 0,
      },
    ],
    examList: [
      {
        id: "exam-n4-opinion-speaking",
        title: "N4 Opinion Practice Test",
        lessonId: "lesson-n4-opinion",
        lessonTitle: "Lesson 1: いけんを言う",
        sections: ["Grammar", "Listening", "Mixed"],
        level: "N4",
        status: "Closed",
        description: "Formal assessment for giving opinions in simple conversations.",
        durationMinutes: 45,
        startTime: "2026-06-10 08:00",
        endTime: "2026-06-12 23:59",
        attemptLimit: 1,
        submittedCount: 17,
        totalStudents: 18,
        averageScore: 7.6,
      },
    ],
  },
  {
    id: "n5-weekend-class",
    name: "N5 Weekend Class",
    level: "N5",
    status: "Draft",
    description: "Weekend class planned for new learners.",
    schedule: "Saturday",
    students: 0,
    lessons: 0,
    averageProgress: 0,
    openHomework: 0,
    openExams: 0,
    pendingInvitations: 0,
    recentActivity: [],
    upcomingWork: [],
    invitations: [],
    lessonList: [],
    homeworkList: [],
    examList: [],
  },
];
