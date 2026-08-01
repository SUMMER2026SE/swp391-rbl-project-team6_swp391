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
  register: (data: RegisterRequest) => api.post<null>("/auth/register", data),

  login: (data: LoginRequest) => api.post<AuthResponse>("/auth/login", data),

  logout: () => api.post<null>("/auth/logout"),

  getMe: (init?: RequestInit) => {
    const requestId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);
    const signal = init?.signal;
    if (typeof window !== "undefined") {
      console.log(`[AUTH /me START] ${requestId}, Path: ${window.location.pathname}, Timestamp: ${new Date().toISOString()}, AbortSignal state: ${signal?.aborted}`);
      console.trace(`[AUTH /me START TRACE] ${requestId}`);
      signal?.addEventListener("abort", () => {
        console.log(`[AUTH /me ABORT] ${requestId}, Timestamp: ${new Date().toISOString()}`);
      });
    }
    return api.get<UserResponse>(`/auth/me?fe_req_id=${requestId}`, init);
  },

  verifyEmail: (data: VerifyEmailRequest) => api.post<null>("/auth/verify-email", data),

  resendVerification: (data: ResendVerificationRequest) =>
    api.post<null>("/auth/resend-verification", data),

  forgotPassword: (data: ForgotPasswordRequest) => api.post<null>("/auth/forgot-password", data),

  resetPassword: (data: ResetPasswordRequest) => api.post<null>("/auth/reset-password", data),

  changePassword: (data: ChangePasswordRequest) => api.post<null>("/auth/change-password", data),

  googleLogin: (idToken: string, role?: string) =>
    api.post<AuthResponse>("/auth/google", role ? { idToken, role } : { idToken }),
};
