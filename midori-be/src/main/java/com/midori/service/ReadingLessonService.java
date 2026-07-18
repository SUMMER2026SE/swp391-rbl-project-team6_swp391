package com.midori.service;

import com.midori.dto.reading.ReadingDetailResponse;
import com.midori.dto.reading.ReadingLessonRequest;
import com.midori.dto.reading.ReadingLessonResponse;
import com.midori.dto.reading.ReadingLessonWithQuestionsRequest;
import com.midori.dto.reading.ReadingSubmitRequest;
import com.midori.dto.reading.ReadingSubmitResponse;

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

    /**
     * Server-side grading for a student Reading attempt. When {@code request.passageId}
     * is null the entire lesson's questions are graded; otherwise only the questions
     * that belong to that passage are graded.
     */
    ReadingSubmitResponse submitAnswers(UUID lessonId, ReadingSubmitRequest request);
}
