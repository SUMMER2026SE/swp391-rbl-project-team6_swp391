package com.midori.service.impl;

import com.midori.dto.tokenizer.JapaneseTokenResponse;
import com.midori.service.JapaneseTokenizerService;
import com.midori.util.RomajiConverter;
import com.worksap.nlp.sudachi.Dictionary;
import com.worksap.nlp.sudachi.DictionaryFactory;
import com.worksap.nlp.sudachi.Morpheme;
import com.worksap.nlp.sudachi.Tokenizer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
public class JapaneseTokenizerServiceImpl implements JapaneseTokenizerService {

    private Tokenizer sudachiTokenizer;
    private boolean useSudachi = false;

    private static final Set<String> PARTICLES = Set.of(
            "は", "が", "を", "に", "へ", "と", "で", "から", "より", "も", "て", "た", "ね", "よ", "か", "の", "な", "ぜ", "わ", "ぞ", "っ", "ゃ", "ゅ", "ょ", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ"
    );

    // Common Japanese words that should NOT be split character by character
    private static final Set<String> COMMON_WORDS = Set.of(
            "こんにちは", "こんばんは", "おはよう", "ありがとう", "すみません", "はじめまして",
            "よろしく", "おねがい", "ください", "わかります",
            "小朋友", "大家好", "老师们", "同学们"
    );

    @PostConstruct
    public void init() {
        try {
            String dictPath = resolveDictionaryPath();
            if (dictPath != null) {
                File dictFile = new File(dictPath);
                if (dictFile.exists() && dictFile.isFile()) {
                    log.info("Sudachi dictionary found at: {}. Initializing Sudachi...", dictFile.getAbsolutePath());
                    String configJson = "{\"systemDict\":\"" + dictFile.getAbsolutePath().replace("\\", "/") + "\"}";
                    Dictionary dictionary = new DictionaryFactory().create(null, configJson, true);
                    this.sudachiTokenizer = dictionary.create();
                    this.useSudachi = true;
                    log.info("Sudachi Tokenizer initialized successfully.");
                    return;
                }
            }
            log.warn("Sudachi system.dic not found at {} (fallback rule-based will be used).", dictPath);
        } catch (Exception e) {
            log.error("Failed to initialize Sudachi (falling back to rule-based): {}", e.getMessage());
        }
    }

    private String resolveDictionaryPath() {
        String candidate = "dictionary/sudachi/sudachi-dictionary-20240409/system_core.dic";
        if (getClass().getClassLoader().getResource(candidate) != null) {
            URL resource = getClass().getClassLoader().getResource(candidate);
            if (resource != null) {
                try {
                    return new File(resource.toURI()).getAbsolutePath();
                } catch (Exception e) {
                    // ignore
                }
            }
        }
        File file = new File(candidate);
        if (file.exists()) {
            return file.getAbsolutePath();
        }
        file = new File("src/main/resources/" + candidate);
        if (file.exists()) {
            return file.getAbsolutePath();
        }
        return candidate;
    }

    @Override
    public List<JapaneseTokenResponse> tokenize(String sentence) {
        if (sentence == null || sentence.trim().isEmpty()) {
            return List.of();
        }

        if (useSudachi && sudachiTokenizer != null) {
            try {
                return tokenizeWithSudachi(sentence);
            } catch (Exception e) {
                log.warn("Sudachi tokenization failed (falling back to rule-based): {}", e.getMessage());
            }
        }

        return tokenizeWithRules(sentence);
    }

    private List<JapaneseTokenResponse> tokenizeWithSudachi(String sentence) {
        List<JapaneseTokenResponse> tokens = new ArrayList<>();
        List<Morpheme> morphemes = sudachiTokenizer.tokenize(Tokenizer.SplitMode.C, sentence);

        for (Morpheme m : morphemes) {
            // Get reading (Sudachi returns katakana, we can map to hiragana or leave as is)
            String reading = m.readingForm();
            String romaji = RomajiConverter.convert(reading);
            
            // Map Sudachi POS tags
            List<String> posList = m.partOfSpeech();
            String pos = posList.isEmpty() ? "noun" : posList.get(0);
            String normPos = normalizePartOfSpeech(pos);

            tokens.add(JapaneseTokenResponse.builder()
                    .surface(m.surface())
                    .lemma(m.dictionaryForm()) // lemma is dictionary form
                    .reading(reading)
                    .partOfSpeech(normPos)
                    .dictionaryForm(m.dictionaryForm())
                    .characterOffset(m.begin())
                    .build());
        }

        return tokens;
    }

    private List<JapaneseTokenResponse> tokenizeWithRules(String sentence) {
        List<JapaneseTokenResponse> tokens = new ArrayList<>();
        int len = sentence.length();
        int i = 0;

        while (i < len) {
            char c = sentence.charAt(i);
            
            // Skip whitespaces
            if (Character.isWhitespace(c)) {
                i++;
                continue;
            }

            int start = i;
            String type = getCharType(c);
            StringBuilder sb = new StringBuilder();
            sb.append(c);
            i++;

            if ("kanji".equals(type)) {
                // Group consecutive kanji
                while (i < len && "kanji".equals(getCharType(sentence.charAt(i)))) {
                    sb.append(sentence.charAt(i));
                    i++;
                }
                // Check if trailing Hiragana forms a verb/adjective ending
                if (i < len && "hiragana".equals(getCharType(sentence.charAt(i)))) {
                    char next = sentence.charAt(i);
                    if (next == 'る' || next == 'う' || next == 'つ' || next == 'く' || next == 'ぐ' || 
                        next == 'す' || next == 'む' || next == 'ぶ' || next == 'ぬ' || next == 'い') {
                        sb.append(next);
                        i++;
                    } else if (i + 1 < len) {
                        char nextNext = sentence.charAt(i + 1);
                        if (nextNext == 'る' || nextNext == 'た' || nextNext == 'て') {
                            sb.append(next);
                            sb.append(nextNext);
                            i += 2;
                        }
                    }
                }
            } else if ("hiragana".equals(type)) {
                // Group consecutive hiragana into a word (e.g., こんにちは, はじめまして)
                while (i < len && "hiragana".equals(getCharType(sentence.charAt(i)))) {
                    sb.append(sentence.charAt(i));
                    i++;
                }
            } else if ("katakana".equals(type)) {
                // Group consecutive katakana into a word
                while (i < len && "katakana".equals(getCharType(sentence.charAt(i)))) {
                    sb.append(sentence.charAt(i));
                    i++;
                }
            } else {
                // Other characters (punctuation, etc.) - keep as single
            }

            String surface = sb.toString();
            String pos = determinePartOfSpeech(surface, type);
            tokens.add(JapaneseTokenResponse.builder()
                    .surface(surface)
                    .lemma(surface)
                    .reading(surface)
                    .partOfSpeech(pos)
                    .dictionaryForm(surface)
                    .characterOffset(start)
                    .build());
        }

        return tokens;
    }

    private String getCharType(char c) {
        if (c >= '\u4e00' && c <= '\u9faf') {
            return "kanji";
        } else if (c >= '\u3040' && c <= '\u309f') {
            return "hiragana";
        } else if (c >= '\u30a0' && c <= '\u30ff') {
            return "katakana";
        } else {
            return "other";
        }
    }

    private String determinePartOfSpeech(String surface, String type) {
        if (PARTICLES.contains(surface)) {
            return "particle";
        }
        if ("kanji".equals(type) || surface.codePoints().anyMatch(c -> c >= '\u4e00' && c <= '\u9faf')) {
            if (surface.endsWith("る") || surface.endsWith("う") || surface.endsWith("つ") || 
                surface.endsWith("く") || surface.endsWith("ぐ") || surface.endsWith("す") || 
                surface.endsWith("む") || surface.endsWith("ぶ") || surface.endsWith("ぬ")) {
                return "verb";
            }
            if (surface.endsWith("い")) {
                return "adjective";
            }
            return "noun";
        }
        if ("hiragana".equals(type) || "katakana".equals(type)) {
            return "noun";
        }
        return "other";
    }

    private String normalizePartOfSpeech(String sudachiPos) {
        if (sudachiPos == null) return "noun";
        String lower = sudachiPos.toLowerCase();
        if (lower.contains("noun") || lower.contains("名詞")) {
            return "noun";
        }
        if (lower.contains("verb") || lower.contains("動詞")) {
            return "verb";
        }
        if (lower.contains("adjective") || lower.contains("形容詞")) {
            return "adjective";
        }
        if (lower.contains("particle") || lower.contains("助詞")) {
            return "particle";
        }
        return "noun"; // default
    }
}
