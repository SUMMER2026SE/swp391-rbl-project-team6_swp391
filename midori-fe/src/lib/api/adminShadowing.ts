import { api } from "./client";

export interface GeneratedSentence {
  id: string;
  order: number;
  japanese: string;
  vietnamese: string;
  startTime: number;
  endTime: number;
}

export interface ShadowingItem {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  createdAt?: string;
  segments: {
    id: string;
    startTime: number;
    endTime: number;
    japaneseText: string;
    vietnameseTranslation: string;
  }[];
}

export const adminShadowingApi = {
  /**
   * Upload video file to server. Returns videoId, videoUrl, and duration from backend
   */
  uploadVideo: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ videoId: string; videoUrl: string; duration: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    
    return await api.uploadFile<{ videoId: string; videoUrl: string; duration: number }>(
      "/admin/shadowing/upload",
      formData,
      onProgress
    );
  },

  /**
   * Call AI to automatically generate sentences with timestamps
   */
  generateShadowing: async (videoId: string): Promise<GeneratedSentence[]> => {
    const response = await api.post<any>(`/admin/shadowing/${videoId}/generate`);
    if (response && response.sentences && Array.isArray(response.sentences)) {
      return response.sentences;
    }
    return (Array.isArray(response) ? response : []) as GeneratedSentence[];
  },

  /**
   * Get list of all shadowing items from backend
   */
  listShadowing: async (): Promise<ShadowingItem[]> => {
    const res = await api.get<any[]>("/admin/shadowing");
    return res.map((l: any) => ({
      id: l.id,
      title: l.title,
      videoUrl: l.videoUrl,
      duration: l.duration,
      createdAt: l.createdAt,
      segments: l.sentences ? l.sentences.map((s: any) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        japaneseText: s.japanese,
        vietnameseTranslation: s.vietnamese
      })) : []
    }));
  },

  /**
   * Get single shadowing detail from backend by ID
   */
  getShadowingDetail: async (id: string): Promise<ShadowingItem> => {
    const l = await api.get<any>(`/admin/shadowing/${id}`);
    return {
      id: l.id,
      title: l.title,
      videoUrl: l.videoUrl,
      duration: l.duration,
      createdAt: l.createdAt,
      segments: l.sentences ? l.sentences.map((s: any) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        japaneseText: s.japanese,
        vietnameseTranslation: s.vietnamese
      })) : []
    };
  },

  /**
   * Save (create or update) shadowing lesson edits through backend
   */
  saveShadowing: async (payload: any): Promise<void> => {
    await api.post("/admin/shadowing", payload);
  },

  /**
   * Delete shadowing lesson using backend
   */
  deleteShadowing: async (id: string): Promise<void> => {
    await api.delete(`/admin/shadowing/${id}`);
  }
};
