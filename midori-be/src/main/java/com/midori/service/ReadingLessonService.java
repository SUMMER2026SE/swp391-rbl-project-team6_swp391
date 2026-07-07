package com.midori.service;

import com.midori.dto.reading.ReadingDetailResponse;
import com.midori.dto.reading.ReadingLessonRequest;
import com.midori.dto.reading.ReadingLessonResponse;
import com.midori.dto.reading.ReadingLessonWithQuestionsRequest;

import java.util.List;
import java.util.UUID;

public interface ReadingLessonService {

    ReadingLessonResponse createReadingLesson(ReadingLessonRequest request);

    ReadingDetailResponse createReadingLessonWithQuestions(ReadingLessonWithQuestionsRequest request);

    ReadingDetailResponse updateReadingLesson(UUID lessonId, ReadingLessonRequest request);

    ReadingDetailResponse updateReadingLessonWithQuestions(UUID lessonId, ReadingLessonWithQuestionsRequest request);

    void deleteReadingLesson(UUID lessonId);

    ReadingLessonResponse getReadingLesson(UUID lessonId);

    ReadingDetailResponse getReadingLessonDetail(UUID lessonId);

    List<ReadingLessonResponse> getAllReadingLessons();

    List<ReadingLessonResponse> getReadingLessonsByLevel(String jlptLevel);

    List<ReadingLessonResponse> getActiveReadingLessons();

    List<ReadingLessonResponse> getActiveReadingLessonsByLevel(String jlptLevel);

    ReadingLessonResponse publishLesson(UUID lessonId);

    ReadingLessonResponse unpublishLesson(UUID lessonId);
}
