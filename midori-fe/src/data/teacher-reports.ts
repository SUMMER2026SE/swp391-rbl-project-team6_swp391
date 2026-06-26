export type ReportType =
  | "Content issue"
  | "Technical bug"
  | "Student behavior"
  | "Feature request"
  | "Accessibility"
  | "Other";
export type ReportStatus = "Open" | "In review" | "Resolved";
export type ReportPriority = "Low" | "Medium" | "High" | "Urgent";

export const REPORT_TYPES: ReportType[] = [
  "Content issue",
  "Technical bug",
  "Student behavior",
  "Feature request",
  "Accessibility",
  "Other",
];
export const REPORT_STATUSES: ReportStatus[] = ["Open", "In review", "Resolved"];
export const REPORT_PRIORITIES: ReportPriority[] = ["Low", "Medium", "High", "Urgent"];

export interface TeacherReport {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  priority: ReportPriority;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  studentName?: string;
  className?: string;
  attachments?: string[];
  replies?: ReportReply[];
}

export interface ReportReply {
  id: string;
  author: "teacher" | "admin";
  message: string;
  createdAt: string;
}

export const MOCK_REPORTS: TeacherReport[] = [
  {
    id: "rpt-001",
    type: "Content issue",
    title: "Vocabulary lesson has incorrect furigana",
    description: "The word 日本語 (Nihongo) is shown with wrong reading in lesson 12.",
    priority: "High",
    status: "Open",
    createdAt: "2026-06-18T09:30:00Z",
    updatedAt: "2026-06-18T09:30:00Z",
    className: "N5 Intensive",
    replies: [],
  },
  {
    id: "rpt-002",
    type: "Feature request",
    title: "Request for JLPT N1 listening exercises",
    description: "Would be great to have more listening practice materials for N1 level students.",
    priority: "Medium",
    status: "In review",
    createdAt: "2026-06-15T14:20:00Z",
    updatedAt: "2026-06-17T10:00:00Z",
    replies: [
      {
        id: "rep-001",
        author: "admin",
        message:
          "Thank you for the suggestion! We're working on adding more N1 listening materials.",
        createdAt: "2026-06-17T10:00:00Z",
      },
    ],
  },
  {
    id: "rpt-003",
    type: "Technical bug",
    title: "Audio player not working on mobile",
    description: "Shadowing audio tracks fail to load on iOS Safari.",
    priority: "Urgent",
    status: "Open",
    createdAt: "2026-06-19T08:00:00Z",
    updatedAt: "2026-06-19T08:00:00Z",
    className: "N3 Listening Practice",
    replies: [],
  },
  {
    id: "rpt-004",
    type: "Content issue",
    title: "Grammar explanation is confusing",
    description: "The explanation for ～にもかかわらず is too brief and lacks examples.",
    priority: "Low",
    status: "Resolved",
    createdAt: "2026-06-10T11:45:00Z",
    updatedAt: "2026-06-14T16:30:00Z",
    className: "N2 Grammar",
    replies: [
      {
        id: "rep-002",
        author: "admin",
        message: "Updated with more examples. Please review and let us know.",
        createdAt: "2026-06-14T16:30:00Z",
      },
    ],
  },
  {
    id: "rpt-005",
    type: "Student behavior",
    title: "Student copying homework from internet",
    description: "One student submitted identical answers to online resources for homework #5.",
    priority: "Medium",
    status: "In review",
    createdAt: "2026-06-16T13:15:00Z",
    updatedAt: "2026-06-18T09:00:00Z",
    studentName: "Yuki Tanaka",
    className: "N4 Grammar",
    replies: [],
  },
  {
    id: "rpt-006",
    type: "Accessibility",
    title: "Flashcard app not keyboard accessible",
    description: "Students using screen readers cannot navigate the flashcard interface.",
    priority: "High",
    status: "Open",
    createdAt: "2026-06-17T16:00:00Z",
    updatedAt: "2026-06-17T16:00:00Z",
    replies: [],
  },
];
