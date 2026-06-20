import { useState, useCallback, useEffect } from "react";
import {
  type JLPTLevel, type ContentSkill,
  type VocabularyLesson, type GrammarLesson, type ReadingLesson, type ListeningLesson, type ShadowingItem,
  type VocabularyItem, type GrammarItem,
  getVocabularyLessons, addVocabularyLesson, updateVocabularyLesson, deleteVocabularyLesson,
  getGrammarLessons, addGrammarLesson, updateGrammarLesson, deleteGrammarLesson,
  getReadingLessons, addReadingLesson, updateReadingLesson, deleteReadingLesson,
  getListeningLessons, addListeningLesson, updateListeningLesson, deleteListeningLesson,
  getShadowingItems, addShadowingItem, updateShadowingItem, deleteShadowingItem,
  generateId, subscribe,
} from "@/mocks/contentLibraryMock";

export function useContentLibrary(level: JLPTLevel, skill: ContentSkill) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => setRefreshKey(k => k + 1));
    return unsub;
  }, []);

  const getData = useCallback((): (VocabularyLesson | GrammarLesson | ReadingLesson | ListeningLesson | ShadowingItem)[] => {
    switch (skill) {
      case "vocabulary": return getVocabularyLessons(level);
      case "grammar": return getGrammarLessons(level);
      case "reading": return getReadingLessons(level);
      case "listening": return getListeningLessons(level);
      case "shadowing": return getShadowingItems(level);
      default: return [];
    }
  }, [level, skill, refreshKey]);

  const getLessonById = useCallback((lessonId: string): VocabularyLesson | GrammarLesson | ReadingLesson | ListeningLesson | ShadowingItem | null => {
    const data = getData();
    return data.find(l => l.id === lessonId) || null;
  }, [getData]);

  const createLesson = useCallback((lessonData: Partial<VocabularyLesson | GrammarLesson | ReadingLesson | ListeningLesson | ShadowingItem>) => {
    switch (skill) {
      case "vocabulary": addVocabularyLesson(level, lessonData as VocabularyLesson); break;
      case "grammar": addGrammarLesson(level, lessonData as GrammarLesson); break;
      case "reading": addReadingLesson(level, lessonData as ReadingLesson); break;
      case "listening": addListeningLesson(level, lessonData as ListeningLesson); break;
      case "shadowing": addShadowingItem(level, lessonData as ShadowingItem); break;
    }
  }, [level, skill]);

  const updateLesson = useCallback((lessonId: string, lessonData: Partial<VocabularyLesson | GrammarLesson | ReadingLesson | ListeningLesson | ShadowingItem>) => {
    switch (skill) {
      case "vocabulary": updateVocabularyLesson(level, lessonId, lessonData as Partial<VocabularyLesson>); break;
      case "grammar": updateGrammarLesson(level, lessonId, lessonData as Partial<GrammarLesson>); break;
      case "reading": updateReadingLesson(level, lessonId, lessonData as Partial<ReadingLesson>); break;
      case "listening": updateListeningLesson(level, lessonId, lessonData as Partial<ListeningLesson>); break;
      case "shadowing": updateShadowingItem(level, lessonId, lessonData as Partial<ShadowingItem>); break;
    }
  }, [level, skill]);

  const deleteLesson = useCallback((lessonId: string) => {
    switch (skill) {
      case "vocabulary": deleteVocabularyLesson(level, lessonId); break;
      case "grammar": deleteGrammarLesson(level, lessonId); break;
      case "reading": deleteReadingLesson(level, lessonId); break;
      case "listening": deleteListeningLesson(level, lessonId); break;
      case "shadowing": deleteShadowingItem(level, lessonId); break;
    }
  }, [level, skill]);

  const addItem = useCallback((lessonId: string, item: VocabularyItem | GrammarItem | ReadingLesson["items"][0] | ListeningLesson["items"][0] | ShadowingItem["segments"][0]) => {
    switch (skill) {
      case "vocabulary": 
        if ("word" in item) {
          const lesson = getData().find(l => l.id === lessonId) as VocabularyLesson | undefined;
          if (lesson) {
            const newItem = { ...item, id: generateId("v") } as VocabularyItem;
            updateLesson(lessonId, { items: [...lesson.items, newItem] });
          }
        }
        break;
      case "grammar":
        if ("grammarPoint" in item) {
          const lesson = getData().find(l => l.id === lessonId) as GrammarLesson | undefined;
          if (lesson) {
            const newItem = { ...item, id: generateId("g") } as GrammarItem;
            updateLesson(lessonId, { items: [...lesson.items, newItem] });
          }
        }
        break;
    }
  }, [skill, getData, updateLesson]);

  const getStats = useCallback(() => {
    const data = getData();
    const totalItems = data.reduce((sum, lesson) => {
      if ("items" in lesson && Array.isArray(lesson.items)) return sum + lesson.items.length;
      if ("segments" in lesson && Array.isArray(lesson.segments)) return sum + lesson.segments.length;
      return sum;
    }, 0);
    return {
      totalLessons: data.length,
      totalItems,
    };
  }, [getData]);

  return {
    lessons: getData(),
    getLessonById,
    createLesson,
    updateLesson,
    deleteLesson,
    addItem,
    getStats,
    refresh: () => setRefreshKey(k => k + 1),
  };
}
