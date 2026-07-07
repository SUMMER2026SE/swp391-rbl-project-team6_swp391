package com.midori.service;

import com.midori.dto.reading.ReadingQuestionRequest;
import com.midori.dto.reading.ReadingQuestionResponse;

import java.util.List;
import java.util.UUID;

public interface ReadingQuestionService {

    ReadingQuestionResponse createQuestion(UUID readingLessonId, ReadingQuestionRequest request);

    ReadingQuestionResponse updateQuestion(UUID questionId, ReadingQuestionRequest request);

    void deleteQuestion(UUID questionId);

    ReadingQuestionResponse getQuestion(UUID questionId);

    List<ReadingQuestionResponse> getQuestionsByReadingLesson(UUID readingLessonId);

    void deleteQuestionsByReadingLesson(UUID readingLessonId);
}
