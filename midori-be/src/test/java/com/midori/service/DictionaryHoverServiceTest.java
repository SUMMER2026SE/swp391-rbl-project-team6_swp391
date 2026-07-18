package com.midori.service;

import com.midori.dto.dictionary.DictionaryHoverResponse;
import com.midori.entity.DictionaryEntry;
import com.midori.entity.DictionaryMeaning;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.DictionaryEntryRepository;
import com.midori.service.impl.DictionaryHoverServiceImpl;
import com.midori.service.impl.LocalDictionaryRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DictionaryHoverServiceTest {

    @Mock
    private DictionaryEntryRepository dictionaryEntryRepository;

    @Mock
    private DictionaryCacheService cacheService;

    @Mock
    private LocalDictionaryRegistry localDictionaryRegistry;

    private DictionaryHoverServiceImpl hoverService;

    private DictionaryEntry entry;

    @BeforeEach
    void setUp() {
        // Manually instantiate to ensure all 3 dependencies are wired correctly
        hoverService = new DictionaryHoverServiceImpl(
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
                .partOfSpeech("verb")
                .meanings(new ArrayList<>())
                .build();

        // 3 sample meanings with "vi" language (non-English so they pass the filter)
        entry.getMeanings().add(DictionaryMeaning.builder().meaning("to eat").sortOrder(1).language("vi").entry(entry).build());
        entry.getMeanings().add(DictionaryMeaning.builder().meaning("to consume").sortOrder(2).language("vi").entry(entry).build());
        entry.getMeanings().add(DictionaryMeaning.builder().meaning("to live on").sortOrder(0).language("vi").entry(entry).build());
    }

    @Test
    @DisplayName("should find hover info by surface")
    void testGetHoverInfo_bySurface() {
        when(dictionaryEntryRepository.findBySurfaceWithMeanings("食べる"))
                .thenReturn(List.of(entry));

        DictionaryHoverResponse response = hoverService.getHoverInfo("食べる");

        assertNotNull(response);
        assertEquals("食べる", response.getWord());
        assertEquals("たべる", response.getReading());
        assertEquals(3, response.getMeanings().size());
        // verify sorted order: sortOrder 0, 1, 2
        assertEquals("to live on", response.getMeanings().get(0));
        assertEquals("to eat", response.getMeanings().get(1));
        assertEquals("to consume", response.getMeanings().get(2));

        verify(dictionaryEntryRepository).findBySurfaceWithMeanings("食べる");
        verify(dictionaryEntryRepository, never()).findByLemmaWithMeanings(anyString());
        verify(dictionaryEntryRepository, never()).findByReadingWithMeanings(anyString());
    }

    @Test
    @DisplayName("should fallback to lemma search if surface not found")
    void testGetHoverInfo_fallbackToLemma() {
        when(dictionaryEntryRepository.findBySurfaceWithMeanings("tabe"))
                .thenReturn(Collections.emptyList());
        when(dictionaryEntryRepository.findByLemmaWithMeanings("tabe"))
                .thenReturn(List.of(entry));

        DictionaryHoverResponse response = hoverService.getHoverInfo("tabe");

        assertNotNull(response);
        assertEquals("食べる", response.getWord());

        verify(dictionaryEntryRepository).findBySurfaceWithMeanings("tabe");
        verify(dictionaryEntryRepository).findByLemmaWithMeanings("tabe");
        verify(dictionaryEntryRepository, never()).findByReadingWithMeanings(anyString());
    }

    @Test
    @DisplayName("should fallback to reading search if surface and lemma not found")
    void testGetHoverInfo_fallbackToReading() {
        when(dictionaryEntryRepository.findBySurfaceWithMeanings("taberu"))
                .thenReturn(Collections.emptyList());
        when(dictionaryEntryRepository.findByLemmaWithMeanings("taberu"))
                .thenReturn(Collections.emptyList());
        when(dictionaryEntryRepository.findByReadingWithMeanings("taberu"))
                .thenReturn(List.of(entry));

        DictionaryHoverResponse response = hoverService.getHoverInfo("taberu");

        assertNotNull(response);
        assertEquals("食べる", response.getWord());

        verify(dictionaryEntryRepository).findBySurfaceWithMeanings("taberu");
        verify(dictionaryEntryRepository).findByLemmaWithMeanings("taberu");
        verify(dictionaryEntryRepository).findByReadingWithMeanings("taberu");
    }

    @Test
    @DisplayName("should limit meanings to maximum of 5")
    void testGetHoverInfo_limitMeanings() {
        // Add 4 more meanings so total is 7
        for (int i = 3; i < 7; i++) {
            entry.getMeanings().add(DictionaryMeaning.builder().meaning("meaning " + i).sortOrder(i).language("vi").entry(entry).build());
        }

        when(dictionaryEntryRepository.findBySurfaceWithMeanings("食べる"))
                .thenReturn(List.of(entry));

        DictionaryHoverResponse response = hoverService.getHoverInfo("食べる");

        assertEquals(5, response.getMeanings().size());
    }

    @Test
    @DisplayName("should throw ResourceNotFoundException when word not found in database")
    void testGetHoverInfo_notFound() {
        when(dictionaryEntryRepository.findBySurfaceWithMeanings("unknown"))
                .thenReturn(Collections.emptyList());
        when(dictionaryEntryRepository.findByLemmaWithMeanings("unknown"))
                .thenReturn(Collections.emptyList());
        when(dictionaryEntryRepository.findByReadingWithMeanings("unknown"))
                .thenReturn(Collections.emptyList());

        assertThrows(ResourceNotFoundException.class, () -> hoverService.getHoverInfo("unknown"));
    }
}
