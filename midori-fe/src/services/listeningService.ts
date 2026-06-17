// ─── Listening Service ──────────────────────────────────────────────────────────────
// Production-ready service with API integration and mock fallback

import { api } from "../lib/api/client";
import type {
  AdminListeningItem,
  ListeningUploadPayload,
  ListeningUpdatePayload,
  ListeningFilter,
  ListeningMode,
  ListeningStatus,
  AIProcessPayload,
  PublishPayload,
  ReviewAction,
  ListeningQuestion,
  ListeningTranscript,
} from "./aiService.types";
import type { JLPTLevel } from "../types/content-library";
import { aiService, generateAIListeningContent, processAudioWithAI } from "./aiService";

// ─── Configuration ───────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const isApiEnabled = !!API_BASE_URL;

// ─── Local Storage Keys ─────────────────────────────────────────────────────────
const LISTENING_STORAGE_KEY = "midori_listening_items";

// ─── Listening Service Class ────────────────────────────────────────────────────
class ListeningService {
  // ─── Admin: Get All Listening Items ──────────────────────────────────────────
  async getAdminListeningItems(
    filter?: ListeningFilter
  ): Promise<AdminListeningItem[]> {
    if (isApiEnabled) {
      try {
        const params = this.buildFilterParams(filter);
        const response = await api.get<AdminListeningItem[]>(
          `/admin/listening${params ? `?${params}` : ""}`
        );
        return response.data;
      } catch (error) {
        console.warn("API failed, using local storage:", error);
      }
    }

    // Fallback to local storage
    return this.getLocalListeningItems(filter);
  }

  // ─── Admin: Get Single Item ─────────────────────────────────────────────────
  async getAdminListeningItem(id: string): Promise<AdminListeningItem | null> {
    if (isApiEnabled) {
      try {
        const response = await api.get<AdminListeningItem>(
          `/admin/listening/${id}`
        );
        return response.data;
      } catch (error) {
        console.warn("API failed, using local storage:", error);
      }
    }

    // Fallback to local storage
    const items = this.getLocalListeningItems();
    return items.find((item) => item.id === id) || null;
  }

  // ─── Admin: Upload Audio ────────────────────────────────────────────────────
  async uploadAudio(
    payload: ListeningUploadPayload,
    onProgress?: (progress: number) => void
  ): Promise<AdminListeningItem> {
    const { file, title, level, mode, tags } = payload;

    if (isApiEnabled) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        formData.append("level", level);
        formData.append("mode", mode);
        if (tags) formData.append("tags", JSON.stringify(tags));

        const response = await api.uploadFile<AdminListeningItem>(
          "/listening/upload",
          formData,
          (progress) => onProgress?.(progress)
        );
        return response.data;
      } catch (error) {
        console.warn("Upload API failed, storing locally:", error);
      }
    }

    // Fallback: Store file metadata locally
    const localItem: AdminListeningItem = {
      id: `listen-${Date.now()}`,
      title,
      audioUrl: URL.createObjectURL(file), // Create local URL for preview
      audioFileName: file.name,
      audioType: file.type,
      audioSize: file.size,
      level,
      mode,
      status: "draft",
      questions: [],
      tags: tags || [],
      jlptLevel: level,
      duration: 0, // Will be calculated when audio is processed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to local storage
    this.saveLocalListeningItem(localItem);

    return localItem;
  }

  // ─── Admin: Process with AI ─────────────────────────────────────────────────
  async processWithAI(
    itemId: string,
    options: AIProcessPayload
  ): Promise<AdminListeningItem | null> {
    const item = await this.getAdminListeningItem(itemId);
    if (!item) return null;

    // Update status to processing
    await this.updateListeningStatus(itemId, "processing");

    try {
      if (isApiEnabled) {
        try {
          const response = await api.post<AdminListeningItem>(
            `/listening/ai-process`,
            options
          );
          return response.data;
        } catch (error) {
          console.warn("AI process API failed, using mock:", error);
        }
      }

      // Mock AI processing
      const result = await processAudioWithAI(itemId, options.level, options.mode);

      // Update item with AI results
      const updatedItem: AdminListeningItem = {
        ...item,
        status: "reviewed", // Mock AI results are considered reviewed
        transcript: result.transcript,
        questions: result.questions,
        updatedAt: new Date().toISOString(),
      };

      this.updateLocalListeningItem(updatedItem);
      return updatedItem;
    } catch (error) {
      console.error("AI processing failed:", error);
      await this.updateListeningStatus(itemId, "draft");
      throw error;
    }
  }

  // ─── Admin: Generate Mock AI Content ────────────────────────────────────────
  async generateMockAIContent(
    options: AIProcessPayload
  ): Promise<{ transcript: ListeningTranscript; questions: ListeningQuestion[] }> {
    const result = await generateAIListeningContent({
      level: options.level,
      mode: options.mode,
    });

    return {
      transcript: result.transcript!,
      questions: result.questions,
    };
  }

  // ─── Admin: Update Item ─────────────────────────────────────────────────────
  async updateListening(
    id: string,
    payload: ListeningUpdatePayload
  ): Promise<AdminListeningItem | null> {
    if (isApiEnabled) {
      try {
        const response = await api.put<AdminListeningItem>(
          `/admin/listening/${id}`,
          payload
        );
        return response.data;
      } catch (error) {
        console.warn("API update failed, updating locally:", error);
      }
    }

    // Fallback to local storage
    const item = await this.getAdminListeningItem(id);
    if (!item) return null;

    const updatedItem: AdminListeningItem = {
      ...item,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    this.updateLocalListeningItem(updatedItem);
    return updatedItem;
  }

  // ─── Admin: Update Status ───────────────────────────────────────────────────
  async updateListeningStatus(
    id: string,
    status: ListeningStatus
  ): Promise<AdminListeningItem | null> {
    return this.updateListening(id, { status });
  }

  // ─── Admin: Update Transcript ────────────────────────────────────────────────
  async updateTranscript(
    id: string,
    transcript: ListeningTranscript
  ): Promise<AdminListeningItem | null> {
    return this.updateListening(id, { transcript });
  }

  // ─── Admin: Update Questions ────────────────────────────────────────────────
  async updateQuestions(
    id: string,
    questions: ListeningQuestion[]
  ): Promise<AdminListeningItem | null> {
    return this.updateListening(id, { questions });
  }

  // ─── Admin: Add Question ────────────────────────────────────────────────────
  async addQuestion(
    id: string,
    question: ListeningQuestion
  ): Promise<AdminListeningItem | null> {
    const item = await this.getAdminListeningItem(id);
    if (!item) return null;

    const questions = [...item.questions, question];
    return this.updateQuestions(id, questions);
  }

  // ─── Admin: Delete Question ────────────────────────────────────────────────
  async deleteQuestion(
    itemId: string,
    questionId: string
  ): Promise<AdminListeningItem | null> {
    const item = await this.getAdminListeningItem(itemId);
    if (!item) return null;

    const questions = item.questions.filter((q) => q.id !== questionId);
    return this.updateQuestions(itemId, questions);
  }

  // ─── Admin: Review Item ────────────────────────────────────────────────────
  async reviewListening(
    id: string,
    action: ReviewAction
  ): Promise<AdminListeningItem | null> {
    if (action.action === "approve") {
      return this.updateListening(id, {
        status: "reviewed",
      });
    }

    if (action.action === "reject") {
      return this.updateListening(id, {
        status: "draft",
      });
    }

    // request_changes - keep as draft but with feedback
    return this.updateListening(id, {
      status: "draft",
    });
  }

  // ─── Admin: Publish Item ───────────────────────────────────────────────────
  async publishListening(payload: PublishPayload): Promise<AdminListeningItem | null> {
    return this.updateListening(payload.id, {
      status: payload.status === "published" ? "published" : "draft",
    });
  }

  // ─── Admin: Delete Item ────────────────────────────────────────────────────
  async deleteListening(id: string): Promise<boolean> {
    if (isApiEnabled) {
      try {
        await api.delete(`/admin/listening/${id}`);
        return true;
      } catch (error) {
        console.warn("API delete failed, deleting locally:", error);
      }
    }

    // Fallback to local storage
    this.deleteLocalListeningItem(id);
    return true;
  }

  // ─── Student: Get Published Items ─────────────────────────────────────────
  async getPublishedListeningItems(
    filter?: ListeningFilter
  ): Promise<AdminListeningItem[]> {
    const allItems = await this.getAdminListeningItems(filter);
    return allItems.filter((item) => item.status === "published");
  }

  // ─── Student: Get Single Item ──────────────────────────────────────────────
  async getStudentListeningItem(id: string): Promise<AdminListeningItem | null> {
    const item = await this.getAdminListeningItem(id);
    
    // Only return published items for students
    if (item && item.status === "published") {
      return item;
    }
    return null;
  }

  // ─── Helper: Build Filter Params ────────────────────────────────────────────
  private buildFilterParams(filter?: ListeningFilter): string {
    if (!filter) return "";

    const params = new URLSearchParams();
    if (filter.level) params.set("level", filter.level);
    if (filter.mode) params.set("mode", filter.mode);
    if (filter.status) params.set("status", filter.status);
    if (filter.search) params.set("search", filter.search);
    if (filter.tags?.length) params.set("tags", filter.tags.join(","));
    if (filter.dateFrom) params.set("dateFrom", filter.dateFrom);
    if (filter.dateTo) params.set("dateTo", filter.dateTo);

    return params.toString();
  }

  // ─── Local Storage Methods ──────────────────────────────────────────────────

  private getLocalListeningItems(
    filter?: ListeningFilter
  ): AdminListeningItem[] {
    try {
      const stored = localStorage.getItem(LISTENING_STORAGE_KEY);
      if (!stored) return [];

      let items: AdminListeningItem[] = JSON.parse(stored);

      // Apply filters
      if (filter) {
        if (filter.level) {
          items = items.filter((item) => item.level === filter.level);
        }
        if (filter.mode) {
          items = items.filter((item) => item.mode === filter.mode);
        }
        if (filter.status) {
          items = items.filter((item) => item.status === filter.status);
        }
        if (filter.search) {
          const search = filter.search.toLowerCase();
          items = items.filter(
            (item) =>
              item.title.toLowerCase().includes(search) ||
              item.transcript?.cleaned.toLowerCase().includes(search)
          );
        }
        if (filter.tags?.length) {
          items = items.filter((item) =>
            filter.tags!.some((tag) => item.tags.includes(tag))
          );
        }
      }

      return items;
    } catch (error) {
      console.error("Error reading local listening items:", error);
      return [];
    }
  }

  private saveLocalListeningItem(item: AdminListeningItem): void {
    try {
      const items = this.getLocalListeningItems();
      items.unshift(item);
      localStorage.setItem(LISTENING_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Error saving local listening item:", error);
    }
  }

  private updateLocalListeningItem(updatedItem: AdminListeningItem): void {
    try {
      const items = this.getLocalListeningItems();
      const index = items.findIndex((item) => item.id === updatedItem.id);
      if (index !== -1) {
        items[index] = updatedItem;
      } else {
        items.unshift(updatedItem);
      }
      localStorage.setItem(LISTENING_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Error updating local listening item:", error);
    }
  }

  private deleteLocalListeningItem(id: string): void {
    try {
      const items = this.getLocalListeningItems();
      const filtered = items.filter((item) => item.id !== id);
      localStorage.setItem(LISTENING_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error deleting local listening item:", error);
    }
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  async getListeningStats(): Promise<{
    total: number;
    draft: number;
    processing: number;
    reviewed: number;
    published: number;
    byLevel: Record<JLPTLevel, number>;
    byMode: Record<ListeningMode, number>;
  }> {
    const items = await this.getAdminListeningItems();

    const stats = {
      total: items.length,
      draft: 0,
      processing: 0,
      reviewed: 0,
      published: 0,
      byLevel: { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 } as Record<JLPTLevel, number>,
      byMode: { dictation: 0, quiz: 0, both: 0 } as Record<ListeningMode, number>,
    };

    items.forEach((item) => {
      // Count by status
      if (item.status === "draft") stats.draft++;
      else if (item.status === "processing") stats.processing++;
      else if (item.status === "reviewed") stats.reviewed++;
      else if (item.status === "published") stats.published++;

      // Count by level
      stats.byLevel[item.level] = (stats.byLevel[item.level] || 0) + 1;

      // Count by mode
      stats.byMode[item.mode] = (stats.byMode[item.mode] || 0) + 1;
    });

    return stats;
  }
}

// ─── Export Singleton ───────────────────────────────────────────────────────────
export const listeningService = new ListeningService();

// ─── Named Exports for Convenience ──────────────────────────────────────────────
export const getAdminListeningItems = (filter?: ListeningFilter) =>
  listeningService.getAdminListeningItems(filter);

export const getAdminListeningItem = (id: string) =>
  listeningService.getAdminListeningItem(id);

export const uploadListeningAudio = (
  payload: ListeningUploadPayload,
  onProgress?: (progress: number) => void
) => listeningService.uploadAudio(payload, onProgress);

export const processListeningWithAI = (
  itemId: string,
  options: AIProcessPayload
) => listeningService.processWithAI(itemId, options);

export const generateMockAIListeningContent = (options: AIProcessPayload) =>
  listeningService.generateMockAIContent(options);

export const updateListeningContent = (
  id: string,
  payload: ListeningUpdatePayload
) => listeningService.updateListening(id, payload);

export const publishListeningContent = (payload: PublishPayload) =>
  listeningService.publishListening(payload);

export const deleteListeningContent = (id: string) =>
  listeningService.deleteListening(id);

export const reviewListeningContent = (
  id: string,
  action: ReviewAction
) => listeningService.reviewListening(id, action);

export const getListeningStats = () => listeningService.getListeningStats();

// ─── Check if API is available ──────────────────────────────────────────────────
export const isListeningApiEnabled = isApiEnabled;
