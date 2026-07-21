package com.midori.service;

import com.midori.dto.kanji.KanjiResponse;
import com.midori.entity.KanjiEntry;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.KanjiEntryRepository;
import com.midori.service.impl.KanjiServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KanjiServiceTest {

    @Mock
    private KanjiEntryRepository kanjiEntryRepository;

    @Mock
    private KanjiMnemonicService kanjiMnemonicService;

    @InjectMocks
    private KanjiServiceImpl kanjiService;

    private KanjiEntry entry;

    @BeforeEach
    void setUp() {
        entry = KanjiEntry.builder()
                .id(UUID.randomUUID())
                .character("食")
                .onyomi("ショク, ジキ")
                .kunyomi("く.う, く.らう, た.べる")
                .strokeCount(9)
                .radical("184")
                .jlpt("N5")
                .meaning("eat, food")
                .build();
    }

    @Test
    @DisplayName("should get kanji info successfully by character")
    void testGetKanjiInfo_success() {
        when(kanjiEntryRepository.findByCharacter("食")).thenReturn(Optional.of(entry));

        KanjiResponse response = kanjiService.getKanjiInfo("食");

        assertNotNull(response);
        assertEquals("食", response.getCharacter());
        assertEquals("ショク, ジキ", response.getOnyomi());
        assertEquals("く.う, く.らう, た.べる", response.getKunyomi());
        assertEquals(9, response.getStrokeCount());
        assertEquals("184", response.getRadical());
        assertEquals("N5", response.getJlpt());
        assertEquals("eat, food", response.getMeaning());

        verify(kanjiEntryRepository).findByCharacter("食");
    }

    @Test
    @DisplayName("should throw IllegalArgumentException when character is blank")
    void testGetKanjiInfo_blankCharacter() {
        assertThrows(IllegalArgumentException.class, () -> kanjiService.getKanjiInfo("   "));
        verifyNoInteractions(kanjiEntryRepository);
    }

    @Test
    @DisplayName("should throw ResourceNotFoundException when character is not found")
    void testGetKanjiInfo_notFound() {
        when(kanjiEntryRepository.findByCharacter("unknown")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> kanjiService.getKanjiInfo("unknown"));

        verify(kanjiEntryRepository).findByCharacter("unknown");
    }
}
