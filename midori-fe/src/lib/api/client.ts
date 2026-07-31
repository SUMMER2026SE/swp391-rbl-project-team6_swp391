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

function buildHeaders(isFormData = false): HeadersInit {
  const headers: HeadersInit = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

class ApiError extends Error {
  public readonly isApiError = true;

  constructor(
    message: string,
    public status: number,
    public success: boolean = false,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as any).isApiError === true
  );
}

async function request<T>(method: string, path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const isFormData = body instanceof FormData;
  const options: RequestInit = {
    method,
    headers: buildHeaders(isFormData),
    ...init,
  };

  if (body !== undefined) {
    if (isFormData) {
      options.body = body as FormData;
    } else {
      options.body = JSON.stringify(body);
    }
  }

  const tokenBeforeRequest = getToken();
  const res = await fetch(url, options);

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      const msg =
        res.status === 401 && (path === "/auth/login" || path === "/auth/google")
          ? "Unable to sign in. Please try again."
          : res.status === 403
            ? "You do not have permission to access this resource."
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
    if (res.status === 403) {
      throw new ApiError(
        json.message ?? "You do not have permission to access this resource.",
        res.status,
        false,
      );
    }
    throw new ApiError(json.message ?? "An unexpected error occurred.", res.status, false);
  }

  // Auto-redirect on 401 for non-auth endpoints only
  const isAuthEndpoint = path.startsWith("/auth/");
  if (!res.ok && res.status === 401 && !isAuthEndpoint) {
    if (getToken() === tokenBeforeRequest) {
      removeToken();
    }
    const isLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";
    if (!isLoginPage && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(json.message ?? "Session expired. Please login again.", 401);
  }

  return json.data as T;
}

export const api = {
  get<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>("GET", path, undefined, init);
  },

  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>("POST", path, body, init);
  },

  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>("PUT", path, body, init);
  },

  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>("PATCH", path, body, init);
  },

  delete<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>("DELETE", path, undefined, init);
  },

  /**
   * Upload file with progress tracking
   */
  uploadFile<T>(
    path: string,
    formData: FormData,
    onProgress?: (progress: number) => void,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${BASE_URL}${path}`;

      xhr.open("POST", url);

      // Set headers
      const token = getToken();
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.data as T);
          } catch {
            resolve(xhr.responseText as T);
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new ApiError(error.message || "Upload failed", xhr.status));
          } catch {
            reject(new ApiError(`Upload failed: ${xhr.status}`, xhr.status));
          }
        }
      };

      xhr.onerror = () => {
        reject(new ApiError("Network error during upload", 0));
      };

      xhr.send(formData);
    });
  },

  setToken,
  getToken,
  removeToken,
  TOKEN_KEY,
};

export { ApiError };
