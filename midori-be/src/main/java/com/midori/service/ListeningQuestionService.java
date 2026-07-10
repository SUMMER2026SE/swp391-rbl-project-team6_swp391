package com.midori.service;

import com.midori.dto.listening.ListeningQuestionRequest;
import com.midori.dto.listening.ListeningQuestionResponse;

import java.util.List;
import java.util.UUID;

public interface ListeningQuestionService {

    ListeningQuestionResponse createQuestion(UUID listeningLessonId, ListeningQuestionRequest request);

    ListeningQuestionResponse updateQuestion(UUID questionId, ListeningQuestionRequest request);

    void deleteQuestion(UUID questionId);

    ListeningQuestionResponse getQuestion(UUID questionId);

    List<ListeningQuestionResponse> getQuestionsByListeningLesson(UUID listeningLessonId);

    void deleteQuestionsByListeningLesson(UUID listeningLessonId);
}
