package com.midori.util;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility class for converting English POS tags from JMdict to Vietnamese.
 * Handles complex POS tags like "adverb (fukushi), noun, used as a suffix"
 */
public class VietnamesePosConverter {

    private static final Map<String, String> POS_MAP = new HashMap<>();

    static {
        // Verb types
        POS_MAP.put("verb", "Động từ");
        POS_MAP.put("ichidan verb", "Động từ Nhất đoạn");
        POS_MAP.put("godan verb", "Động từ Ngũ đoạn");
        POS_MAP.put("suru verb", "Động từ する");
        POS_MAP.put("kuru verb", "Động từ 来る");
        POS_MAP.put(" intrans verb", "Động từ nội động từ");
        POS_MAP.put("transitive verb", "Động từ ngoại động từ");
        POS_MAP.put("auxiliary verb", "Động từ phụ trợ");

        // Adjective types
        POS_MAP.put("i-adjective", "Tính từ đuôi い");
        POS_MAP.put("na-adjective", "Tính từ đuôi な");
        POS_MAP.put("adjective", "Tính từ");

        // Noun types
        POS_MAP.put("noun", "Danh từ");
        POS_MAP.put("proper noun", "Danh từ riêng");
        POS_MAP.put("noun - used as a suffix", "Danh từ (hậu tố)");
        POS_MAP.put("noun - temporal", "Danh từ chỉ thời gian");
        POS_MAP.put("noun - common", "Danh từ thường");
        POS_MAP.put("noun - suru verb", "Danh từ + する");
        POS_MAP.put("noun or verb acting prenominally", "Danh từ / Động từ");

        // Other word types
        POS_MAP.put("adverb", "Phó từ");
        POS_MAP.put("adverb (fukushi)", "Phó từ");
        POS_MAP.put("particle", "Trợ từ");
        POS_MAP.put("conjunction", "Liên từ");
        POS_MAP.put("prefix", "Tiền tố");
        POS_MAP.put("suffix", "Hậu tố");
        POS_MAP.put("expression", "Biểu thức");
        POS_MAP.put("interjection", "Thán từ");
        POS_MAP.put("pronoun", "Đại từ");
        POS_MAP.put("counter", "Lượng từ");

        // JMdict specific
        POS_MAP.put("fukushi", "Phó từ");
        POS_MAP.put("nouns forming verb pairs", "Danh từ ghép");
        POS_MAP.put("archaic/formal form of", "Từ cổ / Hình thức trang trọng");

        // Common combinations
        POS_MAP.put("noun or participle", "Danh từ / Phân từ");
        POS_MAP.put("adverbial noun", "Danh từ trạng ngữ");
        POS_MAP.put("expressions (phrases, clauses, etc.)", "Cụm từ");
        POS_MAP.put("sentence-ending (fukushi)", "Phó từ cuối câu");
    }

    private static final Pattern POS_IN_PARENTHESES = Pattern.compile("\\(([^)]+)\\)");
    private static final Pattern COMMA_SPLIT = Pattern.compile("\\s*,\\s*");

    /**
     * Convert English POS to Vietnamese.
     * Handles formats like:
     * - "noun"
     * - "adverb (fukushi), noun, used as a suffix"
     * - "ichidan verb"
     * - "i-adjective"
     *
     * @param englishPos English POS string from dictionary
     * @return Vietnamese POS string
     */
    public static String convert(String englishPos) {
        if (englishPos == null || englishPos.trim().isEmpty()) {
            return "";
        }

        String pos = englishPos.trim().toLowerCase();

        // Strategy 1: Direct match
        if (POS_MAP.containsKey(pos)) {
            return POS_MAP.get(pos);
        }

        // Strategy 2: Check each comma-separated part
        String[] parts = COMMA_SPLIT.split(pos);
        StringBuilder result = new StringBuilder();

        for (int i = 0; i < parts.length; i++) {
            String part = parts[i].trim();
            String vietnamese = POS_MAP.get(part);

            if (vietnamese != null) {
                if (result.length() > 0) {
                    result.append(" / ");
                }
                result.append(vietnamese);
            } else {
                // Try matching part of speech in parentheses
                Matcher m = POS_IN_PARENTHESES.matcher(part);
                if (m.find()) {
                    String inside = m.group(1).trim();
                    String fromParen = POS_MAP.get(inside);
                    if (fromParen != null) {
                        if (result.length() > 0) {
                            result.append(" / ");
                        }
                        result.append(fromParen);
                    }
                }
            }
        }

        if (result.length() > 0) {
            return result.toString();
        }

        // Strategy 3: Match key patterns
        if (pos.contains("ichidan")) {
            return "Động từ Nhất đoạn";
        }
        if (pos.contains("godan")) {
            return "Động từ Ngũ đoạn";
        }
        if (pos.contains("suru")) {
            return "Động từ する";
        }
        if (pos.contains("i-adjective") || pos.contains("i adj")) {
            return "Tính từ đuôi い";
        }
        if (pos.contains("na-adjective") || pos.contains("na adj")) {
            return "Tính từ đuôi な";
        }
        if (pos.contains("noun")) {
            if (pos.contains("proper")) {
                return "Danh từ riêng";
            }
            if (pos.contains("suffix")) {
                return "Danh từ (hậu tố)";
            }
            if (pos.contains("prefix")) {
                return "Danh từ (tiền tố)";
            }
            return "Danh từ";
        }
        if (pos.contains("verb")) {
            return "Động từ";
        }
        if (pos.contains("adjective")) {
            return "Tính từ";
        }
        if (pos.contains("adverb") || pos.contains("fukushi")) {
            return "Phó từ";
        }
        if (pos.contains("particle")) {
            return "Trợ từ";
        }
        if (pos.contains("conjunction")) {
            return "Liên từ";
        }
        if (pos.contains("interjection")) {
            return "Thán từ";
        }
        if (pos.contains("pronoun")) {
            return "Đại từ";
        }
        if (pos.contains("prefix")) {
            return "Tiền tố";
        }
        if (pos.contains("suffix")) {
            return "Hậu tố";
        }
        if (pos.contains("expression") || pos.contains("phrase")) {
            return "Biểu thức";
        }
        if (pos.contains("counter")) {
            return "Lượng từ";
        }

        // If no match found, return original but capitalize
        return capitalizeFirst(englishPos);
    }

    /**
     * Convert POS and also add explanation suffix if present.
     * E.g., "noun, used as a suffix" -> "Danh từ (hậu tố)"
     */
    public static String convertWithModifier(String englishPos) {
        if (englishPos == null || englishPos.trim().isEmpty()) {
            return "";
        }

        String pos = englishPos.trim();

        // Check for "used as a suffix"
        if (pos.toLowerCase().contains("used as a suffix")) {
            String basePos = pos.replaceAll(",?\\s*used as a suffix", "").trim();
            String converted = convert(basePos);
            if (!converted.isEmpty() && !converted.equals(capitalizeFirst(pos))) {
                return converted + " (hậu tố)";
            }
            return converted;
        }

        // Check for "used as a prefix"
        if (pos.toLowerCase().contains("used as a prefix")) {
            String basePos = pos.replaceAll(",?\\s*used as a prefix", "").trim();
            String converted = convert(basePos);
            if (!converted.isEmpty() && !converted.equals(capitalizeFirst(pos))) {
                return converted + " (tiền tố)";
            }
            return converted;
        }

        return convert(pos);
    }

    private static String capitalizeFirst(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
