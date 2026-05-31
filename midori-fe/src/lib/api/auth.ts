import { api } from "./client";
import type {
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
    api.post<null>("/auth/register", data),

  login: (data: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", data),

  logout: () =>
    api.post<null>("/auth/logout"),

  getMe: () =>
    api.get<UserResponse>("/auth/me"),

  verifyEmail: (data: VerifyEmailRequest) =>
    api.post<null>("/auth/verify-email", data),

  resendVerification: (data: ResendVerificationRequest) =>
    api.post<null>("/auth/resend-verification", data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<null>("/auth/forgot-password", data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<null>("/auth/reset-password", data),

  changePassword: (data: ChangePasswordRequest) =>
    api.put<null>("/auth/change-password", data),
};
