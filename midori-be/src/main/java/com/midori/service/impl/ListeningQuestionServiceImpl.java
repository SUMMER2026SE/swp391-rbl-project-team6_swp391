package com.midori.service.impl;

import com.midori.dto.listening.ListeningQuestionRequest;
import com.midori.dto.listening.ListeningQuestionResponse;
import com.midori.entity.ListeningLesson;
import com.midori.entity.ListeningQuestion;
import com.midori.entity.ListeningQuestionType;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ListeningLessonRepository;
import com.midori.repository.ListeningQuestionRepository;
import com.midori.service.ListeningQuestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ListeningQuestionServiceImpl implements ListeningQuestionService {

    private final ListeningQuestionRepository listeningQuestionRepository;
    private final ListeningLessonRepository listeningLessonRepository;

    @Override
    public ListeningQuestionResponse createQuestion(UUID listeningLessonId, ListeningQuestionRequest request) {
        log.info("Creating question for listening lesson: {}", listeningLessonId);

        ListeningLesson lesson = listeningLessonRepository.findById(listeningLessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", listeningLessonId));

        if (listeningQuestionRepository.existsByListeningLessonIdAndQuestionOrder(
                listeningLessonId, request.getQuestionOrder())) {
            throw new BadRequestException(
                    String.format("Question with order %d already exists for this listening lesson",
                            request.getQuestionOrder()));
        }

        ListeningQuestion question = ListeningQuestion.builder()
                .listeningLesson(lesson)
                .questionOrder(request.getQuestionOrder())
                .questionType(request.getQuestionType())
                .question(trimToNull(request.getQuestion()))
                .optionA(trimToNull(request.getOptionA()))
                .optionB(trimToNull(request.getOptionB()))
                .optionC(trimToNull(request.getOptionC()))
                .optionD(trimToNull(request.getOptionD()))
                .correctAnswer(request.getCorrectAnswer().toUpperCase().trim())
                .explanation(trimToNull(request.getExplanation()))
                .audioUrl(trimToNull(request.getAudioUrl()))
                .build();

        question = listeningQuestionRepository.save(question);
        log.info("Created listening question with id: {}", question.getId());

        return toResponse(question);
    }

    @Override
    public ListeningQuestionResponse updateQuestion(UUID questionId, ListeningQuestionRequest request) {
        log.info("Updating listening question: {}", questionId);

        ListeningQuestion question = listeningQuestionRepository.findByIdWithLesson(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningQuestion", "id", questionId));

        if (!question.getQuestionOrder().equals(request.getQuestionOrder())) {
            if (listeningQuestionRepository.existsByListeningLessonIdAndQuestionOrder(
                    question.getListeningLesson().getId(), request.getQuestionOrder())) {
                throw new BadRequestException(
                        String.format("Question with order %d already exists for this listening lesson",
                                request.getQuestionOrder()));
            }
        }

        if (request.getQuestionOrder() != null) {
            question.setQuestionOrder(request.getQuestionOrder());
        }
        if (request.getQuestionType() != null) {
            question.setQuestionType(request.getQuestionType());
        }
        if (request.getQuestion() != null) {
            question.setQuestion(trimToNull(request.getQuestion()));
        }
        if (request.getOptionA() != null) {
            question.setOptionA(trimToNull(request.getOptionA()));
        }
        if (request.getOptionB() != null) {
            question.setOptionB(trimToNull(request.getOptionB()));
        }
        if (request.getOptionC() != null) {
            question.setOptionC(trimToNull(request.getOptionC()));
        }
        if (request.getOptionD() != null) {
            question.setOptionD(trimToNull(request.getOptionD()));
        }
        if (request.getCorrectAnswer() != null) {
            question.setCorrectAnswer(request.getCorrectAnswer().toUpperCase().trim());
        }
        if (request.getExplanation() != null) {
            question.setExplanation(trimToNull(request.getExplanation()));
        }
        if (request.getAudioUrl() != null) {
            question.setAudioUrl(trimToNull(request.getAudioUrl()));
        }

        question = listeningQuestionRepository.save(question);
        log.info("Updated listening question: {}", questionId);

        return toResponse(question);
    }

    @Override
    public void deleteQuestion(UUID questionId) {
        log.info("Deleting listening question: {}", questionId);

        if (!listeningQuestionRepository.existsById(questionId)) {
            throw new ResourceNotFoundException("ListeningQuestion", "id", questionId);
        }

        listeningQuestionRepository.deleteById(questionId);
        log.info("Deleted listening question: {}", questionId);
    }

    @Override
    @Transactional(readOnly = true)
    public ListeningQuestionResponse getQuestion(UUID questionId) {
        log.debug("Fetching listening question: {}", questionId);

        ListeningQuestion question = listeningQuestionRepository.findByIdWithLesson(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningQuestion", "id", questionId));

        return toResponse(question);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListeningQuestionResponse> getQuestionsByListeningLesson(UUID listeningLessonId) {
        log.debug("Fetching questions for listening lesson: {}", listeningLessonId);

        if (!listeningLessonRepository.existsById(listeningLessonId)) {
            throw new ResourceNotFoundException("ListeningLesson", "id", listeningLessonId);
        }

        return listeningQuestionRepository.findByListeningLessonIdOrderByQuestionOrderAsc(listeningLessonId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteQuestionsByListeningLesson(UUID listeningLessonId) {
        log.info("Deleting all questions for listening lesson: {}", listeningLessonId);

        listeningQuestionRepository.deleteByListeningLessonId(listeningLessonId);
        log.info("Deleted all questions for listening lesson: {}", listeningLessonId);
    }

    private ListeningQuestionResponse toResponse(ListeningQuestion question) {
        return ListeningQuestionResponse.builder()
                .id(question.getId())
                .listeningLessonId(question.getListeningLesson().getId())
                .questionOrder(question.getQuestionOrder())
                .questionType(question.getQuestionType() != null ? question.getQuestionType().name() : null)
                .question(question.getQuestion())
                .optionA(question.getOptionA())
                .optionB(question.getOptionB())
                .optionC(question.getOptionC())
                .optionD(question.getOptionD())
                .correctAnswer(question.getCorrectAnswer())
                .explanation(question.getExplanation())
                .audioUrl(question.getAudioUrl())
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .build();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
