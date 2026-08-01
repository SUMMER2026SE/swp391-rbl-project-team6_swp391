import { api } from './client';

export interface LearningJourneyLessonDto {
  id: string;
  lessonNumber: number;
  title: string;
  level: string;
  displayOrder: number;
  hasVocabulary: boolean;
  hasGrammar: boolean;
  hasReading: boolean;
  hasListening: boolean;
}

export interface LearningJourneyResponse {
  level: string;
  lessons: LearningJourneyLessonDto[];
}

export const studentJourneyApi = {
  getJourney(level: string): Promise<LearningJourneyResponse> {
    return api.get<LearningJourneyResponse>(`/student/learning-journey?level=${level}`);
  }
};