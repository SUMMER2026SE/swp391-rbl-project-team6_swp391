// Shared types for Question Bank
// These types are used across Question Bank components

export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type QuestionType = "Vocabulary" | "Grammar" | "Reading" | "Listening";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Lesson {
  id: number;
  lessonNumber: number;
  lessonName: string;
  status: "Active" | "Draft";
  questionCount: number;
  createdAt: string;
}

// Base question interface
export interface QuestionBase {
  id: string;
  level: JLPTLevel;
  lesson: number;
  type: QuestionType;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  createdAt: string;
  points?: number;
}

// Listening-specific audio fields
export interface ListeningAudio {
  audioUrl: string;
  audioFileName: string;
  audioDuration: number; // in seconds
}

// Listening question extends base with audio
export interface ListeningQuestion extends QuestionBase {
  type: "Listening";
  audio: ListeningAudio;
}

// Standard question (Vocabulary, Grammar, Reading)
export interface StandardQuestion extends QuestionBase {
  type: "Vocabulary" | "Grammar" | "Reading";
}

// Union type for all questions
export type Question = StandardQuestion | ListeningQuestion;

// Audio library item
export interface AudioItem {
  id: string;
  fileName: string;
  url: string;
  duration: number; // in seconds
  size: number; // in bytes
  uploadedAt: string;
}

// Type guards
export function isListeningQuestion(q: Question): q is ListeningQuestion {
  return q.type === "Listening";
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
