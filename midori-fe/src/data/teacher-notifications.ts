import type { NotificationType } from "@/types/notification";

export interface TeacherNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  relatedId?: string;
  relatedType?: "lesson" | "homework" | "exam" | "student" | "class";
}

export const TEACHER_NOTIFICATIONS: TeacherNotification[] = [
  {
    id: "notif-001",
    type: "ACCOUNT",
    title: "New student enrolled",
    message: "Kenji Suzuki joined N5 Intensive class.",
    time: "2026-06-20T10:30:00Z",
    read: false,
    relatedId: "cls-001",
    relatedType: "class",
  },
  {
    id: "notif-002",
    type: "LEARNING",
    title: "Homework submission received",
    message: "12 students submitted Homework #5 for N5 Intensive.",
    time: "2026-06-20T09:15:00Z",
    read: false,
    relatedId: "hw-002",
    relatedType: "homework",
  },
  {
    id: "notif-003",
    type: "CONTENT_REVIEW",
    title: "Content approved",
    message: "Your lesson 'N4 Grammar - Te-form' has been approved.",
    time: "2026-06-19T16:45:00Z",
    read: true,
    relatedId: "lesson-003",
    relatedType: "lesson",
  },
  {
    id: "notif-004",
    type: "LEARNING",
    title: "Exam grading complete",
    message: "All submissions for N5 Midterm Exam have been graded.",
    time: "2026-06-19T14:00:00Z",
    read: false,
    relatedId: "exam-001",
    relatedType: "exam",
  },
  {
    id: "notif-005",
    type: "LEARNING",
    title: "Student progress alert",
    message: "3 students in N4 Listening class are falling behind.",
    time: "2026-06-18T11:00:00Z",
    read: true,
    relatedId: "cls-002",
    relatedType: "class",
  },
  {
    id: "notif-006",
    type: "CONTENT_REVIEW",
    title: "Content revision needed",
    message: "Please revise the vocabulary list for N3 level - some words are above level.",
    time: "2026-06-17T15:30:00Z",
    read: true,
    relatedId: "lesson-005",
    relatedType: "lesson",
  },
  {
    id: "notif-007",
    type: "LEARNING",
    title: "New lesson added to Data Bank",
    message: "Admin added 5 new grammar lessons to the Data Bank.",
    time: "2026-06-16T09:00:00Z",
    read: true,
  },
  {
    id: "notif-008",
    type: "SYSTEM",
    title: "Weekly summary ready",
    message: "Your weekly teaching summary for Jun 9-15 is ready.",
    time: "2026-06-15T08:00:00Z",
    read: true,
  },
];
