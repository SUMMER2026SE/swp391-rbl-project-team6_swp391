// ─── AI Service Types ─────────────────────────────────────────────────────────────
// Type definitions for the Listening AI Content System

import type { JLPTLevel } from "../types/content-library";

// ─── Listening Modes ─────────────────────────────────────────────────────────────
export type ListeningMode = "dictation" | "quiz" | "both";

// ─── Listening Status ─────────────────────────────────────────────────────────────
export type ListeningStatus = "draft" | "processing" | "reviewed" | "published";

// ─── Transcript Types ────────────────────────────────────────────────────────────
export interface ListeningTranscript {
  raw: string; // Raw transcript with speaker labels
  cleaned: string; // Cleaned transcript without labels
  segments: ListeningSegment[];
}

export interface ListeningSegment {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  translation: string;
  hintWords?: string[]; // Optional hint words for dictation
}

// ─── Question Types ──────────────────────────────────────────────────────────────
export interface ListeningQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  explanation?: string;
  hintWords?: string[];
  linkedSegmentId?: string; // Link to transcript segment
}

// ─── AI Processing Result ────────────────────────────────────────────────────────
export interface ListeningAIResult {
  audioFileId: string;
  status: "pending" | "processing" | "completed" | "failed";
  transcript?: ListeningTranscript;
  questions: ListeningQuestion[];
  metadata: {
    level: JLPTLevel;
    mode: ListeningMode;
    generatedAt: string;
    processingTime: number;
    confidenceScore?: number; // AI confidence 0-100
  };
  error?: string;
}

// ─── AI Processing Status ────────────────────────────────────────────────────────
export interface AIProcessingStatus {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  estimatedTime: number; // seconds remaining
  result?: ListeningAIResult;
}

// ─── Admin Listening Item (Extended) ────────────────────────────────────────────
export interface AdminListeningItem {
  id: string;
  title: string;
  audioUrl?: string;
  audioFileName?: string;
  audioType?: string;
  audioSize?: number; // in bytes
  level: JLPTLevel;
  mode: ListeningMode;
  status: ListeningStatus;
  transcript?: ListeningTranscript;
  questions: ListeningQuestion[];
  hintWords?: string[];
  jlptLevel: JLPTLevel;
  tags: string[];
  duration: number; // in seconds
  teacherId?: string;
  teacherName?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Upload Payload ─────────────────────────────────────────────────────────────
export interface ListeningUploadPayload {
  file: File;
  title: string;
  level: JLPTLevel;
  mode: ListeningMode;
  tags?: string[];
}

// ─── AI Process Payload ────────────────────────────────────────────────────────
export interface AIProcessPayload {
  audioFileId: string;
  level: JLPTLevel;
  mode: ListeningMode;
}

// ─── Update Payload ─────────────────────────────────────────────────────────────
export interface ListeningUpdatePayload {
  title?: string;
  transcript?: ListeningTranscript;
  questions?: ListeningQuestion[];
  hintWords?: string[];
  level?: JLPTLevel;
  tags?: string[];
  status?: ListeningStatus;
}

// ─── Review Actions ─────────────────────────────────────────────────────────────
export interface ReviewAction {
  action: "approve" | "reject" | "request_changes";
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// ─── Publish Payload ────────────────────────────────────────────────────────────
export interface PublishPayload {
  id: string;
  status: "published" | "draft";
}

// ─── Student View Types ────────────────────────────────────────────────────────
export interface StudentListeningView {
  id: string;
  title: string;
  audioUrl: string;
  level: JLPTLevel;
  mode: ListeningMode;
  transcript?: string;
  segments?: ListeningSegment[];
  questions?: ListeningQuestion[];
  hintWords?: string[];
  duration: number;
}

export interface ListeningAttempt {
  listeningId: string;
  userId: string;
  answers: Record<string, number>; // questionId -> selectedOption
  score?: number;
  completedAt?: string;
}

// ─── Filter Types ───────────────────────────────────────────────────────────────
export interface ListeningFilter {
  level?: JLPTLevel;
  mode?: ListeningMode;
  status?: ListeningStatus;
  search?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}
