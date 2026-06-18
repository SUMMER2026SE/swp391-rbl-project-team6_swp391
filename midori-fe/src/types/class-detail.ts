export interface ModuleProgress {
  vocabulary: number;
  grammar: number;
  listening: number;
  reading: number;
  shadowing: number;
  writing: number;
}

export interface Assignment {
  id: string;
  title: string;
  moduleType: "Vocabulary" | "Grammar" | "Listening" | "Reading" | "Shadowing" | "Writing";
  assignedDate: string;
  deadline: string;
  timeLimit: number; // in minutes, 0 means no limit
  maxScore: number;
  score?: number;
  status: "Not Started" | "In Progress" | "Submitted" | "Graded" | "Overdue";
}

export interface MaterialItem {
  id: string;
  title: string;
  url?: string;
  content?: string;
}

export interface LessonMaterials {
  lessonId: string;
  title: string;
  items: MaterialItem[];
}

export interface LevelMaterials {
  level: string; // N5, N4, N3, etc.
  lessons: LessonMaterials[];
}

export interface ModuleMaterials {
  vocabulary: LevelMaterials[];
  grammar: LevelMaterials[];
  listening: LevelMaterials[];
  reading: LevelMaterials[];
  shadowing: LevelMaterials[];
  writing: LevelMaterials[];
}

export interface ScoreBreakdown {
  assignmentId: string;
  assignmentName: string;
  module: string;
  score: number;
  maxScore: number;
  submissionTime: string;
  aiFeedback: string;
  wrongAnswers: Array<{ question: string; userAnswer: string; correctAnswer: string }>;
  strengths: string[];
  weaknesses: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "deadline" | "event" | "overdue";
  description?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  teacherName: string;
  read: boolean;
}

export interface Classmate {
  name: string;
  avatar: string;
}

export interface AIWeakPoints {
  listening: string[];
  grammar: string[];
  vocabularyCount: number;
}

export interface DetailedClassInfo {
  id: string;
  name: string;
  teacher: string;
  teacherAvatarInitials: string;
  level: string;
  members: number;
  assignmentCount: number;
  unfinishedCount: number;
  nextDeadline: string;
  createdDate: string;
  joinDate: string;
  isNew?: boolean;
  progress: ModuleProgress;
  classmates: Classmate[];
  assignments: Assignment[];
  materials: ModuleMaterials;
  scores: ScoreBreakdown[];
  calendarEvents: CalendarEvent[];
  announcements: Announcement[];
  weakPoints: AIWeakPoints;
}
