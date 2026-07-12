/**
 * Admin Shadowing Video API
 * Mirrors: POST /api/admin/shadowing/videos/upload
 *          GET  /api/admin/shadowing/videos
 *          GET  /api/admin/shadowing/videos/{id}
 *          GET  /api/admin/shadowing/videos/{id}/status
 *          DELETE /api/admin/shadowing/videos/{id}
 */

// ─── API Types ──────────────────────────────────────────────────────────────────

export interface ShadowingVideoUploadResponse {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  storagePath: string | null;
  duration: number | null;
  jlptLevel: string | null;
  difficulty: string | null;
  lesson: string | null;
  topic: string | null;
  status: string;
  message: string | null;
  sentenceCount: number | null;
  createdAt: string;
}

export interface ShadowingProcessingStatusResponse {
  id: string;
  status: string;
  currentStep: string | null;
  errorMessage: string | null;
  logs: ProcessingLogResponse[];
  updatedAt: string;
}

export interface ProcessingLogResponse {
  id: string;
  videoId: string;
  step: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

// ─── Admin Shadowing API ────────────────────────────────────────────────────────

export const adminShadowingApi = {
  /**
   * POST /api/admin/shadowing/videos/upload
   * Uploads a video file and metadata. Video is stored in Supabase Storage.
   * The server triggers async AI processing automatically.
   */
  uploadVideo: async (formData: FormData): Promise<ShadowingVideoUploadResponse> => {
    const response = await fetch("/api/admin/shadowing/videos/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("midori_access_token") ?? ""}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message ?? `Upload failed: ${response.status}`);
    }

    const json = await response.json();
    return json.data as ShadowingVideoUploadResponse;
  },

  /**
   * GET /api/admin/shadowing/videos
   * Lists all shadowing videos (any status).
   */
  getAllVideos: async (): Promise<ShadowingVideoUploadResponse[]> => {
    const response = await fetch("/api/admin/shadowing/videos", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("midori_access_token") ?? ""}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.status}`);
    }

    const json = await response.json();
    return (json.data ?? []) as ShadowingVideoUploadResponse[];
  },

  /**
   * GET /api/admin/shadowing/videos/{id}
   * Returns a single shadowing video.
   */
  getVideo: async (id: string): Promise<ShadowingVideoUploadResponse> => {
    const response = await fetch(`/api/admin/shadowing/videos/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("midori_access_token") ?? ""}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status}`);
    }

    const json = await response.json();
    return json.data as ShadowingVideoUploadResponse;
  },

  /**
   * GET /api/admin/shadowing/videos/{id}/status
   * Returns the current AI processing status and logs for a video.
   */
  getProcessingStatus: async (id: string): Promise<ShadowingProcessingStatusResponse> => {
    const response = await fetch(`/api/admin/shadowing/videos/${id}/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("midori_access_token") ?? ""}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch processing status: ${response.status}`);
    }

    const json = await response.json();
    return json.data as ShadowingProcessingStatusResponse;
  },

  /**
   * DELETE /api/admin/shadowing/videos/{id}
   * Permanently deletes a shadowing video.
   */
  deleteVideo: async (id: string): Promise<void> => {
    const response = await fetch(`/api/admin/shadowing/videos/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("midori_access_token") ?? ""}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete video: ${response.status}`);
    }
  },

  /**
   * PUT /api/admin/shadowing/videos/{id}
   * Updates shadowing video details, status, and transcripts.
   */
  updateVideo: async (id: string, payload: any): Promise<ShadowingVideoUploadResponse> => {
    const response = await fetch(`/api/admin/shadowing/videos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("midori_access_token") ?? ""}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Update failed" }));
      throw new Error(error.message ?? `Update failed: ${response.status}`);
    }

    const json = await response.json();
    return json.data as ShadowingVideoUploadResponse;
  },
};
