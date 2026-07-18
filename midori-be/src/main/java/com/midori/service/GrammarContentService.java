package com.midori.service;

import com.midori.dto.grammar.GrammarContentRequest;
import com.midori.dto.grammar.GrammarContentResponse;

import java.util.List;
import java.util.UUID;

public interface GrammarContentService {

    GrammarContentResponse createContent(UUID grammarLessonId, GrammarContentRequest request);

    GrammarContentResponse updateContent(UUID contentId, GrammarContentRequest request);

    void deleteContent(UUID contentId);

    GrammarContentResponse getContent(UUID contentId);

    List<GrammarContentResponse> getContentsByGrammarLesson(UUID grammarLessonId);

    void deleteContentsByGrammarLesson(UUID grammarLessonId);
}