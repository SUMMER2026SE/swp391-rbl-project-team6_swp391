import { MOCK_CLASSES, type TeacherClass, type Lesson, type Homework, type Exam } from "@/data/teacher-classes";
import { QUESTION_TOPICS, JLPT_EXAM_SETS, getTopicsByLevel, getQuestionsByTopic, getJlptByLevel } from "@/data/teacher-banks";
import { MOCK_REPORTS, type TeacherReport } from "@/data/teacher-reports";
import { TEACHER_NOTIFICATIONS, type TeacherNotification } from "@/data/teacher-notifications";

// Classes
export function getClasses(): TeacherClass[] {
  return MOCK_CLASSES;
}

export function getClassById(id: string): TeacherClass | undefined {
  return MOCK_CLASSES.find((c) => c.id === id);
}

// Lessons
export function createLesson(data: { title: string; classId?: string; level?: string }) {
  const lesson: Lesson = {
    id: `lesson-${Date.now()}`,
    title: data.title,
    classId: data.classId,
    level: (data.level as Lesson["level"]) ?? "N5",
    status: "Draft",
    createdAt: new Date().toISOString(),
    publishedAt: undefined,
    estimatedMinutes: 30,
    vocabularyCount: 0,
    grammarCount: 0,
    listeningCount: 0,
    readingCount: 0,
    exercises: 0,
    description: "",
    objectives: [],
  };
  return lesson;
}

// Homework
export function createHomework(data: { title: string; classId?: string; lessonId?: string; dueDate?: string }) {
  const homework: Homework = {
    id: `hw-${Date.now()}`,
    classId: data.classId ?? "",
    lessonId: data.lessonId,
    title: data.title,
    description: "",
    dueDate: data.dueDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalPoints: 100,
    submissions: 0,
    status: "Open",
    createdAt: new Date().toISOString(),
    type: "Written",
  };
  return homework;
}

// Exams
export function createExam(data: { title: string; classId?: string; level?: string }) {
  const exam: Exam = {
    id: `exam-${Date.now()}`,
    classId: data.classId ?? "",
    title: data.title,
    level: (data.level as Exam["level"]) ?? "N5",
    status: "Draft",
    createdAt: new Date().toISOString(),
    scheduledAt: undefined,
    duration: 60,
    totalPoints: 100,
    sections: ["Vocabulary"],
    questions: [],
    submissions: 0,
    averageScore: undefined,
    description: "",
  };
  return exam;
}

// Data Bank
export function getDataBankResources() {
  return QUESTION_TOPICS.map((t) => ({
    ...t,
    topics: getQuestionsByTopic(t.id),
  }));
}

// Question Bank helpers
export function getQuestionTopics() {
  return QUESTION_TOPICS;
}

export function getQuestionCounts() {
  return {
    total: QUESTION_TOPICS.reduce((sum, t) => sum + t.questionCount, 0),
    available: QUESTION_TOPICS.reduce((sum, t) => sum + t.availableCount, 0),
    easy: 0,
    medium: 0,
    hard: 0,
  };
}

// Progress data types
export interface ClassProgressRecord {
  classId: string;
  className: string;
  level: string;
  avgProgress: number;
  activeCount: number;
  examAvg: number | null;
  atRiskCount: number;
  totalStudents: number;
}

export interface StudentProgressRecord {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  overallProgress: number;
  vocabularyProgress: number;
  grammarProgress: number;
  listeningProgress: number;
  shadowingProgress: number;
  homeworkProgress: number;
  examProgress: number;
  completedLessons: number;
  completedHomework: number;
  examScoreAvg: number | null;
  atRisk: boolean;
  lastActive: string;
}

export function getProgressData(classId?: string): ClassProgressRecord[] {
  return MOCK_CLASSES
    .filter((c) => !classId || c.id === classId)
    .map((c) => ({
      classId: c.id,
      className: c.name,
      level: c.level,
      avgProgress: Math.round(50 + Math.random() * 40),
      activeCount: c.studentList.length,
      examAvg: Math.round(60 + Math.random() * 30),
      atRiskCount: Math.floor(Math.random() * 3),
      totalStudents: c.studentList.length,
    }));
}

// Reports
export function getReports() {
  return MOCK_REPORTS;
}

// Notifications
export function getNotifications(): TeacherNotification[] {
  return TEACHER_NOTIFICATIONS;
}

export function markAsRead(id: string) {
  const notif = TEACHER_NOTIFICATIONS.find((n) => n.id === id);
  if (notif) notif.read = true;
}

export function markAllAsRead() {
  TEACHER_NOTIFICATIONS.forEach((n) => (n.read = true));
}
