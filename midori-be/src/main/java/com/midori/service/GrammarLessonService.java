package com.midori.service;

import com.midori.dto.grammar.GrammarDetailResponse;
import com.midori.dto.grammar.GrammarLessonRequest;
import com.midori.dto.grammar.GrammarLessonResponse;
import com.midori.dto.grammar.GrammarLessonWithContentsRequest;

import java.util.List;
import java.util.UUID;

public interface GrammarLessonService {

    GrammarLessonResponse createGrammarLesson(GrammarLessonRequest request);

    GrammarDetailResponse createGrammarLessonWithContents(GrammarLessonWithContentsRequest request);

    GrammarDetailResponse updateGrammarLesson(UUID lessonId, GrammarLessonRequest request);

    GrammarDetailResponse updateGrammarLessonWithContents(UUID lessonId, GrammarLessonWithContentsRequest request);

    void deleteGrammarLesson(UUID lessonId);

    GrammarLessonResponse getGrammarLesson(UUID lessonId);

    GrammarDetailResponse getGrammarLessonDetail(UUID lessonId);

    List<GrammarLessonResponse> getAllGrammarLessons();

    List<GrammarLessonResponse> getGrammarLessonsByLevel(String jlptLevel);

    List<GrammarLessonResponse> getActiveGrammarLessons();

    List<GrammarLessonResponse> getActiveGrammarLessonsByLevel(String jlptLevel);

    GrammarLessonResponse publishLesson(UUID lessonId);

    GrammarLessonResponse unpublishLesson(UUID lessonId);
}