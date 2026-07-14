package com.midori.service;

import com.midori.dto.dictionary.DictionaryAutocompleteResponse;
import com.midori.dto.dictionary.DictionaryEntryResponse;
import com.midori.entity.DictionaryEntry;
import com.midori.repository.DictionaryEntryRepository;
import com.midori.service.impl.DictionarySearchServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DictionarySearchServiceTest {

    @Mock
    private DictionaryEntryRepository dictionaryEntryRepository;

    @InjectMocks
    private DictionarySearchServiceImpl searchService;

    private DictionaryEntry entry;

    @BeforeEach
    void setUp() {
        entry = DictionaryEntry.builder()
                .id(UUID.randomUUID())
                .surface("食べる")
                .lemma("食べる")
                .reading("たべる")
                .romaji("taberu")
                .jlptLevel("N5")
                .frequency(100)
                .build();
    }

    @Test
    @DisplayName("should search with pageable successfully")
    void testSearch_success() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "frequency"));
        Page<DictionaryEntry> entriesPage = new PageImpl<>(List.of(entry), pageable, 1);

        when(dictionaryEntryRepository.search("食べる", pageable)).thenReturn(entriesPage);

        Page<DictionaryEntryResponse> response = searchService.search("食べる", pageable);

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals("食べる", response.getContent().get(0).getSurface());
        verify(dictionaryEntryRepository).search("食べる", pageable);
    }

    @Test
    @DisplayName("should fallback to frequency desc sort when invalid sort property is provided")
    void testSearch_invalidSortProperty() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "invalidProperty"));
        Page<DictionaryEntry> entriesPage = new PageImpl<>(List.of(entry), PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "frequency")), 1);

        Pageable expectedPageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "frequency"));
        when(dictionaryEntryRepository.search("食べる", expectedPageable)).thenReturn(entriesPage);

        Page<DictionaryEntryResponse> response = searchService.search("食べる", pageable);

        assertNotNull(response);
        verify(dictionaryEntryRepository).search("食べる", expectedPageable);
    }

    @Test
    @DisplayName("should return autocomplete suggestions successfully")
    void testAutocomplete_success() {
        Pageable expectedLimit = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "frequency"));
        when(dictionaryEntryRepository.autocomplete("tabe", expectedLimit)).thenReturn(List.of(entry));

        List<DictionaryAutocompleteResponse> response = searchService.autocomplete("tabe");

        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("食べる", response.get(0).getWord());
        verify(dictionaryEntryRepository).autocomplete("tabe", expectedLimit);
    }

    @Test
    @DisplayName("should return empty list for autocomplete with empty query")
    void testAutocomplete_emptyQuery() {
        List<DictionaryAutocompleteResponse> response = searchService.autocomplete("   ");
        assertTrue(response.isEmpty());
        verifyNoInteractions(dictionaryEntryRepository);
    }
}
