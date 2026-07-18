package com.midori.service.impl;

import com.midori.dto.grammar.GrammarExampleRequest;
import com.midori.dto.grammar.GrammarExampleResponse;
import com.midori.entity.GrammarContent;
import com.midori.entity.GrammarExample;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.GrammarContentRepository;
import com.midori.repository.GrammarExampleRepository;
import com.midori.service.GrammarExampleService;
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
public class GrammarExampleServiceImpl implements GrammarExampleService {

    private final GrammarExampleRepository grammarExampleRepository;
    private final GrammarContentRepository grammarContentRepository;

    @Override
    public GrammarExampleResponse createExample(UUID grammarContentId, GrammarExampleRequest request) {
        log.info("Creating example for grammar content: {}", grammarContentId);

        GrammarContent content = grammarContentRepository.findById(grammarContentId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarContent", "id", grammarContentId));

        if (grammarExampleRepository.existsByGrammarContentIdAndExampleOrder(
                grammarContentId, request.getExampleOrder())) {
            throw new BadRequestException(
                    String.format("Example with order %d already exists for this grammar content",
                            request.getExampleOrder()));
        }

        GrammarExample example = GrammarExample.builder()
                .grammarContent(content)
                .exampleOrder(request.getExampleOrder())
                .japanese(trimToNull(request.getJapanese()))
                .vietnameseMeaning(trimToNull(request.getVietnameseMeaning()))
                .build();

        example = grammarExampleRepository.save(example);
        log.info("Created grammar example with id: {}", example.getId());

        return toResponse(example);
    }

    @Override
    public GrammarExampleResponse updateExample(UUID exampleId, GrammarExampleRequest request) {
        log.info("Updating grammar example: {}", exampleId);

        GrammarExample example = grammarExampleRepository.findByIdWithContent(exampleId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarExample", "id", exampleId));

        if (!example.getExampleOrder().equals(request.getExampleOrder())) {
            if (grammarExampleRepository.existsByGrammarContentIdAndExampleOrder(
                    example.getGrammarContent().getId(), request.getExampleOrder())) {
                throw new BadRequestException(
                        String.format("Example with order %d already exists for this grammar content",
                                request.getExampleOrder()));
            }
        }

        if (request.getExampleOrder() != null) {
            example.setExampleOrder(request.getExampleOrder());
        }
        if (request.getJapanese() != null) {
            example.setJapanese(trimToNull(request.getJapanese()));
        }
        if (request.getVietnameseMeaning() != null) {
            example.setVietnameseMeaning(trimToNull(request.getVietnameseMeaning()));
        }

        example = grammarExampleRepository.save(example);
        log.info("Updated grammar example: {}", exampleId);

        return toResponse(example);
    }

    @Override
    public void deleteExample(UUID exampleId) {
        log.info("Deleting grammar example: {}", exampleId);

        if (!grammarExampleRepository.existsById(exampleId)) {
            throw new ResourceNotFoundException("GrammarExample", "id", exampleId);
        }

        grammarExampleRepository.deleteById(exampleId);
        log.info("Deleted grammar example: {}", exampleId);
    }

    @Override
    @Transactional(readOnly = true)
    public GrammarExampleResponse getExample(UUID exampleId) {
        log.debug("Fetching grammar example: {}", exampleId);

        GrammarExample example = grammarExampleRepository.findByIdWithContent(exampleId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarExample", "id", exampleId));

        return toResponse(example);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrammarExampleResponse> getExamplesByGrammarContent(UUID grammarContentId) {
        log.debug("Fetching examples for grammar content: {}", grammarContentId);

        if (!grammarContentRepository.existsById(grammarContentId)) {
            throw new ResourceNotFoundException("GrammarContent", "id", grammarContentId);
        }

        return grammarExampleRepository.findByGrammarContentIdOrderByExampleOrderAsc(grammarContentId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteExamplesByGrammarContent(UUID grammarContentId) {
        log.info("Deleting all examples for grammar content: {}", grammarContentId);

        grammarExampleRepository.deleteByGrammarContentId(grammarContentId);
        log.info("Deleted all examples for grammar content: {}", grammarContentId);
    }

    private GrammarExampleResponse toResponse(GrammarExample example) {
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