package com.midori.service.impl;

import com.midori.dto.listening.ListeningItemRequest;
import com.midori.dto.listening.ListeningItemResponse;
import com.midori.entity.ListeningItem;
import com.midori.entity.ListeningLesson;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ListeningItemRepository;
import com.midori.repository.ListeningLessonRepository;
import com.midori.service.ListeningItemService;
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
public class ListeningItemServiceImpl implements ListeningItemService {

    private final ListeningItemRepository listeningItemRepository;
    private final ListeningLessonRepository listeningLessonRepository;

    @Override
    public ListeningItemResponse createItem(UUID listeningLessonId, ListeningItemRequest request) {
        log.info("Creating listening item for lesson: {}", listeningLessonId);

        ListeningLesson lesson = listeningLessonRepository.findById(listeningLessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", listeningLessonId));

        if (listeningItemRepository.existsByListeningLessonIdAndQuestionOrder(
                listeningLessonId, request.getQuestionOrder())) {
            throw new BadRequestException(
                    String.format("Item with order %d already exists for this listening lesson",
                            request.getQuestionOrder()));
        }

        ListeningItem item = ListeningItem.builder()
                .listeningLesson(lesson)
                .questionOrder(request.getQuestionOrder())
                .audioUrl(request.getAudioUrl().trim())
                .question(trimToNull(request.getQuestion()))
                .optionA(trimToNull(request.getOptionA()))
                .optionB(trimToNull(request.getOptionB()))
                .optionC(trimToNull(request.getOptionC()))
                .optionD(trimToNull(request.getOptionD()))
                .correctAnswer(request.getCorrectAnswer().toUpperCase().trim())
                .explanation(trimToNull(request.getExplanation()))
                .build();

        item = listeningItemRepository.save(item);
        log.info("Created listening item with id: {}", item.getId());

        return toResponse(item);
    }

    @Override
    public ListeningItemResponse updateItem(UUID itemId, ListeningItemRequest request) {
        log.info("Updating listening item: {}", itemId);

        ListeningItem item = listeningItemRepository.findByIdWithLesson(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningItem", "id", itemId));

        if (!item.getQuestionOrder().equals(request.getQuestionOrder())) {
            if (listeningItemRepository.existsByListeningLessonIdAndQuestionOrder(
                    item.getListeningLesson().getId(), request.getQuestionOrder())) {
                throw new BadRequestException(
                        String.format("Item with order %d already exists for this listening lesson",
                                request.getQuestionOrder()));
            }
        }

        if (request.getQuestionOrder() != null) {
            item.setQuestionOrder(request.getQuestionOrder());
        }
        if (request.getAudioUrl() != null && !request.getAudioUrl().isBlank()) {
            item.setAudioUrl(request.getAudioUrl().trim());
        }
        if (request.getQuestion() != null) {
            item.setQuestion(trimToNull(request.getQuestion()));
        }
        if (request.getOptionA() != null) {
            item.setOptionA(trimToNull(request.getOptionA()));
        }
        if (request.getOptionB() != null) {
            item.setOptionB(trimToNull(request.getOptionB()));
        }
        if (request.getOptionC() != null) {
            item.setOptionC(trimToNull(request.getOptionC()));
        }
        if (request.getOptionD() != null) {
            item.setOptionD(trimToNull(request.getOptionD()));
        }
        if (request.getCorrectAnswer() != null) {
            item.setCorrectAnswer(request.getCorrectAnswer().toUpperCase().trim());
        }
        if (request.getExplanation() != null) {
            item.setExplanation(trimToNull(request.getExplanation()));
        }

        item = listeningItemRepository.save(item);
        log.info("Updated listening item: {}", itemId);

        return toResponse(item);
    }

    @Override
    public void deleteItem(UUID itemId) {
        log.info("Deleting listening item: {}", itemId);

        if (!listeningItemRepository.existsById(itemId)) {
            throw new ResourceNotFoundException("ListeningItem", "id", itemId);
        }

        listeningItemRepository.deleteById(itemId);
        log.info("Deleted listening item: {}", itemId);
    }

    @Override
    @Transactional(readOnly = true)
    public ListeningItemResponse getItem(UUID itemId) {
        ListeningItem item = listeningItemRepository.findByIdWithLesson(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningItem", "id", itemId));
        return toResponse(item);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListeningItemResponse> getItemsByListeningLesson(UUID listeningLessonId) {
        if (!listeningLessonRepository.existsById(listeningLessonId)) {
            throw new ResourceNotFoundException("ListeningLesson", "id", listeningLessonId);
        }

        return listeningItemRepository
                .findByListeningLessonIdOrderByQuestionOrderAsc(listeningLessonId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteItemsByListeningLesson(UUID listeningLessonId) {
        listeningItemRepository.deleteByListeningLessonId(listeningLessonId);
    }

    private ListeningItemResponse toResponse(ListeningItem item) {
        return ListeningItemResponse.builder()
                .id(item.getId().toString())
                .listeningLessonId(item.getListeningLesson().getId().toString())
                .questionOrder(item.getQuestionOrder())
                .audioUrl(item.getAudioUrl())
                .question(item.getQuestion())
                .optionA(item.getOptionA())
                .optionB(item.getOptionB())
                .optionC(item.getOptionC())
                .optionD(item.getOptionD())
                .correctAnswer(item.getCorrectAnswer())
                .explanation(item.getExplanation())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}