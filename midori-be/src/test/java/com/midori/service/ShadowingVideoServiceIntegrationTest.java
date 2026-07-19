package com.midori.service;

import com.midori.dto.shadowing.ShadowingTimestampsResponse;
import com.midori.dto.shadowing.ShadowingTranscriptResponse;
import com.midori.entity.ShadowingTranscript;
import com.midori.entity.ShadowingVideo;
import com.midori.entity.TranscriptToken;
import com.midori.repository.ShadowingProcessingLogRepository;
import com.midori.repository.ShadowingTranscriptRepository;
import com.midori.repository.ShadowingVideoRepository;
import com.midori.service.impl.ShadowingVideoServiceImpl;
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
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShadowingVideoServiceIntegrationTest {

    @Mock
    private ShadowingVideoRepository shadowingVideoRepository;

    @Mock
    private ShadowingTranscriptRepository shadowingTranscriptRepository;

    @Mock
    private ShadowingProcessingLogRepository shadowingProcessingLogRepository;

    @Mock
    private VideoStorageService videoStorageService;

    @Mock
    private ShadowingAiProcessingService shadowingAiProcessingService;

    @Mock
    private TranscriptAnalyzerService transcriptAnalyzerService;

    @InjectMocks
    private ShadowingVideoServiceImpl shadowingVideoService;

    private ShadowingVideo video;
    private ShadowingTranscript transcript;
    private TranscriptToken token;

    @BeforeEach
    void setUp() {
        video = ShadowingVideo.builder()
                .id(UUID.randomUUID())
                .title("Shadowing Lesson 1")
                .status(com.midori.entity.ShadowingStatus.COMPLETED)
                .transcripts(new ArrayList<>())
                .build();

        transcript = ShadowingTranscript.builder()
                .id(UUID.randomUUID())
                .shadowingVideo(video)
                .sentenceOrder(0)
                .startTime(1)
                .endTime(5)
                .jpText("こんにちは")
                .vnText("Xin chào")
                .build();

        video.getTranscripts().add(transcript);

        token = TranscriptToken.builder()
                .id(UUID.randomUUID())
                .sentence(transcript)
                .surface("こんにちは")
                .lemma("こんにちは")
                .reading("こんにちは")
                .position(0)
                .build();
    }

    @Test
    @DisplayName("should get timestamps with pre-tokenized sentences")
    void testGetTimestamps_withTokens() {
        when(shadowingVideoRepository.findByIdWithTranscripts(video.getId())).thenReturn(Optional.of(video));
        when(transcriptAnalyzerService.getTokensForSentences(anyList())).thenReturn(List.of(token));

        ShadowingTimestampsResponse result = shadowingVideoService.getTimestamps(video.getId());

        assertNotNull(result);
        assertEquals(1, result.getSegments().size());
        
        ShadowingTranscriptResponse seg = result.getSegments().get(0);
        assertEquals("こんにちは", seg.getJpText());
        assertNotNull(seg.getTokens());
        assertEquals(1, seg.getTokens().size());
        assertEquals("こんにちは", seg.getTokens().get(0).getSurface());

        verify(shadowingVideoRepository).findByIdWithTranscripts(video.getId());
        verify(transcriptAnalyzerService).getTokensForSentences(anyList());
        verify(transcriptAnalyzerService, never()).analyzeAndSave(any());
    }

    @Test
    @DisplayName("should analyze-on-the-fly and save when tokens list is empty")
    void testGetTimestamps_analyzeOnTheFly() {
        when(shadowingVideoRepository.findByIdWithTranscripts(video.getId())).thenReturn(Optional.of(video));
        when(transcriptAnalyzerService.getTokensForSentences(anyList())).thenReturn(Collections.emptyList());
        when(transcriptAnalyzerService.getTokensForSentence(transcript.getId())).thenReturn(Collections.emptyList());
        when(transcriptAnalyzerService.analyzeAndSave(transcript)).thenReturn(List.of(token));

        ShadowingTimestampsResponse result = shadowingVideoService.getTimestamps(video.getId());

        assertNotNull(result);
        assertEquals(1, result.getSegments().size());
        
        ShadowingTranscriptResponse seg = result.getSegments().get(0);
        assertNotNull(seg.getTokens());
        assertEquals(1, seg.getTokens().size());
        assertEquals("こんにちは", seg.getTokens().get(0).getSurface());

        verify(shadowingVideoRepository).findByIdWithTranscripts(video.getId());
        verify(transcriptAnalyzerService).getTokensForSentences(anyList());
        verify(transcriptAnalyzerService).getTokensForSentence(transcript.getId());
        verify(transcriptAnalyzerService).analyzeAndSave(transcript);
    }
}
