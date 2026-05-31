import { api } from "./client";
import type {
  ApiResponse,
  AuthResponse,
  UserResponse,
  LoginRequest,
  RegisterRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResendVerificationRequest,
  ChangePasswordRequest,
} from "./types";

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<null>>("/auth/register", data),

  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>("/auth/login", data),

  logout: () =>
    api.post<ApiResponse<null>>("/auth/logout"),

  getMe: () =>
    api.get<ApiResponse<UserResponse>>("/auth/me"),

  verifyEmail: (data: VerifyEmailRequest) =>
    api.post<ApiResponse<null>>("/auth/verify-email", data),

  resendVerification: (data: ResendVerificationRequest) =>
    api.post<ApiResponse<null>>("/auth/resend-verification", data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<ApiResponse<null>>("/auth/forgot-password", data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<ApiResponse<null>>("/auth/reset-password", data),

  changePassword: (data: ChangePasswordRequest) =>
    api.put<ApiResponse<null>>("/auth/change-password", data),
};
