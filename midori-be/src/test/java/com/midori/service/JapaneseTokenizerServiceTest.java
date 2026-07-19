package com.midori.service;

import com.midori.dto.tokenizer.JapaneseTokenResponse;
import com.midori.service.impl.JapaneseTokenizerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JapaneseTokenizerServiceTest {

    private JapaneseTokenizerServiceImpl tokenizerService;

    @BeforeEach
    void setUp() {
        tokenizerService = new JapaneseTokenizerServiceImpl();
        // Initialize tokenizer manually without local system.dic (triggering rule fallback)
        tokenizerService.init();
    }

    @Test
    @DisplayName("should tokenize simple Japanese sentence using rule fallback")
    void testTokenize_simpleSentence() {
        String sentence = "私はリンゴを食べる";
        // Expected tokens under rule fallback:
        // 1. 私 (kanji) - noun - offset 0
        // 2. は (particle) - particle - offset 1
        // 3. リンゴ (katakana) - noun - offset 2
        // 4. を (particle) - particle - offset 5
        // 5. 食べる (kanji + trailing) - verb - offset 6

        List<JapaneseTokenResponse> tokens = tokenizerService.tokenize(sentence);

        assertNotNull(tokens);
        assertFalse(tokens.isEmpty());

        // Verify "私"
        JapaneseTokenResponse t0 = tokens.get(0);
        assertEquals("私", t0.getSurface());
        assertEquals("noun", t0.getPartOfSpeech());
        assertEquals(0, t0.getCharacterOffset());

        // Verify "は"
        JapaneseTokenResponse t1 = tokens.get(1);
        assertEquals("は", t1.getSurface());
        assertEquals("particle", t1.getPartOfSpeech());
        assertEquals(1, t1.getCharacterOffset());

        // Verify "食べる"
        JapaneseTokenResponse t4 = tokens.get(4);
        assertEquals("食べる", t4.getSurface());
        assertEquals("verb", t4.getPartOfSpeech());
        assertEquals(6, t4.getCharacterOffset());
    }

    @Test
    @DisplayName("should return empty list for empty/null sentence")
    void testTokenize_emptySentence() {
        assertTrue(tokenizerService.tokenize("").isEmpty());
        assertTrue(tokenizerService.tokenize("   ").isEmpty());
        assertTrue(tokenizerService.tokenize(null).isEmpty());
    }
}
