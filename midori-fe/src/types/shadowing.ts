export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type VideoStatus = "processing" | "completed" | "failed" | "uploading";
export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";

export interface SentenceItem {
  id: string;
  startTime: number;
  endTime: number;
  japanese: string;
  vietnamese: string;
}

export interface ShadowingVideo {
  id: string;
  title: string;
  description: string;
  jlptLevel: JLPTLevel;
  lesson: string;
  difficulty: DifficultyLevel;
  duration: string;
  thumbnail: string;
  status: VideoStatus;
  storagePath: string;
  videoUrl: string;
  topic: string;
  createdDate: string;
  updatedDate: string;
  tags: string[];
  sentences: SentenceItem[];
  sentenceCount?: number;
  statistics: {
    totalStudents: number;
    completedCount: number;
    averageScore: number;
    averageCompletionTime: string;
  };
}
