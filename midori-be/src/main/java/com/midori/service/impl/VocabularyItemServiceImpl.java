package com.midori.service.impl;

import com.midori.dto.vocabulary.VocabularyItemRequest;
import com.midori.dto.vocabulary.VocabularyItemResponse;
import com.midori.entity.VocabularyItem;
import com.midori.entity.VocabularyLesson;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.VocabularyItemRepository;
import com.midori.repository.VocabularyLessonRepository;
import com.midori.service.VocabularyItemService;
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
public class VocabularyItemServiceImpl implements VocabularyItemService {

    private final VocabularyItemRepository vocabularyItemRepository;
    private final VocabularyLessonRepository vocabularyLessonRepository;

    @Override
    public VocabularyItemResponse createItem(UUID vocabularyLessonId, VocabularyItemRequest request) {
        log.info("Creating item for vocabulary lesson: {}", vocabularyLessonId);

        VocabularyLesson lesson = vocabularyLessonRepository.findById(vocabularyLessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", vocabularyLessonId));

        if (vocabularyItemRepository.existsByVocabularyLessonIdAndItemOrder(
                vocabularyLessonId, request.getItemOrder())) {
            throw new BadRequestException(
                    String.format("Item with order %d already exists for this vocabulary lesson",
                            request.getItemOrder()));
        }

        VocabularyItem item = VocabularyItem.builder()
                .vocabularyLesson(lesson)
                .itemOrder(request.getItemOrder())
                .japanese(trimToNull(request.getJapanese()))
                .furigana(trimToNull(request.getFurigana()))
                .romaji(trimToNull(request.getRomaji()))
                .meaning(trimToNull(request.getMeaning()))
                .exampleSentence(trimToNull(request.getExampleSentence()))
                .exampleTranslation(trimToNull(request.getExampleTranslation()))
                .partOfSpeech(trimToNull(request.getPartOfSpeech()))
                .build();

        item = vocabularyItemRepository.save(item);
        log.info("Created vocabulary item with id: {}", item.getId());

        return toResponse(item);
    }

    @Override
    public VocabularyItemResponse updateItem(UUID itemId, VocabularyItemRequest request) {
        log.info("Updating vocabulary item: {}", itemId);

        VocabularyItem item = vocabularyItemRepository.findByIdWithLesson(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyItem", "id", itemId));

        if (!item.getItemOrder().equals(request.getItemOrder())) {
            if (vocabularyItemRepository.existsByVocabularyLessonIdAndItemOrder(
                    item.getVocabularyLesson().getId(), request.getItemOrder())) {
                throw new BadRequestException(
                        String.format("Item with order %d already exists for this vocabulary lesson",
                                request.getItemOrder()));
            }
        }

        if (request.getItemOrder() != null) {
            item.setItemOrder(request.getItemOrder());
        }
        if (request.getJapanese() != null) {
            item.setJapanese(trimToNull(request.getJapanese()));
        }
        if (request.getFurigana() != null) {
            item.setFurigana(trimToNull(request.getFurigana()));
        }
        if (request.getRomaji() != null) {
            item.setRomaji(trimToNull(request.getRomaji()));
        }
        if (request.getMeaning() != null) {
            item.setMeaning(trimToNull(request.getMeaning()));
        }
        if (request.getExampleSentence() != null) {
            item.setExampleSentence(trimToNull(request.getExampleSentence()));
        }
        if (request.getExampleTranslation() != null) {
            item.setExampleTranslation(trimToNull(request.getExampleTranslation()));
        }
        if (request.getPartOfSpeech() != null) {
            item.setPartOfSpeech(trimToNull(request.getPartOfSpeech()));
        }

        item = vocabularyItemRepository.save(item);
        log.info("Updated vocabulary item: {}", itemId);

        return toResponse(item);
    }

    @Override
    public void deleteItem(UUID itemId) {
        log.info("Deleting vocabulary item: {}", itemId);

        if (!vocabularyItemRepository.existsById(itemId)) {
            throw new ResourceNotFoundException("VocabularyItem", "id", itemId);
        }

        vocabularyItemRepository.deleteById(itemId);
        log.info("Deleted vocabulary item: {}", itemId);
    }

    @Override
    @Transactional(readOnly = true)
    public VocabularyItemResponse getItem(UUID itemId) {
        log.debug("Fetching vocabulary item: {}", itemId);

        VocabularyItem item = vocabularyItemRepository.findByIdWithLesson(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyItem", "id", itemId));

        return toResponse(item);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VocabularyItemResponse> getItemsByVocabularyLesson(UUID vocabularyLessonId) {
        log.debug("Fetching items for vocabulary lesson: {}", vocabularyLessonId);

        if (!vocabularyLessonRepository.existsById(vocabularyLessonId)) {
            throw new ResourceNotFoundException("VocabularyLesson", "id", vocabularyLessonId);
        }

        return vocabularyItemRepository.findByVocabularyLessonIdOrderByItemOrderAsc(vocabularyLessonId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteItemsByVocabularyLesson(UUID vocabularyLessonId) {
        log.info("Deleting all items for vocabulary lesson: {}", vocabularyLessonId);

        vocabularyItemRepository.deleteByVocabularyLessonId(vocabularyLessonId);
        log.info("Deleted all items for vocabulary lesson: {}", vocabularyLessonId);
    }

    private VocabularyItemResponse toResponse(VocabularyItem item) {
        return VocabularyItemResponse.builder()
                .id(item.getId())
                .vocabularyLessonId(item.getVocabularyLesson().getId())
                .itemOrder(item.getItemOrder())
                .japanese(item.getJapanese())
                .furigana(item.getFurigana())
                .romaji(item.getRomaji())
                .meaning(item.getMeaning())
                .exampleSentence(item.getExampleSentence())
                .exampleTranslation(item.getExampleTranslation())
                .partOfSpeech(item.getPartOfSpeech())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
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