package com.midori.service;

import com.midori.dto.tokenizer.JapaneseTokenResponse;
import com.midori.entity.ShadowingTranscript;
import com.midori.entity.TranscriptToken;
import com.midori.repository.ShadowingTranscriptRepository;
import com.midori.repository.TranscriptTokenRepository;
import com.midori.service.impl.TranscriptAnalyzerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TranscriptAnalyzerServiceTest {

    @Mock
    private TranscriptTokenRepository transcriptTokenRepository;

    @Mock
    private ShadowingTranscriptRepository shadowingTranscriptRepository;

    @Mock
    private JapaneseTokenizerService tokenizerService;

    @InjectMocks
    private TranscriptAnalyzerServiceImpl transcriptAnalyzerService;

    private ShadowingTranscript transcript;
    private JapaneseTokenResponse tokenResponse;

    @BeforeEach
    void setUp() {
        transcript = ShadowingTranscript.builder()
                .id(UUID.randomUUID())
                .jpText("私は食べる")
                .build();

        tokenResponse = JapaneseTokenResponse.builder()
                .surface("食べる")
                .lemma("食べる")
                .reading("たべる")
                .partOfSpeech("verb")
                .dictionaryForm("食べる")
                .characterOffset(2)
                .build();
    }

    @Test
    @DisplayName("should analyze and save transcript tokens successfully")
    void testAnalyzeAndSave_success() {
        when(tokenizerService.tokenize("私は食べる")).thenReturn(List.of(tokenResponse));
        
        TranscriptToken expectedToken = TranscriptToken.builder()
                .sentence(transcript)
                .surface("食べる")
                .lemma("食べる")
                .reading("たべる")
                .position(2)
                .build();

        when(transcriptTokenRepository.saveAll(anyList())).thenReturn(List.of(expectedToken));

        List<TranscriptToken> result = transcriptAnalyzerService.analyzeAndSave(transcript);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("食べる", result.get(0).getSurface());
        assertEquals(2, result.get(0).getPosition());

        verify(transcriptTokenRepository).deleteBySentenceId(transcript.getId());
        verify(tokenizerService).tokenize("私は食べる");
        verify(transcriptTokenRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("should skip tokenization for null/empty jpText")
    void testAnalyzeAndSave_emptyJpText() {
        transcript.setJpText("  ");

        List<TranscriptToken> result = transcriptAnalyzerService.analyzeAndSave(transcript);

        assertTrue(result.isEmpty());
        verify(transcriptTokenRepository).deleteBySentenceId(transcript.getId());
        verifyNoInteractions(tokenizerService);
    }

    @Test
    @DisplayName("should retrieve tokens for sentence successfully")
    void testGetTokensForSentence() {
        UUID sentenceId = UUID.randomUUID();
        TranscriptToken token = TranscriptToken.builder().surface("食べる").build();

        when(transcriptTokenRepository.findBySentenceId(sentenceId)).thenReturn(List.of(token));

        List<TranscriptToken> result = transcriptAnalyzerService.getTokensForSentence(sentenceId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("食べる", result.get(0).getSurface());

        verify(transcriptTokenRepository).findBySentenceId(sentenceId);
    }

    @Test
    @DisplayName("should analyze video transcripts successfully")
    void testAnalyzeVideoTranscripts() {
        UUID videoId = UUID.randomUUID();
        when(shadowingTranscriptRepository.findByShadowingVideoIdOrderBySentenceOrderAsc(videoId))
                .thenReturn(List.of(transcript));
        when(tokenizerService.tokenize("私は食べる")).thenReturn(List.of(tokenResponse));

        transcriptAnalyzerService.analyzeVideoTranscripts(videoId);

        verify(shadowingTranscriptRepository).findByShadowingVideoIdOrderBySentenceOrderAsc(videoId);
        verify(transcriptTokenRepository).deleteBySentenceId(transcript.getId());
        verify(tokenizerService).tokenize("私は食べる");
    }
}
