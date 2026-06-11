export type Role = "STUDENT" | "TEACHER" | "ADMIN";
export type UserStatus = "PENDING" | "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "BANNED";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UserResponse {
  id: string;
  email: string;
  name?: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword?: string;
  role?: "STUDENT" | "TEACHER";
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ─── Grammar Types ─────────────────────────────────────────────────────────────────

export type GrammarLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export type GrammarStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface GrammarResponse {
  id: string;
  title: string;
  pattern: string;
  meaning: string;
  structure: string;
  usage: string;
  examples: string[];
  level: GrammarLevel;
  status: GrammarStatus;
  rejectReason: string | null;
  createdBy: string;
  teacherName: string;
  ownedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GrammarListParams {
  level?: GrammarLevel;
  search?: string;
}

// ─── Progress Types ─────────────────────────────────────────────────────────────────

export type ProgressContentType = "VOCABULARY" | "GRAMMAR" | "FLASHCARD" | "LESSON";

export interface ProgressResponse {
  id: string;
  contentType: ProgressContentType;
  contentId: string;
  isLearned: boolean;
  isMastered: boolean;
  isFavorite: boolean;
  isCompleted: boolean;
  learnedAt: string | null;
  masteredAt: string | null;
  favoriteAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyStudyData {
  date: string;
  day: string;
  count: number;
}

export interface ProgressStatsResponse {
  completedLessons: number;
  learnedWords: number;
  masteredWords: number;
  favoriteWords: number;
  progressPercent: number | null;
  learningStreak: number | null;
  weeklyStudyData: WeeklyStudyData[];
}

export interface ProgressUpdateRequest {
  isLearned?: boolean;
  isMastered?: boolean;
  isFavorite?: boolean;
  isCompleted?: boolean;
}

export interface ProgressListParams {
  contentType?: ProgressContentType;
  contentId?: string;
  isLearned?: boolean;
  isMastered?: boolean;
  isFavorite?: boolean;
  isCompleted?: boolean;
}
