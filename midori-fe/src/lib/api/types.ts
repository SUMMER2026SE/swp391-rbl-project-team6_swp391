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
