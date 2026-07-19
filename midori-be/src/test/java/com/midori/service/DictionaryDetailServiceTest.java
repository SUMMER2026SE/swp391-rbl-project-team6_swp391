package com.midori.service;

import com.midori.dto.dictionary.DictionaryDetailResponse;
import com.midori.entity.DictionaryEntry;
import com.midori.entity.DictionaryMeaning;
import com.midori.entity.DictionaryExample;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.DictionaryEntryRepository;
import com.midori.service.impl.DictionaryDetailServiceImpl;
import com.midori.service.impl.LocalDictionaryRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DictionaryDetailServiceTest {

    @Mock
    private DictionaryEntryRepository dictionaryEntryRepository;

    @Mock
    private DictionaryCacheService cacheService;

    @Mock
    private LocalDictionaryRegistry localDictionaryRegistry;

    private DictionaryDetailServiceImpl detailService;

    private DictionaryEntry entry;
    private DictionaryEntry relatedEntry;

    @BeforeEach
    void setUp() {
        detailService = new DictionaryDetailServiceImpl(
                dictionaryEntryRepository,
                cacheService,
                localDictionaryRegistry
        );

        lenient().when(cacheService.getOrFetch(anyString(), any(), any(), anyLong(), any()))
                .thenAnswer(invocation -> {
                    java.util.function.Supplier<?> supplier = invocation.getArgument(2);
                    return supplier.get();
                });

        lenient().when(localDictionaryRegistry.lookup(anyString()))
                .thenReturn(Collections.emptyList());

        entry = DictionaryEntry.builder()
                .surface("食べる")
                .lemma("食べる")
                .reading("たべる")
                .romaji("taberu")
                .jlptLevel("N5")
                .frequency(120)
                .partOfSpeech("verb")
                .meanings(new ArrayList<>())
                .examples(new ArrayList<>())
                .build();

        entry.getMeanings().add(DictionaryMeaning.builder().language("en").meaning("to eat").sortOrder(0).entry(entry).build());
        entry.getExamples().add(DictionaryExample.builder().japanese("ご飯を食べる").translation("Eat rice").sortOrder(0).entry(entry).build());

        relatedEntry = DictionaryEntry.builder()
                .surface("食べ物")
                .lemma("食べ物")
                .reading("たべもの")
                .romaji("tabemono")
                .build();
    }

    @Test
    @DisplayName("should find detail successfully by surface")
    void testGetDetail_success() {
        when(dictionaryEntryRepository.findBySurface("食べる")).thenReturn(List.of(entry));
        when(dictionaryEntryRepository.findRelatedWords("食べる", PageRequest.of(0, 5)))
                .thenReturn(List.of(relatedEntry));

        DictionaryDetailResponse response = detailService.getDetail("食べる");

        assertNotNull(response);
        assertEquals("食べる", response.getWord());
        assertEquals("たべる", response.getReading());
        assertEquals("N5", response.getJlpt());
        assertEquals(120, response.getFrequency());
        assertEquals("verb", response.getPartOfSpeech());
        assertEquals(1, response.getMeanings().size());
        assertEquals("to eat", response.getMeanings().get(0).getMeaning());
        assertEquals(1, response.getExamples().size());
        assertEquals("ご飯を食べる", response.getExamples().get(0).getJapanese());
        assertEquals(1, response.getRelatedWords().size());
        assertEquals("食べ物", response.getRelatedWords().get(0).getWord());

        verify(dictionaryEntryRepository).findBySurface("食べる");
        verify(dictionaryEntryRepository).findRelatedWords("食べる", PageRequest.of(0, 5));
    }

    @Test
    @DisplayName("should fallback to lemma then reading search")
    void testGetDetail_fallback() {
        when(dictionaryEntryRepository.findBySurface("たべる")).thenReturn(Collections.emptyList());
        when(dictionaryEntryRepository.findByLemma("たべる")).thenReturn(Collections.emptyList());
        when(dictionaryEntryRepository.findByReading("たべる")).thenReturn(List.of(entry));
        when(dictionaryEntryRepository.findRelatedWords("食べる", PageRequest.of(0, 5)))
                .thenReturn(Collections.emptyList());

        DictionaryDetailResponse response = detailService.getDetail("たべる");

        assertNotNull(response);
        assertEquals("食べる", response.getWord());

        verify(dictionaryEntryRepository).findBySurface("たべる");
        verify(dictionaryEntryRepository).findByLemma("たべる");
        verify(dictionaryEntryRepository).findByReading("たべる");
    }

    @Test
    @DisplayName("should throw ResourceNotFoundException when not found")
    void testGetDetail_notFound() {
        when(dictionaryEntryRepository.findBySurface("unknown")).thenReturn(Collections.emptyList());
        when(dictionaryEntryRepository.findByLemma("unknown")).thenReturn(Collections.emptyList());
        when(dictionaryEntryRepository.findByReading("unknown")).thenReturn(Collections.emptyList());

        assertThrows(ResourceNotFoundException.class, () -> detailService.getDetail("unknown"));
    }
}
