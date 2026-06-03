import type { ApiResponse } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
const TOKEN_KEY = "midori_access_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public success: boolean = false
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: buildHeaders(),
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      const msg = res.status === 401 && (path === "/auth/login" || path === "/auth/google")
        ? "Unable to sign in. Please try again."
        : "Request failed. Please try again.";
      throw new ApiError(msg, res.status);
    }
    throw new ApiError(`Request failed: ${res.status} ${res.statusText}`, res.status);
  }

  if (!json.success) {
    // Extract field-level error if available (e.g. from MethodArgumentNotValidException)
    if (json.errors && typeof json.errors === "object") {
      const fieldErrors = json.errors as Record<string, string>;
      const errorValues = Object.values(fieldErrors);
      if (errorValues.length > 0) {
        throw new ApiError(errorValues[0], res.status, false);
      }
    }
    throw new ApiError(json.message ?? "An unexpected error occurred.", res.status, false);
  }

  if (!res.ok && res.status === 401) {
    removeToken();
    const isLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";
    if (!isLoginPage && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(json.message ?? "Session expired. Please login again.", 401);
  }

  return json.data as T;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>("GET", path);
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("POST", path, body);
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("PUT", path, body);
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("PATCH", path, body);
  },

  delete<T>(path: string): Promise<T> {
    return request<T>("DELETE", path);
  },

  setToken,
  getToken,
  removeToken,
  TOKEN_KEY,
};

export { ApiError };
