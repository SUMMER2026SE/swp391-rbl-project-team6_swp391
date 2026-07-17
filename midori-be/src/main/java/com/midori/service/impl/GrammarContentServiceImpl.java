package com.midori.service.impl;

import com.midori.dto.grammar.GrammarContentRequest;
import com.midori.dto.grammar.GrammarContentResponse;
import com.midori.dto.grammar.GrammarExampleRequest;
import com.midori.dto.grammar.GrammarExampleResponse;
import com.midori.entity.GrammarContent;
import com.midori.entity.GrammarExample;
import com.midori.entity.GrammarLesson;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.GrammarContentRepository;
import com.midori.repository.GrammarExampleRepository;
import com.midori.repository.GrammarLessonRepository;
import com.midori.service.GrammarContentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class GrammarContentServiceImpl implements GrammarContentService {

    private final GrammarContentRepository grammarContentRepository;
    private final GrammarExampleRepository grammarExampleRepository;
    private final GrammarLessonRepository grammarLessonRepository;

    @Override
    public GrammarContentResponse createContent(UUID grammarLessonId, GrammarContentRequest request) {
        log.info("Creating grammar content for lesson: {}", grammarLessonId);

        GrammarLesson lesson = grammarLessonRepository.findById(grammarLessonId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarLesson", "id", grammarLessonId));

        if (grammarContentRepository.existsByGrammarLessonIdAndContentOrder(
                grammarLessonId, request.getContentOrder())) {
            throw new BadRequestException(
                    String.format("Content with order %d already exists for this grammar lesson",
                            request.getContentOrder()));
        }

        GrammarContent content = GrammarContent.builder()
                .grammarLesson(lesson)
                .contentOrder(request.getContentOrder())
                .pattern(trimToNull(request.getPattern()))
                .meaning(trimToNull(request.getMeaning()))
                .structure(trimToNull(request.getStructure()))
                .usage(trimToNull(request.getUsage()))
                .build();

        content = grammarContentRepository.save(content);
        log.info("Created grammar content with id: {}", content.getId());

        List<GrammarExampleResponse> exampleResponses = new ArrayList<>();
        if (request.getExamples() != null && !request.getExamples().isEmpty()) {
            for (GrammarExampleRequest eReq : request.getExamples()) {
                if (grammarExampleRepository.existsByGrammarContentIdAndExampleOrder(
                        content.getId(), eReq.getExampleOrder())) {
                    throw new BadRequestException(
                            String.format("Example with order %d already exists for this grammar content",
                                    eReq.getExampleOrder()));
                }

                GrammarExample example = GrammarExample.builder()
                        .grammarContent(content)
                        .exampleOrder(eReq.getExampleOrder())
                        .japanese(trimToNull(eReq.getJapanese()))
                        .vietnameseMeaning(trimToNull(eReq.getVietnameseMeaning()))
                        .build();

                example = grammarExampleRepository.save(example);
                exampleResponses.add(toExampleResponse(example));
            }
            log.info("Created {} examples for grammar content: {}", exampleResponses.size(), content.getId());
        }

        return toResponse(content, exampleResponses);
    }

    @Override
    public GrammarContentResponse updateContent(UUID contentId, GrammarContentRequest request) {
        log.info("Updating grammar content: {}", contentId);

        GrammarContent content = grammarContentRepository.findByIdWithLesson(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarContent", "id", contentId));

        UUID lessonId = content.getGrammarLesson().getId();

        if (!content.getContentOrder().equals(request.getContentOrder())) {
            if (grammarContentRepository.existsByGrammarLessonIdAndContentOrder(
                    lessonId, request.getContentOrder())) {
                throw new BadRequestException(
                        String.format("Content with order %d already exists for this grammar lesson",
                                request.getContentOrder()));
            }
        }

        if (request.getContentOrder() != null) {
            content.setContentOrder(request.getContentOrder());
        }
        content.setPattern(trimToNull(request.getPattern()));
        content.setMeaning(trimToNull(request.getMeaning()));
        content.setStructure(trimToNull(request.getStructure()));
        content.setUsage(trimToNull(request.getUsage()));

        content = grammarContentRepository.save(content);

        // Replace examples wholesale — matches Reading's update pattern.
        grammarExampleRepository.deleteByGrammarContentId(contentId);

        List<GrammarExampleResponse> exampleResponses = new ArrayList<>();
        if (request.getExamples() != null && !request.getExamples().isEmpty()) {
            for (GrammarExampleRequest eReq : request.getExamples()) {
                GrammarExample example = GrammarExample.builder()
                        .grammarContent(content)
                        .exampleOrder(eReq.getExampleOrder())
                        .japanese(trimToNull(eReq.getJapanese()))
                        .vietnameseMeaning(trimToNull(eReq.getVietnameseMeaning()))
                        .build();

                example = grammarExampleRepository.save(example);
                exampleResponses.add(toExampleResponse(example));
            }
            log.info("Updated {} examples for grammar content: {}", exampleResponses.size(), contentId);
        }

        log.info("Updated grammar content: {}", contentId);
        return toResponse(content, exampleResponses);
    }

    @Override
    public void deleteContent(UUID contentId) {
        log.info("Deleting grammar content: {}", contentId);

        if (!grammarContentRepository.existsById(contentId)) {
            throw new ResourceNotFoundException("GrammarContent", "id", contentId);
        }

        grammarContentRepository.deleteById(contentId);
        log.info("Deleted grammar content: {}", contentId);
    }

    @Override
    @Transactional(readOnly = true)
    public GrammarContentResponse getContent(UUID contentId) {
        log.debug("Fetching grammar content: {}", contentId);

        GrammarContent content = grammarContentRepository.findByIdWithLesson(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarContent", "id", contentId));

        List<GrammarExampleResponse> examples = grammarExampleRepository
                .findByGrammarContentIdOrderByExampleOrderAsc(contentId)
                .stream()
                .map(this::toExampleResponse)
                .collect(Collectors.toList());

        return toResponse(content, examples);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrammarContentResponse> getContentsByGrammarLesson(UUID grammarLessonId) {
        log.debug("Fetching contents for grammar lesson: {}", grammarLessonId);

        if (!grammarLessonRepository.existsById(grammarLessonId)) {
            throw new ResourceNotFoundException("GrammarLesson", "id", grammarLessonId);
        }

        List<GrammarContent> contents = grammarContentRepository
                .findByGrammarLessonIdOrderByContentOrderAsc(grammarLessonId);

        return contents.stream().map(content -> {
            List<GrammarExampleResponse> examples = grammarExampleRepository
                    .findByGrammarContentIdOrderByExampleOrderAsc(content.getId())
                    .stream()
                    .map(this::toExampleResponse)
                    .collect(Collectors.toList());
            return toResponse(content, examples);
        }).collect(Collectors.toList());
    }

    @Override
    public void deleteContentsByGrammarLesson(UUID grammarLessonId) {
        log.info("Deleting all contents for grammar lesson: {}", grammarLessonId);

        grammarContentRepository.deleteByGrammarLessonId(grammarLessonId);
        log.info("Deleted all contents for grammar lesson: {}", grammarLessonId);
    }

    private GrammarContentResponse toResponse(GrammarContent content, List<GrammarExampleResponse> examples) {
        return GrammarContentResponse.builder()
                .id(content.getId())
                .grammarLessonId(content.getGrammarLesson().getId())
                .contentOrder(content.getContentOrder())
                .pattern(content.getPattern())
                .meaning(content.getMeaning())
                .structure(content.getStructure())
                .usage(content.getUsage())
                .examples(examples)
                .createdAt(content.getCreatedAt())
                .updatedAt(content.getUpdatedAt())
                .build();
    }

    private GrammarExampleResponse toExampleResponse(GrammarExample example) {
        return GrammarExampleResponse.builder()
                .id(example.getId())
                .grammarContentId(example.getGrammarContent().getId())
                .exampleOrder(example.getExampleOrder())
                .japanese(example.getJapanese())
                .vietnameseMeaning(example.getVietnameseMeaning())
                .createdAt(example.getCreatedAt())
                .updatedAt(example.getUpdatedAt())
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