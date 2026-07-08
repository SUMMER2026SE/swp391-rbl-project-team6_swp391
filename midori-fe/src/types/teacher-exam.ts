export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface TeacherExamView {
  id: string;
  classId?: string;
  title: string;
  level: string;
  duration: number;
  attempts: number;
  totalQuestions: number;
  scheduledAt: string;
  status: string;
  averageScore?: number;
  source: string;
}
