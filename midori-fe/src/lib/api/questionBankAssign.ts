import { api } from "./client";

export interface AssignHomeworkFromBankRequest {
  title: string;
  instructions?: string;
  classIds: string[];
  dueDate: string;
  maxScore: number;
}

export interface AssignExamFromBankRequest {
  title: string;
  instructions?: string;
  additionalTopicIds?: string[];
  classIds: string[];
  dueDate: string;
  durationMinutes: number;
  maxScore: number;
}

export interface AssignFromBankResponse {
  created: number;
}

export const questionBankAssignApi = {
  assignHomework: (
    topicId: string,
    body: AssignHomeworkFromBankRequest,
  ): Promise<AssignFromBankResponse> =>
    api.post<AssignFromBankResponse>(
      `/teacher/question-bank/topics/${encodeURIComponent(topicId)}/assign-homework`,
      body,
    ),

  assignExam: (topicId: string, body: AssignExamFromBankRequest): Promise<AssignFromBankResponse> =>
    api.post<AssignFromBankResponse>(
      `/teacher/question-bank/topics/${encodeURIComponent(topicId)}/assign-exam`,
      body,
    ),
};
