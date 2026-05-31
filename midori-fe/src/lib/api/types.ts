export type Role = "STUDENT" | "TEACHER" | "ADMIN";
export type UserStatus = "ACTIVE" | "PENDING" | "INACTIVE" | "BANNED";

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
  oldPassword: string;
  newPassword: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  nativeLanguage?: string;
  learningGoals?: string[];
  preferredStudyTime?: string;
  role: Role;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  nativeLanguage?: string;
  learningGoals?: string[];
  preferredStudyTime?: string;
}
