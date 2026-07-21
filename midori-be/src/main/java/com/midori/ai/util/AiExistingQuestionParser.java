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
    private static final String[] CORRECT_KEYS    = {"isCorrect", "correct", "is_correct", "correctAnswer", "correct_answer", "answer", "correctOption", "correctOptionIndex"};
    private static final String[] OPT_CONTENT_KEYS = {"content", "text", "label", "value", "option"};
    private static final String[] OPT_LABEL_KEYS   = {"label", "key", "letter", "id"};
    private static final String[] CATEGORY_KEYS   = {"category", "section", "categoryName", "questionCategory", "skill", "typeName", "questionSkill"};

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
        result = result.replaceAll("[ \\t]+", " ");
        // Collapse multiple blank lines
        result = result.replaceAll("(?:\n[ \\t]*){2,}", "\n\n");

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
        return s.replaceAll("\\s+", " ").toLowerCase().trim();
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
        String s = content;
        // Remove leading "Read the passage: ...\n\nQuestion: " pattern
        s = s.replaceFirst("(?i)^read\\s*the\\s*passage[^\\n]*\\n+question[:\\s]*", "");
        s = s.replaceFirst("(?i)^read\\s*the\\s*text[^\\n]*\\n+question[:\\s]*", "");
        s = s.replaceFirst("(?i)^reading\\s*passage[^\\n]*\\n+question[:\\s]*", "");
        return s.trim();
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
        if (mapper == null) mapper = new ObjectMapper();
        ObjectMapper m = mapper.copy();
        // Defense in depth: the DTO already declares ignoreUnknown, but this
        // also lets Jackson tolerate weird trailing tokens inside a balanced
        // object. The cleaner should normally extract only the JSON.
        m.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        String extracted = extractGenerateJson(raw);
        if (extracted == null || extracted.isBlank()) {
            throw new IllegalArgumentException("AI returned an invalid response. Please try again.");
        }

        JsonNode root;
        try {
            root = m.readTree(extracted);
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
            return m.treeToValue(root, AiQuizGenerationResponse.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("AI returned an invalid response. Please try again.");
        }
    }

    private static JsonNode readTreeLenient(ObjectMapper mapper, String body) {
        if (mapper == null) mapper = new ObjectMapper();
        if (body == null) return null;
        try {
            return mapper.readTree(body);
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

            JsonNode answersNode = pickField(in, ANSWERS_KEYS);
            ArrayNode answersArr = normalizeAnswers(root, answersNode, pickField(in, CORRECT_KEYS));
            normalized.set("answers", answersArr);
            outQuestions.add(normalized);
        }
        root.set("questions", outQuestions);
        return root;
    }

    private static ArrayNode normalizeAnswers(ObjectNode parent, JsonNode raw, JsonNode directCorrect) {
        ArrayNode out = parent.arrayNode();
        if (raw == null || raw.isNull()) return out;
        if (raw.isArray()) {
            for (JsonNode item : raw) {
                AiAnswerSlot slot = readAsAnswerSlot(item, parent);
                if (slot == null) continue;
                out.add(slot.toNode(parent));
            }
            return out;
        }
        if (raw.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> it = raw.fields();
            while (it.hasNext()) {
                Map.Entry<String, JsonNode> e = it.next();
                AiAnswerSlot slot = readAsAnswerSlot(e.getValue(), parent);
                if (slot == null) continue;
                if (slot.content == null || slot.content.isBlank()) slot.content = e.getKey();
                if (slot.label == null) slot.label = e.getKey();
                out.add(slot.toNode(parent));
            }
            return out;
        }
        if (raw.isTextual()) {
            AiAnswerSlot s = new AiAnswerSlot();
            s.content = raw.asText();
            s.isCorrect = Boolean.FALSE;
            out.add(s.toNode(parent));
        }
        if (out.isEmpty() && directCorrect != null && !directCorrect.isNull()) {
            AiAnswerSlot s = new AiAnswerSlot();
            s.content = directCorrect.isTextual() ? directCorrect.asText() : directCorrect.toString();
            s.isCorrect = Boolean.TRUE;
            out.add(s.toNode(parent));
        }
        return out;
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
        if (parsed.getQuestions() == null) {
            parsed.setQuestions(new ArrayList<>());
        }
        List<AiExamParseResponse.AiQuestionDto> kept = new ArrayList<>();
        for (AiExamParseResponse.AiQuestionDto q : parsed.getQuestions()) {
            if (q == null) continue;
            if (q.getContent() == null || q.getContent().isBlank()) continue;
            if (q.getAnswers() == null || q.getAnswers().isEmpty()) continue;
            for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                if (a.getContent() == null) a.setContent("");
                if (a.getIsCorrect() == null) a.setIsCorrect(Boolean.FALSE);
            }
            long correctCount = q.getAnswers().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                    .count();
            if (correctCount == 0) {
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
            q.setCategory(normalizeCategory(q.getCategory(), q.getContent()));
            kept.add(q);
        }
        parsed.setQuestions(kept);
        return parsed;
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
            if (q.getAnswers() == null || q.getAnswers().isEmpty()) continue;
            for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                if (a.getContent() == null) a.setContent("");
                if (a.getIsCorrect() == null) a.setIsCorrect(Boolean.FALSE);
            }
            long correctCount = q.getAnswers().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                    .count();
            if (correctCount == 0) {
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
        if (parsed.getQuestions() == null) {
            parsed.setQuestions(new ArrayList<>());
        }
        if (selectedSkills == null || selectedSkills.isEmpty()) {
            return sanitize(parsed);
        }
        Set<String> validSkillsLower = new HashSet<>();
        for (String skill : selectedSkills) {
            if (skill != null && !skill.isBlank()) {
                validSkillsLower.add(skill.toUpperCase().trim());
            }
        }
        List<AiExamParseResponse.AiQuestionDto> kept = new ArrayList<>();
        for (AiExamParseResponse.AiQuestionDto q : parsed.getQuestions()) {
            if (q == null) continue;
            if (q.getContent() == null || q.getContent().isBlank()) continue;
            if (q.getAnswers() == null || q.getAnswers().isEmpty()) continue;

            String normalizedCat = normalizeCategoryWithSelectedSkillsList(q.getCategory(), q.getContent(), selectedSkills);
            String catUpper = normalizedCat != null ? normalizedCat.toUpperCase() : "";
            if (!validSkillsLower.contains(catUpper)) {
                continue;
            }
            q.setCategory(normalizedCat);

            for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                if (a.getContent() == null) a.setContent("");
                if (a.getIsCorrect() == null) a.setIsCorrect(Boolean.FALSE);
            }
            long correctCount = q.getAnswers().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                    .count();
            if (correctCount == 0) {
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
            kept.add(q);
        }
        parsed.setQuestions(kept);
        return parsed;
    }

    private static String normalizeCategoryWithSelectedSkillsList(String rawCategory, String questionContent, List<String> selectedSkills) {
        String cat = rawCategory != null ? rawCategory.trim() : "";
        if (!cat.isEmpty()) {
            String lc = cat.toLowerCase();
            if (lc.equals("vocabulary") || lc.equals("grammar") || lc.equals("reading")) {
                return cat.substring(0, 1).toUpperCase() + cat.substring(1).toLowerCase();
            }
        }
        if (selectedSkills != null && selectedSkills.size() == 1) {
            String skill = selectedSkills.get(0);
            if (skill != null && !skill.isBlank()) {
                String lc = skill.toLowerCase();
                if (lc.equals("vocabulary") || lc.equals("grammar") || lc.equals("reading")) {
                    return skill.substring(0, 1).toUpperCase() + skill.substring(1).toLowerCase();
                }
            }
        }
        return inferCategorySemantic(questionContent);
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

        String cat = q.getCategory() != null ? q.getCategory().toLowerCase() : "";
        boolean isReading = cat.contains("read");

        // 1. For Reading: check if passage or question appears in source (soft)
        //    For non-Reading: question text must appear
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

        // 2. At least 2 options must appear in the source.
        List<AiExamParseResponse.AiAnswerDto> answers = q.getAnswers();
        if (answers == null || answers.isEmpty()) {
            return EvidenceCheck.fail("no answers");
        }
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
        if (matchedOptions < 2) {
            return EvidenceCheck.fail(
                    "only " + matchedOptions + " option(s) matched in source (need >=2)");
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

    public static String normalizeCategoryWithTargetSkill(String rawCategory, String questionContent, String targetSkill) {
        String cat = rawCategory != null ? rawCategory.trim() : "";
        if (!cat.isEmpty()) {
            String lc = cat.toLowerCase();
            if (lc.equals("vocabulary") || lc.equals("grammar")
                    || lc.equals("reading") || lc.equals("listening")) {
                return cat.substring(0, 1).toUpperCase() + cat.substring(1).toLowerCase();
            }
        }
        if (targetSkill != null && !targetSkill.isBlank()) {
            String lc = targetSkill.toLowerCase().trim();
            if (lc.equals("vocabulary") || lc.equals("grammar") || lc.equals("reading")) {
                return targetSkill.substring(0, 1).toUpperCase() + targetSkill.substring(1).toLowerCase();
            }
        }
        return inferCategorySemantic(questionContent);
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

    public static String inferCategorySemantic(String content) {
        if (content == null || content.isBlank()) return "Vocabulary";
        String c = content.toLowerCase();

        if (containsAny(c, "trong câu", "in the sentence", "in sentence")
                && (containsAny(c, "biểu thị", "indicate", "means", "nghĩa", "dùng", "chức năng", "express", "function"))) {
            return "Grammar";
        }

        if (containsAny(c, "difference between") && (containsAny(c, "は", "が", "に", "で", "を", "と", "も") || containsAny(c, "particle", "particles"))) {
            return "Grammar";
        }

        // Reading check FIRST and with the broadest Vietnamese/English/Japanese
        // markers — Reading must take priority over Vocabulary when a question
        // asks "Theo bài đọc / Theo passage / Theo đoạn văn ..." etc.
        if (containsAny(c,
                "read the passage", "read the dialogue", "read the text",
                "according to the passage", "based on the text", "based on the passage",
                "according to the text",
                "the passage states", "the passage says", "the text implies",
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
                "文章読解", "読解", "本文", "文章の内容")) {
            return "Reading";
        }

        if (containsAny(c,
                "particle", "trợ từ", "ngữ pháp",
                "mẫu câu", "mẫu", "cấu trúc", "pattern", "sentence pattern", "sentence ending", "sentence structure",
                "dùng để", "cách dùng", "dùng như thế nào", "dùng ra sao",
                "used to", "how to use", "usage of",
                "conjugation", "chia thể", "liên từ", "giới từ",
                "dùng để nói gì", "biểu thị", "diễn đạt", "express",
                "what does the particle", "what does the sentence ending",
                "usually express", "used to express")) {
            return "Grammar";
        }

        if (containsAny(c,
                "nghĩa là gì", "nghĩa tiếng việt", "có nghĩa là", "có nghĩa",
                "what is the meaning", "meaning of",
                "cách đọc", "romaji", "pronunciation",
                "dịch", "translate", "translation")
                || (c.contains("what does") && !c.contains("be inferred"))) {
            return "Vocabulary";
        }

        if (c.contains("「") && (c.contains("mean") || c.contains("nghĩa"))) {
            return "Vocabulary";
        }

        return "Vocabulary";
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
        for (String s : new String[]{"Vocabulary", "Grammar", "Reading", "unknown"}) {
            countsAfterNormalize.put(s, 0);
            countsAfterFilter.put(s, 0);
        }
        for (String reason : new String[]{
                "duplicate_options", "romaji_content", "no_correct_answer",
                "too_few_options", "blank_content", "off_skill",
                "missing_reading_passage"}) {
            dropped.put(reason, 0);
        }

        int rawCount = rawQuestions == null ? 0 : rawQuestions.size();
        List<AiExamParseResponse.AiQuestionDto> out = new ArrayList<>();
        Set<String> allowedSkills = new HashSet<>();
        if (selectedSkills != null) {
            for (String s : selectedSkills) {
                if (s == null) continue;
                String lc = s.trim().toLowerCase();
                if (lc.equals("vocabulary") || lc.equals("grammar") || lc.equals("reading")) {
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
                dropped.merge("blank_content", 1, Integer::sum);
                continue;
            }

            // 1. Re-infer category from content (defense in depth)
            String inferred = inferCategorySemantic(q.getContent());
            q.setCategory(inferred);
            countsAfterNormalize.merge(inferred, 1, Integer::sum);

            // 2. Off-skill filter
            if (!allowedSkills.isEmpty() && !allowedSkills.contains(inferred)) {
                dropped.merge("off_skill", 1, Integer::sum);
                continue;
            }

            // 2b. Reading passage injection (Reading only)
            if ("Reading".equals(inferred)) {
                String[] split = splitQuestionContentForReading(q.getContent());
                String existingPassage = split[0];
                String questionOnly = split[1];
                String chosenPassage = existingPassage;
                if (chosenPassage == null || chosenPassage.isBlank()) {
                    chosenPassage = sourcePassage;
                }
                if (chosenPassage == null || chosenPassage.isBlank()) {
                    dropped.merge("missing_reading_passage", 1, Integer::sum);
                    continue;
                }
                q.setContent(composeReadingContent(chosenPassage, questionOnly));
            }

            // 3. Validate options
            if (q.getAnswers() == null || q.getAnswers().size() < 2) {
                dropped.merge("too_few_options", 1, Integer::sum);
                continue;
            }
            List<String> optionTexts = new ArrayList<>();
            for (var a : q.getAnswers()) {
                optionTexts.add(a == null ? "" : a.getContent() == null ? "" : a.getContent());
            }
            List<Integer> dups = findDuplicateOptionIndices(optionTexts);
            if (!dups.isEmpty()) {
                dropped.merge("duplicate_options", 1, Integer::sum);
                continue;
            }

            // 4. Romaji guard (apply to question + options + explanation)
            StringBuilder blob = new StringBuilder();
            blob.append(q.getContent()).append('\n');
            for (var a : q.getAnswers()) {
                if (a != null && a.getContent() != null) blob.append(a.getContent()).append('\n');
            }
            if (q.getExplanation() != null) blob.append(q.getExplanation()).append('\n');
            if (containsRomaji(blob.toString())) {
                dropped.merge("romaji_content", 1, Integer::sum);
                continue;
            }

            // 5. Exactly one correct answer
            long correctCount = q.getAnswers().stream()
                    .filter(a -> a != null && Boolean.TRUE.equals(a.getIsCorrect()))
                    .count();
            if (correctCount != 1) {
                dropped.merge("no_correct_answer", 1, Integer::sum);
                continue;
            }

            countsAfterFilter.merge(inferred, 1, Integer::sum);
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
        for (String s : new String[]{"Vocabulary", "Grammar", "Reading", "unknown"}) {
            countsAfterNormalize.put(s, 0);
            countsAfterFilter.put(s, 0);
        }
        for (String reason : new String[]{
                "duplicate_options", "romaji_content", "no_correct_answer",
                "too_few_options", "blank_content", "off_skill",
                "missing_reading_passage", "invalid_type_structure"}) {
            dropped.put(reason, 0);
        }

        int rawCount = rawQuestions == null ? 0 : rawQuestions.size();
        List<AiExamParseResponse.AiQuestionDto> out = new ArrayList<>();
        Set<String> allowedSkills = new HashSet<>();
        if (selectedSkills != null) {
            for (String s : selectedSkills) {
                if (s == null) continue;
                String lc = s.trim().toLowerCase();
                if (lc.equals("vocabulary") || lc.equals("grammar") || lc.equals("reading")) {
                    allowedSkills.add(lc.substring(0, 1).toUpperCase() + lc.substring(1));
                }
            }
        }
        if (rawQuestions == null) {
            return new GenerateSanitizeResult(out, rawCount, 0, dropped,
                    countsAfterNormalize, countsAfterFilter, sourcePassage);
        }

        boolean relaxedTypes = expectedType == QuestionType.FILL_BLANK
                || expectedType == QuestionType.SHORT_ANSWER;

        for (AiExamParseResponse.AiQuestionDto q : rawQuestions) {
            if (q == null) continue;
            QuestionType declared = QuestionTypeValidator.normalize(q.getType());
            boolean questionIsRelaxed = (declared == null) ? relaxedTypes : (declared == QuestionType.FILL_BLANK || declared == QuestionType.SHORT_ANSWER);

            if (q.getContent() == null || q.getContent().isBlank()) {
                dropped.merge("blank_content", 1, Integer::sum);
                continue;
            }

            String inferred = inferCategorySemantic(q.getContent());
            q.setCategory(inferred);
            countsAfterNormalize.merge(inferred, 1, Integer::sum);

            if (!allowedSkills.isEmpty() && !allowedSkills.contains(inferred)) {
                dropped.merge("off_skill", 1, Integer::sum);
                continue;
            }

            if ("Reading".equals(inferred)) {
                String[] split = splitQuestionContentForReading(q.getContent());
                String existingPassage = split[0];
                String questionOnly = split[1];
                String chosenPassage = existingPassage;
                if (chosenPassage == null || chosenPassage.isBlank()) {
                    chosenPassage = sourcePassage;
                }
                if (chosenPassage == null || chosenPassage.isBlank()) {
                    dropped.merge("missing_reading_passage", 1, Integer::sum);
                    continue;
                }
                q.setContent(composeReadingContent(chosenPassage, questionOnly));
            }

            if (q.getAnswers() == null || q.getAnswers().isEmpty()) {
                dropped.merge("too_few_options", 1, Integer::sum);
                continue;
            }
            // For MCQ / TRUE_FALSE require ≥ 2 distinct options and exactly 1
            // correct answer. FILL_BLANK / SHORT_ANSWER relax these so a
            // single-text answer slot can survive to the type-repair layer.
            if (!questionIsRelaxed) {
                if (q.getAnswers().size() < 2) {
                    dropped.merge("too_few_options", 1, Integer::sum);
                    continue;
                }
                List<String> optionTexts = new ArrayList<>();
                for (var a : q.getAnswers()) {
                    optionTexts.add(a == null ? "" : a.getContent() == null ? "" : a.getContent());
                }
                List<Integer> dups = findDuplicateOptionIndices(optionTexts);
                if (!dups.isEmpty()) {
                    dropped.merge("duplicate_options", 1, Integer::sum);
                    continue;
                }
                long correctCount = q.getAnswers().stream()
                        .filter(a -> a != null && Boolean.TRUE.equals(a.getIsCorrect()))
                        .count();
                if (correctCount != 1) {
                    dropped.merge("no_correct_answer", 1, Integer::sum);
                    continue;
                }
            }

            // Romaji guard applies to all types including FILL_BLANK.
            StringBuilder blob = new StringBuilder();
            blob.append(q.getContent()).append('\n');
            for (var a : q.getAnswers()) {
                if (a != null && a.getContent() != null) blob.append(a.getContent()).append('\n');
            }
            if (q.getExplanation() != null) blob.append(q.getExplanation()).append('\n');
            if (containsRomaji(blob.toString())) {
                dropped.merge("romaji_content", 1, Integer::sum);
                continue;
            }

            countsAfterFilter.merge(inferred, 1, Integer::sum);
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
            "(?m)^(?:(\\d+)[.)]\\s+|(問|問題|質問|Q)[\\s:]*(\\d+)[.):]?\\s*|Question\\s+(\\d+)[.):]?\\s*)"
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
                    + "passage[:\\s]*|"
                    + "本文[:\\s]*|"
                    + "文章[:\\s]*|"
                    + "đọc\\s*(?:đoạn\\s*văn|bài\\s*đọc)|"
                    + "passage\\s*(?:text)?|"
                    + "text[:\\s]*"
                    + ")[:：]?\\s*(?:\\n|$)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern ANSWER_LINE = Pattern.compile(
            "(?im)^\\s*(?:Correct\\s*(?:answer)?|Answer|Đáp\\s*án|正解|答え)\\s*[:.]?\\s*([A-Da-d]|一二三四)[^A-Za-z]*",
            Pattern.MULTILINE
    );
    private static final Pattern ANSWER_LINE_TEXT = Pattern.compile(
            "(?im)^\\s*(?:Correct\\s*(?:answer)?|Answer|Đáp\\s*án|正解|答え)\\s*[:.]?\\s*(.+)",
            Pattern.MULTILINE
    );

    // Option patterns: A. A) A: Ａ. ア. イ. ウ. エ.
    private static final Pattern OPTION_LINE = Pattern.compile(
            "(?m)^\\s*([A-Da-dＡ-Ｄ]|ア、イ、ウ、エ)[.)::]?\\s*(.+)$"
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

        // 1. Build section/passage context map: for every question block, what
        //    is the active passage (if any) and active section at that point.
        BlockContext ctx = buildBlockContext(normalized);

        // 2. Remove the passage block from text so it doesn't create spurious
        //    question blocks. Keep backward-compat: if no Skill: section
        //    header was found AND the global findAndRemovePassage works, use
        //    that path (preserves the legacy single-skill Reading PDF test).
        String textForBlocks;
        if (ctx.hasExplicitSections) {
            textForBlocks = stripPassageBlocksInReadingSections(normalized, ctx);
        } else {
            int[] bounds = findPassageBoundaries(normalized);
            if (bounds != null) {
                textForBlocks = normalized.substring(0, bounds[0]).trim()
                        + "\n\n"
                        + normalized.substring(bounds[1]).trim();
            } else {
                textForBlocks = normalized;
            }
        }

        // 3. Build answer-key map
        Map<String, String> answerKey = extractAnswerKey(textForBlocks);

        // 4. Split into question blocks
        List<String> blocks = splitIntoBlocks(textForBlocks);

        // 5. Parse each block with its own passage context (NOT a global passage)
        List<AiExamParseResponse.AiQuestionDto> questions = new ArrayList<>();
        for (int qi = 0; qi < blocks.size(); qi++) {
            String block = blocks.get(qi);
            PerBlockContext pbc = ctx.perBlock.get(Math.min(qi, ctx.perBlock.size() - 1));
            String blockPassage = null;
            if (pbc != null && pbc.passage != null) {
                blockPassage = pbc.passage;
            } else if (!ctx.hasExplicitSections && currentReadingPassage != null) {
                // Legacy behavior: when no Skill: section was found, fall back
                // to caller-provided passage (existing API contract).
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

        // 6. Build response
        AiExamParseResponse response = new AiExamParseResponse();
        response.setTitle("");
        response.setDescription("Parsed from PDF text");
        response.setQuestions(questions);
        return sanitize(response);
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

        // First, did the document declare any Skill: section header?
        Matcher secHead = SECTION_HEADER.matcher(normalized);
        boolean hasAnySkillHeader = secHead.find();
        out.hasExplicitSections = hasAnySkillHeader;

        if (!hasAnySkillHeader) {
            // Legacy path: no Skill: sections in this PDF. Build perBlock
            // entries only for the question markers we find, so the caller's
            // per-block indexing in parseFromSourceText always has a context
            // entry to read. Without this, blocks.size() > perBlock.size()
            // causes IndexOutOfBoundsException.
            Matcher qm = QUESTION_MARKER_SIMPLE.matcher(normalized);
            while (qm.find()) {
                out.perBlock.add(new PerBlockContext());
            }
            // If splitIntoBlocks later adds a fallback whole-text block,
            // ensure perBlock is at least size 1 to satisfy index math.
            if (out.perBlock.isEmpty()) {
                out.perBlock.add(new PerBlockContext());
            }
            return out;
        }

        // Second pass: walk every question-marker line, snapshot the
        // section/passage/explicitSkill that are active at that line.
        secHead = SECTION_HEADER.matcher(normalized);
        Matcher passHead = PASSAGE_HEADER.matcher(normalized);
        Matcher qHead = QUESTION_MARKER_SIMPLE.matcher(normalized);

        String activeSection = null;
        String activePassage = null;
        // Last passage header position (char offset) seen in current Reading section
        int lastPassageStart = -1;
        // Track each passage header's [start, end) so we can extract passage text
        // for that specific occurrence only.
        List<int[]> passageRanges = new ArrayList<>();
        while (passHead.find()) {
            passageRanges.add(new int[]{passHead.start(), passHead.end()});
        }
        // Active passage (string) keyed by the passage-header position
        Map<Integer, String> passageTextByStart = new HashMap<>();
        for (int[] r : passageRanges) {
            int[] bounds = findPassageBoundaries(normalized);
            if (bounds != null) {
                String text = normalized.substring(bounds[0], bounds[1]).trim();
                if (text.length() >= 10) {
                    passageTextByStart.put(r[0], text);
                }
            }
            // findPassageBoundaries only returns the FIRST match — for our
            // typical case (one Reading section per PDF) this is fine.
            break;
        }

        // Reset secHead to walk again from the top.
        secHead = SECTION_HEADER.matcher(normalized);

        // For each question-marker line, determine the active section by
        // walking forward from the previous marker / start of text.
        int cursor = 0;
        int secCursor = 0;
        int passCursor = 0;
        int passageHeaderPos = -1;

        while (qHead.find()) {
            int markerStart = qHead.start();

            // Update activeSection: latest SECTION_HEADER at or before markerStart
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

            // Update passage: latest passage-header in a Reading section at or before markerStart
            // Only attach the passage if the active section is Reading AND the passage header
            // appears in the current Reading section (after the last Skill: Reading header).
            if ("Reading".equals(activeSection)) {
                // Find the most recent SECTION_HEADER position; passage must come after it.
                int sectionStartPos = lastSectionHeaderPosAt(normalized, markerStart);
                int latestPassagePos = -1;
                for (Map.Entry<Integer, String> e : passageTextByStart.entrySet()) {
                    int pos = e.getKey();
                    if (pos <= markerStart && pos >= sectionStartPos) {
                        if (pos > latestPassagePos) {
                            latestPassagePos = pos;
                        }
                    }
                }
                if (latestPassagePos >= 0) {
                    activePassage = passageTextByStart.get(latestPassagePos);
                } else {
                    activePassage = null;
                }
            } else {
                // Vocabulary / Grammar / null section => never inherit the passage
                activePassage = null;
            }

            // Build PerBlockContext. Note: markerStart here is the char offset
            // in the normalized text. splitIntoBlocks works on
            // textForBlocks (which is the post-passage-removal text), so we
            // cannot pre-resolve which "block index" this marker corresponds
            // to. Instead we append perBlock entries keyed by markerStart and
            // map them by position-order in parseFromSourceText.
            PerBlockContext pbc = new PerBlockContext();
            pbc.section = activeSection;
            pbc.passage = activePassage;
            // Detect in-block "Skill: X" line by scanning the next ~6 lines
            pbc.explicitCategory = findExplicitSkillInBlockStartingAt(normalized, markerStart);
            out.perBlock.add(pbc);
        }

        // Ensure at least one entry so parseFromSourceText's min(qi, size-1) is safe
        if (out.perBlock.isEmpty()) {
            out.perBlock.add(new PerBlockContext());
        }
        return out;
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
     * Strip every passage block that sits inside a Reading section, so the
     * resulting text can be safely split into question blocks without the
     * passage itself becoming a spurious block.
     *
     * <p>Passage blocks outside any Reading section are left untouched (legacy
     * behavior).
     */
    private static String stripPassageBlocksInReadingSections(String normalized, BlockContext ctx) {
        // Find all passage boundaries (currently findPassageBoundaries returns
        // only the first match). If the first passage is inside a Reading
        // section, strip it. Repeat for any subsequent passages (rare).
        String result = normalized;
        int safety = 0;
        while (safety++ < 5) {
            int[] bounds = findPassageBoundaries(result);
            if (bounds == null) break;
            int passageStart = bounds[0];

            // Find the SECTION_HEADER at or just before this passage
            int sectionStart = lastSectionHeaderPosAt(result, passageStart);
            String activeSection = null;
            if (sectionStart >= 0) {
                Matcher m = SECTION_HEADER.matcher(result);
                if (m.find(sectionStart)) {
                    activeSection = normalizeSectionName(m.group(2));
                }
            }
            if (!"Reading".equals(activeSection)) {
                // Passage is outside a Reading section — leave it alone to
                // preserve legacy behavior for non-mixed PDFs.
                break;
            }
            result = result.substring(0, passageStart).trim()
                    + "\n\n"
                    + result.substring(bounds[1]).trim();
        }
        return result;
    }

    /**
     * Find the Reading passage block from the text.
     * Returns the passage text if found, null otherwise.
     * The original text is NOT modified.
     */
    private static String findAndRemovePassage(String normalized) {
        int[] bounds = findPassageBoundaries(normalized);
        if (bounds == null) return null;
        int passageStart = bounds[0];
        int passageEnd = bounds[1];
        return normalized.substring(passageStart, passageEnd).trim();
    }

    /**
     * Find the start and end (exclusive) indices of the passage block in the text.
     * Returns null if no passage is found.
     */
    private static int[] findPassageBoundaries(String normalized) {
        Matcher header = PASSAGE_HEADER.matcher(normalized);

        while (header.find()) {
            int headerStart = header.start();
            int headerEnd = header.end();

            // Skip any whitespace/newlines after the header line
            int bodyStart = skipLeadingNewlines(normalized, headerEnd);
            String afterHeader = normalized.substring(bodyStart);

            // Find where passage ends (numbered question)
            Pattern passageEnd = Pattern.compile("(?m)^\\s*\\d[.):]");
            Matcher endMatcher = passageEnd.matcher(afterHeader);

            int passageEndIndex;
            if (endMatcher.find()) {
                passageEndIndex = endMatcher.start();
            } else {
                // No numbered question found — look for first "N. " pattern
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
                // Return passage start (after header+newlines) and end
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
        int blockStart = -1;

        while (m.find()) {
            int markerStart = m.start();
            if (blockStart >= 0) {
                String block = text.substring(blockStart, markerStart).trim();
                if (isValidBlock(block)) {
                    blocks.add(block);
                }
            }
            blockStart = markerStart;
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

        return blocks;
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

        if (rawOptions.isEmpty()) return null;

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

        // 6. If currentPassage is set AND the explicit section (if any) is
        //    Reading (or unknown), AND the question text doesn't already
        //    contain it, compose content as "Read the passage: <passage>\n\nQuestion: <question>"
        String finalContent = questionText;
        boolean hasPassageInContent = questionText.toLowerCase().contains("read the passage")
                || questionText.toLowerCase().contains("passage:")
                || questionText.contains("本文");
        // Block passage attachment when the block's explicit section is
        // Vocabulary or Grammar — those sections must never inherit the
        // Reading passage (regression: mixed-skill PDF was tagging all 9
        // questions as Reading).
        boolean sectionAllowsPassage = (explicitSection == null)
                || "Reading".equalsIgnoreCase(explicitSection);
        if (sectionAllowsPassage
                && currentPassage != null && !currentPassage.isBlank()
                && !hasPassageInContent) {
            finalContent = "Read the passage: " + currentPassage + "\n\nQuestion: " + questionText;
        }

        // 7. Build answers
        List<AiExamParseResponse.AiAnswerDto> answers = new ArrayList<>();
        int posA = -1, posB = -1, posC = -1, posD = -1;
        int insertIdx = 0;

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

        // 8. Position-based fallback
        if (correctLetter != null && answers.stream().noneMatch(a -> Boolean.TRUE.equals(a.getIsCorrect()))) {
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
        if (answers.stream().noneMatch(a -> Boolean.TRUE.equals(a.getIsCorrect()))) {
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
        if (questionText.isBlank() || answers.size() < 2) {
            return null;
        }

        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType("MULTIPLE_CHOICE");
        q.setContent(finalContent);
        q.setDifficulty("MEDIUM");
        q.setExplanation(explanation);
        q.setAnswers(answers);
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
}
