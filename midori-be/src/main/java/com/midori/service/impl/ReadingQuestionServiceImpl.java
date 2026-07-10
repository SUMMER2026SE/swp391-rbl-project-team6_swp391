package com.midori.service.impl;

import com.midori.dto.reading.ReadingQuestionRequest;
import com.midori.dto.reading.ReadingQuestionResponse;
import com.midori.entity.ReadingLesson;
import com.midori.entity.ReadingQuestion;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ReadingLessonRepository;
import com.midori.repository.ReadingQuestionRepository;
import com.midori.service.ReadingQuestionService;
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
public class ReadingQuestionServiceImpl implements ReadingQuestionService {

    private final ReadingQuestionRepository readingQuestionRepository;
    private final ReadingLessonRepository readingLessonRepository;

    @Override
    public ReadingQuestionResponse createQuestion(UUID readingLessonId, ReadingQuestionRequest request) {
        log.info("Creating question for reading lesson: {}", readingLessonId);

        ReadingLesson lesson = readingLessonRepository.findById(readingLessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingLesson", "id", readingLessonId));

        if (readingQuestionRepository.existsByReadingLessonIdAndQuestionOrder(
                readingLessonId, request.getQuestionOrder())) {
            throw new BadRequestException(
                    String.format("Question with order %d already exists for this reading lesson",
                            request.getQuestionOrder()));
        }

        ReadingQuestion question = ReadingQuestion.builder()
                .readingLesson(lesson)
                .questionOrder(request.getQuestionOrder())
                .question(trimToNull(request.getQuestion()))
                .optionA(trimToNull(request.getOptionA()))
                .optionB(trimToNull(request.getOptionB()))
                .optionC(trimToNull(request.getOptionC()))
                .optionD(trimToNull(request.getOptionD()))
                .correctAnswer(request.getCorrectAnswer().toUpperCase().trim())
                .explanation(trimToNull(request.getExplanation()))
                .build();

        question = readingQuestionRepository.save(question);
        log.info("Created reading question with id: {}", question.getId());

        return toResponse(question);
    }

    @Override
    public ReadingQuestionResponse updateQuestion(UUID questionId, ReadingQuestionRequest request) {
        log.info("Updating reading question: {}", questionId);

        ReadingQuestion question = readingQuestionRepository.findByIdWithLesson(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingQuestion", "id", questionId));

        if (!question.getQuestionOrder().equals(request.getQuestionOrder())) {
            if (readingQuestionRepository.existsByReadingLessonIdAndQuestionOrder(
                    question.getReadingLesson().getId(), request.getQuestionOrder())) {
                throw new BadRequestException(
                        String.format("Question with order %d already exists for this reading lesson",
                                request.getQuestionOrder()));
            }
        }

        if (request.getQuestionOrder() != null) {
            question.setQuestionOrder(request.getQuestionOrder());
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

        question = readingQuestionRepository.save(question);
        log.info("Updated reading question: {}", questionId);

        return toResponse(question);
    }

    @Override
    public void deleteQuestion(UUID questionId) {
        log.info("Deleting reading question: {}", questionId);

        if (!readingQuestionRepository.existsById(questionId)) {
            throw new ResourceNotFoundException("ReadingQuestion", "id", questionId);
        }

        readingQuestionRepository.deleteById(questionId);
        log.info("Deleted reading question: {}", questionId);
    }

    @Override
    @Transactional(readOnly = true)
    public ReadingQuestionResponse getQuestion(UUID questionId) {
        log.debug("Fetching reading question: {}", questionId);

        ReadingQuestion question = readingQuestionRepository.findByIdWithLesson(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingQuestion", "id", questionId));

        return toResponse(question);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReadingQuestionResponse> getQuestionsByReadingLesson(UUID readingLessonId) {
        log.debug("Fetching questions for reading lesson: {}", readingLessonId);

        if (!readingLessonRepository.existsById(readingLessonId)) {
            throw new ResourceNotFoundException("ReadingLesson", "id", readingLessonId);
        }

        return readingQuestionRepository.findByReadingLessonIdOrderByQuestionOrderAsc(readingLessonId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteQuestionsByReadingLesson(UUID readingLessonId) {
        log.info("Deleting all questions for reading lesson: {}", readingLessonId);

        readingQuestionRepository.deleteByReadingLessonId(readingLessonId);
        log.info("Deleted all questions for reading lesson: {}", readingLessonId);
    }

    private ReadingQuestionResponse toResponse(ReadingQuestion question) {
        return ReadingQuestionResponse.builder()
                .id(question.getId())
                .readingLessonId(question.getReadingLesson().getId())
                .questionOrder(question.getQuestionOrder())
                .question(question.getQuestion())
                .optionA(question.getOptionA())
                .optionB(question.getOptionB())
                .optionC(question.getOptionC())
                .optionD(question.getOptionD())
                .correctAnswer(question.getCorrectAnswer())
                .explanation(question.getExplanation())
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
