export interface DataBankItem {
  id: string;
  title: string;
  type: DataBankType;
  level: string;
  topic: string;
  description: string;
  status: "Approved" | "Pending Review" | "Rejected";
  createdBy: "Admin" | "Teacher";
  usageCount: number;
  lastUpdated: string;
}

export type DataBankType =
  | "Vocabulary"
  | "Grammar"
  | "Listening"
  | "Shadowing"
  | "Question"
  | "Exam";

export const DATA_BANK_ITEMS: DataBankItem[] = [
  {
    id: "vocab-n5-greetings",
    title: "N5 Greetings Vocabulary Set",
    type: "Vocabulary",
    level: "N5",
    topic: "Greetings",
    description: "Common greeting words for beginner students.",
    status: "Approved",
    createdBy: "Admin",
    usageCount: 12,
    lastUpdated: "2026-06-10",
  },
  {
    id: "grammar-n5-intro",
    title: "N は N です Structure",
    type: "Grammar",
    level: "N5",
    topic: "Self Introduction",
    description: "Basic sentence pattern for self-introduction.",
    status: "Approved",
    createdBy: "Admin",
    usageCount: 9,
    lastUpdated: "2026-06-11",
  },
  {
    id: "listening-n5-classroom",
    title: "Classroom Listening Practice",
    type: "Listening",
    level: "N5",
    topic: "Classroom",
    description: "Listen-and-answer and dictation activity for classroom words.",
    status: "Approved",
    createdBy: "Admin",
    usageCount: 6,
    lastUpdated: "2026-06-12",
  },
  {
    id: "shadowing-n5-greetings",
    title: "Greeting Shadowing Script",
    type: "Shadowing",
    level: "N5",
    topic: "Greetings",
    description: "Short greeting scripts for shadowing practice.",
    status: "Approved",
    createdBy: "Admin",
    usageCount: 5,
    lastUpdated: "2026-06-12",
  },
  {
    id: "question-n4-opinion",
    title: "N4 Opinion Question Set",
    type: "Question",
    level: "N4",
    topic: "Giving Opinions",
    description: "Grammar and listening questions for opinion practice.",
    status: "Approved",
    createdBy: "Admin",
    usageCount: 3,
    lastUpdated: "2026-06-14",
  },
  {
    id: "teacher-submission-n5-food",
    title: "Food Vocabulary Practice",
    type: "Vocabulary",
    level: "N5",
    topic: "Food",
    description: "Teacher-created vocabulary practice pending Admin review.",
    status: "Pending Review",
    createdBy: "Teacher",
    usageCount: 0,
    lastUpdated: "2026-06-16",
  },
  {
    id: "exam-n5-final",
    title: "N5 Final Exam",
    type: "Exam",
    level: "N5",
    topic: "General",
    description: "Final exam covering all N5 vocabulary and grammar.",
    status: "Approved",
    createdBy: "Admin",
    usageCount: 8,
    lastUpdated: "2026-06-09",
  },
  {
    id: "grammar-n4-causative",
    title: "N4 Causative Form",
    type: "Grammar",
    level: "N4",
    topic: "Grammar",
    description: "Exercises for N4 causative and passive form combinations.",
    status: "Approved",
    createdBy: "Admin",
    usageCount: 4,
    lastUpdated: "2026-06-13",
  },
];

export const DATA_BANK_TYPES: DataBankType[] = [
  "Vocabulary",
  "Grammar",
  "Listening",
  "Shadowing",
  "Question",
  "Exam",
];

export const DATA_BANK_LEVELS = ["N5", "N4", "N3", "N2", "N1"];

export const DATA_BANK_STATUSES = ["Approved", "Pending Review", "Rejected"] as const;
