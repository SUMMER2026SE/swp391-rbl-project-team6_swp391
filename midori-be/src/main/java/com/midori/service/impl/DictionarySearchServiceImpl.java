package com.midori.service.impl;

import com.midori.dto.dictionary.DictionaryAutocompleteResponse;
import com.midori.dto.dictionary.DictionaryEntryResponse;
import com.midori.dto.dictionary.DictionaryMapper;
import com.midori.entity.DictionaryEntry;
import com.midori.repository.DictionaryEntryRepository;
import com.midori.service.DictionarySearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DictionarySearchServiceImpl implements DictionarySearchService {

    private final DictionaryEntryRepository dictionaryEntryRepository;

    private static final Set<String> ALLOWED_SORT_PROPERTIES = Set.of(
            "surface", "lemma", "reading", "romaji", "frequency", "createdAt"
    );

    @Override
    @Transactional(readOnly = true)
    public Page<DictionaryEntryResponse> search(String query, Pageable pageable) {
        String cleanQuery = query != null ? query.trim() : "";

        // Validate and clean up sort properties to prevent errors/SQL injection
        Pageable validatedPageable = pageable;
        if (pageable.getSort().isSorted()) {
            boolean hasInvalid = pageable.getSort().stream()
                    .anyMatch(order -> !ALLOWED_SORT_PROPERTIES.contains(order.getProperty()));
            if (hasInvalid) {
                log.warn("Invalid sort properties detected, falling back to default sorting (frequency DESC).");
                validatedPageable = PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by(Sort.Direction.DESC, "frequency")
                );
            }
        }

        Page<DictionaryEntry> entriesPage = dictionaryEntryRepository.search(cleanQuery, validatedPageable);
        return entriesPage.map(DictionaryMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DictionaryAutocompleteResponse> autocomplete(String query) {
        String cleanQuery = query != null ? query.trim() : "";
        if (cleanQuery.isEmpty()) {
            return List.of();
        }

        // Limit autocomplete results to top 20, sorted by frequency descending
        Pageable limit = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "frequency"));
        List<DictionaryEntry> entries = dictionaryEntryRepository.autocomplete(cleanQuery, limit);

        return entries.stream()
                .map(e -> DictionaryAutocompleteResponse.builder()
                        .id(e.getId())
                        .word(e.getSurface())
                        .reading(e.getReading())
                        .romaji(e.getRomaji())
                        .build())
                .collect(Collectors.toList());
    }
}
