package com.midori.service.impl;

import com.midori.dto.tokenizer.JapaneseTokenResponse;
import com.midori.entity.ShadowingTranscript;
import com.midori.entity.TranscriptToken;
import com.midori.repository.ShadowingTranscriptRepository;
import com.midori.repository.TranscriptTokenRepository;
import com.midori.service.JapaneseTokenizerService;
import com.midori.service.TranscriptAnalyzerService;
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
public class TranscriptAnalyzerServiceImpl implements TranscriptAnalyzerService {

    private final TranscriptTokenRepository transcriptTokenRepository;
    private final ShadowingTranscriptRepository shadowingTranscriptRepository;
    private final JapaneseTokenizerService tokenizerService;

    @Override
    @Transactional
    public List<TranscriptToken> analyzeAndSave(ShadowingTranscript transcript) {
        if (transcript == null || transcript.getId() == null) {
            return List.of();
        }

        // 1. Delete any existing tokens for this sentence
        transcriptTokenRepository.deleteBySentenceId(transcript.getId());

        String jpText = transcript.getJpText();
        if (jpText == null || jpText.trim().isEmpty()) {
            return List.of();
        }

        // 2. Tokenize using Sudachi Tokenizer Service
        List<JapaneseTokenResponse> rawTokens = tokenizerService.tokenize(jpText);

        // 3. Map and save entities
        List<TranscriptToken> tokensToSave = rawTokens.stream()
                .map(rt -> TranscriptToken.builder()
                        .sentence(transcript)
                        .surface(rt.getSurface())
                        .lemma(rt.getLemma())
                        .reading(rt.getReading())
                        .position(rt.getCharacterOffset())
                        .build())
                .collect(Collectors.toList());

        if (!tokensToSave.isEmpty()) {
            return transcriptTokenRepository.saveAll(tokensToSave);
        }

        return List.of();
    }

    @Override
    @Transactional
    public void analyzeVideoTranscripts(UUID videoId) {
        if (videoId == null) {
            return;
        }

        List<ShadowingTranscript> transcripts = shadowingTranscriptRepository
                .findByShadowingVideoIdOrderBySentenceOrderAsc(videoId);

        for (ShadowingTranscript transcript : transcripts) {
            try {
                analyzeAndSave(transcript);
            } catch (Exception e) {
                log.error("Failed to analyze transcript sentence {}: {}", transcript.getId(), e.getMessage());
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TranscriptToken> getTokensForSentence(UUID sentenceId) {
        if (sentenceId == null) {
            return List.of();
        }
        return transcriptTokenRepository.findBySentenceId(sentenceId);
    }
}
