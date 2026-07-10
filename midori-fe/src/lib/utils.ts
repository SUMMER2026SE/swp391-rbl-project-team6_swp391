import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

// VITE_API_BASE_URL typically ends with "/api" (e.g. http://localhost:8080/api).
// We strip that suffix so we can prepend the host to backend stream paths.
const API_ORIGIN = RAW_API_BASE_URL.replace(/\/api\/?$/, "");

/**
 * Resolve a video URL to a fully-qualified absolute URL.
 * - If the URL is already absolute (http/https), return as-is.
 * - If the URL is a backend stream path (e.g. /api/admin/shadowing/video/{id}),
 *   rewrite it to the student-authenticated equivalent and prepend the API origin.
 * - Otherwise, prepend the API origin to any relative path.
 */
export function getAbsoluteVideoUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Rewrite admin stream path -> student stream path so students go through
  // an authenticated endpoint instead of /api/admin/shadowing/video/{id}.
  const rewritten = url.replace(/^\/api\/admin\/shadowing\/video\//, "/api/student/shadowing/video/");
  return `${API_ORIGIN}${rewritten}`;
}
