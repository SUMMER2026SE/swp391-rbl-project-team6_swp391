package com.midori.service;

import com.midori.entity.ShadowingTranscript;
import com.midori.entity.TranscriptToken;

import java.util.List;
import java.util.UUID;

public interface TranscriptAnalyzerService {
    List<TranscriptToken> analyzeAndSave(ShadowingTranscript transcript);
    void analyzeVideoTranscripts(UUID videoId);
    List<TranscriptToken> getTokensForSentence(UUID sentenceId);
    List<TranscriptToken> getTokensForSentences(List<UUID> sentenceIds);
}
