export interface TeacherStudent {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avgScore: number;
  completionRate: number;
  currentStreak: number;
  lastActivity: string;
  needSupport?: boolean;
  overdueCount?: number;
  lowScoreCount?: number;
}

export interface TeacherAssignment {
  id: string;
  title: string;
  moduleType: "Vocabulary" | "Grammar" | "Listening" | "Reading" | "Shadowing" | "Writing";
  assignedDate: string;
  deadline: string;
  totalSubmissions: number;
  notSubmittedCount: number;
  avgScore: number;
  status: "Active" | "Closed" | "Upcoming";
  ungradedCount?: number;
}

export interface TeacherActivity {
  id: string;
  studentName: string;
  actionText: string;
  timeAgo: string;
  date: string;
}

export interface TeacherMaterialModule {
  id: "vocabulary" | "grammar" | "listening" | "reading" | "shadowing" | "writing";
  moduleName: string;
  totalLessons: number;
  publishedCount: number;
  draftCount: number;
}

export interface TeacherAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  isPinned?: boolean;
}

export interface TeacherClassAnalytics {
  avgScore: number;
  submissionRate: number;
  topStudents: string[];
  weakestTopics: string[];
  mostDifficultAssignments: string[];
  progressByModule: {
    vocabulary: number;
    grammar: number;
    listening: number;
    reading: number;
    shadowing: number;
    writing: number;
  };
}

export interface TeacherClassInfo {
  id: string;
  name: string;
  teacher: string;
  teacherAvatarInitials: string;
  level: string;
  members: number;
  assignmentCount: number;
  avgScore: number;
  nextDeadline: string;
  createdDate: string;
  progress?: number;
  status?: "ACTIVE" | "ARCHIVED";
  students: TeacherStudent[];
  assignments: TeacherAssignment[];
  activities: TeacherActivity[];
  materials: TeacherMaterialModule[];
  announcements: TeacherAnnouncement[];
  analytics: TeacherClassAnalytics;
  calendarEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: "deadline" | "event" | "overdue";
    description?: string;
  }>;
}

