package com.midori.ai.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.dto.AiQuizGenerationResponse;
import com.midori.entity.Difficulty;
import com.midori.entity.QuestionType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Helpers used by {@link com.midori.ai.core.AiCoreService#parseExistingQuestionsFromText(String, String)}
 * to clean up LLM chat output and sanitize the parsed response so that the
 * controller mapping never blows up on partial / slightly-misformatted output.
 *
 * <p>Pulled out of {@code AiCoreService} to make unit-testing trivial and to
 * keep the orchestration service readable.
 */
public final class AiExistingQuestionParser {

    private static final Logger log = LoggerFactory.getLogger(AiExistingQuestionParser.class);

    private AiExistingQuestionParser() {}

    // Accepted aliases for each logical field. First non-empty value wins.
    private static final String[] TEXT_KEYS       = {"content", "question", "questionText", "text", "prompt"};
    private static final String[] ANSWERS_KEYS    = {"answers", "options", "choices"};
    private static final String[] CORRECT_KEYS    = {"isCorrect", "correct", "is_correct", "correctAnswer", "correct_answer", "answer", "correctOption", "correctOptionIndex", "referenceAnswer", "reference_answer", "correctText", "referenceText"};
    /** Direct-answer field names for FILL_BLANK / SHORT_ANSWER / TRUE_FALSE — not an MCQ answers array. */
    private static final String[] DIRECT_ANSWER_KEYS = {"correctAnswer", "correctText", "referenceAnswer", "referenceText", "correct_answer", "reference_answer"};
    /** Option label prefix pattern: strips "A.", "A)", "A " etc. from answer option text. */
    private static final Pattern OPTION_LABEL_PREFIX = Pattern.compile("^([A-Da-d\\uFF21-\\uFF24])[.)\\uFF1A:-]\\s*");
    private static final String[] OPT_CONTENT_KEYS = {"content", "text", "label", "value", "option"};
    private static final String[] OPT_LABEL_KEYS   = {"label", "key", "letter", "id"};
    private static final String[] CATEGORY_KEYS   = {"category", "section", "categoryName", "questionCategory", "skill", "typeName", "questionSkill"};

    private static final Pattern MULTIPLE_WHITESPACE_PATTERN = Pattern.compile("[ \\t]+");
    private static final Pattern MULTIPLE_BLANK_LINES_PATTERN = Pattern.compile("(?:\\n[ \\t]*){2,}");
    private static final Pattern ASCII_WHITESPACE_PATTERN = Pattern.compile("\\s+");
    private static final Pattern READING_PREFIX_PATTERN = Pattern.compile("(?i)^(?:read\\s*the\\s*(?:passage|text)|reading\\s*passage)[^\\n]*\\n+question[:\\s]*");
    private static final Pattern CORRECT_TEXT_LINE = Pattern.compile(
            "(?im)^\\s*(?:Correct\\s*Text|CorrectText|Text|Đáp\\s*án\\s*đúng)\\s*[:.]?\\s*(.+)",
            Pattern.MULTILINE
    );
    private static final Pattern REFERENCE_ANSWER_LINE = Pattern.compile(
            "(?im)^\\s*(?:Reference\\s*Answer|ReferenceAnswer|Đáp\\s*án\\s*tham\\s*khảo)\\s*[:.]?\\s*(.+)",
            Pattern.MULTILINE
    );
    private static final ObjectMapper LENIENT_MAPPER = createLenientMapper();

    private static ObjectMapper createLenientMapper() {
        ObjectMapper m = new ObjectMapper();
        m.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return m;
    }

    // =============================================================
    // PHẦN 1: TEXT NORMALIZATION (NFKC, CRLF, spaces, Japanese spacing)
    // =============================================================

    /**
     * Normalize text for comparison against source PDF text.
     * Handles:
     * - Unicode NFKC normalization (decomposes then recomposes)
     * - CRLF -> LF
     * - Multiple whitespace/tabs -> single space
     * - Japanese character spacing fix: collapses accidental spaces between
     *   hiragana/katakana/kanji characters (PDF extractor artifacts)
     * - Fullwidth punctuation to ASCII equivalents
     * - Preserves Japanese text content
     */
    public static String normalizeForEvidence(String s) {
        if (s == null) return "";
        String result = s;

        // 1. CRLF -> LF
        result = result.replace("\r\n", "\n").replace('\r', '\n');

        // 2. Unicode NFKC normalization
        result = Normalizer.normalize(result, Normalizer.Form.NFKC);

        // 3. Collapse multiple newlines/tabs/spaces
        result = MULTIPLE_WHITESPACE_PATTERN.matcher(result).replaceAll(" ");
        // Collapse multiple blank lines
        result = MULTIPLE_BLANK_LINES_PATTERN.matcher(result).replaceAll("\n\n");

        // 4. Fix Japanese character spacing artifacts from PDF extractor.
        // PDF extractors sometimes insert spaces between CJK characters.
        // Collapse any space that sits between two CJK characters (Hiragana, Katakana, Kanji).
        result = collapseJapaneseSpacing(result);

        // 5. Normalize fullwidth ASCII punctuation (used in some Japanese PDFs)
        result = normalizeFullwidthPunctuation(result);

        return result.trim();
    }

    /**
     * Collapse spaces between CJK characters only.
     * e.g., "撮り まし た" -> "撮りました"
     * e.g., "学校 で行 きまし す" -> "学校で行きます"
     */
    private static String collapseJapaneseSpacing(String s) {
        if (s == null || s.isEmpty()) return s;
        StringBuilder sb = new StringBuilder();
        char[] chars = s.toCharArray();
        for (int i = 0; i < chars.length; i++) {
            char c = chars[i];
            if (c == ' ' && i > 0 && i < chars.length - 1) {
                char prev = chars[i - 1];
                char next = chars[i + 1];
                // Collapse if both neighbors are CJK
                if (isJapaneseChar(prev) && isJapaneseChar(next)) {
                    continue; // skip this space
                }
            }
            sb.append(c);
        }
        return sb.toString();
    }

    /**
     * Check if a character is a Japanese character (Hiragana, Katakana, Kanji, or Japanese punctuation).
     */
    private static boolean isJapaneseChar(char c) {
        // Hiragana: \u3040-\u309F
        if (c >= '\u3040' && c <= '\u309F') return true;
        // Katakana: \u30A0-\u30FF
        if (c >= '\u30A0' && c <= '\u30FF') return true;
        // Kanji (CJK Unified Ideographs): \u4E00-\u9FFF
        if (c >= '\u4E00' && c <= '\u9FFF') return true;
        // Halfwidth Katakana: \uFF65-\uFF9F
        if (c >= '\uFF65' && c <= '\uFF9F') return true;
        // Japanese punctuation/range extensions
        if (c == '\u3000' || c == '\u3001' || c == '\u3002' || c == '\u300A' || c == '\u300B' ||
                c == '\u3010' || c == '\u3011' || c == '\u3013' || c == '\u3014' || c == '\u3015') return true;
        return false;
    }

    /**
     * Normalize fullwidth ASCII punctuation to ASCII equivalents.
     */
    private static String normalizeFullwidthPunctuation(String s) {
        if (s == null) return "";
        return s
                .replace('＋', '+').replace('－', '-').replace('－', '-')
                .replace('＝', '=').replace('＜', '<').replace('＞', '>')
                .replace('（', '(').replace('）', ')')
                .replace('Ａ', 'A').replace('Ｂ', 'B').replace('Ｃ', 'C').replace('Ｄ', 'D')
                .replace('ａ', 'a').replace('ｂ', 'b').replace('ｃ', 'c').replace('ｄ', 'd')
                .replace('１', '1').replace('２', '2').replace('３', '3').replace('４', '4')
                .replace('０', '0')
                .replace('　', ' '); // fullwidth space
    }

    /**
     * Simple ASCII-lowercase normalization (no NFKC — for legacy code paths).
     */
    private static String normalizeAsciiLowercase(String s) {
        if (s == null) return "";
        return ASCII_WHITESPACE_PATTERN.matcher(s).replaceAll(" ").toLowerCase().trim();
    }

    // =============================================================
    // LEGACY: kept for existing call sites that pass already-normalized strings
    // =============================================================

    /**
     * @deprecated Use {@link #normalizeForEvidence(String)} instead.
     *             This method is kept for backward compatibility with existing
     *             code paths that pass pre-normalized strings.
     */
    @Deprecated
    private static String normalizeForCompare(String s) {
        return normalizeAsciiLowercase(s);
    }

    /**
     * @deprecated Use {@link #textAppearsInSourceSoft(String, String)} instead.
     */
    @Deprecated
    private static boolean textAppearsInSource(String content, String normalizedSource) {
        String nc = normalizeAsciiLowercase(content);
        if (nc.isEmpty()) return false;
        return normalizedSource.contains(nc);
    }

    /**
     * @deprecated Use {@link #contentAppearsInSourceSoft(String, String)} instead.
     */
    @Deprecated
    private static boolean contentAppearsInSource(String content, String normalizedSource) {
        String nc = normalizeAsciiLowercase(content);
        if (nc.isEmpty()) return false;
        if (normalizedSource.contains(nc)) return true;
        // Try a 20+ char sliding window from the start of the content.
        for (int len = Math.min(nc.length(), 80); len >= 20; len -= 10) {
            String window = nc.substring(0, len);
            if (normalizedSource.contains(window)) return true;
        }
        return false;
    }

    // =============================================================
    // PHẦN 4: SOFT EVIDENCE VALIDATION (for Reading with passage support)
    // =============================================================

    /**
     * Soft content match for normalized text.
     * Uses exact contains first, then tries prefix windows.
     */
    public static boolean textAppearsInSourceSoft(String content, String normalizedSource) {
        String nc = content;
        if (nc == null || nc.isEmpty()) return false;
        if (normalizedSource.contains(nc)) return true;
        // Try a sliding window from the start of the content.
        int maxLen = Math.min(nc.length(), 80);
        for (int len = maxLen; len >= 20; len -= 10) {
            String window = nc.substring(0, len);
            if (normalizedSource.contains(window)) return true;
        }
        return false;
    }

    /**
     * Soft question-content match: question text or its prefix appears in source.
     * For Reading passages, also checks if a significant substring of the question
     * (after removing common "Read the passage..." prefix) appears in source.
     */
    public static boolean contentAppearsInSourceSoft(String content, String normalizedSource) {
        String nc = content;
        if (nc == null || nc.isEmpty()) return false;

        // Try exact match first
        if (normalizedSource.contains(nc)) return true;

        // Try prefix windows
        int maxLen = Math.min(nc.length(), 80);
        for (int len = maxLen; len >= 20; len -= 10) {
            String window = nc.substring(0, len);
            if (normalizedSource.contains(window)) return true;
        }

        // For Reading-style content: strip "Read the passage: ...\n\nQuestion: "
        // prefix and try to find the actual question text
        String stripped = stripReadingPrefix(nc);
        if (!stripped.isEmpty() && !stripped.equals(nc)) {
            if (normalizedSource.contains(stripped)) return true;
            int maxLen2 = Math.min(stripped.length(), 60);
            for (int len = maxLen2; len >= 15; len -= 10) {
                String window = stripped.substring(0, len);
                if (normalizedSource.contains(window)) return true;
            }
        }

        return false;
    }

    /**
     * Strip common Reading question prefixes to get the actual question text.
     */
    private static String stripReadingPrefix(String content) {
        if (content == null) return "";
        return READING_PREFIX_PATTERN.matcher(content).replaceFirst("").trim();
    }

    // =============================================================
    // JSON CLEANING (unchanged)
    // =============================================================

    /**
     * Strip markdown code fences and surrounding prose from a raw LLM chat
     * reply so the result has a chance of being valid JSON.
     */
    public static String cleanJsonResponse(String raw) {
        if (raw == null) return "";
        String s = raw.trim();
        if (s.startsWith("```")) {
            int firstNewline = s.indexOf('\n');
            if (firstNewline > 0 && firstNewline < 20) {
                s = s.substring(firstNewline + 1);
            } else {
                s = s.substring(3);
            }
        }
        if (s.endsWith("```")) {
            s = s.substring(0, s.length() - 3);
        }
        s = s.trim();
        int firstBrace = s.indexOf('{');
        int lastBrace = s.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            String candidate = s.substring(firstBrace, lastBrace + 1);
            if (countChar(candidate, '{') == countChar(candidate, '}')) {
                return candidate;
            }
        }
        return s;
    }

    /**
     * Walk the input right-to-left looking for a balanced {@code {...}} block.
     * Returns null when no such block exists.
     */
    public static String extractLastBalancedJsonObject(String input) {
        if (input == null) return null;
        for (int end = input.length() - 1; end > 0; end--) {
            if (input.charAt(end) != '}') continue;
            int depth = 1;
            int start = -1;
            for (int i = end - 1; i >= 0; i--) {
                char c = input.charAt(i);
                if (c == '}') depth++;
                else if (c == '{') {
                    depth--;
                    if (depth == 0) { start = i; break; }
                }
            }
            if (start >= 0) {
                String candidate = input.substring(start, end + 1);
                if (countChar(candidate, '{') == countChar(candidate, '}')) {
                    return candidate;
                }
            }
        }
        return null;
    }

    /**
     * Tolerant end-to-end parse: strip markdown / surrounding prose, locate the
     * balanced JSON object, then map every accepted alias to the canonical
     * {@link AiExamParseResponse} shape before sanitizing.
     */
    public static AiExamParseResponse parseAndNormalize(String raw, ObjectMapper mapper) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("empty response");
        }
        String cleaned = cleanJsonResponse(raw);
        JsonNode root = readTreeLenient(mapper, cleaned);
        if (root == null || !root.isObject()) {
            String second = extractLastBalancedJsonObject(cleaned);
            if (second != null) {
                root = readTreeLenient(mapper, second);
            }
        }
        if (root == null || !root.isObject()) {
            throw new IllegalArgumentException("no parseable JSON object");
        }
        ObjectNode normalized = normalizeRoot((ObjectNode) root);
        try {
            AiExamParseResponse parsed = mapper.treeToValue(normalized, AiExamParseResponse.class);
            return sanitize(parsed);
        } catch (Exception e) {
            throw new IllegalArgumentException("normalized JSON failed to bind: " + e.getMessage(), e);
        }
    }

    // =============================================================
    // GENERATE MODE JSON EXTRACTION
    // Shared cleaner for AI-generated quiz responses (mode =
    // "Generate from Learning Content"). Tolerant of:
    //   - markdown code fences
    //   - leading prose ("We need to generate...")
    //   - trailing prose ("Hope this helps")
    //   - JSON arrays wrapped at top-level (auto-wrapped into
    //     { "questions": [...] })
    //   - BOM and other leading whitespace
    // =============================================================

    /** Strip a UTF-8 BOM (\uFEFF) if present at the very start. */
    private static String stripBom(String s) {
        if (s == null || s.isEmpty()) return s;
        if (s.charAt(0) == '\uFEFF') return s.substring(1);
        return s;
    }

    /**
     * Strip leading control chars (BOM, ZWSP, etc.) from the very start of a
     * raw AI response so JSON parsing doesn't choke.
     */
    public static String stripLeadingControlChars(String raw) {
        if (raw == null || raw.isEmpty()) return raw;
        int i = 0;
        while (i < raw.length()) {
            char c = raw.charAt(i);
            // BOM, zero-width, and other invisible chars
            if (c == '\uFEFF' || c == '\u200B' || c == '\u200C' || c == '\u200D'
                    || c == '\u2060' || c == '\u00A0') {
                i++;
            } else {
                break;
            }
        }
        return i == 0 ? raw : raw.substring(i);
    }

    /**
     * Find the first balanced JSON object/array starting at index {@code start}.
     * Returns the substring including the opening/closing braces/brackets, or
     * null when no balanced structure is found. Handles nested braces/brackets
     * and quoted strings (so braces inside strings are ignored).
     */
    private static String findBalancedJson(String s, int start) {
        if (s == null) return null;
        int len = s.length();
        while (start < len) {
            char c = s.charAt(start);
            if (c != '{' && c != '[') {
                start++;
                continue;
            }
            char open = c;
            char close = (c == '{') ? '}' : ']';
            int depth = 1;
            int i = start + 1;
            boolean inString = false;
            boolean escaped = false;
            while (i < len) {
                char ch = s.charAt(i);
                if (inString) {
                    if (escaped) {
                        escaped = false;
                    } else if (ch == '\\') {
                        escaped = true;
                    } else if (ch == '"') {
                        inString = false;
                    }
                    i++;
                    continue;
                }
                if (ch == '"') {
                    inString = true;
                    i++;
                    continue;
                }
                if (ch == open) {
                    depth++;
                } else if (ch == close) {
                    depth--;
                    if (depth == 0) {
                        return s.substring(start, i + 1);
                    }
                }
                i++;
            }
            return null; // Unbalanced — give up
        }
        return null;
    }

    /**
     * Strip a balanced JSON object or array from a raw AI response, including
     * the leading/trailing markdown fence and prose.
     *
     * <p>Strategy:
     * <ol>
     *   <li>Strip BOM / leading control chars.</li>
     *   <li>Strip leading {@code ```json} or {@code ```} fences.</li>
     *   <li>Strip trailing {@code ```} fences.</li>
     *   <li>Locate the first balanced JSON object (preferred) or array
     *       using {@link #findBalancedJson(String, int)}.</li>
     *   <li>Return the substring, trimmed.</li>
     * </ol>
     */
    public static String extractGenerateJson(String raw) {
        if (raw == null) return null;
        String s = stripLeadingControlChars(raw).trim();
        if (s.isEmpty()) return null;

        // Strip leading ```json or ``` fence
        if (s.startsWith("```json")) {
            int nl = s.indexOf('\n');
            s = (nl > 0 && nl < 30) ? s.substring(nl + 1) : s.substring(7);
        } else if (s.startsWith("```")) {
            int nl = s.indexOf('\n');
            s = (nl > 0 && nl < 30) ? s.substring(nl + 1) : s.substring(3);
        }
        // Strip trailing ``` fence
        if (s.endsWith("```")) {
            s = s.substring(0, s.length() - 3);
        }
        s = s.trim();
        if (s.isEmpty()) return null;

        // Try balanced object first (more specific), then balanced array
        String obj = findBalancedJson(s, 0);
        if (obj != null && obj.startsWith("{")) return obj;

        // Fall back: if the first non-whitespace char is [, it's an array
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isWhitespace(c)) continue;
            if (c == '[') {
                String arr = findBalancedJson(s, i);
                return arr; // may be null — caller handles
            }
            break;
        }
        return null;
    }

    /**
     * Tolerant end-to-end parse for AI quiz-generation responses.
     *
     * <p>Wraps {@link #extractGenerateJson(String)} and tolerates:
     * <ul>
     *   <li>Markdown code fences</li>
     *   <li>Leading prose preamble ("We need to generate...")</li>
     *   <li>Trailing prose ("Hope this helps")</li>
     *   <li>Top-level JSON array (auto-wrapped into {@code {"questions": [...]}})</li>
     *   <li>BOM / leading control chars</li>
     *   <li>Unknown / extra fields (the DTO has
     *       {@code @JsonIgnoreProperties(ignoreUnknown = true)})</li>
     * </ul>
     *
     * @throws IllegalArgumentException when the response contains no parseable
     *         JSON object/array. The message is friendly — it does NOT
     *         include the raw response.
     */
    public static AiQuizGenerationResponse parseQuizGenerationResponse(
            String raw, ObjectMapper mapper) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("AI returned an empty response. Please try again.");
        }
        ObjectMapper m = (mapper != null) ? mapper : LENIENT_MAPPER;
        com.fasterxml.jackson.databind.ObjectReader responseReader = m.readerFor(AiQuizGenerationResponse.class)
                .without(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        com.fasterxml.jackson.databind.ObjectReader treeReader = m.reader();

        String extracted = extractGenerateJson(raw);
        if (extracted == null || extracted.isBlank()) {
            throw new IllegalArgumentException("AI returned an invalid response. Please try again.");
        }

        JsonNode root;
        try {
            root = treeReader.readTree(extracted);
        } catch (Exception e) {
            throw new IllegalArgumentException("AI returned an invalid response. Please try again.");
        }
        if (root == null) {
            throw new IllegalArgumentException("AI returned an invalid response. Please try again.");
        }

        // Wrap top-level array → {"questions": [...]}
        if (root.isArray()) {
            ObjectNode wrapped = m.createObjectNode();
            ArrayNode qs = m.createArrayNode();
            for (JsonNode item : root) qs.add(item);
            wrapped.set("questions", qs);
            root = wrapped;
        }
        if (!root.isObject()) {
            throw new IllegalArgumentException("AI returned an invalid response. Please try again.");
        }

        try {
            return responseReader.readValue(root);
        } catch (Exception e) {
            throw new IllegalArgumentException("AI returned an invalid response. Please try again.");
        }
    }

    private static JsonNode readTreeLenient(ObjectMapper mapper, String body) {
        ObjectMapper m = (mapper != null) ? mapper : LENIENT_MAPPER;
        if (body == null) return null;
        try {
            return m.readTree(body);
        } catch (Exception ignored) {
            return null;
        }
    }

    static ObjectNode normalizeRoot(ObjectNode root) {
        JsonNode qs = firstArrayField(root, "questions", "items", "data");
        if (qs == null || !qs.isArray()) {
            return root;
        }
        ArrayNode outQuestions = root.arrayNode();
        for (JsonNode qn : qs) {
            if (qn == null || qn.isNull()) continue;
            if (qn.isTextual()) {
                ObjectNode onlyText = root.objectNode();
                onlyText.put("content", qn.asText());
                onlyText.set("answers", root.arrayNode());
                outQuestions.add(onlyText);
                continue;
            }
            if (!qn.isObject()) continue;
            ObjectNode in = (ObjectNode) qn;
            ObjectNode normalized = root.objectNode();
            JsonNode typeNode = pickField(in, "type", "questionType", "kind");
            if (typeNode != null && !typeNode.isNull()) normalized.set("type", typeNode);
            JsonNode text = pickField(in, TEXT_KEYS);
            if (text != null && !text.isNull()) normalized.set("content", text);
            JsonNode diff = pickField(in, "difficulty", "level");
            if (diff != null && !diff.isNull()) normalized.set("difficulty", diff);
            JsonNode exp = pickField(in, "explanation", "rationale", "note");
            if (exp != null && !exp.isNull()) normalized.set("explanation", exp);
            JsonNode cat = pickField(in, CATEGORY_KEYS);
            if (cat != null && !cat.isNull()) normalized.set("category", cat);
            JsonNode rp = pickField(in, "readingPassage", "sourcePassage");
            if (rp != null && !rp.isNull()) {
                normalized.set("readingPassage", rp);
                normalized.set("sourcePassage", rp);
            }

            // Pick the type string for format-aware answer normalization
            String typeStr = (typeNode != null && typeNode.isTextual()) ? typeNode.asText().toUpperCase() : "";

            // For FILL_BLANK / SHORT_ANSWER / TRUE_FALSE: prefer direct answer field over MCQ answers array
            JsonNode directAnswerNode = pickField(in, DIRECT_ANSWER_KEYS);

            JsonNode answersNode = pickField(in, ANSWERS_KEYS);
            ArrayNode answersArr = normalizeAnswers(root, answersNode, pickField(in, CORRECT_KEYS),
                    directAnswerNode, typeStr);
            normalized.set("answers", answersArr);
            outQuestions.add(normalized);
        }
        root.set("questions", outQuestions);
        return root;
    }

    private static ArrayNode normalizeAnswers(ObjectNode parent, JsonNode raw, JsonNode directCorrect) {
        return normalizeAnswers(parent, raw, directCorrect, null, "");
    }

    /**
     * Normalize an answers array, with special handling for non-MCQ formats.
     *
     * @param directAnswerNode the directAnswer/correctText/referenceAnswer field from the question JSON
     * @param typeStr the question type string (e.g. "FILL_BLANK", "SHORT_ANSWER", "TRUE_FALSE", "MULTIPLE_CHOICE")
     */
    private static ArrayNode normalizeAnswers(ObjectNode parent, JsonNode raw, JsonNode directCorrect,
                                              JsonNode directAnswerNode, String typeStr) {
        ArrayNode out = parent.arrayNode();

        // Resolve correctVal from the CORRECT_KEYS or DIRECT_ANSWER_KEYS
        String correctVal = null;
        if (directCorrect != null && !directCorrect.isNull() && (directCorrect.isTextual() || directCorrect.isNumber() || directCorrect.isBoolean())) {
            correctVal = directCorrect.asText();
        }
        // For FILL_BLANK / SHORT_ANSWER / TRUE_FALSE: direct answer field takes priority over MCQ isCorrect logic
        String directAnswer = null;
        if (directAnswerNode != null && !directAnswerNode.isNull() && directAnswerNode.isTextual()) {
            directAnswer = directAnswerNode.asText().trim();
        }
        if (directAnswer != null && !directAnswer.isEmpty()) {
            correctVal = directAnswer;
        }

        boolean isNonMcq = typeStr.equals("FILL_BLANK") || typeStr.equals("SHORT_ANSWER");

        if (raw == null || raw.isNull()) {
            if (correctVal != null && !correctVal.isEmpty()) {
                AiAnswerSlot s = new AiAnswerSlot();
                s.content = correctVal;
                s.isCorrect = Boolean.TRUE;
                out.add(s.toNode(parent));
            }
            return out;
        }

        if (raw.isArray()) {
            for (JsonNode item : raw) {
                AiAnswerSlot slot = readAsAnswerSlot(item, parent);
                if (slot == null) continue;
                // Strip option-label prefix from MCQ option content (e.g. "A. としょかん" → "としょかん")
                if (!isNonMcq && slot.content != null) {
                    slot.content = stripOptionLabelPrefix(slot.content);
                }
                out.add(slot.toNode(parent));
            }
        } else if (raw.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> it = raw.fields();
            while (it.hasNext()) {
                Map.Entry<String, JsonNode> e = it.next();
                AiAnswerSlot slot = readAsAnswerSlot(e.getValue(), parent);
                if (slot == null) continue;
                if (slot.content == null || slot.content.isBlank()) slot.content = e.getKey();
                if (slot.label == null) slot.label = e.getKey();
                if (!isNonMcq && slot.content != null) {
                    slot.content = stripOptionLabelPrefix(slot.content);
                }
                out.add(slot.toNode(parent));
            }
        } else if (raw.isTextual()) {
            AiAnswerSlot s = new AiAnswerSlot();
            s.content = raw.asText();
            s.isCorrect = Boolean.FALSE;
            out.add(s.toNode(parent));
        }

        boolean foundMatch = false;
        if (correctVal != null) {
            String strippedCorrect = stripOptionLabelPrefix(correctVal);
            for (JsonNode n : out) {
                JsonNode contentField = n.get("content");
                if (contentField != null) {
                    String optText = stripOptionLabelPrefix(contentField.asText().trim());
                    if (optText.equalsIgnoreCase(strippedCorrect.trim())) {
                        if (n instanceof ObjectNode) {
                            ((ObjectNode) n).put("isCorrect", true);
                        }
                        foundMatch = true;
                    }
                }
            }
        }

        if (!foundMatch && out.isEmpty() && correctVal != null && !correctVal.isEmpty()) {
            AiAnswerSlot s = new AiAnswerSlot();
            s.content = stripOptionLabelPrefix(correctVal);
            s.isCorrect = Boolean.TRUE;
            out.add(s.toNode(parent));
        }

        return out;
    }

    /**
     * Strip the standard option-label prefix from an answer option string.
     * Handles: "A.", "A)", "A ", "A. ", "a)", "a. ", "(A)", "(A) " etc.
     * Does NOT strip legitimate leading letters from normal text.
     */
    public static String stripOptionLabelPrefix(String text) {
        if (text == null) return null;
        String trimmed = text.trim();
        if (trimmed.isEmpty()) return trimmed;

        // 1. Punctuation prefix: "A.", "A)", "A:", "A-", "a.", "a)", "a:", "a-"
        Matcher m1 = OPTION_LABEL_PREFIX.matcher(trimmed);
        if (m1.find()) {
            String remaining = trimmed.substring(m1.end()).trim();
            if (!remaining.isEmpty()) {
                return remaining;
            }
        }

        // 2. Space prefix: "A ", "B ", "C ", "D " (only uppercase A-D, to avoid "a book")
        Pattern spacePattern = Pattern.compile("^([A-D\\uFF21-\\uFF24])\\s+");
        Matcher m2 = spacePattern.matcher(trimmed);
        if (m2.find()) {
            String remaining = trimmed.substring(m2.end()).trim();
            if (!remaining.isEmpty()) {
                boolean isJapanese = CJK_CHAR.matcher(remaining).find();
                boolean isSingleWord = !remaining.contains(" ") && !remaining.contains("\t");
                boolean startsWithLowercase = Character.isLowerCase(remaining.charAt(0));
                
                if (isJapanese || isSingleWord || !startsWithLowercase) {
                    if (trimmed.startsWith("Câu") || trimmed.startsWith("Đáp") || trimmed.startsWith("Bệnh")) {
                        return trimmed;
                    }
                    return remaining;
                }
            }
        }

        return trimmed;
    }

    private static AiAnswerSlot readAsAnswerSlot(JsonNode item, ObjectNode parent) {
        if (item == null || item.isNull()) return null;
        AiAnswerSlot slot = new AiAnswerSlot();
        if (item.isTextual() || item.isNumber() || item.isBoolean()) {
            slot.content = item.asText();
            slot.isCorrect = Boolean.FALSE;
            return slot;
        }
        if (!item.isObject()) return null;
        ObjectNode obj = (ObjectNode) item;
        JsonNode contentNode = pickField(obj, OPT_CONTENT_KEYS);
        if (contentNode == null || contentNode.isNull()) {
            return null;
        }
        slot.content = contentNode.isTextual() ? contentNode.asText() : contentNode.toString();
        JsonNode labelNode = pickField(obj, OPT_LABEL_KEYS);
        if (labelNode != null && labelNode.isTextual()) slot.label = labelNode.asText();
        JsonNode correctNode = pickField(obj, CORRECT_KEYS);
        if (correctNode == null || correctNode.isNull()) {
            slot.isCorrect = Boolean.FALSE;
        } else if (correctNode.isBoolean()) {
            slot.isCorrect = correctNode.booleanValue();
        } else if (correctNode.isNumber()) {
            slot.isCorrect = correctNode.intValue() == 1;
        } else if (correctNode.isTextual()) {
            String txt = correctNode.asText().trim();
            if (txt.isEmpty()) {
                slot.isCorrect = Boolean.FALSE;
            } else if (isTruthy(txt)) {
                slot.isCorrect = Boolean.TRUE;
            } else if (isFalsy(txt)) {
                slot.isCorrect = Boolean.FALSE;
            } else {
                slot.isCorrect = txt.equalsIgnoreCase(slot.content)
                        || (slot.label != null && txt.equalsIgnoreCase(slot.label));
            }
        } else {
            slot.isCorrect = Boolean.FALSE;
        }
        return slot;
    }

    private static boolean isTruthy(String v) {
        return v.equalsIgnoreCase("true") || v.equalsIgnoreCase("yes") || v.equalsIgnoreCase("y")
                || v.equalsIgnoreCase("t") || v.equalsIgnoreCase("correct") || v.equals("1");
    }

    private static boolean isFalsy(String v) {
        return v.equalsIgnoreCase("false") || v.equalsIgnoreCase("no") || v.equalsIgnoreCase("n")
                || v.equalsIgnoreCase("f") || v.equalsIgnoreCase("incorrect") || v.equals("0");
    }

    private static JsonNode firstArrayField(ObjectNode obj, String... names) {
        for (String n : names) {
            JsonNode v = obj.get(n);
            if (v != null && v.isArray()) return v;
        }
        return null;
    }

    private static JsonNode pickField(ObjectNode obj, String... names) {
        for (String n : names) {
            JsonNode v = obj.get(n);
            if (v != null && !v.isNull()) return v;
        }
        return null;
    }

    private static final class AiAnswerSlot {
        String content;
        String label;
        Boolean isCorrect;

        ObjectNode toNode(ObjectNode parent) {
            ObjectNode n = parent.objectNode();
            n.put("content", content == null ? "" : content);
            n.put("isCorrect", Boolean.TRUE.equals(isCorrect));
            return n;
        }
    }

    // =============================================================
    // SANITIZE (unchanged signatures)
    // =============================================================

    public static AiExamParseResponse sanitize(AiExamParseResponse parsed) {
        if (parsed == null) {
            return AiExamParseResponse.empty();
        }
        if (checkMalformedCollapse(parsed.getQuestions())) {
            parsed.setSuccess(false);
            parsed.setCode("PARSER_BLOCK_SEGMENTATION_FAILED");
            parsed.setErrorMessage("PARSER_BLOCK_SEGMENTATION_FAILED");
            parsed.setQuestions(new ArrayList<>());
            return parsed;
        }
        if (parsed.getQuestions() == null) {
            parsed.setQuestions(new ArrayList<>());
        }
        List<AiExamParseResponse.AiQuestionDto> kept = new ArrayList<>();
        for (AiExamParseResponse.AiQuestionDto q : parsed.getQuestions()) {
            if (q == null) continue;
            splitReadingPassageIfPresent(q);
            if (q.getContent() == null || q.getContent().isBlank()) continue;
            if (q.getAnswers() == null) {
                q.setAnswers(new ArrayList<>());
            }
            // Normalize type first so we can skip MCQ rules for non-MCQ formats
            if (q.getType() == null || q.getType().isBlank()) {
                q.setType("MULTIPLE_CHOICE");
            }
            boolean isMcqLike = isMcqLikeType(q.getType());
            for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                if (a.getContent() == null) a.setContent("");
                // Strip option-label prefix from MCQ options if still present
                if (isMcqLike) {
                    a.setContent(stripOptionLabelPrefix(a.getContent()));
                }
                if (a.getIsCorrect() == null) a.setIsCorrect(Boolean.FALSE);
            }
            // MCQ / TRUE_FALSE: enforce exactly one correct answer
            if (isMcqLike) {
                long correctCount = q.getAnswers().stream()
                        .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                        .count();
                if (correctCount == 0 && !q.getAnswers().isEmpty()) {
                    q.getAnswers().get(0).setIsCorrect(Boolean.TRUE);
                } else if (correctCount > 1) {
                    boolean first = true;
                    for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                        if (Boolean.TRUE.equals(a.getIsCorrect())) {
                            if (!first) a.setIsCorrect(Boolean.FALSE);
                            first = false;
                        }
                    }
                }
            }
            if (q.getDifficulty() == null || q.getDifficulty().isBlank()) {
                q.setDifficulty("MEDIUM");
            }
            if (q.getExplanation() == null) {
                q.setExplanation("");
            }
            q.setCategory(normalizeCategoryWithReadingPassage(q.getCategory(), q.getContent(), q.getReadingPassage()));
            kept.add(q);
        }
        parsed.setQuestions(kept);
        return parsed;
     }

    public static void splitReadingPassageIfPresent(AiExamParseResponse.AiQuestionDto q) {
        if (q == null || q.getContent() == null) return;
        String content = q.getContent().trim();

        // If q already has readingPassage/sourcePassage set (set directly by parseBlock),
        // do nothing — the Reading category was already set via getCategoryFromMetadata.
        if ((q.getReadingPassage() != null && !q.getReadingPassage().isBlank()) ||
            (q.getSourcePassage() != null && !q.getSourcePassage().isBlank())) {
            return;
        }

        // Matcher patterns for "Read the passage: <passage>\n\nQuestion: <question>"
        Pattern enRead = Pattern.compile("(?s)^\\s*Read\\s+the\\s+passage\\s*[:\\-]\\s*(.*?)\\s+Question\\s*[:\\-]\\s*(.+)$", Pattern.CASE_INSENSITIVE);
        Pattern enPassage = Pattern.compile("(?s)^\\s*Passage\\s*[:\\-]\\s*(.*?)\\s+Question\\s*[:\\-]\\s*(.+)$", Pattern.CASE_INSENSITIVE);
        Pattern viDoc = Pattern.compile("(?s)^\\s*Đọc\\s+(?:đoạn\\s*văn|bài\\s*đọc)\\s*[:\\-]\\s*(.*?)\\s+Câu\\s+hỏi\\s*[:\\-]\\s*(.+)$", Pattern.CASE_INSENSITIVE);
        // Handle both "Reading Passage: <passage>\n\nQuestion: <question>" AND
        //        "Reading Passage: <passage>\n\n<statement>" (e.g. a True/False statement)
        Pattern jpRead = Pattern.compile("(?s)^\\s*Reading\\s*Passage\\s*[:\\-]\\s*(.+?)\\s+Question\\s*[:\\-]\\s*(.+)$", Pattern.CASE_INSENSITIVE);
        Pattern jpReadStatement = Pattern.compile("(?s)^\\s*Reading\\s*Passage\\s*[:\\-]\\s*(.+?)\\s*\\n\\s*\\n\\s*(.+)$", Pattern.CASE_INSENSITIVE);

        Matcher m = enRead.matcher(content);
        if (m.matches()) {
            q.setReadingPassage(m.group(1).trim());
            q.setSourcePassage(m.group(1).trim());
            q.setContent(m.group(2).trim());
            return;
        }
        m = enPassage.matcher(content);
        if (m.matches()) {
            q.setReadingPassage(m.group(1).trim());
            q.setSourcePassage(m.group(1).trim());
            q.setContent(m.group(2).trim());
            return;
        }
        m = viDoc.matcher(content);
        if (m.matches()) {
            q.setReadingPassage(m.group(1).trim());
            q.setSourcePassage(m.group(1).trim());
            q.setContent(m.group(2).trim());
            return;
        }
        m = jpRead.matcher(content);
        if (m.matches()) {
            q.setReadingPassage(m.group(1).trim());
            q.setSourcePassage(m.group(1).trim());
            q.setContent(m.group(2).trim());
            return;
        }
        // Also handle "Reading Passage: <passage>\n\n<statement>" (e.g. a True/False statement with passage)
        Matcher sm2 = jpReadStatement.matcher(content);
        if (sm2.matches()) {
            q.setReadingPassage(sm2.group(1).trim());
            q.setSourcePassage(sm2.group(1).trim());
            q.setContent(sm2.group(2).trim());
            return;
        }

        // Handle standalone "Reading Passage: <text>" (no "Question:" after it).
        // Only matches when the content is EXACTLY just a passage (no statement/question after).
        // Uses a non-greedy match that stops at the first paragraph break.
        Pattern standalone = Pattern.compile(
                "(?is)^\\s*reading\\s*passage\\s*[:\\-]\\s*(.+?)\\s*\\n\\s*\\n\\s*$",
                Pattern.CASE_INSENSITIVE);
        Matcher sm = standalone.matcher(content);
        if (sm.matches()) {
            q.setReadingPassage(sm.group(1).trim());
            q.setSourcePassage(sm.group(1).trim());
            q.setContent(null);
            return;
        }
    }

    /**
     * Returns true for question types that use MCQ-style multiple-option answers
     * and require exactly one correct answer.
     * FILL_BLANK and SHORT_ANSWER use a direct reference answer instead.
     */
    public static boolean isMcqLikeType(String type) {
        if (type == null) return true; // default to MCQ behaviour
        String upper = type.toUpperCase().trim();
        return !upper.equals("FILL_BLANK") && !upper.equals("SHORT_ANSWER") && !upper.equals("FILL_IN_BLANK");
    }

    public static AiExamParseResponse sanitize(AiExamParseResponse parsed, String targetSkill) {
        if (parsed == null) {
            return AiExamParseResponse.empty();
        }
        if (parsed.getQuestions() == null) {
            parsed.setQuestions(new ArrayList<>());
        }
        String normalizedTargetSkill = parseTargetSkill(targetSkill);
        List<AiExamParseResponse.AiQuestionDto> kept = new ArrayList<>();
        for (AiExamParseResponse.AiQuestionDto q : parsed.getQuestions()) {
            if (q == null) continue;
            if (q.getContent() == null || q.getContent().isBlank()) continue;
            if (q.getAnswers() == null) {
                q.setAnswers(new ArrayList<>());
            }
            for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                if (a.getContent() == null) a.setContent("");
                if (a.getIsCorrect() == null) a.setIsCorrect(Boolean.FALSE);
            }
            long correctCount = q.getAnswers().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                    .count();
            if (correctCount == 0 && !q.getAnswers().isEmpty()) {
                q.getAnswers().get(0).setIsCorrect(Boolean.TRUE);
            } else if (correctCount > 1) {
                boolean first = true;
                for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                    if (Boolean.TRUE.equals(a.getIsCorrect())) {
                        if (!first) a.setIsCorrect(Boolean.FALSE);
                        first = false;
                    }
                }
            }
            if (q.getType() == null || q.getType().isBlank()) {
                q.setType("MULTIPLE_CHOICE");
            }
            if (q.getDifficulty() == null || q.getDifficulty().isBlank()) {
                q.setDifficulty("MEDIUM");
            }
            if (q.getExplanation() == null) {
                q.setExplanation("");
            }
            q.setCategory(normalizeCategoryWithTargetSkill(q.getCategory(), q.getContent(), normalizedTargetSkill));
            kept.add(q);
        }
        parsed.setQuestions(kept);
        return parsed;
    }

    public static AiExamParseResponse sanitizeWithSelectedSkills(AiExamParseResponse parsed, List<String> selectedSkills) {
        if (parsed == null) {
            return AiExamParseResponse.empty();
        }
        if (checkMalformedCollapse(parsed.getQuestions())) {
            parsed.setSuccess(false);
            parsed.setCode("PARSER_BLOCK_SEGMENTATION_FAILED");
            parsed.setErrorMessage("PARSER_BLOCK_SEGMENTATION_FAILED");
            parsed.setQuestions(new ArrayList<>());
            return parsed;
        }
        if (parsed.getQuestions() == null) {
            parsed.setQuestions(new ArrayList<>());
        }
        if (selectedSkills == null || selectedSkills.isEmpty()) {
            return sanitize(parsed);
        }
        List<AiExamParseResponse.AiQuestionDto> kept = new ArrayList<>();
        for (AiExamParseResponse.AiQuestionDto q : parsed.getQuestions()) {
            if (q == null) continue;
            splitReadingPassageIfPresent(q);
            if (q.getContent() == null || q.getContent().isBlank()) continue;
            // Normalize type first (needed for format-aware checks below)
            if (q.getType() == null || q.getType().isBlank()) {
                q.setType("MULTIPLE_CHOICE");
            }
            boolean isMcqLike = isMcqLikeType(q.getType());
            if (q.getAnswers() == null) {
                q.setAnswers(new ArrayList<>());
            }
            // For MCQ-like types, require at least one answer to be present.
            // FILL_BLANK and SHORT_ANSWER may legitimately have zero or one answer entry.
            if (isMcqLike && q.getAnswers().isEmpty()) continue;

            String normalizedCat = normalizeCategoryWithSelectedSkillsList(q, selectedSkills);
            boolean matches = false;
            for (String skill : selectedSkills) {
                if (skill != null && isCompatible(normalizedCat, normalizeCategory(skill))) {
                    matches = true;
                    break;
                }
            }
            if (!matches) {
                String reason = "skill_not_selected";
                if ("unknown".equals(normalizedCat) || normalizedCat == null) {
                    reason = "unknown_skill";
                }
                log.info("[Import] Dropped question: reason={}, category={}, content_prefix={}",
                        reason, normalizedCat, q.getContent() != null ? q.getContent().substring(0, Math.min(40, q.getContent().length())) : "");
                continue;
            }
            q.setCategory(normalizedCat);

            for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                if (a.getContent() == null) a.setContent("");
                // Strip option-label prefix from MCQ options if still present after normalizeRoot
                if (isMcqLike) {
                    a.setContent(stripOptionLabelPrefix(a.getContent()));
                }
                if (a.getIsCorrect() == null) a.setIsCorrect(Boolean.FALSE);
            }
            // MCQ / TRUE_FALSE: enforce exactly one correct answer
            if (isMcqLike) {
                long correctCount = q.getAnswers().stream()
                        .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                        .count();
                if (correctCount == 0 && !q.getAnswers().isEmpty()) {
                    q.getAnswers().get(0).setIsCorrect(Boolean.TRUE);
                } else if (correctCount > 1) {
                    boolean first = true;
                    for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                        if (Boolean.TRUE.equals(a.getIsCorrect())) {
                            if (!first) a.setIsCorrect(Boolean.FALSE);
                            first = false;
                        }
                    }
                }
            }
            if (q.getDifficulty() == null || q.getDifficulty().isBlank()) {
                q.setDifficulty("MEDIUM");
            }
            if (q.getExplanation() == null) {
                q.setExplanation("");
            }
            kept.add(q);
        }
        parsed.setQuestions(kept);
        return parsed;
    }

    private static String normalizeCategoryWithSelectedSkillsList(AiExamParseResponse.AiQuestionDto q, List<String> selectedSkills) {
        if (q == null) return "unknown";
        String category = normalizeCategory(q.getCategory());
        // Force re-inference when the question has a reading passage or reading content,
        // so a mistakenly-set Vocabulary category doesn't override the correct Reading skill.
        if (category == null || q.getReadingPassage() != null || q.getSourcePassage() != null) {
            String inferred = inferCategoryFromQuestionDto(q);
            if (inferred != null) {
                category = inferred;
            }
        }
        if (category == null) {
            category = inferCategorySemantic(q.getContent(), selectedSkills);
        }
        if ("unknown".equals(category) || category == null) {
            if (selectedSkills != null && selectedSkills.size() == 1) {
                String singleSkill = selectedSkills.get(0);
                String norm = normalizeCategory(singleSkill);
                if (norm != null) {
                    category = norm;
                } else {
                    category = "unknown";
                }
            } else {
                category = "unknown";
            }
        }
        return category;
    }

    public static String inferCategoryFromQuestionDto(AiExamParseResponse.AiQuestionDto q) {
        if (q == null) return null;
        String content = q.getContent();
        if (content != null && (content.contains("Reading Passage:") || content.contains("read the passage:") || content.contains("Bài đọc:") || content.contains("文章読解"))) {
            return "Reading";
        }
        // If the question has a readingPassage set (set by parseBlock), it is a
        // Reading question regardless of the raw content label.
        if (q.getReadingPassage() != null && !q.getReadingPassage().isBlank()) {
            return "Reading";
        }
        if (q.getErrorCorrectionMetadata() != null || q.getSentenceWritingMetadata() != null || q.getTranslationMetadata() != null) {
            return "Writing";
        }
        return null;
    }

    private static int countChar(String s, char c) {
        int n = 0;
        for (int i = 0; i < s.length(); i++) if (s.charAt(i) == c) n++;
        return n;
    }

    /**
     * Detect whether the extracted PDF text is unreadable Unicode — typically a
     * PDF that has the expected ASCII question-bank scaffolding
     * (Skill:, Question:, A./B./C./D., Correct answer:) but whose Japanese /
     * Vietnamese / accented content collapsed into {@code ?} because the PDF
     * lacks a ToUnicode CMap or proper embedded font.
     *
     * <p>Conservative — returns {@code true} only when:
     * <ul>
     *   <li>ASCII question-bank markers are present (so we know this is meant
     *       to be a question bank), AND</li>
     *   <li>non-whitespace {@code ?} ratio is high (>= 15%), OR</li>
     *   <li>there are multiple runs of four-or-more consecutive {@code ?}
     *       characters (a strong signal of font fallback).</li>
     * </ul>
     *
     * <p>Plain English text with the occasional {@code ?} at the end of a
     * sentence will not trigger this check.
     *
     * @param text raw extracted PDF text (may be null)
     * @return true when the text strongly suggests a Unicode/font failure
     */
    public static boolean isUnreadableUnicodeText(String text) {
        if (text == null || text.isBlank()) return false;
        int len = text.length();
        if (len < 50) return false;

        // Count non-whitespace question marks vs non-whitespace chars.
        int nonWsTotal = 0;
        int questionMarks = 0;
        for (int i = 0; i < len; i++) {
            char c = text.charAt(i);
            if (c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '　') continue;
            nonWsTotal++;
            if (c == '?') questionMarks++;
        }
        if (nonWsTotal == 0) return false;
        double ratio = (double) questionMarks / nonWsTotal;

        String lower = text.toLowerCase();
        int markerScore = 0;
        if (lower.contains("skill"))      markerScore++;
        if (lower.contains("reading"))    markerScore++;
        if (lower.contains("question"))   markerScore++;
        if (lower.contains("correct"))    markerScore++;
        if (text.contains("A.") || text.contains("A)") || text.contains("A:")) markerScore++;
        if (text.contains("B.") || text.contains("B)") || text.contains("B:")) markerScore++;
        if (text.contains("C.") || text.contains("C)") || text.contains("C:")) markerScore++;
        if (text.contains("D.") || text.contains("D)") || text.contains("D:")) markerScore++;

        // Strong signal: 4+ consecutive ? — likely font fallback, not a real question mark
        int quadRunCount = 0;
        int run = 0;
        for (int i = 0; i < len; i++) {
            char c = text.charAt(i);
            if (c == '?') {
                run++;
                if (run >= 4) quadRunCount++;
            } else {
                run = 0;
            }
        }

        // Question bank marker present?
        boolean hasQuestionBankShape = markerScore >= 4;

        if (!hasQuestionBankShape) {
            // Without question-bank markers we cannot conclude anything from ? ratio.
            return false;
        }

        // Trigger conditions (either):
        // (a) question-mark ratio >= 15% of non-whitespace chars, OR
        // (b) at least 3 runs of 4+ consecutive ? chars (very strong signal).
        return ratio >= 0.15d || quadRunCount >= 3;
    }

    /**
     * Returns a short, user-friendly message explaining that the PDF's
     * Unicode text could not be read by the text extractor.
     */
    public static String unreadableUnicodeUserMessage() {
        return "Japanese text in this PDF could not be read correctly. "
                + "Please export the PDF again with embedded Unicode fonts, "
                + "or upload a text-based PDF with searchable Japanese text.";
    }

    /**
     * Take a single 200-char logging summary (NO full extractedText).
     * Public so the controller package can call it.
     */
    public static String summarizeForUnreadableLog(String filename, String text) {
        if (text == null) text = "";
        int nonWsTotal = 0;
        int questionMarks = 0;
        int run = 0;
        int quadRuns = 0;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '　') continue;
            nonWsTotal++;
            if (c == '?') {
                questionMarks++;
                run++;
                if (run >= 4) quadRuns++;
            } else {
                run = 0;
            }
        }
        double ratio = nonWsTotal > 0 ? (double) questionMarks / nonWsTotal : 0d;
        int questionMarkers = countOccurrences(text, "Question");
        int correctMarkers  = countOccurrences(text.toLowerCase(), "correct answer")
                + countOccurrences(text, "正解") + countOccurrences(text, "答え");
        int aCount = countOccurrences(text, "A.") + countOccurrences(text, "A)") + countOccurrences(text, "A:");
        return String.format(
                "file=%s, extractedTextLength=%d, questionMarkRatio=%.3f, quadRuns=%d, "
                        + "questionMarkers=%d, correctMarkers=%d, aMarkers=%d",
                filename, text.length(), ratio, quadRuns, questionMarkers, correctMarkers, aCount);
    }

    private static int countOccurrences(String text, String substring) {
        if (text == null || substring == null) return 0;
        int count = 0;
        int idx = 0;
        while ((idx = text.indexOf(substring, idx)) != -1) {
            count++;
            idx += substring.length();
        }
        return count;
    }

    // =============================================================
    // EVIDENCE VALIDATION (PHẦN 4: soft validation + Reading support)
    // =============================================================

    /**
     * Result of evidence validation for a single parsed question.
     */
    public static final class EvidenceCheck {
        public final boolean valid;
        public final String reason;

        private EvidenceCheck(boolean valid, String reason) {
            this.valid = valid;
            this.reason = reason;
        }

        public static EvidenceCheck ok() {
            return new EvidenceCheck(true, "");
        }

        public static EvidenceCheck fail(String reason) {
            return new EvidenceCheck(false, reason);
        }
    }

    /**
     * Verify a parsed question actually came from the PDF.
     *
     * <p>Soft validation strategy:
     * <ul>
     *   <li>For Reading questions: passage OR (question text OR >=2 options) must match source.
     *   <li>For non-Reading questions: question text OR >=2 options must match.
     *   <li>The correct-answer option must appear in source or have inline marker.
     * </ul>
     *
     * <p>Uses {@link #normalizeForEvidence(String)} for comparison which handles
     * NFKC, Japanese spacing artifacts, and fullwidth punctuation.
     */
    public static EvidenceCheck validateAgainstSource(
            AiExamParseResponse.AiQuestionDto q,
            String extractedText) {

        if (q == null) return EvidenceCheck.fail("null question");
        if (extractedText == null || extractedText.isBlank()) {
            return EvidenceCheck.fail("empty source text");
        }
        String src = normalizeForEvidence(extractedText);
        String content = q.getContent() == null ? "" : q.getContent().trim();
        if (content.isEmpty()) {
            return EvidenceCheck.fail("blank question content");
        }

        String typeUpper = q.getType() != null ? q.getType().toUpperCase().trim() : "MULTIPLE_CHOICE";
        boolean isFillBlank = typeUpper.equals("FILL_BLANK") || typeUpper.equals("FILL_IN_BLANK");
        boolean isShortAnswer = typeUpper.equals("SHORT_ANSWER");
        boolean isTrueFalse = typeUpper.equals("TRUE_FALSE");
        boolean isNonMcq = isFillBlank || isShortAnswer;

        String cat = q.getCategory() != null ? q.getCategory().toLowerCase() : "";
        boolean isReading = cat.contains("read");

        // 1. Question text must appear in source
        if (isReading) {
            // Reading: try to find passage substring in source
            if (!passageMatchesSource(content, src)) {
                // Fallback: question text or options must match
                if (!contentAppearsInSourceSoft(content, src)) {
                    if (!readingOptionsMatchSource(q, src)) {
                        return EvidenceCheck.fail(
                                "reading: neither passage nor question/options found in source PDF");
                    }
                }
            }
        } else {
            // Non-Reading: question text must appear
            if (!contentAppearsInSourceSoft(content, src)) {
                return EvidenceCheck.fail("question text not found in source PDF");
            }
        }

        // 2. For FILL_BLANK / SHORT_ANSWER: only need the single correct answer in source
        List<AiExamParseResponse.AiAnswerDto> answers = q.getAnswers();
        if (isNonMcq) {
            // Accept if there's at least one answer entry whose content appears in source
            if (answers == null || answers.isEmpty()) {
                // No answers array at all — accept if question text was found above (already passed)
                return EvidenceCheck.ok();
            }
            for (AiExamParseResponse.AiAnswerDto a : answers) {
                String ac = a == null || a.getContent() == null ? "" : a.getContent().trim();
                if (ac.isEmpty()) continue;
                String acNorm = normalizeForEvidence(ac);
                if (acNorm.isEmpty()) continue;
                if (src.contains(acNorm) || textAppearsInSourceSoft(acNorm, src)) {
                    return EvidenceCheck.ok();
                }
            }
            // Correct answer not found in source — still accept if we already matched question text
            // (reference answer may have been generated; be lenient for fill_blank/short_answer)
            return EvidenceCheck.ok();
        }

        // 3. MCQ / TRUE_FALSE: at least 2 options must appear in the source.
        //    For TRUE_FALSE with only 2 options (True/False), require at least 1.
        if (answers == null || answers.isEmpty()) {
            return EvidenceCheck.fail("no answers");
        }
        int requiredMatches = isTrueFalse ? 1 : 2;
        int matchedOptions = 0;
        for (AiExamParseResponse.AiAnswerDto a : answers) {
            String ac = a == null || a.getContent() == null ? "" : a.getContent().trim();
            if (ac.isEmpty()) continue;
            // Normalize for evidence check (handles NFKC, Japanese spacing)
            String acNorm = normalizeForEvidence(ac);
            if (acNorm.isEmpty()) continue;
            if (src.contains(acNorm)) {
                matchedOptions++;
            } else {
                // Try prefix match for long options (like for question text)
                if (textAppearsInSourceSoft(acNorm, src)) {
                    matchedOptions++;
                }
            }
        }
        if (matchedOptions < requiredMatches) {
            return EvidenceCheck.fail(
                    "only " + matchedOptions + " option(s) matched in source (need >=" + requiredMatches + ")");
        }

        // 3. The marked-correct option must be supported by evidence.
        AiExamParseResponse.AiAnswerDto correct = answers.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .findFirst()
                .orElse(null);
        if (correct == null) {
            return EvidenceCheck.fail("no isCorrect=true option");
        }
        String correctContent = correct.getContent() == null ? "" : correct.getContent().trim();
        if (correctContent.isEmpty()) {
            return EvidenceCheck.fail("correct option has blank content");
        }

        // Inline markers: Correct answer: A / Answer: B / Đáp án: C / 正解: D / 答え: D
        Pattern correctInline = Pattern.compile(
                "(?im)^\\s*(?:Correct\\s*(?:answer)?|Answer|Đáp\\s*án|正解|答え)\\s*[:.]?\\s*(.+)$");
        Matcher m = correctInline.matcher(extractedText);
        while (m.find()) {
            String correctMarker = m.group(1).trim();
            String optionLabel = labelForOption(correct);
            String normalizedMarker = normalizeAsciiLowercase(correctMarker);
            String normalizedContent = normalizeAsciiLowercase(correctContent);
            if (optionLabel != null && normalizedMarker.equals(optionLabel.toLowerCase())) {
                return EvidenceCheck.ok();
            }
            if (!normalizedContent.isEmpty() && normalizedMarker.contains(normalizedContent)) {
                return EvidenceCheck.ok();
            }
            // Letter match
            String letter = normalizeAsciiLowercase(correctMarker);
            if (letter.length() == 1 && letter.matches("[a-d]")) {
                String myLetter = normalizeAsciiLowercase(correctContent);
                if (myLetter.length() == 1 && letter.equals(myLetter)) {
                    return EvidenceCheck.ok();
                }
            }
            // Japanese hiragana number: 一、二、三、四 → 1,2,3,4
            if (correctMarker.matches("\\s*[一二三四]\\s*")) {
                return EvidenceCheck.ok();
            }
        }

        // Trailing answer-key block
        Pattern keyHeader = Pattern.compile(
                "(?im)^\\s*(?:Answer\\s*Key|Đáp\\s*án|Answers?|正解|答え)\\s*[:.]?\\s*$");
        Matcher h = keyHeader.matcher(extractedText);
        if (h.find()) {
            return EvidenceCheck.ok();
        }

        // Correct answer content must appear in source
        String correctNorm = normalizeForEvidence(correctContent);
        if (!src.contains(correctNorm) && !textAppearsInSourceSoft(correctNorm, src)) {
            return EvidenceCheck.fail("correct option not found in source PDF");
        }

        return EvidenceCheck.ok();
    }

    /**
     * Check if a Reading passage substring appears in the source.
     * Uses soft matching: exact contains, then tries substrings.
     */
    private static boolean passageMatchesSource(String content, String src) {
        // Extract passage from content patterns:
        // "Read the passage: <passage>\n\nQuestion:"
        // "Reading Passage:\n<passage>\n\nQuestion:"
        // "Passage: <passage>\n\n<numbered question>"

        // Try to find a passage block in the content
        String passage = extractPassageFromContent(content);
        if (passage == null || passage.isEmpty()) {
            return false;
        }

        String passageNorm = normalizeForEvidence(passage);
        if (passageNorm.isEmpty()) return false;

        // Try exact
        if (src.contains(passageNorm)) return true;

        // Try sliding windows from passage start (passages can be 50-200+ chars)
        int maxLen = Math.min(passageNorm.length(), 120);
        for (int len = maxLen; len >= 30; len -= 10) {
            String window = passageNorm.substring(0, len);
            if (src.contains(window)) return true;
        }

        // Try sliding windows from passage end (in case start is truncated)
        int endMaxLen = Math.min(passageNorm.length(), 80);
        for (int len = endMaxLen; len >= 30; len -= 10) {
            int start = passageNorm.length() - len;
            String window = passageNorm.substring(start);
            if (src.contains(window)) return true;
        }

        return false;
    }

    /**
     * Extract passage text from a Reading question content string.
     */
    private static String extractPassageFromContent(String content) {
        if (content == null || content.isEmpty()) return null;

        // Pattern 1: "Read the passage: <passage>\n\nQuestion:"
        Pattern p1 = Pattern.compile(
                "(?is)read\\s*the\\s*passage[:\\s]*(.+?)\\n{1,2}\\s*question",
                Pattern.CASE_INSENSITIVE);
        Matcher m1 = p1.matcher(content);
        if (m1.find()) return m1.group(1).trim();

        // Pattern 2: "Reading Passage:\n<passage>\n\n<number>"
        Pattern p2 = Pattern.compile(
                "(?is)reading\\s*passage[:\\s]*\\n*(.+?)\\n{1,2}\\s*\\d",
                Pattern.CASE_INSENSITIVE);
        Matcher m2 = p2.matcher(content);
        if (m2.find()) return m2.group(1).trim();

        // Pattern 3: "Passage:\n<passage>\n\n<number>"
        Pattern p3 = Pattern.compile(
                "(?is)passage[:\\s]*\\n*(.+?)\\n{1,2}\\s*\\d");
        Matcher m3 = p3.matcher(content);
        if (m3.find()) return m3.group(1).trim();

        // Pattern 4: "本文:\n<passage>\n\nQuestion:"
        Pattern p4 = Pattern.compile(
                "(?is)本文[:\\s]*\\n*(.+?)\\n{1,2}\\s*(?:question|問題|質問)",
                Pattern.CASE_INSENSITIVE);
        Matcher m4 = p4.matcher(content);
        if (m4.find()) return m4.group(1).trim();

        // Pattern 5: long Japanese text followed by numbered questions
        // If the content starts with a long Japanese block (no explicit marker),
        // take it as passage
        Pattern p5 = Pattern.compile(
                "(?s)(^[\\u3040-\\u309F\\u30A0-\\u30FF\\u4E00-\\u9FFF].+?)\\n{1,2}\\s*\\d[.):]",
                Pattern.CASE_INSENSITIVE);
        Matcher m5 = p5.matcher(content);
        if (m5.find()) {
            String candidate = m5.group(1).trim();
            if (candidate.length() >= 20) return candidate;
        }

        return null;
    }

    /**
     * For Reading questions: check if at least 2 answer options match source.
     */
    private static boolean readingOptionsMatchSource(AiExamParseResponse.AiQuestionDto q, String src) {
        List<AiExamParseResponse.AiAnswerDto> answers = q.getAnswers();
        if (answers == null || answers.isEmpty()) return false;
        int matched = 0;
        for (AiExamParseResponse.AiAnswerDto a : answers) {
            String ac = a == null || a.getContent() == null ? "" : a.getContent().trim();
            if (ac.isEmpty()) continue;
            String acNorm = normalizeForEvidence(ac);
            if (acNorm.isEmpty()) continue;
            if (src.contains(acNorm) || textAppearsInSourceSoft(acNorm, src)) {
                matched++;
            }
            if (matched >= 2) return true;
        }
        return matched >= 2;
    }

    private static String labelForOption(AiExamParseResponse.AiAnswerDto a) {
        if (a == null || a.getContent() == null) return null;
        String c = a.getContent().trim();
        if (c.length() >= 2) {
            char first = c.charAt(0);
            // ASCII A-D
            if ((first >= 'A' && first <= 'D') || (first >= 'a' && first <= 'd')) {
                char sep = c.charAt(1);
                if (sep == '.' || sep == ')' || sep == ':') {
                    return String.valueOf(first).toUpperCase();
                }
            }
            // Fullwidth Ａ－Ｄ
            if (first >= 'Ａ' && first <= 'Ｄ') {
                char sep = c.charAt(1);
                if (sep == '.' || sep == ')' || sep == ':') {
                    return String.valueOf((char) (first - 'Ａ' + 'A'));
                }
            }
        }
        return null;
    }

    /**
     * Filter a parsed response by removing any question that fails the
     * evidence check against the source text.
     */
    public static AiExamParseResponse filterByEvidence(
            AiExamParseResponse parsed,
            String extractedText,
            String filenameForLog) {

        if (parsed == null) return AiExamParseResponse.empty();
        List<AiExamParseResponse.AiQuestionDto> original =
                parsed.getQuestions() != null ? parsed.getQuestions() : java.util.Collections.emptyList();
        List<AiExamParseResponse.AiQuestionDto> kept = new ArrayList<>();
        int idx = 0;
        for (AiExamParseResponse.AiQuestionDto q : original) {
            EvidenceCheck check = validateAgainstSource(q, extractedText);
            if (check.valid) {
                kept.add(q);
            } else {
                String skill = q == null || q.getCategory() == null ? "(unknown)" : q.getCategory();
                logEvidenceDrop(filenameForLog, skill, idx, check.reason);
            }
            idx++;
        }
        parsed.setQuestions(kept);
        return parsed;
    }

    private static void logEvidenceDrop(
            String filenameForLog,
            String skill,
            int index,
            String reason) {
        String file = filenameForLog != null ? filenameForLog : "(unknown)";
        String safeSkill = (skill == null || skill.isBlank()) ? "(unknown)" : skill;
        log.warn("Dropped AI PDF question without source evidence: file={}, skill={}, index={}, reason={}",
                file, safeSkill, index, reason);
    }

    // =============================================================
    // CATEGORY NORMALIZATION (unchanged)
    // =============================================================

    public static String normalizeCategory(String rawCategory, String questionContent) {
        return normalizeCategoryWithTargetSkill(rawCategory, questionContent, null);
    }

    public static String normalizeCategoryWithReadingPassage(String rawCategory, String questionContent, String readingPassage) {
        // If readingPassage is set (from parseBlock for Reading questions), the answer is
        // unambiguously Reading. This handles questions whose content doesn't contain
        // "Read the passage:" but still belong to the Reading section.
        // This takes priority over any other category inference.
        if (readingPassage != null && !readingPassage.isBlank()) {
            return "Reading";
        }
        String category = normalizeCategory(rawCategory);
        if (category == null) {
            category = inferCategorySemantic(questionContent, null);
        }
        return category;
    }

    public static String normalizeCategoryWithTargetSkill(String rawCategory, String questionContent, String targetSkill) {
        String category = normalizeCategory(rawCategory);
        if (category == null && targetSkill != null && !targetSkill.isBlank()) {
            category = normalizeCategory(targetSkill);
        }
        if (category == null) {
            List<String> selectedSkills = targetSkill != null ? List.of(targetSkill) : null;
            category = inferCategorySemantic(questionContent, selectedSkills);
        }
        return category;
    }

    public static String parseTargetSkill(String targetSkill) {
        if (targetSkill == null || targetSkill.isBlank()) {
            return null;
        }
        String lc = targetSkill.toLowerCase().trim();
        switch (lc) {
            case "auto":
            case "detect":
                return null;
            case "vocabulary":
            case "vocab":
            case "word":
            case "meaning":
                return "Vocabulary";
            case "grammar":
            case "pattern":
            case "structure":
                return "Grammar";
            case "reading":
            case "reading_comprehension":
            case "passage":
            case "text":
            case "comprehension":
                return "Reading";
            default:
                return null;
        }
    }

    public static String normalizeCategory(String rawCategory) {
        if (rawCategory == null || rawCategory.isBlank()) {
            return null;
        }
        String lc = rawCategory.trim().toLowerCase();
        switch (lc) {
            case "vocabulary":
            case "vocab":
            case "word":
            case "words":
            case "lexical":
                return "Vocabulary";
            case "grammar":
            case "pattern":
            case "structure":
            case "particle":
            case "conjugation":
                return "Grammar";
            case "reading":
            case "reading comprehension":
            case "comprehension":
            case "passage":
            case "text":
                return "Reading";
            case "writing":
                return "Writing";
            case "sentence writing":
            case "sentence_writing":
                return "Sentence Writing";
            case "kanji":
            case "character":
                return "Kanji";
            case "listening":
            case "audio comprehension":
                return "Listening";
            case "translation":
            case "translate":
                return "Translation";
            case "error correction":
            case "error_correction":
            case "correction":
                return "Error Correction";
            default:
                return null;
        }
    }

    public static boolean isCompatible(String category, String skill) {
        if (category == null || skill == null) return false;
        if (category.equals(skill)) return true;

        // Writing skill allows Translation, Sentence Writing, Error Correction
        if (skill.equals("Writing") &&
            (category.equals("Translation") || category.equals("Sentence Writing") || category.equals("Error Correction"))) {
            return true;
        }
        // Grammar skill allows Error Correction, Translation, Sentence Writing
        if (skill.equals("Grammar") &&
            (category.equals("Error Correction") || category.equals("Translation") || category.equals("Sentence Writing"))) {
            return true;
        }
        // Vocabulary skill allows Translation
        if (skill.equals("Vocabulary") && category.equals("Translation")) {
            return true;
        }
        return false;
    }

    public static String inferCategorySemantic(String content) {
        return inferCategorySemantic(content, (java.util.Collection<String>) null);
    }

    private static String getFallbackCategory(java.util.Collection<String> allowedSkills) {
        if (allowedSkills != null && !allowedSkills.isEmpty()) {
            if (allowedSkills.size() == 1) {
                String singleSkill = allowedSkills.iterator().next();
                if (singleSkill != null && !singleSkill.isBlank()) {
                    String norm = normalizeCategory(singleSkill);
                    return norm != null ? norm : "Vocabulary";
                }
            }
            return "unknown";
        }
        return "Vocabulary";
    }

    public static String inferCategorySemantic(String content, java.util.Collection<String> allowedSkills) {
        if (content == null || content.isBlank()) {
            return getFallbackCategory(allowedSkills);
        }
        String c = content.toLowerCase();

        // 1. Reading
        if (containsAny(c,
                "read the passage", "read the dialogue", "read the text",
                "according to the passage", "based on the text", "based on the passage",
                "according to the text", "the passage states", "the passage says", "the text implies",
                "main idea of the passage", "main idea of the text",
                "can be inferred from the passage", "can be inferred from the text",
                "what can be inferred", "the author suggests",
                "passage comprehension", "text comprehension", "reading comprehension",
                "đọc đoạn văn", "đọc bài đọc", "đọc hiểu",
                "theo bài đọc", "theo đoạn văn", "theo passage",
                "dựa vào bài đọc", "dựa vào đoạn văn",
                "ý chính của đoạn văn", "ý chính của bài đọc",
                "đoạn văn sau", "bài đọc sau",
                "trả lời câu hỏi theo bài đọc", "trả lời theo bài đọc",
                "bài đọc ghi", "passage ghi",
                "passage", "paragraph", "main idea", "comprehension", "according to the text", "inference from passage",
                "文章読解", "読解", "本文", "文章の内容",
                // MUST come before Vocabulary inference: "reading" keyword in Vocabulary catches these
                "reading passage:", "reading passage :", "reading passage -",
                "reading passage", "bài đọc:", "đoạn đọc:")) {
            return "Reading";
        }

        // Check if new categories are allowed in allowedSkills or if we should fallback/coerce
        boolean allowAll = allowedSkills != null && !allowedSkills.isEmpty();
        boolean allowWriting = allowAll || (allowedSkills != null && allowedSkills.contains("Writing"));
        boolean allowErrorCorrection = allowAll || (allowedSkills != null && allowedSkills.contains("Error Correction"));
        boolean allowSentenceWriting = allowAll || (allowedSkills != null && allowedSkills.contains("Sentence Writing"));
        boolean allowTranslation = allowAll || (allowedSkills != null && allowedSkills.contains("Translation"));
        boolean allowListening = allowAll || (allowedSkills != null && allowedSkills.contains("Listening"));
        boolean allowKanji = allowAll || (allowedSkills != null && allowedSkills.contains("Kanji"));
        boolean allowVocabulary = allowAll || (allowedSkills != null && allowedSkills.contains("Vocabulary"));

        // 2. Error Correction
        if (containsAny(c,
                "find the error", "correct the sentence", "incorrect part",
                "tìm lỗi sai", "sửa lỗi sai", "lỗi sai")) {
            if (allowErrorCorrection || allowWriting) {
                return "Error Correction";
            } else {
                return "Grammar"; // Fall back to Grammar for legacy
            }
        }

        // 3. Sentence Writing
        if (containsAny(c,
                "create a sentence", "write a sentence using", "sentence composition",
                "viết câu sử dụng", "đặt câu với")) {
            if (allowSentenceWriting || allowWriting) {
                return "Sentence Writing";
            } else {
                return "Vocabulary"; // Fall back to Vocabulary for legacy
            }
        }

        // 4. Writing
        if (containsAny(c,
                "write a sentence", "compose", "answer in japanese",
                "reorder words", "sentence construction",
                "viết câu", "đặt câu", "sắp xếp từ")) {
            if (allowWriting) {
                return "Writing";
            } else {
                return "Vocabulary"; // Fall back to Vocabulary for legacy
            }
        }

        // 5. Translation
        if (containsAny(c,
                "translate into japanese", "translate into vietnamese", "translation",
                "dịch sang", "dịch câu", "dịch")) {
            if (allowTranslation || allowWriting || allowVocabulary) {
                if (allowedSkills != null && (allowedSkills.contains("Writing") || allowedSkills.contains("Translation"))) {
                    return "Translation";
                }
                return "Vocabulary";
            } else {
                return "Vocabulary";
            }
        }

        // 6. Listening
        if (containsAny(c,
                "audio", "listen", "speaker", "conversation", "recording",
                "nghe", "đoạn hội thoại", "bài nghe")) {
            if (allowListening) {
                return "Listening";
            } else {
                return "Vocabulary";
            }
        }

        // 7. Kanji
        if (containsAny(c,
                "kanji reading", "character meaning", "choose the kanji",
                "onyomi", "kunyomi", "chữ hán", "âm hán", "cách đọc kanji", "kanji")) {
            if (allowKanji) {
                return "Kanji";
            } else {
                return "Vocabulary";
            }
        }

        // 8. Grammar
        if (containsAny(c, "trong câu", "in the sentence", "in sentence")
                && (containsAny(c, "biểu thị", "indicate", "means", "nghĩa", "dùng", "chức năng", "express", "function"))) {
            return "Grammar";
        }
        if (containsAny(c, "difference between") && (containsAny(c, "は", "が", "に", "で", "を", "と", "も") || containsAny(c, "particle", "particles"))) {
            return "Grammar";
        }
        if (containsAny(c,
                "particle", "particles", "trợ từ", "ngữ pháp", "mẫu câu", "mẫu", "cấu trúc",
                "pattern", "sentence pattern", "sentence ending", "sentence structure",
                "dùng để", "cách dùng", "dùng như thế nào", "dùng ra sao",
                "used to", "how to use", "usage of",
                "conjugation", "conjugations", "chia thể", "liên từ", "giới từ",
                "dùng để nói gì", "biểu thị", "diễn đạt", "express",
                "what does the particle", "what does the sentence ending",
                "usually express", "used to express", "verb forms", "verb form", "ending", "endings",
                "ています", "ている", "たいです", "たい", "てください", "ませんか", "ましょう", "てみる", "〜")) {
            return "Grammar";
        }

        // 9. Vocabulary
        if (containsAny(c,
                "nghĩa là gì", "nghĩa tiếng việt", "có nghĩa là", "có nghĩa",
                "what is the meaning", "meaning of", "cách đọc", "romaji", "pronunciation",
                "word meaning", "synonym", "antonym", "word choice", "synonyms", "antonyms",
                "correct reading", "reading of",
                "word for", "japanese word", "fill in the blank", "fill in", "điền vào chỗ trống", "chỗ trống", "blank",
                "読み方", "読み", "意味", "どの意味", "どういう意味", "正しい読み方")
                || (c.contains("what does") && !c.contains("be inferred"))
                || (c.contains("japanese word for"))
                || (c.contains("「") && (c.contains("mean") || c.contains("nghĩa")))) {
            return "Vocabulary";
        }

        return getFallbackCategory(allowedSkills);
    }

    private static boolean containsAny(String text, String... keywords) {
        String lowerText = text.toLowerCase();
        for (String kw : keywords) {
            if (lowerText.contains(kw.toLowerCase())) return true;
        }
        return false;
    }

    // =============================================================
    // GENERATE-FROM-CONTENT SANITIZATION
    // Defense in depth for AI-generated quiz questions: re-infer category,
    // drop off-skill questions, drop duplicate options, drop romaji tokens,
    // drop questions with 0 or >1 correct answer.
    // =============================================================

    /**
     * Romaji tokens that should NEVER appear in a Japanese-learning quiz
     * question/option/explanation when the content is Japanese. Matched
     * case-insensitively as whole words (or hyphenated forms).
     *
     * <p>These cover the most common false-romaji the AI injects:
     * <ul>
     *   <li>Honorifics: -san, -kun, -chan, -sensei, -sama</li>
     *   <li>Common nouns: Tanaka, Tanaka-san, toshokan, eki, ie, resutoran,
     *       gakusei, sensei, shukudai, benkyou, gakkou, etc.</li>
     *   <li>Particles-as-words: de, wa, ga, wo, ni, ha (lowercase, standalone)</li>
     * </ul>
     */
    private static final Pattern ROMAJI_TOKEN = Pattern.compile(
            "(?i)(?<![A-Za-z])(" +
                    "tanaka|suzuki|satou|sato|saito|yamada|takahashi|watanabe|ito|kobayashi|kato|kato|tanaka-san|"
                    + "honorifics|surname|place|noun" +
                    "tok|" +
                    "gakusei|gakusei-san|seito|kyouju|buchou|shachou|tenchou|" +
                    "tomodachi|toshokan|resutoran|ie|eki|gakkou|gakko|" +
                    "benkyou|benkyo|shukudai|syukudai|sensei|okaasan|otousan|" +
                    "kyoudai|imaudon|kudamono|sakana|taiyou|getsuyoubi|" +
                    "nani|naze|doko|itsu|dare|donata|doushite|naze|ikutsu" +
                    ")s?(?![A-Za-z])"
    );

    // Strip honorific suffix variants (-san, -kun, -chan, -sama, -sensei)
    private static final Pattern ROMAJI_HONORIFIC = Pattern.compile(
            "(?i)\\b[a-z]+(?:-(?:san|kun|chan|sama|sensei))\\b"
    );

    // Bare Latinized Japanese first names (Tanaka, Yuki, Ken, …) only flagged
    // when the question ALSO contains CJK characters — proves this is a
    // Japanese-content question where the bare Latin name should have been
    // kanji/kana (e.g. 田中さん). Catches the case where the AI writes
    // "Tanaka" instead of 田中さん.
    private static final Pattern CJK_CHAR = Pattern.compile("[\\u3040-\\u30FF\\u4E00-\\u9FFF]");
    private static final Pattern ROMAJI_NAME_BARE = Pattern.compile(
            "(?i)(?<![a-z])\\b(tanaka|suzuki|satou|sato|yamada|takahashi|watanabe|ito|kobayashi|kato|hanako|taro|jiro|sakura|akira|ken|naoki|hiroshi|sachiko)\\b(?!\\s*-?\\s*san\\b)"
    );

    /**
     * Returns true when the given text contains romaji tokens that should
     * have been written in Japanese (kana / kanji). Used by the generate
     * sanitizer to drop questions that would teach learners romaji instead
     * of real Japanese.
     *
     * <p>The check is conservative: it matches whole-word tokens from the
     * curated list above plus the honorific-suffix pattern. For bare
     * Latinized names we also require the text to contain at least one
     * CJK / kana / kanji character so that unrelated English content
     * (e.g. a sentence about "Akira the movie") is not dropped.
     */
    public static boolean containsRomaji(String text) {
        if (text == null || text.isBlank()) return false;
        String trimmed = text.trim();
        if (ROMAJI_TOKEN.matcher(trimmed).find()) return true;
        if (ROMAJI_HONORIFIC.matcher(trimmed).find()) return true;
        if (ROMAJI_NAME_BARE.matcher(trimmed).find()
                && CJK_CHAR.matcher(trimmed).find()) return true;
        return false;
    }

    public static String findRomajiViolationToken(String text) {
        if (text == null || text.isBlank()) return null;
        String trimmed = text.trim();
        java.util.regex.Matcher m = ROMAJI_TOKEN.matcher(trimmed);
        if (m.find()) {
            return m.group();
        }
        m = ROMAJI_HONORIFIC.matcher(trimmed);
        if (m.find()) {
            return m.group();
        }
        if (CJK_CHAR.matcher(trimmed).find()) {
            m = ROMAJI_NAME_BARE.matcher(trimmed);
            if (m.find()) {
                return m.group();
            }
        }
        return null;
    }

    private static boolean checkFieldRomaji(String fieldName, String fieldValue) {
        if (fieldValue == null || fieldValue.isBlank()) return false;
        String token = findRomajiViolationToken(fieldValue);
        if (token != null) {
            String excerpt = fieldValue.length() > 60 ? fieldValue.substring(0, 60) + "..." : fieldValue;
            log.info("romaji_content field={} token=\"{}\" excerpt=\"{}\"",
                     fieldName, token, excerpt.replace("\n", " "));
            return true;
        }
        return false;
    }

    public static boolean checkRomajiContent(AiExamParseResponse.AiQuestionDto q, String finalCategory) {
        if (q == null) return false;
        boolean isReading = finalCategory != null && "reading".equalsIgnoreCase(finalCategory.trim());

        // 1. Question text field
        String content = q.getContent() == null ? "" : q.getContent();
        String questionText;
        if (isReading) {
            String lowerContent = content.toLowerCase(java.util.Locale.ENGLISH);
            if (lowerContent.contains("read the passage")
                    || lowerContent.contains("reading passage")
                    || content.contains("本文") || content.contains("文章")) {
                int qIdx = content.lastIndexOf("Question:");
                if (qIdx < 0) qIdx = content.lastIndexOf("question:");
                if (qIdx >= 0 && qIdx < content.length() - 9) {
                    questionText = content.substring(qIdx + "Question:".length()).trim();
                } else {
                    String[] splitParts = splitQuestionContentForReading(content);
                    questionText = (splitParts[0] != null) ? splitParts[1] : content;
                }
            } else {
                questionText = content;
            }
        } else {
            questionText = content;
        }

        if (checkFieldRomaji("questionText", questionText)) {
            return true;
        }

        // 2. Options / Answers
        if (q.getAnswers() != null) {
            int idx = 0;
            for (var a : q.getAnswers()) {
                if (a != null && a.getContent() != null) {
                    if (checkFieldRomaji("option_" + idx, a.getContent())) {
                        return true;
                    }
                }
                idx++;
            }
        }

        // 3. Explanation (only check if NOT a READING question)
        if (!isReading) {
            if (checkFieldRomaji("explanation", q.getExplanation())) {
                return true;
            }
        }

        return false;
    }

    /**
     * Extracts only the answerable fields of a question for romaji validation.
     *
     * <p>For Reading questions the full {@code q.getContent()} contains the
     * entire reading passage (e.g. "Read the passage:\nMIDORI - JLPT N5 ...
     * Passage 1 - Morning routine ..."). That passage may legitimately contain
     * English metadata tokens ("MIDORI", "JLPT", "Passage", "Reference") that
     * would cause false-positive {@code romaji_content} rejections.
     *
     * <p>This method strips the passage portion and returns only the
     * question-only part of the content (the part after "Question: ") together
     * with the option texts and the explanation. These fields are AI-generated
     * answerable content and must not contain romaji.
     *
     * @param q the question DTO
     * @return a string containing only the fields that must be romaji-free
     */
    public static String extractAnswerableFieldsForRomajiCheck(
            AiExamParseResponse.AiQuestionDto q) {
        if (q == null) return "";
        StringBuilder sb = new StringBuilder();

        // For the question content: if it looks like a reading-format question
        // (contains "Read the passage:") extract only the question-only part.
        // This avoids false-positive romaji rejections caused by English metadata
        // in the PDF source passage ("MIDORI", "JLPT", "Passage N - ...", etc.)
        String content = q.getContent() == null ? "" : q.getContent();
        String questionOnly;
        String lowerContent = content.toLowerCase(java.util.Locale.ENGLISH);
        if (lowerContent.contains("read the passage")
                || lowerContent.contains("reading passage")
                || content.contains("本文") || content.contains("文章")) {
            // Find the last occurrence of "Question:" or "question:" which marks
            // where the actual answerable question text begins (after the passage).
            // We use the last occurrence to handle cases where "question" also
            // appears inside the passage text (e.g., "Reference question").
            int qIdx = content.lastIndexOf("Question:");
            if (qIdx < 0) qIdx = content.lastIndexOf("question:");
            if (qIdx >= 0 && qIdx < content.length() - 9) {
                // Extract only the text after "Question:" as the answerable part
                questionOnly = content.substring(qIdx + "Question:".length()).trim();
            } else {
                // No "Question:" marker found — try using splitQuestionContentForReading
                // as a fallback; if it can split, use the question part only.
                String[] splitParts = splitQuestionContentForReading(content);
                questionOnly = (splitParts[0] != null) ? splitParts[1] : content;
            }
        } else {
            // Not a reading question — use the full content for the romaji check.
            questionOnly = content;
        }
        sb.append(questionOnly).append('\n');

        // Options / answers
        if (q.getAnswers() != null) {
            for (var a : q.getAnswers()) {
                if (a != null && a.getContent() != null) {
                    sb.append(a.getContent()).append('\n');
                }
            }
        }

        // Explanation is AI-generated prose — check it too
        if (q.getExplanation() != null) {
            sb.append(q.getExplanation()).append('\n');
        }
        return sb.toString();
    }

    /**
     * Strips English document-title and generation-instruction lines from a
     * reading passage so they do not pollute the romaji-check blob or the
     * stored passage text displayed to learners.
     *
     * <p>Lines removed:
     * <ul>
     *   <li>Lines whose trimmed form is entirely ASCII and matches a known
     *       metadata pattern such as "MIDORI - JLPT N5 AI Question Generation
     *       Test Material", "JLPT N5 Reading Practice", "Passage N - …",
     *       "Reference question", "Reference answer", "Searchable Japanese
     *       passages with …", "Use for READING + …").</li>
     *   <li>Blank-only lines left after removal are collapsed.</li>
     * </ul>
     *
     * <p>Japanese-only content lines are always preserved.
     *
     * @param passage raw passage text; may be {@code null}
     * @return cleaned passage, or {@code null} if the input was {@code null}
     */
    public static String cleanReadingPassageForStorage(String passage) {
        if (passage == null) return null;
        // Metadata-heading lines to strip (case-insensitive, matched against
        // the trimmed line)
        java.util.regex.Pattern metaLine = java.util.regex.Pattern.compile(
                "(?i)^(" +
                        "MIDORI\\s*-.*|" +               // "MIDORI - JLPT N5 ..."
                        "JLPT\\s*N[1-5]\\s.*|" +        // "JLPT N5 Reading Practice"
                        "Searchable\\s+Japanese.*|" +    // "Searchable Japanese passages..."
                        "Use\\s+for\\s+READING.*|" +    // "Use for READING + ..."
                        "Passage\\s+\\d+\\s*[-\u2013\u2014].*|" + // "Passage 1 - Morning routine"
                        "Reference\\s+(question|answer).*|" + // "Reference question" / "Reference answer"
                        "SHORT_ANSWER\\s+generation.*" + // trailing instruction
                        ")$"
        );
        String[] lines = passage.split("\n", -1);
        StringBuilder out = new StringBuilder();
        for (String line : lines) {
            String trimmed = line.trim();
            // Always keep lines that contain at least one CJK/kana character
            boolean hasCjk = CJK_CHAR.matcher(trimmed).find();
            if (hasCjk) {
                out.append(line).append('\n');
                continue;
            }
            // Skip metadata-only ASCII lines
            if (metaLine.matcher(trimmed).matches()) {
                continue;
            }
            // Keep other non-empty lines (e.g. Passage titles in Japanese, etc.)
            if (!trimmed.isEmpty()) {
                out.append(line).append('\n');
            }
        }
        String result = out.toString().trim();
        return result.isEmpty() ? passage.trim() : result;
    }

    // Boundary-form mapping: kana suffix → kanji counter.
    // E.g. detecting "じ時" means answer already contains the counter 時.
    private static final java.util.Map<String, String> COUNTER_BOUNDARY_MAP;
    static {
        java.util.Map<String, String> m = new java.util.LinkedHashMap<>();
        // Counter duplication pairs: (kana-tail → kanji-counter)
        m.put("じ",    "時");  // ろくじ時
        m.put("ふん",  "分");  // いちふん分
        m.put("ぷん",  "分");  // よんじゅっぷん分
        m.put("にん",  "人");
        m.put("ほん",  "本");
        m.put("ぼん",  "本");
        m.put("ぽん",  "本");
        m.put("まい",  "枚");
        m.put("かい",  "回");
        m.put("ねん",  "年");
        m.put("がつ",  "月");
        m.put("にち",  "日");
        m.put("か",   "日");   // みっか日 (short form)
        COUNTER_BOUNDARY_MAP = java.util.Collections.unmodifiableMap(m);
    }

    // Kanji-counter self-duplication: 時時, 分分, 人人 …
    private static final java.util.Set<String> SELF_DUPLICATE_COUNTERS =
            new java.util.HashSet<>(java.util.Arrays.asList(
                    "時", "分", "人", "本", "枚", "回", "年", "月", "日"));

    /**
     * Returns {@code true} when a FILL_BLANK question has a boundary
     * duplication: the correct answer already contains the counter/suffix that
     * immediately follows (or precedes) the blank marker in the question text,
     * causing the rendered sentence to show the counter twice.
     *
     * <p>Examples that return {@code true} (should be rejected):
     * <ul>
     *   <li>question="電車で___分かかります。" answer="よんじゅっぷん" → suffix 分 outside
     *       blank; answer ends with ぷん (maps to 分) → boundary duplication.</li>
     *   <li>question="午後___時" answer="ろくじ" → kanji 時 outside blank; answer
     *       ends with じ (maps to 時).</li>
     *   <li>question="___人います" answer="三人" → 人 outside blank; answer ends
     *       with 人 (self-duplicate).</li>
     * </ul>
     *
     * <p>Does NOT flag cases where the blank consumes the counter:
     * <ul>
     *   <li>question="___時に起きます" answer="ろくじ" → blank at start, 時 is the
     *       first token after blank; but here 時 is inside the answer span
     *       only if the answer does not end with じ — if it does, reject.</li>
     *   <li>question="電車で___分かかります" answer="よんじゅう" (no counter) → clean.</li>
     * </ul>
     *
     * @param questionText the question sentence containing {@code ___}
     * @param answerText   the correct answer string
     * @return {@code true} when boundary duplication is detected
     */
    public static boolean detectFillBlankBoundaryDuplication(
            String questionText, String answerText) {
        if (questionText == null || answerText == null) return false;
        int blankIdx = questionText.indexOf("___");
        if (blankIdx < 0) return false;

        int afterBlank = blankIdx + 3;
        String afterPart = afterBlank < questionText.length()
                ? questionText.substring(afterBlank).trim() : "";

        if (!afterPart.isEmpty()) {
            // Check kanji self-duplicate: 分分, 時時, …
            char firstAfter = afterPart.charAt(0);
            String firstAfterStr = String.valueOf(firstAfter);
            if (SELF_DUPLICATE_COUNTERS.contains(firstAfterStr)) {
                // Does the answer end with this kanji counter itself?
                if (answerText.endsWith(firstAfterStr)) {
                    return true;
                }
            }

            // Check kana-tail → kanji-counter mapping
            for (java.util.Map.Entry<String, String> entry : COUNTER_BOUNDARY_MAP.entrySet()) {
                String kanaTail = entry.getKey();
                String kanjiCounter = entry.getValue();
                // Is the kanji counter immediately after the blank?
                if (afterPart.startsWith(kanjiCounter)) {
                    // Does the answer end with this kana tail?
                    if (answerText.endsWith(kanaTail)) {
                        return true;
                    }
                    // Does the answer end with the kanji counter itself? (e.g. answer="六時", blank=___時)
                    if (answerText.endsWith(kanjiCounter)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Returns {@code true} if the given text contains Vietnamese prose
     * meta-commentary that indicates the AI leaked explanatory prose
     * (e.g. question headers, answer labels, explanatory sentences)
     * into a field that should contain only Japanese or English content.
     *
     * <p>Japanese-only or English-only text returns {@code false}.
     *
     * @param text the text to inspect; {@code null} or blank returns {@code false}
     * @return {@code true} if Vietnamese prose markers are detected
     */
    public static boolean containsVietnameseProse(String text) {
        if (text == null || text.isBlank()) return false;
        String lower = text.toLowerCase();
        // Common Vietnamese AI meta-commentary patterns
        if (lower.contains("dưới đây là")) return true;
        if (lower.contains("câu hỏi")) return true;
        if (lower.contains("đáp án")) return true;
        if (lower.contains("giải thích")) return true;
        if (lower.contains("hãy chọn")) return true;
        if (lower.contains("nghĩa của")) return true;
        if (lower.contains("chọn đáp án")) return true;
        if (lower.contains("các câu hỏi")) return true;
        if (lower.contains("vì sao")) return true;
        return false;
    }

    /**
     * Returns the indices of duplicate options (case/whitespace insensitive).
     * An option that appears more than once is flagged; only the first
     * occurrence is considered the canonical one. Returns an empty list if
     * all options are distinct.
     */
    public static List<Integer> findDuplicateOptionIndices(List<String> options) {
        List<Integer> dups = new ArrayList<>();
        if (options == null) return dups;
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < options.size(); i++) {
            String norm = options.get(i) == null ? "" : options.get(i).trim().toLowerCase();
            if (!seen.add(norm)) {
                dups.add(i);
            }
        }
        return dups;
    }

    /**
     * Result of {@link #sanitizeGeneratedQuestions}. Carries safe metadata
     * for logging — never logs the question content itself.
     */
    public static final class GenerateSanitizeResult {
        public final List<AiExamParseResponse.AiQuestionDto> questions;
        public final int rawGeneratedCount;
        public final int finalCount;
        public final Map<String, Integer> droppedByReason;
        public final Map<String, Integer> categoryCountsAfterNormalize;
        public final Map<String, Integer> categoryCountsAfterFilter;
        /** Source passage attached to Reading questions (may be null). */
        public final String sourcePassage;

        public GenerateSanitizeResult(
                List<AiExamParseResponse.AiQuestionDto> questions,
                int rawGeneratedCount,
                int finalCount,
                Map<String, Integer> droppedByReason,
                Map<String, Integer> categoryCountsAfterNormalize,
                Map<String, Integer> categoryCountsAfterFilter,
                String sourcePassage) {
            this.questions = questions;
            this.rawGeneratedCount = rawGeneratedCount;
            this.finalCount = finalCount;
            this.droppedByReason = droppedByReason;
            this.categoryCountsAfterNormalize = categoryCountsAfterNormalize;
            this.categoryCountsAfterFilter = categoryCountsAfterFilter;
            this.sourcePassage = sourcePassage;
        }
    }

    /**
     * Sanitize AI-generated quiz questions against {@code selectedSkills}.
     *
     * <p>For each generated question:
     * <ol>
     *   <li>Re-infer the category from question content using
     *       {@link #inferCategorySemantic(String)}. This overrides whatever
     *       category the AI assigned.</li>
     *   <li>Drop the question if its inferred category is not in
     *       {@code selectedSkills}.</li>
     *   <li>For Reading questions: attach {@code sourcePassage} (extracted
     *       from the uploaded PDF) into the standard
     *       {@code Read the passage: … Question: …} format. If the AI
     *       already produced a passage of its own, normalize the format.
     *       If {@code sourcePassage} is null and the content does not
     *       already contain a passage, drop the question with reason
     *       {@code missing_reading_passage}.</li>
     *   <li>Drop the question if any option duplicates another (case/whitespace
     *       insensitive).</li>
     *   <li>Drop the question if any field (question, options, explanation,
     *       correctAnswer) contains romaji tokens.</li>
     *   <li>Drop the question if it has 0 or &gt; 1 correct answer.</li>
     *   <li>Drop the question if it has fewer than 2 options.</li>
     * </ol>
     *
     * <p>The returned result exposes safe metadata (counts only — no
     * question content) for logging.
     *
     * @param rawQuestions the AI's raw quiz questions (must already be
     *                     deserialized into {@link AiExamParseResponse.AiQuestionDto}s)
     * @param selectedSkills the user-selected skills; null/empty means
     *                       accept any of Vocabulary / Grammar / Reading
     * @param sourcePassage the passage extracted from the uploaded source
     *                      PDF; may be null when the source had no passage
     *                      block.
     */
    public static GenerateSanitizeResult sanitizeGeneratedQuestions(
            List<AiExamParseResponse.AiQuestionDto> rawQuestions,
            List<String> selectedSkills,
            String sourcePassage) {

        Map<String, Integer> dropped = new LinkedHashMap<>();
        Map<String, Integer> countsAfterNormalize = new LinkedHashMap<>();
        Map<String, Integer> countsAfterFilter = new LinkedHashMap<>();
        for (String s : new String[]{"Vocabulary", "Grammar", "Reading", "Writing", "Listening", "Kanji", "Translation", "Error Correction", "Sentence Writing", "unknown"}) {
            countsAfterNormalize.put(s, 0);
            countsAfterFilter.put(s, 0);
        }
        for (String reason : new String[]{
                "duplicate_options", "romaji_content", "no_correct_answer",
                "too_few_options", "blank_content", "off_skill",
                "missing_reading_passage",
                "vietnamese_prose_in_question", "vietnamese_prose_in_options"}) {
            dropped.put(reason, 0);
        }

        int rawCount = rawQuestions == null ? 0 : rawQuestions.size();
        List<AiExamParseResponse.AiQuestionDto> out = new ArrayList<>();
        Set<String> allowedSkills = new HashSet<>();
        if (selectedSkills != null) {
            for (String s : selectedSkills) {
                if (s == null) continue;
                String lc = s.trim().toLowerCase();
                if (lc.equals("vocabulary") || lc.equals("grammar") || lc.equals("reading")
                        || lc.equals("writing") || lc.equals("listening") || lc.equals("kanji")) {
                    allowedSkills.add(lc.substring(0, 1).toUpperCase() + lc.substring(1));
                }
            }
        }

        if (rawQuestions == null) {
            return new GenerateSanitizeResult(out, rawCount, 0, dropped,
                    countsAfterNormalize, countsAfterFilter, sourcePassage);
        }

        for (AiExamParseResponse.AiQuestionDto q : rawQuestions) {
            if (q == null) continue;
            if (q.getContent() == null || q.getContent().isBlank()) {
                log.info("[AiCategoryInference] Question dropped: content=null/blank, status=DROPPED, dropReason=blank_content");
                dropped.merge("blank_content", 1, Integer::sum);
                continue;
            }

            // 1. Normalize and infer category
            String rawCategory = q.getCategory();
            String normalizedCategory = normalizeCategory(rawCategory);
            if (normalizedCategory == null && q.getType() != null) {
                normalizedCategory = normalizeCategory(q.getType());
            }
            String inferredCategory = null;
            String finalCategory = normalizedCategory;
            if (finalCategory == null) {
                inferredCategory = inferCategorySemantic(q.getContent(), allowedSkills);
                finalCategory = inferredCategory;
            }
            q.setCategory(finalCategory);
            countsAfterNormalize.merge(finalCategory, 1, Integer::sum);

            // 2. Off-skill filter
            boolean matches = false;
            if (allowedSkills.isEmpty()) {
                matches = true;
            } else {
                for (String allowed : allowedSkills) {
                    if (isCompatible(finalCategory, allowed)) {
                        matches = true;
                        break;
                    }
                }
            }
            if (!matches) {
                log.info("[AiCategoryInference] Category mismatch: content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=off_skill",
                         q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                dropped.merge("off_skill", 1, Integer::sum);
                continue;
            }

            // 2a. Vietnamese prose guard
            boolean isTranslation = q.getType() != null && "TRANSLATION".equalsIgnoreCase(q.getType().trim());
            if (!isTranslation) {
                if (containsVietnameseProse(q.getContent())) {
                    log.info("[AiCategoryInference] Question dropped: content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=vietnamese_prose_in_question",
                             q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                    dropped.merge("vietnamese_prose_in_question", 1, Integer::sum);
                    continue;
                }
                boolean optionsContainVietnamese = false;
                if (q.getAnswers() != null) {
                    for (var ans : q.getAnswers()) {
                        if (ans != null && containsVietnameseProse(ans.getContent())) {
                            optionsContainVietnamese = true;
                            break;
                        }
                    }
                }
                if (optionsContainVietnamese) {
                    log.info("[AiCategoryInference] Question dropped: content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=vietnamese_prose_in_options",
                             q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                    dropped.merge("vietnamese_prose_in_options", 1, Integer::sum);
                    continue;
                }
            }

            // 2b. Reading passage injection (Reading only)
            if ("Reading".equals(finalCategory)) {
                String[] split = splitQuestionContentForReading(q.getContent());
                String existingPassage = split[0];
                String questionOnly = split[1];
                String chosenPassage = existingPassage;
                if (chosenPassage == null || chosenPassage.isBlank()) {
                    chosenPassage = sourcePassage;
                }
                if (chosenPassage == null || chosenPassage.isBlank()) {
                    log.info("[AiCategoryInference] Question dropped: content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=missing_reading_passage",
                             q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                    dropped.merge("missing_reading_passage", 1, Integer::sum);
                    continue;
                }
                q.setContent(composeReadingContent(chosenPassage, questionOnly));
            }

            // 3. Validate options
            if (q.getAnswers() == null || q.getAnswers().size() < 2) {
                log.info("[AiCategoryInference] Question dropped: content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=too_few_options",
                         q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                dropped.merge("too_few_options", 1, Integer::sum);
                continue;
            }
            List<String> optionTexts = new ArrayList<>();
            for (var a : q.getAnswers()) {
                optionTexts.add(a == null ? "" : a.getContent() == null ? "" : a.getContent());
            }
            List<Integer> dups = findDuplicateOptionIndices(optionTexts);
            if (!dups.isEmpty()) {
                log.info("[AiCategoryInference] Question dropped: content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=duplicate_options",
                         q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                dropped.merge("duplicate_options", 1, Integer::sum);
                continue;
            }

            // 4a. FILL_BLANK boundary-duplication guard
            if ("FILL_BLANK".equalsIgnoreCase(q.getType())) {
                String fbContent = q.getContent() == null ? "" : q.getContent();
                String fbAnswer = (q.getAnswers() != null && !q.getAnswers().isEmpty()
                        && q.getAnswers().get(0) != null)
                        ? q.getAnswers().get(0).getContent() : null;
                if (detectFillBlankBoundaryDuplication(fbContent, fbAnswer)) {
                    log.info("[AiCategoryInference] Question dropped: content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=fill_blank_boundary_duplication",
                             q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                    dropped.merge("fill_blank_boundary_duplication", 1, Integer::sum);
                    continue;
                }
            }

            if (checkRomajiContent(q, finalCategory)) {
                log.info("[AiCategoryInference] Question dropped: content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=romaji_content",
                         q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                dropped.merge("romaji_content", 1, Integer::sum);
                continue;
            }

            // 5. Exactly one correct answer
            long correctCount = q.getAnswers().stream()
                    .filter(a -> a != null && Boolean.TRUE.equals(a.getIsCorrect()))
                    .count();
            if (correctCount != 1) {
                log.info("[AiCategoryInference] Question dropped: content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=no_correct_answer",
                         q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                dropped.merge("no_correct_answer", 1, Integer::sum);
                continue;
            }

            log.info("[AiCategoryInference] Question accepted: content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=ACCEPTED",
                     q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
            countsAfterFilter.merge(finalCategory, 1, Integer::sum);
            out.add(q);
        }

        return new GenerateSanitizeResult(
                out, rawCount, out.size(), dropped,
                countsAfterNormalize, countsAfterFilter, sourcePassage);
    }

    /**
     * Backwards-compatible overload that does NOT have a source passage.
     * Reading questions that lack their own embedded passage will be
     * dropped with reason {@code missing_reading_passage}.
     */
    public static GenerateSanitizeResult sanitizeGeneratedQuestions(
            List<AiExamParseResponse.AiQuestionDto> rawQuestions,
            List<String> selectedSkills) {
        return sanitizeGeneratedQuestions(rawQuestions, selectedSkills, null);
    }

    /**
     * Sanitize AI-generated quiz questions against an explicit
     * {@code expectedType} and an explicit
     * {@code expectedDistribution} ({@code {EASY, MEDIUM, HARD}}).
     *
     * <p>This is the new strict-mode entry point used by the PDF
     * "Generate from Content" workflow. In addition to the rules enforced
     * by {@link #sanitizeGeneratedQuestions(List, List, String)}:
     * <ol>
     *   <li>Every surviving question is forced to have {@code type} equal to
     *       {@code expectedType} (after alias normalization). Questions whose
     *       declared type cannot be normalized to the expected type are
     *       dropped with reason {@code wrong_question_type}.</li>
     *   <li>Every surviving question is validated against the type contract
     *       via {@link QuestionTypeValidator#isValid(com.midori.ai.dto.AiExamParseResponse.AiQuestionDto)};
     *       questions that fail are dropped with reason
     *       {@code invalid_type_structure}.</li>
     *   <li>Every surviving question is re-classified into a difficulty bucket
     *       (EASY / MEDIUM / HARD). The result is partitioned by difficulty
     *       and trimmed to exactly {@code expectedDistribution} questions per
     *       bucket — questions in excess of the requested bucket count are
     *       dropped with reason {@code excess_difficulty}.</li>
     *   <li>Questions whose difficulty cannot be normalized are repaired by
     *       assigning a difficulty bucket that still has free capacity, then
     *       falling back to MEDIUM when the bucket is already full.</li>
     * </ol>
     *
     * <p>The returned {@link GenerateSanitizeResult#getQuestions()} list may
     * be SHORTER than the requested total when the AI response did not
     * contain enough valid questions. The caller is expected to retry
     * (supplementation) when the count falls short.
     *
     * @param rawQuestions         the AI's raw quiz questions
     * @param selectedSkills       user-selected skills; null/empty means
     *                             accept any of Vocabulary / Grammar / Reading
     * @param sourcePassage        optional Reading source passage
     * @param expectedType         the strict type requested by the teacher
     * @param expectedDistribution per-difficulty target counts (must sum to
     *                             the caller's expected total)
     */
    public static GenerateSanitizeResult sanitizeGeneratedQuestionsWithTypeAndDistribution(
            List<AiExamParseResponse.AiQuestionDto> rawQuestions,
            List<String> selectedSkills,
            String sourcePassage,
            QuestionType expectedType,
            Map<Difficulty, Integer> expectedDistribution) {

        // The base sanitize() requires ≥ 2 options and ≥ 1 correct answer, which
        // is too strict for FILL_BLANK / SHORT_ANSWER / SINGLE-ANSWER types
        // (the AI's response for these is normally a single correct-answer slot).
        // Run a relaxed version of the base sanitize so the type-specific layer
        // can do its own repairs below.
        GenerateSanitizeResult base = sanitizeWithStructuralAwareness(
                rawQuestions, selectedSkills, sourcePassage, expectedType);

        Map<String, Integer> dropped = new LinkedHashMap<>(base.droppedByReason);
        for (String reason : new String[]{
                "wrong_question_type", "invalid_type_structure",
                "excess_difficulty", "missing_difficulty"}) {
            dropped.put(reason, 0);
        }

        List<AiExamParseResponse.AiQuestionDto> filtered = new ArrayList<>();
        Map<Difficulty, Integer> remaining = new EnumMap<>(Difficulty.class);
        if (expectedDistribution != null) {
            for (Map.Entry<Difficulty, Integer> e : expectedDistribution.entrySet()) {
                remaining.put(e.getKey(), Math.max(0, e.getValue()));
            }
        }

        for (AiExamParseResponse.AiQuestionDto q : base.questions) {
            if (q == null) continue;
            // 1. Enforce strict question type.
            if (expectedType != null) {
                QuestionType declared = QuestionTypeValidator.normalize(q.getType());
                if (declared == null) {
                    q.setType(expectedType.name());
                    declared = expectedType;
                } else if (declared != expectedType) {
                    dropped.merge("wrong_question_type", 1, Integer::sum);
                    continue;
                }
                // 2. Apply structural repair and re-validate the type contract.
                List<String> repairs = QuestionTypeValidator.repair(q);
                QuestionTypeValidator.applyRepairs(q, repairs);
                if (!QuestionTypeValidator.isValid(q)) {
                    dropped.merge("invalid_type_structure", 1, Integer::sum);
                    continue;
                }
            }
            // 3. Resolve difficulty bucket.
            Difficulty bucket = resolveDifficulty(q.getDifficulty());
            if (bucket == null) {
                // Repair: assign to first bucket with remaining capacity,
                // falling back to MEDIUM if all buckets are full.
                bucket = pickRepairBucket(remaining);
                if (bucket == null) bucket = Difficulty.MEDIUM;
                q.setDifficulty(toCanonicalDifficultyString(bucket));
                dropped.merge("missing_difficulty", 1, Integer::sum);
            }
            // 4. Enforce per-difficulty capacity.
            if (expectedDistribution != null && !expectedDistribution.isEmpty()) {
                int left = remaining.getOrDefault(bucket, 0);
                if (left <= 0) {
                    dropped.merge("excess_difficulty", 1, Integer::sum);
                    continue;
                }
                remaining.put(bucket, left - 1);
            }
            q.setDifficulty(toCanonicalDifficultyString(bucket));
            filtered.add(q);
        }

        return new GenerateSanitizeResult(
                filtered,
                base.rawGeneratedCount,
                filtered.size(),
                dropped,
                base.categoryCountsAfterNormalize,
                base.categoryCountsAfterFilter,
                sourcePassage);
    }

    /**
     * Structurally-aware pre-sanitizer used by the strict type-aware pipeline.
     * Behaves like {@link #sanitizeGeneratedQuestions(List, List, String)} but
     * relaxes the {@code too_few_options}, {@code no_correct_answer} and
     * {@code duplicate_options} gates for {@code FILL_BLANK} and
     * {@code SHORT_ANSWER} so a single-text-answer question can survive long
     * enough for the type-repair layer to apply the correct normalization.
     */
    private static GenerateSanitizeResult sanitizeWithStructuralAwareness(
            List<AiExamParseResponse.AiQuestionDto> rawQuestions,
            List<String> selectedSkills,
            String sourcePassage,
            QuestionType expectedType) {

        Map<String, Integer> dropped = new LinkedHashMap<>();
        Map<String, Integer> countsAfterNormalize = new LinkedHashMap<>();
        Map<String, Integer> countsAfterFilter = new LinkedHashMap<>();
        for (String s : new String[]{"Vocabulary", "Grammar", "Reading", "Writing", "Listening", "Kanji", "Translation", "Error Correction", "Sentence Writing", "unknown"}) {
            countsAfterNormalize.put(s, 0);
            countsAfterFilter.put(s, 0);
        }
        for (String reason : new String[]{
                "duplicate_options", "romaji_content", "no_correct_answer",
                "too_few_options", "blank_content", "off_skill",
                "missing_reading_passage", "invalid_type_structure", "missing_correct_answer"}) {
            dropped.put(reason, 0);
        }

        int rawCount = rawQuestions == null ? 0 : rawQuestions.size();
        List<AiExamParseResponse.AiQuestionDto> out = new ArrayList<>();
        Set<String> allowedSkills = new HashSet<>();
        if (selectedSkills != null) {
            for (String s : selectedSkills) {
                if (s == null) continue;
                String lc = s.trim().toLowerCase();
                if (lc.equals("vocabulary") || lc.equals("grammar") || lc.equals("reading")
                        || lc.equals("writing") || lc.equals("listening") || lc.equals("kanji")) {
                    allowedSkills.add(lc.substring(0, 1).toUpperCase() + lc.substring(1));
                }
            }
        }
        if (rawQuestions == null) {
            return new GenerateSanitizeResult(out, rawCount, 0, dropped,
                    countsAfterNormalize, countsAfterFilter, sourcePassage);
        }

        boolean relaxedTypes = expectedType == QuestionType.FILL_BLANK
                || expectedType == QuestionType.SHORT_ANSWER
                || expectedType == QuestionType.TRANSLATION
                || expectedType == QuestionType.SENTENCE_WRITING
                || expectedType == QuestionType.ERROR_CORRECTION;

        for (AiExamParseResponse.AiQuestionDto q : rawQuestions) {
            if (q == null) continue;
            QuestionType declared = QuestionTypeValidator.normalize(q.getType());
            boolean questionIsRelaxed = (declared == null) ? relaxedTypes : (declared == QuestionType.FILL_BLANK || declared == QuestionType.SHORT_ANSWER || declared == QuestionType.TRANSLATION || declared == QuestionType.SENTENCE_WRITING || declared == QuestionType.ERROR_CORRECTION);

            if (q.getContent() == null || q.getContent().isBlank()) {
                log.info("[AiCategoryInference] Question dropped: content=null/blank, status=DROPPED, dropReason=blank_content");
                dropped.merge("blank_content", 1, Integer::sum);
                continue;
            }

            // 1. Normalize and infer category
            String rawCategory = q.getCategory();
            String normalizedCategory = normalizeCategory(rawCategory);
            if (normalizedCategory == null && q.getType() != null) {
                normalizedCategory = normalizeCategory(q.getType());
            }
            String inferredCategory = null;
            String finalCategory = normalizedCategory;
            if (finalCategory == null) {
                inferredCategory = inferCategorySemantic(q.getContent(), allowedSkills);
                finalCategory = inferredCategory;
            }
            q.setCategory(finalCategory);
            countsAfterNormalize.merge(finalCategory, 1, Integer::sum);

            // 2. Off-skill filter
            boolean matches = false;
            if (allowedSkills.isEmpty()) {
                matches = true;
            } else {
                for (String allowed : allowedSkills) {
                    if (isCompatible(finalCategory, allowed)) {
                        matches = true;
                        break;
                    }
                }
            }
            if (!matches) {
                log.info("[AiCategoryInference] Category mismatch (structural): content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=off_skill",
                         q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                dropped.merge("off_skill", 1, Integer::sum);
                continue;
            }

            if ("Reading".equals(finalCategory)) {
                String[] split = splitQuestionContentForReading(q.getContent());
                String existingPassage = split[0];
                String questionOnly = split[1];
                String chosenPassage = existingPassage;
                if (chosenPassage == null || chosenPassage.isBlank()) {
                    chosenPassage = sourcePassage;
                }
                if (chosenPassage == null || chosenPassage.isBlank()) {
                    log.info("[AiCategoryInference] Question dropped (structural): content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=missing_reading_passage",
                             q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                    dropped.merge("missing_reading_passage", 1, Integer::sum);
                    continue;
                }
                q.setContent(composeReadingContent(chosenPassage, questionOnly));
            }

            if (q.getAnswers() == null || q.getAnswers().isEmpty()) {
                if (questionIsRelaxed) {
                    log.info("[AiCategoryInference] Question dropped (structural): content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=missing_correct_answer",
                             q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                    dropped.merge("missing_correct_answer", 1, Integer::sum);
                } else {
                    log.info("[AiCategoryInference] Question dropped (structural): content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=too_few_options",
                             q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                    dropped.merge("too_few_options", 1, Integer::sum);
                }
                continue;
            }
            // For MCQ / TRUE_FALSE require ≥ 2 distinct options and exactly 1
            // correct answer. FILL_BLANK / SHORT_ANSWER relax these so a
            // single-text answer slot can survive to the type-repair layer.
            if (!questionIsRelaxed) {
                if (q.getAnswers().size() < 2) {
                    log.info("[AiCategoryInference] Question dropped (structural): content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=too_few_options",
                             q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                    dropped.merge("too_few_options", 1, Integer::sum);
                    continue;
                }
                List<String> optionTexts = new ArrayList<>();
                for (var a : q.getAnswers()) {
                    optionTexts.add(a == null ? "" : a.getContent() == null ? "" : a.getContent());
                }
                List<Integer> dups = findDuplicateOptionIndices(optionTexts);
                if (!dups.isEmpty()) {
                    log.info("[AiCategoryInference] Question dropped (structural): content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=duplicate_options",
                             q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                    dropped.merge("duplicate_options", 1, Integer::sum);
                    continue;
                }
                long correctCount = q.getAnswers().stream()
                        .filter(a -> a != null && Boolean.TRUE.equals(a.getIsCorrect()))
                        .count();
                if (correctCount != 1) {
                    log.info("[AiCategoryInference] Question dropped (structural): content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=no_correct_answer",
                             q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                    dropped.merge("no_correct_answer", 1, Integer::sum);
                    continue;
                }
            }

            // FILL_BLANK boundary-duplication guard (structural path)
            if ("FILL_BLANK".equalsIgnoreCase(q.getType())) {
                String fbContent = q.getContent() == null ? "" : q.getContent();
                String fbAnswer = (q.getAnswers() != null && !q.getAnswers().isEmpty()
                        && q.getAnswers().get(0) != null)
                        ? q.getAnswers().get(0).getContent() : null;
                if (detectFillBlankBoundaryDuplication(fbContent, fbAnswer)) {
                    log.info("[AiCategoryInference] Question dropped (structural): content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=fill_blank_boundary_duplication",
                             q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                    dropped.merge("fill_blank_boundary_duplication", 1, Integer::sum);
                    continue;
                }
            }

            if (checkRomajiContent(q, finalCategory)) {
                log.info("[AiCategoryInference] Question dropped (structural): content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=DROPPED, dropReason=romaji_content",
                         q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
                dropped.merge("romaji_content", 1, Integer::sum);
                continue;
            }

            log.info("[AiCategoryInference] Question accepted (structural): content='{}', requested={}, rawCategory='{}', normalizedCategory='{}', inferredCategory='{}', finalCategory='{}', status=ACCEPTED",
                     q.getContent(), allowedSkills, rawCategory, normalizedCategory, inferredCategory, finalCategory);
            countsAfterFilter.merge(finalCategory, 1, Integer::sum);
            out.add(q);
        }

        return new GenerateSanitizeResult(
                out, rawCount, out.size(), dropped,
                countsAfterNormalize, countsAfterFilter, sourcePassage);
    }

    private static Difficulty resolveDifficulty(String raw) {
        if (raw == null) return null;
        String norm = raw.trim();
        if (norm.equalsIgnoreCase("easy"))   return Difficulty.EASY;
        if (norm.equalsIgnoreCase("medium")) return Difficulty.MEDIUM;
        if (norm.equalsIgnoreCase("hard"))   return Difficulty.HARD;
        return null;
    }

    private static Difficulty pickRepairBucket(
            Map<Difficulty, Integer> remaining) {
        for (Difficulty d : new Difficulty[]{
                Difficulty.EASY,
                Difficulty.MEDIUM,
                Difficulty.HARD}) {
            Integer left = remaining.get(d);
            if (left != null && left > 0) return d;
        }
        return null;
    }

    /** Map an enum value to the canonical "Easy" / "Medium" / "Hard" string
     *  used by the FE renderer and DB columns. */
    public static String toCanonicalDifficultyString(Difficulty d) {
        if (d == null) return "Medium";
        switch (d) {
            case EASY:   return "Easy";
            case MEDIUM: return "Medium";
            case HARD:   return "Hard";
            default: return "Medium";
        }
    }

    /**
     * Detect an existing passage block inside a Reading question's
     * already-packed content. Returns {@code [passage, question]} where
     * either may be empty/null. The "passage" here is whatever the AI
     * produced; the caller decides whether to keep it or replace with
     * the canonical source passage.
     *
     * <p>Recognizes the same English / Vietnamese / Japanese headers the
     * FE parser uses (Read the passage / Passage / Đọc bài đọc /
     * Đọc đoạn văn / 本文 / 文章) plus the "Theo bài đọc" preamble.
     */
    public static String[] splitQuestionContentForReading(String content) {
        if (content == null) return new String[]{null, ""};
        String[] out = new String[]{null, content.trim()};
        String text = content.trim();

        // 1. Read the passage / Passage / 本文 / 文章 headers
        Pattern p = Pattern.compile(
                "^(?s)\\s*(?:read\\s*the\\s*passage|reading\\s*passage|passage|"
                        + "đọc\\s*(?:đoạn\\s*văn|bài\\s*đọc)|"
                        + "bài\\s*đọc|đoạn\\s*văn|"
                        + "本文|文章)"
                        + "\\s*[:：]?\\s*([\\s\\S]*?)\\s+"
                        + "(?:question|câu\\s*hỏi|問題|質問|q\\s*[:：])\\s*[:：]?\\s*([\\s\\S]+)\\s*$",
                Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
        Matcher m = p.matcher(text);
        if (m.find()) {
            out[0] = m.group(1).trim();
            out[1] = m.group(2).trim();
            return out;
        }

        // 2. "Theo bài đọc / Theo đoạn văn … Câu hỏi: ..."
        p = Pattern.compile(
                "^(?s)\\s*(?:theo\\s*(?:bài\\s*đọc|đoạn\\s*văn|passage)[\\s\\S]*?)\\s*"
                        + "câu\\s*hỏi\\s*[:：]?\\s*([\\s\\S]+)\\s*$",
                Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
        m = p.matcher(text);
        if (m.find()) {
            out[0] = text.substring(0, text.length() - m.group(1).length()).trim();
            out[1] = m.group(1).trim();
            return out;
        }

        return out;
    }

    /**
     * Extract a Reading passage block from a "source" PDF text (the full
     * extracted text of the uploaded material PDF). Used by the Generate
     * from Learning Content flow to get the passage to attach to AI
     * generated Reading questions.
     *
     * <p>The detection tries a sequence of patterns and returns the first
     * match whose body length is >= 30 chars. Patterns:
     * <ol>
     *   <li>{@code Read the passage} / {@code Reading Passage} (en)</li>
     *   <li>{@code Đọc bài đọc} / {@code Đọc đoạn văn} / {@code Đoạn văn:} / {@code Bài đọc:} (vi)</li>
     *   <li>{@code 本文} / {@code 文章} (ja)</li>
     *   <li>{@code Skill: Reading … Read the passage: …} (the standard
     *       mixed-skill format)</li>
     *   <li>Fallback: a long Japanese block (>= 60 chars of CJK) followed
     *       by a numbered question marker.</li>
     * </ol>
     *
     * @return the passage text (trimmed) or null when no passage block
     *         was found.
     */
    public static String extractReadingPassageFromSource(String sourceText) {
        if (sourceText == null || sourceText.isBlank()) return null;

        String normalized = normalizeForEvidence(sourceText);

        // 1. Existing passage-header extractor (handles all "Read the passage"
        //    / "本文" / etc. labels and returns the block body).
        String direct = findAndRemovePassage(normalized);
        if (direct != null && direct.length() >= 30) return direct;

        // 2. Vietnamese heading "Bài đọc" / "Đoạn văn" / "Reading Passage:"
        //    followed by a numbered question. The matched body becomes the passage.
        Pattern[] viHeading = {
                Pattern.compile("(?im)^\\s*(?:bài\\s*đọc|đoạn\\s*văn|reading\\s*passage)[\\s:：]*\\n+(.+?)(?=\\n\\s*\\d+[.)]\\s*|\\Z)",
                        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE),
                Pattern.compile("(?im)^\\s*(?:bài\\s*đọc|đoạn\\s*văn|reading\\s*passage)\\s*[:：]?\\s*(.+?)(?=\\n\\s*\\d+[.)]\\s*|\\Z)",
                        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE)
        };
        for (Pattern p : viHeading) {
            Matcher m = p.matcher(normalized);
            if (m.find()) {
                String body = m.group(1).trim();
                if (body.length() >= 30) return body;
            }
        }

        // 3. Fallback: a long Japanese block (>= 60 CJK chars) immediately
        //    followed by a numbered question marker. Common case when the
        //    source PDF has no explicit passage header — the longest Japanese
        //    paragraph IS the passage.
        Pattern longJp = Pattern.compile(
                "(?ims)([\\s\\S]*?(?:[\\u3040-\\u309F\\u30A0-\\u30FF\\u4E00-\\u9FFF][\\s\\S]{60,}?))(?=\\n\\s*\\d+[.)]\\s*|\\Z)");
        Matcher m = longJp.matcher(normalized);
        if (m.find()) {
            String body = m.group(1).trim();
            // Score by CJK char density; only accept if >40% of body is CJK.
            long cjk = body.chars().filter(c -> (c >= 0x3040 && c <= 0x309F)
                    || (c >= 0x30A0 && c <= 0x30FF) || (c >= 0x4E00 && c <= 0x9FFF)).count();
            if (body.length() >= 60 && cjk * 100 / body.length() >= 40) {
                return body;
            }
        }
        return null;
    }

    /**
     * Format a (passage, question) pair into the standard Reading content
     * string the FE parser expects:
     * <pre>
     * Read the passage:
     * &lt;passage&gt;
     *
     * Question:
     * &lt;question&gt;
     * </pre>
     * Returns just the question text when passage is null/blank.
     */
    public static String composeReadingContent(String passage, String question) {
        String q = question == null ? "" : question.trim();
        String p = passage == null ? "" : passage.trim();
        if (p.isEmpty()) return q;
        return "Read the passage:\n" + p + "\n\nQuestion: " + q;
    }

    // =============================================================
    // RULE-BASED FALLBACK PARSER
    // PHẦN 2/3: Shared passage support + Japanese question patterns
    // =============================================================

    // Question number patterns: 1. 1) 問1: 問題1: 質問1: Q1: Question 1:
    private static final Pattern QUESTION_MARKER_SIMPLE = Pattern.compile(
            "(?im)^(?:(\\d+)[.)]\\s+|(問|問題|質問|Q|Câu|Question|Câu\\s*hỏi|Cau|Cau\\s*hoi)[\\s:]*(\\d+)[.):]?\\s*|Question\\s+(\\d+)[.):]?\\s*)"
    );

    // Section header pattern: detects "Skill: Vocabulary", "Skill: Grammar",
    // "Skill: Reading" at line start OR at the start of a question line (after
    // a question number marker like "1. "). Used by parseFromSourceText to
    // scope the global Reading passage to its actual section instead of
    // attaching it to every question in a mixed-skill PDF.
    //
    // Matches BOTH:
    //   "Skill: Vocabulary"     (standalone header line)
    //   "1. Skill: Vocabulary"  (per-question header inside the block)
    private static final Pattern SECTION_HEADER = Pattern.compile(
            "(?im)^(?:\\s*|(?:\\d+[.)]\\s+))(Skill\\s*[:：]?\\s*(Vocabulary|Grammar|Reading|Vocabulaire|Grammaire|Lecture))\\b"
    );

    // Per-question Skill line pattern. The user's standard mixed format
    // embeds "1. Skill: Vocabulary" or "4. Skill: Grammar" inside the block,
    // before the question text. This is an explicit hint that must override
    // any global inference.
    private static final Pattern INBLOCK_SKILL_LINE = Pattern.compile(
            "(?im)^\\s*(?:\\d+[.)]\\s+)?Skill\\s*[:：]?\\s*(Vocabulary|Grammar|Reading|Vocabulaire|Grammaire|Lecture)\\b"
    );

    // Passage header patterns.
    //
    // Each alternative matches a label like "Read the passage", "本文",
    // "Đọc bài đọc", etc. The optional `[:：]?` after the group accepts a
    // single halfwidth (U+003A) or fullwidth (U+FF1A) colon before the
    // trailing newline so that both forms work:
    //
    //   "Read the passage:"        (most common — was failing before this fix)
    //   "Read the passage"
    //   "Reading Passage:"
    //   "本文:"
    //   "文章："
    //   "Đọc đoạn văn:"
    //
    // The `[:：]?` is optional, so existing formats without any colon
    // continue to parse unchanged.
    private static final Pattern PASSAGE_HEADER = Pattern.compile(
            "(?im)^\\s*(?:"
                    + "read\\s*(?:the)?\\s*passage|"
                    + "reading\\s*passage|"
                    + "passage|"
                    + "本文|"
                    + "文章|"
                    + "đọc\\s*(?:đoạn\\s*văn|bài\\s*đọc)|"
                    + "passage\\s*(?:text)?|"
                    + "text"
                    + ")\\s*(?:[:：.]\\s*|(?=\\n|\\r|$))",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern ANSWER_LINE = Pattern.compile(
            "(?im)^\\s*(?:Correct\\s*(?:answer)?|Answer|Đáp\\s*án|正解|答え)\\s*[:.]?\\s*([A-Da-d]|一二三四)[^A-Za-z]*",
            Pattern.MULTILINE
    );
    // Sentinel inserted by stripAllPassages before each question that was preceded by
    // a stripped passage. splitIntoBlocks splits on this so orphan questions get
    // their own block instead of merging with the previous one.
    private static final String ORPHAN_QUESTION_MARKER = "\n__MIDORI_ORPHAN__\n";
    // Pattern for splitting blocks on passage headers: matches the start of a passage line
    // so "Reading Passage: Tanaka-san..." becomes a separate block from the question.
    private static final Pattern PASSAGE_HEADER_SPLITTER = Pattern.compile(
            "(?im)^\\s*(?:read(?:ing)?\\s*passage|đọc\\s*(?:đoạn\\s*văn|bài\\s*đọc)|本文|文章)",
            Pattern.CASE_INSENSITIVE | Pattern.MULTILINE
    );
    private static final Pattern ANSWER_LINE_TEXT = Pattern.compile(
            "(?im)^\\s*(?:Correct\\s*(?:answer)?|Answer|Đáp\\s*án|正解|答え)\\s*[:.]?\\s*(.+)",
            Pattern.MULTILINE
    );

    // Option patterns: A. A) A: Ａ. ア. イ. ウ. エ.
    private static final Pattern OPTION_LINE = Pattern.compile(
            "(?m)^\\s*([A-Da-dＡ-Ｄ]|ア、イ、ウ、エ)(?:[.):：]|\\s+)\\s*(.+)$"
    );

    private static final Pattern OPTION_INLINE = Pattern.compile(
            "(?i)(?<![A-Za-zＡ-Ｚ])([A-D])\\s*[.:]\\s*([^A-D\\n]{1,80}?)\\s*(?=[A-D][.:]|\\z)"
    );

    private static final Pattern EXPLANATION_LINE = Pattern.compile(
            "(?im)^\\s*(?:Explanation|Giải\\s*thích|Note|解説)\\s*[:.]?\\s*(.+)",
            Pattern.MULTILINE
    );
    private static final Pattern ANSWER_KEY_ENTRY = Pattern.compile(
            "(?i)\\b(\\d+)\\s*[.:=]\\s*([A-Da-d])"
    );
    private static final Pattern ANSWER_KEY_HEADER = Pattern.compile(
            "(?im)^\\s*(?:Answer\\s*Key|Đáp\\s*án|Answers?|正解)\\s*[:.]?\\s*$"
    );
    private static final Pattern TRAILING_KEY_BLOCK = Pattern.compile(
            "(?i)(?:Answer\\s*Key|Đáp\\s*án|Answers?)\\s*[:.]?\\s*\\n?([\\s\\S]*)"
    );

    /**
     * Parse plain text (extracted from a PDF) into structured questions.
     *
     * <p>Supports shared Reading passages (one passage, multiple questions)
     * and Japanese question numbering / option formats.
     */
    public static AiExamParseResponse parseFromSourceText(String text) {
        return parseFromSourceText(text, null);
    }

    /**
     * Parse plain text with optional currentReadingPassage context.
     * When called sequentially with the same extractedText, pass the previously
     * found passage so that questions without explicit passage text can still
     * reference it.
     *
     * <p><b>Section-aware:</b> walks the text tracking {@code Skill:} section
     * headers and passage headers so a {@code Read the passage:} block under
     * {@code Skill: Reading} only attaches to questions that follow it, and
     * never to questions in earlier {@code Skill: Vocabulary} / {@code Skill:
     * Grammar} sections of a mixed-skill PDF. A per-question {@code Skill: X}
     * line inside a block is honored as an explicit category hint and wins
     * over inference.
     */
    public static AiExamParseResponse parseFromSourceText(String text, String currentReadingPassage) {
        if (text == null || text.isBlank()) {
            return AiExamParseResponse.empty();
        }

        String normalized = normalizeForEvidence(text);

        // 1. Build section/passage context map on the ORIGINAL text (with passages).
        BlockContext ctx = buildBlockContextForSplit(normalized);

        // 1b. Insert orphan question markers BEFORE stripping so splitIntoBlocks can
        //     find them in textForBlocks. Do this on the original normalized text.
        String textWithOrphans = insertOrphanMarkers(normalized, ctx);

        // 2. Remove the passage block from text so it doesn't create spurious
        //    question blocks. Keep backward-compat: if no Skill: section
        //    header was found AND the global findAndRemovePassage works, use
        //    that path (preserves the legacy single-skill Reading PDF test).
        String textForBlocks = stripAllPassages(textWithOrphans, ctx);

        // 3. Build answer-key map
        Map<String, String> answerKey = extractAnswerKey(textForBlocks);

        // 4. Split into question blocks
        List<String> blocks = splitIntoBlocks(textForBlocks);

        // 5. Parse each block with its own passage context.
        //    Pass the ORIGINAL normalized text (with passages) so we can extract
        //    passage content from the correct positions.
        List<AiExamParseResponse.AiQuestionDto> questions = parseBlocksWithContext(
                blocks, ctx, answerKey, normalized, currentReadingPassage);

        // 6. Build response
        AiExamParseResponse response = new AiExamParseResponse();
        response.setTitle("");
        response.setDescription("Parsed from PDF text");
        response.setQuestions(questions);
        return sanitize(response);
    }

    /**
     * Parse blocks with their context. Pass the original normalized text so passage
     * extraction uses correct positions. Handles passage-only blocks by carrying
     * their passage content to the next actual question block.
     */
    private static List<AiExamParseResponse.AiQuestionDto> parseBlocksWithContext(
            List<String> blocks,
            BlockContext ctx,
            Map<String, String> answerKey,
            String originalNormalizedText,
            String currentReadingPassage) {

        List<AiExamParseResponse.AiQuestionDto> questions = new ArrayList<>();
        String pendingPassage = null;

        for (int qi = 0; qi < blocks.size(); qi++) {
            String block = blocks.get(qi);
            PerBlockContext pbc = ctx.perBlock.get(Math.min(qi, ctx.perBlock.size() - 1));

            // Skip passage-only blocks; carry their passage to the next question
            if (pbc != null && pbc.isPassageBlock) {
                String pass = extractPassageFromOriginal(pbc, originalNormalizedText, ctx.passageRanges);
                if (pass != null && !pass.isBlank()) {
                    pendingPassage = pass;
                }
                continue;
            }

            // For question blocks, check if a previous passage-only block set pendingPassage
            String blockPassage = pendingPassage;
            pendingPassage = null; // reset after use

            if (blockPassage == null && pbc != null && pbc.passage != null) {
                blockPassage = pbc.passage;
            }

            if (blockPassage == null && !ctx.hasExplicitSections && currentReadingPassage != null) {
                blockPassage = currentReadingPassage;
            }

            String blockSection = pbc != null ? pbc.section : null;

            AiExamParseResponse.AiQuestionDto q = parseBlock(
                    block, qi, answerKey, blockPassage, blockSection);

            if (q != null) {
                // If the block carries an explicit Skill: line, surface it as
                // a category hint so sanitize() / inferCategorySemantic keep it.
                if (pbc != null && pbc.explicitCategory != null) {
                    q.setCategory(pbc.explicitCategory);
                }
                questions.add(q);
            }
        }
        return questions;
    }

    /**
     * Extract passage content from the original text using the PerBlockContext's passage info.
     */
    private static String extractPassageFromOriginal(
            PerBlockContext pbc,
            String originalText,
            List<int[]> passageRanges) {
        if (pbc == null || pbc.passage == null) return null;
        // The pbc.passage field already contains the passage text from buildBlockContextForSplit.
        // Just return it directly.
        return pbc.passage;
    }

    /**
     * Section + passage context for a single normalized text.
     *
     * <p>The text is partitioned by line. For each line index we record:
     * <ul>
     *   <li>The active section (Vocabulary / Grammar / Reading / null)</li>
     *   <li>The active passage (if any) — set after a PASSAGE_HEADER and only
     *       within a Reading section</li>
     *   <li>The active explicit category for the current question block (only
     *       set when an in-block "Skill: X" line is found in that block)</li>
     * </ul>
     */
    private static final class BlockContext {
        boolean hasExplicitSections;
        final List<PerBlockContext> perBlock = new ArrayList<>();
        final List<int[]> passageRanges = new ArrayList<>();

        BlockContext() {
        }
    }

    private static final class PerBlockContext {
        /** Active section at this block's start line; may be null. */
        String section;
        /** Active passage for this block; null if no passage applies. */
        String passage;
        /** Explicit Skill: category hint inside the block, or null. */
        String explicitCategory;
        /** True if this block was created by a passage header split (no question marker). */
        boolean isPassageBlock;
    }

    /**
     * Walk the normalized text and build a per-block context (section, passage,
     * explicit skill). Blocks here are LINE ranges, NOT yet the post-splitIntoBlocks
     * question blocks. The mapping between line ranges and post-split blocks is
     * approximate but sufficient because every question starts with a number
     * marker that matches QUESTION_MARKER_SIMPLE.
     */
    private static BlockContext buildBlockContext(String normalized) {
        BlockContext out = new BlockContext();

        Matcher secHead = SECTION_HEADER.matcher(normalized);
        boolean hasAnySkillHeader = secHead.find();
        out.hasExplicitSections = hasAnySkillHeader;

        // 1. Collect all passage ranges
        Matcher passHead = PASSAGE_HEADER.matcher(normalized);
        while (passHead.find()) {
            int[] bounds = findPassageBoundariesFrom(normalized, passHead.start());
            if (bounds != null) {
                boolean duplicate = false;
                for (int[] r : out.passageRanges) {
                    if (r[0] == bounds[0] && r[1] == bounds[1]) {
                        duplicate = true;
                        break;
                    }
                }
                if (!duplicate) {
                    out.passageRanges.add(bounds);
                }
            }
        }

        // 2. Walk every question-marker line
        secHead = SECTION_HEADER.matcher(normalized);
        Matcher qHead = QUESTION_MARKER_SIMPLE.matcher(normalized);

        String activeSection = null;
        int secCursor = 0;

        while (qHead.find()) {
            int markerStart = qHead.start();

            // Update activeSection: latest SECTION_HEADER at or before markerStart
            if (hasAnySkillHeader) {
                while (secCursor < normalized.length()) {
                    if (secHead.find(secCursor)) {
                        if (secHead.start() <= markerStart) {
                            activeSection = normalizeSectionName(secHead.group(2));
                            secCursor = secHead.end();
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
            }

            // Update passage: latest passage-header at or before markerStart
            String activePassage = null;
            if ("Reading".equals(activeSection) || activeSection == null) {
                int sectionStartPos = (activeSection != null) ? lastSectionHeaderPosAt(normalized, markerStart) : -1;
                int latestPassagePos = -1;
                for (int[] range : out.passageRanges) {
                    int startPos = range[0];
                    if (startPos <= markerStart && startPos >= sectionStartPos) {
                        if (startPos > latestPassagePos) {
                            latestPassagePos = startPos;
                        }
                    }
                }
                if (latestPassagePos >= 0) {
                    for (int[] range : out.passageRanges) {
                        if (range[0] == latestPassagePos) {
                            activePassage = normalized.substring(range[0], range[1]).trim();
                            break;
                        }
                    }
                }
            }

            PerBlockContext pbc = new PerBlockContext();
            pbc.section = activeSection;
            pbc.passage = activePassage;
            pbc.explicitCategory = findExplicitSkillInBlockStartingAt(normalized, markerStart);
            out.perBlock.add(pbc);
        }

        if (out.perBlock.isEmpty()) {
            out.perBlock.add(new PerBlockContext());
        }
        return out;
    }

    /**
     * Build block context for use with splitIntoBlocks.
     * Walks the original text tracking passage headers that will appear as orphaned
     * single-line blocks in the stripped text (the passage body is removed by
     * stripAllPassages, leaving only the header line).
     *
     * <p>For each orphaned passage header, this method assigns the passage context
     * to the *following* question block (the one whose number marker immediately
     * follows the header). No extra perBlock entry is emitted for the passage-only
     * block since splitIntoBlocks will not produce one (the orphan marker at the
     * passage start is consumed without creating a separate block).
     */
    private static BlockContext buildBlockContextForSplit(String normalized) {
        BlockContext out = new BlockContext();

        Matcher secHead = SECTION_HEADER.matcher(normalized);
        boolean hasAnySkillHeader = secHead.find();
        out.hasExplicitSections = hasAnySkillHeader;

        // Collect passage ranges from PASSAGE_HEADER (used to extract passage content)
        Matcher passHead = PASSAGE_HEADER.matcher(normalized);
        while (passHead.find()) {
            int[] bounds = findPassageBoundariesFrom(normalized, passHead.start());
            if (bounds != null) {
                boolean duplicate = false;
                for (int[] r : out.passageRanges) {
                    if (r[0] == bounds[0] && r[1] == bounds[1]) {
                        duplicate = true;
                        break;
                    }
                }
                if (!duplicate) {
                    out.passageRanges.add(bounds);
                }
            }
        }

        // Walk question markers. For each question preceded by a passage header
        // (the header will become an orphaned single-line block after stripping),
        // assign the passage context directly to this question block.
        // No extra perBlock entry is emitted for the orphaned header since
        // splitIntoBlocks consumes the orphan marker without producing a block for it.
        Matcher qHead = QUESTION_MARKER_SIMPLE.matcher(normalized);
        // Use passageRanges to detect which questions are preceded by a passage.
        // insertOrphanMarkers puts the orphan marker at r[0], so after stripping,
        // the orphaned header line appears between the orphan marker and the question number.
        // We use the same r[0] position to find the matching header.
        String activeSection = null;
        int secCursor = 0;

        while (qHead.find()) {
            int markerStart = qHead.start();

            // Update activeSection: latest SECTION_HEADER at or before markerStart
            if (hasAnySkillHeader) {
                secHead = SECTION_HEADER.matcher(normalized);
                secCursor = 0;
                while (secCursor < normalized.length()) {
                    if (secHead.find(secCursor)) {
                        if (secHead.start() <= markerStart) {
                            activeSection = normalizeSectionName(secHead.group(2));
                            secCursor = secHead.end();
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
            }

            // Check if this question is preceded by a passage whose body will be stripped.
            // A question is preceded by a passage if there is a passage range whose r[1]
            // (passage end, right before the next numbered question) is <= markerStart.
            // We look for the most recent such passage.
            String activePassage = null;
            if ("Reading".equals(activeSection) || activeSection == null) {
                int bestPassagePos = -1;
                for (int[] r : out.passageRanges) {
                    int sectionStartPos = (activeSection != null) ? lastSectionHeaderPosAt(normalized, r[0]) : -1;
                    // Check if this passage is inside the active section and ends before this marker
                    if (r[1] <= markerStart && r[1] > bestPassagePos) {
                        // Verify it's inside the active section
                        if (activeSection != null) {
                            if (sectionStartPos >= 0 && sectionStartPos <= r[0]) {
                                bestPassagePos = r[1];
                            }
                        } else {
                            bestPassagePos = r[1];
                        }
                    }
                }
                if (bestPassagePos >= 0) {
                    for (int[] r : out.passageRanges) {
                        if (r[1] == bestPassagePos) {
                            activePassage = extractPassageContentAt(normalized, r[0], out.passageRanges);
                            break;
                        }
                    }
                }
            }

            // Emit PerBlockContext for the question block
            PerBlockContext pbc = new PerBlockContext();
            pbc.section = activeSection;
            pbc.passage = activePassage;
            pbc.explicitCategory = findExplicitSkillInBlockStartingAt(normalized, markerStart);
            out.perBlock.add(pbc);
        }

        if (out.perBlock.isEmpty()) {
            out.perBlock.add(new PerBlockContext());
        }
        return out;
    }

    /**
     * Extract the full passage text starting at the given position.
     */
    private static String extractPassageContentAt(String normalized, int passStart, List<int[]> passageRanges) {
        for (int[] range : passageRanges) {
            if (range[0] == passStart) {
                return normalized.substring(range[0], range[1]).trim();
            }
        }
        return null;
    }

    private static String normalizeSectionName(String raw) {
        if (raw == null) return null;
        String lc = raw.toLowerCase();
        if (lc.startsWith("vocab")) return "Vocabulary";
        if (lc.startsWith("gramm")) return "Grammar";
        if (lc.startsWith("read")) return "Reading";
        if (lc.startsWith("lect")) return "Reading"; // Lecture (FR)
        return null;
    }

    /**
     * Returns the position of the most recent SECTION_HEADER line at or before
     * {@code atPos}. Used to verify a passage-header is inside the active
     * Reading section rather than a previous section's tail.
     */
    private static int lastSectionHeaderPosAt(String normalized, int atPos) {
        Matcher m = SECTION_HEADER.matcher(normalized);
        int last = -1;
        while (m.find()) {
            if (m.start() <= atPos) {
                last = m.start();
            } else {
                break;
            }
        }
        return last;
    }

    /**
     * Scan up to 6 lines starting at {@code markerStart} for an in-block
     * "Skill: X" line. Returns the canonical category name (Vocabulary /
     * Grammar / Reading) or null if not found. Used to detect the user's
     * standard mixed format where each question carries its own "Skill: X"
     * hint.
     */
    private static String findExplicitSkillInBlockStartingAt(String normalized, int markerStart) {
        // Find end of block = next QUESTION_MARKER_SIMPLE or end-of-text
        Matcher qm = QUESTION_MARKER_SIMPLE.matcher(normalized);
        int blockEnd = normalized.length();
        if (qm.find(markerStart + 1)) {
            blockEnd = qm.start();
        }
        String block = normalized.substring(markerStart, blockEnd);
        Matcher m = INBLOCK_SKILL_LINE.matcher(block);
        if (m.find()) {
            return normalizeSectionName(m.group(1));
        }
        return null;
    }

    /**
     * Insert orphan question markers into the original text BEFORE stripAllPassages.
     * These markers mark where questions that were preceded by a passage will appear
     * after the passage is stripped, so splitIntoBlocks can find them.
     */
    private static String insertOrphanMarkers(String normalized, BlockContext ctx) {
        // Collect all positions where orphan markers should go.
        // An orphan marker is placed at the START of each stripped passage so that
        // after stripAllPassages removes the passage body, the marker appears
        // between the previous question's content and the orphaned passage header.
        // splitIntoBlocks handles the orphan header by emitting it as a separate
        // block and placing an orphan marker at the end of the header line so the
        // following question starts a fresh block.
        List<int[]> orphanRanges = new ArrayList<>();
        for (int[] r : ctx.passageRanges) {
            boolean shouldStrip = true;
            if (ctx.hasExplicitSections) {
                int sectionStart = lastSectionHeaderPosAt(normalized, r[0]);
                String activeSec = null;
                if (sectionStart >= 0) {
                    Matcher m = SECTION_HEADER.matcher(normalized);
                    if (m.find(sectionStart)) {
                        activeSec = normalizeSectionName(m.group(2));
                    }
                }
                shouldStrip = "Reading".equals(activeSec);
            }
            if (shouldStrip) {
                // Check if there are question markers inside the passage body
                String passageBody = normalized.substring(r[0], Math.min(r[1], normalized.length()));
                Matcher qInPassage = QUESTION_MARKER_SIMPLE.matcher(passageBody);
                if (qInPassage.find()) {
                    orphanRanges.add(new int[]{r[0], r[1]});
                }
            }
        }

        if (orphanRanges.isEmpty()) {
            return normalized;
        }

        // Sort by position descending so inserting from the end doesn't shift earlier offsets
        orphanRanges.sort((a, b) -> Integer.compare(b[0], a[0]));

        StringBuilder sb = new StringBuilder(normalized);
        for (int[] r : orphanRanges) {
            // Place marker at passage START so it survives stripAllPassages.
            // The marker appears between the previous question's answer and the
            // orphaned passage header in the stripped text.
            sb.insert(r[0], ORPHAN_QUESTION_MARKER);
        }
        return sb.toString();
    }

    /**
     * Strip every passage block that sits inside a Reading section, so the
     * resulting text can be safely split into question blocks without the
     * passage itself becoming a spurious block.
     *
     * <p>Passage blocks outside any Reading section are left untouched (legacy
     * behavior).
     */
    private static String stripAllPassages(String normalized, BlockContext ctx) {
        List<int[]> excludeRanges = new ArrayList<>();
        for (int[] r : ctx.passageRanges) {
            boolean shouldStrip = true;
            if (ctx.hasExplicitSections) {
                int sectionStart = lastSectionHeaderPosAt(normalized, r[0]);
                String activeSec = null;
                if (sectionStart >= 0) {
                    Matcher m = SECTION_HEADER.matcher(normalized);
                    if (m.find(sectionStart)) {
                        activeSec = normalizeSectionName(m.group(2));
                    }
                }
                shouldStrip = "Reading".equals(activeSec);
            }
            if (shouldStrip) {
                int headerStart = -1;
                Matcher ph = PASSAGE_HEADER.matcher(normalized);
                while (ph.find()) {
                    int nextBodyStart = skipLeadingNewlines(normalized, ph.end());
                    if (nextBodyStart == r[0]) {
                        headerStart = ph.start();
                        break;
                    }
                }
                int stripStart = (headerStart >= 0) ? headerStart : r[0];
                excludeRanges.add(new int[]{stripStart, r[1]});
            }
        }

        excludeRanges.sort((a, b) -> Integer.compare(a[0], b[0]));

        StringBuilder sb = new StringBuilder();
        int lastIndex = 0;
        for (int[] range : excludeRanges) {
            if (range[0] > lastIndex) {
                sb.append(normalized, lastIndex, range[0]).append("\n\n");
            }
            lastIndex = range[1];
        }
        if (lastIndex < normalized.length()) {
            sb.append(normalized, lastIndex, normalized.length());
        }
        return sb.toString().trim();
    }

    private static String findAndRemovePassage(String normalized) {
        int[] bounds = findPassageBoundaries(normalized);
        if (bounds == null) return null;
        int passageStart = bounds[0];
        int passageEnd = bounds[1];
        return normalized.substring(passageStart, passageEnd).trim();
    }

    private static int[] findPassageBoundaries(String normalized) {
        return findPassageBoundariesFrom(normalized, 0);
    }

    private static int[] findPassageBoundariesFrom(String normalized, int startSearchPos) {
        Matcher header = PASSAGE_HEADER.matcher(normalized);
        if (header.find(startSearchPos)) {
            int headerStart = header.start();
            int headerEnd = header.end();

            int bodyStart = skipLeadingNewlines(normalized, headerEnd);
            String afterHeader = normalized.substring(bodyStart);

            // Find where passage ends (numbered question or Cau/Câu N)
            Pattern passageEnd = Pattern.compile("(?m)^\\s*(?:\\d+[.):]|C[âa]?u\\s*\\d+)");
            Matcher endMatcher = passageEnd.matcher(afterHeader);

            int passageEndIndex;
            if (endMatcher.find()) {
                passageEndIndex = endMatcher.start();
            } else {
                passageEndIndex = -1;
                for (int i = 0; i + 2 < afterHeader.length(); i++) {
                    if (afterHeader.charAt(i) >= '0' && afterHeader.charAt(i) <= '9') {
                        char next = afterHeader.charAt(i + 1);
                        if (next == '.' || next == ')') {
                            char afterNext = afterHeader.charAt(i + 2);
                            if (afterNext == ' ' || afterNext > 0x2000) {
                                passageEndIndex = i;
                                break;
                            }
                        }
                    }
                }
                if (passageEndIndex < 0) {
                    passageEndIndex = afterHeader.length();
                }
            }

            String passage = afterHeader.substring(0, passageEndIndex).trim();
            if (passage.length() >= 10) {
                int passageStart = bodyStart;
                int passageEndOffset = bodyStart + passageEndIndex;
                return new int[]{passageStart, passageEndOffset};
            }
        }
        return null;
    }

    private static int skipLeadingNewlines(String s, int start) {
        int pos = start;
        while (pos < s.length()) {
            char c = s.charAt(pos);
            if (c == '\n' || c == '\r' || c == ' ' || c == '\t') {
                pos++;
            } else {
                break;
            }
        }
        return pos;
    }

    /**
     * Remove the passage block from text so it doesn't create spurious question blocks.
     */
    private static String removePassageBlock(String normalized) {
        int[] bounds = findPassageBoundaries(normalized);
        if (bounds == null) {
            return normalized;
        }
        int passageStart = bounds[0];
        int passageEnd = bounds[1];
        return normalized.substring(0, passageStart).trim()
                + "\n\n"
                + normalized.substring(passageEnd).trim();
    }

    private static List<String> splitIntoBlocks(String text) {
        List<String> blocks = new ArrayList<>();
        Matcher m = QUESTION_MARKER_SIMPLE.matcher(text);
        Matcher passSplit = PASSAGE_HEADER_SPLITTER.matcher(text);
        if (!passSplit.find()) {
            passSplit = null;
        }
        int blockStart = -1;
        int passSplitPos = passSplit != null ? passSplit.start() : Integer.MAX_VALUE;

        while (m.find()) {
            int markerStart = m.start();
            // If a passage header appears before the next question marker, treat it as a block boundary.
            // Emit the previous block up to the passage header (NOT including it), then emit the
            // passage header as its own block, then continue with the question at markerStart.
            if (passSplit != null && passSplit.start() < markerStart) {
                // Emit any accumulated block so far (before this passage)
                if (blockStart >= 0) {
                    String block = text.substring(blockStart, passSplit.start()).trim();
                    if (isValidBlock(block)) {
                        blocks.add(block);
                    }
                }
                // Emit the passage line as its own block
                int passEnd = passSplit.end();
                String passBlock = text.substring(passSplit.start(), passEnd).trim();
                if (isValidBlock(passBlock)) {
                    blocks.add(passBlock);
                }
                blockStart = markerStart;
                // Advance passSplit to the next passage header
                if (passSplit.find(passEnd)) {
                    passSplitPos = passSplit.start();
                } else {
                    passSplit = null;
                    passSplitPos = Integer.MAX_VALUE;
                }
            } else {
                // Check if an orphan question marker appears between blockStart and markerStart.
                // This happens when stripAllPassages removed a passage body but left the
                // passage header line (now orphaned). The orphan marker was placed at the
                // start of the passage so it appears between the previous question and
                // the orphaned header. We emit everything up to the orphan marker as
                // a valid block, then skip past it so the orphaned header gets its
                // own processing below.
                if (blockStart >= 0) {
                    int orphanPos = text.indexOf(ORPHAN_QUESTION_MARKER, blockStart);
                    while (orphanPos >= 0 && orphanPos < markerStart) {
                        // Emit block from blockStart to orphan marker
                        String block = text.substring(blockStart, orphanPos).trim();
                        if (isValidBlock(block)) {
                            blocks.add(block);
                        }
                        blockStart = orphanPos + ORPHAN_QUESTION_MARKER.length();
                        orphanPos = text.indexOf(ORPHAN_QUESTION_MARKER, blockStart);
                    }
                    // After consuming orphan markers, check if orphaned passage header(s) now
                    // appear at the start of the current block (between blockStart and markerStart).
                    // Emit each orphaned header as a separate block and skip it.
                    Matcher orphanHeader = PASSAGE_HEADER_SPLITTER.matcher(text);
                    while (orphanHeader.find(blockStart) && orphanHeader.start() < markerStart) {
                        int headerEnd = orphanHeader.end();
                        String orphanBlock = text.substring(blockStart, headerEnd).trim();
                        if (isValidBlock(orphanBlock)) {
                            blocks.add(orphanBlock);
                        }
                        blockStart = headerEnd;
                    }
                }
                if (blockStart >= 0) {
                    String block = text.substring(blockStart, markerStart).trim();
                    if (isValidBlock(block)) {
                        blocks.add(block);
                    }
                }
                blockStart = markerStart;
            }
        }

        if (blockStart >= 0) {
            String last = text.substring(blockStart).trim();
            if (isValidBlock(last)) {
                blocks.add(last);
            }
        }

        if (blocks.isEmpty()) {
            blocks.add(text.trim());
        }

        // Fail-safe assertions: verify block integrity
        assertBlockIntegrity(blocks, text);

        return blocks;
    }

    /**
     * Fail-safe assertion: verify no block contains more than one numbered question marker,
     * and no Reading block contains two "Reading Passage:" headers.
     * Logs and rejects (returns empty) with a clear parser reason if invariant is violated.
     */
    private static void assertBlockIntegrity(List<String> blocks, String originalText) {
        Pattern numberedQ = Pattern.compile("(?m)^\\s*\\d+[.):]");
        Pattern passageHeader = Pattern.compile("(?im)^\\s*reading\\s*passage\\s*[:\\-]");
        for (int i = 0; i < blocks.size(); i++) {
            String block = blocks.get(i);
            java.util.regex.Matcher qm = numberedQ.matcher(block);
            int count = 0;
            while (qm.find()) count++;
            if (count > 1) {
                log.warn("[Parser Assertion] Block {} contains {} numbered question markers (expected 1). " +
                        "Block: {}", i, count, block.substring(0, Math.min(100, block.length())));
                // Don't throw — return empty to signal failure to caller
                blocks.clear();
                return;
            }
            java.util.regex.Matcher phm = passageHeader.matcher(block);
            int pcount = 0;
            while (phm.find()) pcount++;
            if (pcount > 1) {
                log.warn("[Parser Assertion] Block {} contains {} Reading Passage headers (expected 1). " +
                        "Block: {}", i, pcount, block.substring(0, Math.min(100, block.length())));
                blocks.clear();
                return;
            }
        }
    }

    /**
     * Check if a block looks like a valid question block (not just explanation or blank).
     */
    private static boolean isValidBlock(String block) {
        if (block == null || block.isBlank()) return false;
        // Too short to be a real question
        if (block.length() < 10) return false;
        // Looks like only an explanation line
        if (block.toLowerCase().matches("(?i)^\\s*(?:explanation|giải\\s*thích|note|解説)[:.]?.*")) {
            return false;
        }
        return true;
    }

    private static Map<String, String> extractAnswerKey(String text) {
        Map<String, String> map = new java.util.LinkedHashMap<>();

        Matcher header = ANSWER_KEY_HEADER.matcher(text);
        int keyStart = -1;
        while (header.find()) {
            keyStart = header.end();
        }

        String section;
        if (keyStart >= 0) {
            section = text.substring(keyStart);
            int para = section.indexOf("\n\n");
            if (para >= 0) section = section.substring(0, para);
        } else {
            Matcher tk = TRAILING_KEY_BLOCK.matcher(text);
            if (tk.find()) {
                section = tk.group(1);
            } else {
                section = "";
            }
        }

        Matcher em = ANSWER_KEY_ENTRY.matcher(section.isBlank() ? text : section);
        while (em.find()) {
            map.put(em.group(1), em.group(2).toUpperCase());
        }

        return map;
    }

    private static AiExamParseResponse.AiQuestionDto parseBlock(
            String block, int index, Map<String, String> answerKey, String currentPassage) {
        return parseBlock(block, index, answerKey, currentPassage, null);
    }

    /**
     * Extended parseBlock that accepts an explicit section hint. When
     * {@code explicitSection} is non-null and one of Vocabulary / Grammar /
     * Reading, the question's final category is forced to that value
     * (returned by the caller after parseBlock sets content + answers).
     */
    private static AiExamParseResponse.AiQuestionDto parseBlock(
            String block, int index, Map<String, String> answerKey,
            String currentPassage, String explicitSection) {

        // 1. Find inline correct-answer indicator
        String correctLetter = null;
        String correctText = null;

        Matcher al = ANSWER_LINE.matcher(block);
        if (al.find()) {
            String raw = al.group(1).trim();
            // Handle Japanese 一二三四
            if (raw.matches("[一二三四]")) {
                String[] jp = {"一", "二", "三", "四"};
                String[] en = {"A", "B", "C", "D"};
                for (int i = 0; i < jp.length; i++) {
                    if (raw.equals(jp[i])) {
                        correctLetter = en[i];
                        break;
                    }
                }
            } else {
                correctLetter = raw.toUpperCase();
            }
        }

        Matcher atl = ANSWER_LINE_TEXT.matcher(block);
        if (atl.find()) {
            String raw = atl.group(1).trim();
            if (correctLetter == null && raw.length() <= 5 && raw.matches("[A-Da-d]")) {
                correctLetter = raw.toUpperCase();
            } else if (correctLetter == null && raw.length() <= 2 && raw.matches("[一二三四]")) {
                String[] jp = {"一", "二", "三", "四"};
                String[] en = {"A", "B", "C", "D"};
                for (int i = 0; i < jp.length; i++) {
                    if (raw.equals(jp[i])) {
                        correctLetter = en[i];
                        break;
                    }
                }
            } else {
                correctText = raw;
            }
        }

        // 2. Fall back to answer-key map
        if (correctLetter == null) {
            String fromKey = answerKey.get(String.valueOf(index + 1));
            if (fromKey != null) correctLetter = fromKey.toUpperCase();
        }

        // 2b. Extract correctText/referenceAnswer
        Matcher ctl = CORRECT_TEXT_LINE.matcher(block);
        if (ctl.find()) {
            correctText = ctl.group(1).trim();
        }
        Matcher ral = REFERENCE_ANSWER_LINE.matcher(block);
        if (ral.find()) {
            correctText = ral.group(1).trim();
        }

        // 3. Parse options
        List<String[]> rawOptions = new ArrayList<>();
        Matcher ol = OPTION_LINE.matcher(block);
        while (ol.find()) {
            // Skip answer annotation lines (e.g., "Correct answer: A", "Answer: B", "Đáp án: C")
            if (isAnswerAnnotationLine(ol.group(0))) continue;
            String letter = ol.group(1);
            // Normalize fullwidth and Japanese hiragana to ASCII
            letter = normalizeOptionLetter(letter);
            rawOptions.add(new String[]{letter, ol.group(2).trim()});
        }

        if (rawOptions.isEmpty()) {
            Matcher inline = OPTION_INLINE.matcher(block);
            while (inline.find()) {
                rawOptions.add(new String[]{inline.group(1).toUpperCase(), inline.group(2).trim()});
            }
        }

        List<AiExamParseResponse.AiAnswerDto> answers = new ArrayList<>();
        String inferredType = "MULTIPLE_CHOICE";
        if (block.toLowerCase().contains("true/false") || block.toLowerCase().contains("true / false") 
                || block.toLowerCase().contains("đúng/sai") || block.toLowerCase().contains("đúng hay sai")) {
            inferredType = "TRUE_FALSE";
        } else if (block.toLowerCase().contains("fill in the blank") || block.toLowerCase().contains("điền vào chỗ trống") 
                || CORRECT_TEXT_LINE.matcher(block).find()) {
            inferredType = "FILL_BLANK";
        } else if (REFERENCE_ANSWER_LINE.matcher(block).find() || block.toLowerCase().contains("short answer")) {
            inferredType = "SHORT_ANSWER";
        }

        if (rawOptions.isEmpty()) {
            if ("TRUE_FALSE".equals(inferredType)) {
                String ansText = (correctText != null) ? correctText : "";
                boolean isTrueCorrect = ansText.toLowerCase().contains("true") 
                        || ansText.toLowerCase().contains("đúng")
                        || "true".equalsIgnoreCase(correctLetter);
                
                AiExamParseResponse.AiAnswerDto a1 = new AiExamParseResponse.AiAnswerDto();
                a1.setContent("True");
                a1.setIsCorrect(isTrueCorrect);
                
                AiExamParseResponse.AiAnswerDto a2 = new AiExamParseResponse.AiAnswerDto();
                a2.setContent("False");
                a2.setIsCorrect(!isTrueCorrect);
                
                answers.add(a1);
                answers.add(a2);
            } else if ("FILL_BLANK".equals(inferredType) || "SHORT_ANSWER".equals(inferredType)) {
                String ansText = (correctText != null) ? correctText : "";
                if (ansText.isEmpty() && correctLetter != null) ansText = correctLetter;
                
                AiExamParseResponse.AiAnswerDto a = new AiExamParseResponse.AiAnswerDto();
                a.setContent(ansText);
                a.setIsCorrect(true);
                answers.add(a);
            } else {
                return null;
            }
        }

        // 4. Extract explanation
        String explanation = "";
        Matcher expMatcher = EXPLANATION_LINE.matcher(block);
        if (expMatcher.find()) {
            explanation = expMatcher.group(1).trim();
        }
        if (explanation.isEmpty()) {
            explanation = "Parsed from PDF.";
        }

        // 5. Extract question text
        String questionText = block.split("\\n")[0].trim();
        // Remove leading "N. " or "N) " or "問N: " etc.
        questionText = questionText.replaceFirst("^\\s*\\d+[.)]\\s+", "");
        questionText = questionText.replaceFirst("^\\s*(?:問|問題|質問|Q)\\s*\\d+[):]?\\s*", "");
        questionText = questionText.replaceFirst("^\\s*Question\\s+\\d+[):]?\\s*", "");
        questionText = questionText.replaceFirst("(?i)^\\s*(?:Câu|Câu\\s*hỏi|Cau|Cau\\s*hoi)\\s*\\d+[):.]?\\s*", "");
        // Strip an inline "Skill: X" hint from the first line so it doesn't
        // become the question text. The category itself is captured by the
        // caller's per-block explicit-category check.
        questionText = questionText.replaceFirst(
                "(?i)^\\s*Skill\\s*[:：]?\\s*(Vocabulary|Grammar|Reading|Vocabulaire|Grammaire|Lecture)\\s*[:：]?\\s*",
                "");
        questionText = questionText.trim();
        // If stripping "Skill: X" leaves the first line blank (the user's
        // standard format puts "Question: ..." on the second line), take the
        // next non-blank line as the question text.
        if (questionText.isEmpty()) {
            String[] lines = block.split("\\n");
            for (int li = 1; li < lines.length; li++) {
                String line = lines[li].trim();
                if (line.isEmpty()) continue;
                // Skip "Question: N." type headers
                line = line.replaceFirst("^\\s*\\d+[.)]\\s+", "");
                line = line.replaceFirst("^\\s*(?:問|問題|質問|Q)\\s*\\d+[):]?\\s*", "");
                line = line.replaceFirst("^\\s*Question\\s+\\d+[):]?\\s*", "");
                line = line.replaceFirst("^\\s*Question\\s*[:：]?\\s*", "");
                line = line.replaceFirst("(?i)^\\s*(?:Câu|Câu\\s*hỏi|Cau|Cau\\s*hoi)\\s*\\d+[):.]?\\s*", "");
                line = line.replaceFirst(
                        "(?i)^\\s*Skill\\s*[:：]?\\s*(Vocabulary|Grammar|Reading|Vocabulaire|Grammaire|Lecture)\\s*[:：]?\\s*",
                        "");
                line = line.trim();
                if (!line.isEmpty()) {
                    questionText = line;
                    break;
                }
            }
        }
        if (questionText.length() > 500) {
            questionText = questionText.substring(0, 500);
        }

        // 6. Set readingPassage/sourcePassage directly from currentPassage.
        //    Do NOT prepend "Read the passage:" to content — that causes truncation
        //    when the 500-char limit is applied. The Reading category is detected
        //    via the readingPassage check in getCategoryFromMetadata.
        String finalContent = questionText;
        // Block passage attachment when the block's explicit section is
        // Vocabulary or Grammar — those sections must never inherit the
        // Reading passage (regression: mixed-skill PDF was tagging all 9
        // questions as Reading).
        boolean sectionAllowsPassage = (explicitSection == null)
                || "Reading".equalsIgnoreCase(explicitSection);
        // Don't prepend to content; readingPassage/sourcePassage carry the passage.
        // The question text alone is the content; the Reading category comes from
        // the readingPassage check in inferCategorySemantic (via sanitize).}

        // 7. Build answers
        int posA = -1, posB = -1, posC = -1, posD = -1;
        int insertIdx = 0;

        if (!rawOptions.isEmpty()) {
            for (String[] opt : rawOptions) {
                String letter = opt[0];
                String content = opt[1];

                if (letter.equals("A") && posA < 0) posA = insertIdx;
                if (letter.equals("B") && posB < 0) posB = insertIdx;
                if (letter.equals("C") && posC < 0) posC = insertIdx;
                if (letter.equals("D") && posD < 0) posD = insertIdx;

                boolean isCorrect = false;
                if (correctLetter != null && letter.equals(correctLetter)) {
                    isCorrect = true;
                }
                if (!isCorrect && correctText != null && !correctText.isBlank()) {
                    isCorrect = content.equalsIgnoreCase(correctText.trim())
                            || content.toLowerCase().contains(correctText.toLowerCase().trim());
                }

                AiExamParseResponse.AiAnswerDto a = new AiExamParseResponse.AiAnswerDto();
                a.setContent(content);
                a.setIsCorrect(isCorrect);
                answers.add(a);
                insertIdx++;
            }
        }

        // 8. Position-based fallback
        if (!rawOptions.isEmpty() && correctLetter != null && answers.stream().noneMatch(a -> Boolean.TRUE.equals(a.getIsCorrect()))) {
            int targetPos = -1;
            if (correctLetter.equals("A")) targetPos = posA;
            else if (correctLetter.equals("B")) targetPos = posB;
            else if (correctLetter.equals("C")) targetPos = posC;
            else if (correctLetter.equals("D")) targetPos = posD;
            if (targetPos >= 0 && targetPos < answers.size()) {
                for (int i = 0; i < answers.size(); i++) {
                    answers.get(i).setIsCorrect(i == targetPos);
                }
            }
        }

        // 9. Default first correct
        if (!rawOptions.isEmpty() && answers.stream().noneMatch(a -> Boolean.TRUE.equals(a.getIsCorrect()))) {
            answers.get(0).setIsCorrect(Boolean.TRUE);
        }

        // 10. Exactly one correct
        boolean first = true;
        for (AiExamParseResponse.AiAnswerDto a : answers) {
            if (Boolean.TRUE.equals(a.getIsCorrect())) {
                if (!first) a.setIsCorrect(Boolean.FALSE);
                first = false;
            }
        }

        // 11. Validate
        if (questionText.isBlank()) {
            return null;
        }
        if ("MULTIPLE_CHOICE".equals(inferredType) && answers.size() < 2) {
            return null;
        }
        if ("TRUE_FALSE".equals(inferredType) && answers.size() != 2) {
            return null;
        }

        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType(inferredType);
        q.setContent(finalContent);
        q.setDifficulty("MEDIUM");
        q.setExplanation(explanation);
        q.setAnswers(answers);
        // Propagate readingPassage/sourcePassage so that inferCategorySemantic in sanitize()
        // can detect Reading via the readingPassage check (getCategoryFromMetadata path).
        // Guard: only set readingPassage when the question's category was NOT explicitly set
        // to Vocabulary or Grammar (those questions have "Skill: Vocabulary/Grammar" in their
        // block content, which sets q.setCategory() in parseBlocksWithContext).
        // Reading questions have "Skill: Reading" in their block, so q.getCategory() would be
        // "Reading" from that explicit setting — but then normalizeCategory returns "Reading"
        // anyway and normalizeCategoryWithReadingPassage skips the override. The readingPassage
        // is still useful for the Reading questions' own field population.
        // We guard on the ORIGINAL category string to avoid overriding explicit Vocab/Grammar.
        if (sectionAllowsPassage && currentPassage != null && !currentPassage.isBlank()) {
            // Only set readingPassage if the question doesn't have an explicit Vocab/Grammar category.
            // The normalizeCategoryWithReadingPassage override in sanitize() will handle
            // the Reading detection for questions where category is null/"unknown".
            String cat = q.getCategory();
            if (!"Vocabulary".equalsIgnoreCase(cat) && !"Grammar".equalsIgnoreCase(cat)) {
                q.setReadingPassage(currentPassage);
                q.setSourcePassage(currentPassage);
            }
        }
        return q;
    }

    /**
     * Normalize option letter to ASCII A-D.
     */
    private static String normalizeOptionLetter(String letter) {
        if (letter == null) return "?";
        String l = letter.trim();
        // ASCII
        if (l.matches("[A-Da-d]")) return l.toUpperCase();
        // Fullwidth Ａ－Ｄ
        if (l.matches("[Ａ-Ｄ]")) {
            char c = l.charAt(0);
            return String.valueOf((char) (c - 'Ａ' + 'A'));
        }
        // Japanese hiragana ア=1, イ=2, ウ=3, エ=4
        switch (l) {
            case "ア": return "A";
            case "イ": return "B";
            case "ウ": return "C";
            case "エ": return "D";
            default: return l;
        }
    }

    // Answer annotation patterns to exclude from options
    private static final Pattern ANSWER_ANNOTATION = Pattern.compile(
            "(?im)^\\s*(?:Correct\\s*(?:answer)?|Answer|Đáp\\s*án|正解|答え)\\s*[:.]?\\s*(.+)$"
    );

    /**
     * Check if a line is an answer annotation (e.g., "Correct answer: A", "Answer: B", "Đáp án: C").
     * These lines should not be treated as options.
     */
    private static boolean isAnswerAnnotationLine(String line) {
        return line != null && ANSWER_ANNOTATION.matcher(line).matches();
    }

    /**
     * Get the line number (0-based) containing the given character offset within the text.
     * Returns -1 if offset is out of bounds.
     */
    private static int getLineContainingOffset(String text, int offset) {
        if (text == null || offset < 0 || offset > text.length()) return -1;
        int lineNum = 0;
        for (int i = 0; i < offset; i++) {
            if (text.charAt(i) == '\n') lineNum++;
        }
        return lineNum;
    }

    // =============================================================
    // PHẦN 2: PUBLIC API for Reading passage parsing pipeline
    // =============================================================

    /**
     * Parse Reading questions from source text, tracking the shared passage.
     * Returns a record with the parsed response and the discovered passage
     * (which can be passed to subsequent calls).
     *
     * <p>Usage:
     * <pre>
     * ReadingParseResult r = parseReadingFromSourceText(extractedText);
     * while (r.questions().isEmpty() && !r.endOfText()) {
     *     r = parseReadingFromSourceText(extractedText, r.discoveredPassage(), r.parsedCount());
     * }
     * </pre>
     */
    public static ReadingParseResult parseReadingFromSourceText(String text, String previousPassage, int skipChars) {
        if (text == null || text.isBlank()) {
            return new ReadingParseResult(AiExamParseResponse.empty(), null, 0, true);
        }
        String normalized = normalizeForEvidence(text);

        // Find passage
        String foundPassage = findAndRemovePassage(normalized);
        String effectivePassage = foundPassage != null ? foundPassage : previousPassage;

        // Skip already-parsed portion
        String remaining = (skipChars > 0 && skipChars < normalized.length())
                ? normalized.substring(Math.min(skipChars, normalized.length()))
                : normalized;

        Map<String, String> answerKey = extractAnswerKey(remaining);
        List<String> blocks = splitIntoBlocks(remaining);

        List<AiExamParseResponse.AiQuestionDto> questions = new ArrayList<>();
        int parsedChars = 0;
        for (int qi = 0; qi < blocks.size(); qi++) {
            String block = blocks.get(qi);
            AiExamParseResponse.AiQuestionDto q = parseBlock(block, qi, answerKey, effectivePassage, null);
            if (q != null) {
                questions.add(q);
                parsedChars += block.length();
            }
        }

        AiExamParseResponse response = new AiExamParseResponse();
        response.setTitle("");
        response.setDescription("Parsed Reading from PDF");
        response.setQuestions(questions);
        sanitize(response);

        return new ReadingParseResult(response, effectivePassage, parsedChars, blocks.isEmpty());
    }

    /**
     * Convenience: parse Reading questions from full text.
     */
    public static ReadingParseResult parseReadingFromSourceText(String text) {
        return parseReadingFromSourceText(text, null, 0);
    }

    /**
     * Result of reading-specific parsing with passage tracking.
     */
    public record ReadingParseResult(
            AiExamParseResponse response,
            String discoveredPassage,
            int parsedCharCount,
            boolean endOfText
    ) {}

    private static boolean checkMalformedCollapse(List<AiExamParseResponse.AiQuestionDto> questions) {
        if (questions == null || questions.isEmpty()) return false;

        Pattern questionMarkerInline = Pattern.compile("(?i)\\b(?:Câu|Question|Câu\\s*hỏi|Cau|Cau\\s*hoi|問|問題|質問)\\s*\\d+");
        Pattern skillMarker = Pattern.compile("(?i)\\bSkill\\b");
        Pattern typeMarker = Pattern.compile("(?i)\\bType\\b");

        for (AiExamParseResponse.AiQuestionDto q : questions) {
            if (q == null) continue;

            boolean isMcq = "MULTIPLE_CHOICE".equalsIgnoreCase(q.getType());
            boolean isTf = "TRUE_FALSE".equalsIgnoreCase(q.getType());
            boolean isDirectAnswer = "FILL_BLANK".equalsIgnoreCase(q.getType()) || "SHORT_ANSWER".equalsIgnoreCase(q.getType());
            int answerCount = q.getAnswers() != null ? q.getAnswers().size() : 0;

            if (isMcq && answerCount > 6) {
                log.warn("[Parser FailSafe] Rejecting malformed MCQ: option count {} exceeds limit 6", answerCount);
                return true;
            }
            if (isTf && answerCount > 0 && answerCount != 2) {
                log.warn("[Parser FailSafe] Rejecting malformed True/False: option count {} is not 2", answerCount);
                return true;
            }
            if (isDirectAnswer && answerCount > 2) {
                log.warn("[Parser FailSafe] Rejecting malformed direct-answer question: option count {} is greater than 2", answerCount);
                return true;
            }
            if (answerCount > 8) {
                log.warn("[Parser FailSafe] Rejecting malformed question: total options count {} exceeds 8", answerCount);
                return true;
            }

            if (q.getAnswers() != null) {
                for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                    if (a.getContent() != null) {
                        if (questionMarkerInline.matcher(a.getContent()).find()) {
                            log.warn("[Parser FailSafe] Rejecting: Option contains embedded question marker: '{}'", a.getContent());
                            return true;
                        }
                        if (skillMarker.matcher(a.getContent()).find() || typeMarker.matcher(a.getContent()).find()) {
                            log.warn("[Parser FailSafe] Rejecting: Option contains embedded metadata marker: '{}'", a.getContent());
                            return true;
                        }
                    }
                }
            }

            if (q.getContent() != null) {
                int skillCount = countOccurrences(q.getContent().toLowerCase(), "skill:");
                int typeCount = countOccurrences(q.getContent().toLowerCase(), "type:");
                if (skillCount > 1 || typeCount > 1) {
                    log.warn("[Parser FailSafe] Rejecting: Multiple metadata markers in question content: skillCount={}, typeCount={}", skillCount, typeCount);
                    return true;
                }
            }
        }
        return false;
    }

    public static boolean isDeterministicValidationFailure(String reason) {
        if (reason == null) return false;
        String normalized = reason.trim().toLowerCase();
        return "off_skill".equals(normalized) || "missing_reading_passage".equals(normalized);
    }

    public static boolean isDeterministicValidationRound(Map<String, Integer> droppedByReason) {
        if (droppedByReason == null || droppedByReason.isEmpty()) return false;
        boolean hasRejection = false;
        for (Map.Entry<String, Integer> entry : droppedByReason.entrySet()) {
            if (entry.getValue() > 0) {
                hasRejection = true;
                if (!isDeterministicValidationFailure(entry.getKey())) {
                    return false;
                }
            }
        }
        return hasRejection;
    }
}

