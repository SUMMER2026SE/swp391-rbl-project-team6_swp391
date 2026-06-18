export interface TeacherReport {
  id: string;
  title: string;
  type: ReportType;
  status: ReportStatus;
  priority: ReportPriority;
  relatedClassId?: string;
  relatedClassName?: string;
  relatedLessonTitle?: string;
  description: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReportType =
  | "Content issue"
  | "System issue"
  | "Student issue"
  | "Class issue"
  | "Request content"
  | "Other";

export type ReportStatus = "Open" | "In Progress" | "Resolved" | "Rejected";

export type ReportPriority = "Low" | "Medium" | "High";

export const REPORT_TYPES: ReportType[] = [
  "Content issue",
  "System issue",
  "Student issue",
  "Class issue",
  "Request content",
  "Other",
];

export const REPORT_STATUSES: ReportStatus[] = ["Open", "In Progress", "Resolved", "Rejected"];

export const REPORT_PRIORITIES: ReportPriority[] = ["Low", "Medium", "High"];

export const MOCK_REPORTS: TeacherReport[] = [
  {
    id: "report-audio-error",
    title: "Listening audio does not play",
    type: "System issue",
    status: "Open",
    priority: "High",
    relatedClassId: "n5-beginner-a",
    relatedClassName: "N5 Beginner A",
    relatedLessonTitle: "Lesson 1: あいさつ",
    description: "The listening audio file cannot be played by several students.",
    createdAt: "2026-06-16",
    updatedAt: "2026-06-16",
  },
  {
    id: "report-content-answer",
    title: "Incorrect answer in vocabulary quiz",
    type: "Content issue",
    status: "In Progress",
    priority: "Medium",
    relatedClassId: "n5-beginner-a",
    relatedClassName: "N5 Beginner A",
    relatedLessonTitle: "Lesson 1: あいさつ",
    description: "One vocabulary quiz answer seems incorrect.",
    adminResponse: "Admin is reviewing the quiz answer.",
    createdAt: "2026-06-14",
    updatedAt: "2026-06-15",
  },
  {
    id: "report-request-n4-bank",
    title: "Request more N4 conversation questions",
    type: "Request content",
    status: "Resolved",
    priority: "Low",
    relatedClassId: "n4-kaiwa-practice",
    relatedClassName: "N4 Kaiwa Practice",
    relatedLessonTitle: "Lesson 1: いけんを言う",
    description: "Need more N4-level conversation practice questions.",
    adminResponse: "Added 20 new N4 conversation questions to the Data Bank.",
    createdAt: "2026-06-10",
    updatedAt: "2026-06-12",
  },
];
