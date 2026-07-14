package com.midori.util;

import java.util.HashMap;
import java.util.Map;

public class RomajiConverter {
    private static final Map<String, String> charMap = new HashMap<>();

    static {
        // Hiragana vowels
        charMap.put("あ", "a"); charMap.put("い", "i"); charMap.put("う", "u"); charMap.put("え", "e"); charMap.put("お", "o");
        // Katakana vowels
        charMap.put("ア", "a"); charMap.put("イ", "i"); charMap.put("ウ", "u"); charMap.put("エ", "e"); charMap.put("オ", "o");

        // K-row
        charMap.put("か", "ka"); charMap.put("き", "ki"); charMap.put("く", "ku"); charMap.put("け", "ke"); charMap.put("こ", "ko");
        charMap.put("カ", "ka"); charMap.put("キ", "ki"); charMap.put("ク", "ku"); charMap.put("ケ", "ke"); charMap.put("コ", "ko");

        // S-row
        charMap.put("さ", "sa"); charMap.put("し", "shi"); charMap.put("す", "su"); charMap.put("せ", "se"); charMap.put("そ", "so");
        charMap.put("サ", "sa"); charMap.put("シ", "shi"); charMap.put("ス", "su"); charMap.put("セ", "se"); charMap.put("ソ", "so");

        // T-row
        charMap.put("た", "ta"); charMap.put("ち", "chi"); charMap.put("つ", "tsu"); charMap.put("て", "te"); charMap.put("と", "to");
        charMap.put("タ", "ta"); charMap.put("チ", "chi"); charMap.put("ツ", "tsu"); charMap.put("テ", "te"); charMap.put("ト", "to");

        // N-row
        charMap.put("な", "na"); charMap.put("に", "ni"); charMap.put("ぬ", "nu"); charMap.put("ね", "ne"); charMap.put("の", "no");
        charMap.put("ナ", "na"); charMap.put("ニ", "ni"); charMap.put("ヌ", "nu"); charMap.put("ネ", "ne"); charMap.put("ノ", "no");

        // H-row
        charMap.put("は", "ha"); charMap.put("ひ", "hi"); charMap.put("ふ", "fu"); charMap.put("へ", "he"); charMap.put("ほ", "ho");
        charMap.put("ハ", "ha"); charMap.put("ヒ", "hi"); charMap.put("フ", "fu"); charMap.put("ヘ", "he"); charMap.put("ホ", "ho");

        // M-row
        charMap.put("ま", "ma"); charMap.put("み", "mi"); charMap.put("む", "mu"); charMap.put("め", "me"); charMap.put("も", "mo");
        charMap.put("マ", "ma"); charMap.put("ミ", "mi"); charMap.put("ム", "mu"); charMap.put("メ", "me"); charMap.put("モ", "mo");

        // Y-row
        charMap.put("や", "ya"); charMap.put("ゆ", "yu"); charMap.put("よ", "yo");
        charMap.put("ヤ", "ya"); charMap.put("ユ", "yu"); charMap.put("ヨ", "yo");

        // R-row
        charMap.put("ら", "ra"); charMap.put("り", "ri"); charMap.put("る", "ru"); charMap.put("れ", "re"); charMap.put("ろ", "ro");
        charMap.put("ラ", "ra"); charMap.put("リ", "ri"); charMap.put("ル", "ru"); charMap.put("レ", "re"); charMap.put("ロ", "ro");

        // W-row
        charMap.put("わ", "wa"); charMap.put("を", "wo");
        charMap.put("ワ", "wa"); charMap.put("ヲ", "wo");

        // N
        charMap.put("ん", "n");
        charMap.put("ン", "n");

        // G-row
        charMap.put("が", "ga"); charMap.put("ぎ", "gi"); charMap.put("ぐ", "gu"); charMap.put("げ", "ge"); charMap.put("ご", "go");
        charMap.put("ガ", "ga"); charMap.put("ギ", "gi"); charMap.put("グ", "gu"); charMap.put("ゲ", "ge"); charMap.put("ゴ", "go");

        // Z-row
        charMap.put("ざ", "za"); charMap.put("じ", "ji"); charMap.put("ず", "zu"); charMap.put("ぜ", "ze"); charMap.put("ぞ", "zo");
        charMap.put("ザ", "za"); charMap.put("ジ", "ji"); charMap.put("ズ", "zu"); charMap.put("ゼ", "ze"); charMap.put("ゾ", "zo");

        // D-row
        charMap.put("だ", "da"); charMap.put("ぢ", "ji"); charMap.put("づ", "zu"); charMap.put("で", "de"); charMap.put("ど", "do");
        charMap.put("ダ", "da"); charMap.put("ヂ", "ji"); charMap.put("ヅ", "zu"); charMap.put("デ", "de"); charMap.put("ド", "do");

        // B-row
        charMap.put("ば", "ba"); charMap.put("び", "bi"); charMap.put("ぶ", "bu"); charMap.put("べ", "be"); charMap.put("ぼ", "bo");
        charMap.put("バ", "ba"); charMap.put("ビ", "bi"); charMap.put("ブ", "bu"); charMap.put("ベ", "be"); charMap.put("ボ", "bo");

        // P-row
        charMap.put("ぱ", "pa"); charMap.put("pi", "pi"); charMap.put("ぷ", "pu"); charMap.put("ぺ", "pe"); charMap.put("ぽ", "po");
        charMap.put("パ", "pa"); charMap.put("ピ", "pi"); charMap.put("プ", "pu"); charMap.put("ペ", "pe"); charMap.put("ポ", "po");

        // Small / combining kana (single character fallback)
        charMap.put("ぁ", "a"); charMap.put("ぃ", "i"); charMap.put("ぅ", "u"); charMap.put("ぇ", "e"); charMap.put("ぉ", "o");
        charMap.put("ァ", "a"); charMap.put("ィ", "i"); charMap.put("ゥ", "u"); charMap.put("ェ", "e"); charMap.put("ォ", "o");
        charMap.put("ゃ", "ya"); charMap.put("ゅ", "yu"); charMap.put("ょ", "yo");
        charMap.put("ャ", "ya"); charMap.put("ュ", "yu"); charMap.put("ョ", "yo");
    }

    public static String convert(String text) {
        if (text == null || text.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        int i = 0;
        int len = text.length();

        while (i < len) {
            char c = text.charAt(i);
            String currentStr = String.valueOf(c);

            // 1. Check double consonant (sokuon: small つ/ツ)
            if (c == 'っ' || c == 'ッ') {
                if (i + 1 < len) {
                    char nextChar = text.charAt(i + 1);
                    String nextRomaji = convert(String.valueOf(nextChar));
                    if (!nextRomaji.isEmpty()) {
                        char firstConsonant = nextRomaji.charAt(0);
                        // Double the consonant (e.g. tt, kk, ss)
                        if (firstConsonant >= 'a' && firstConsonant <= 'z' && !"aeiou".contains(String.valueOf(firstConsonant))) {
                            sb.append(firstConsonant);
                        }
                    }
                }
                i++;
                continue;
            }

            // 2. Check for combining characters (yōon: small ゃ, ゅ, ょ / ャ, ュ, ョ)
            if (i + 1 < len) {
                char nextChar = text.charAt(i + 1);
                if (nextChar == 'ゃ' || nextChar == 'ゅ' || nextChar == 'ょ' || 
                    nextChar == 'ャ' || nextChar == 'ュ' || nextChar == 'ョ') {
                    
                    String yoonRomaji = getYoonRomaji(currentStr, nextChar);
                    if (yoonRomaji != null) {
                        sb.append(yoonRomaji);
                        i += 2;
                        continue;
                    }
                }
            }

            // 3. Check standard mapping
            String romaji = charMap.get(currentStr);
            if (romaji != null) {
                sb.append(romaji);
            } else {
                // Keep non-kana characters as is
                if (c == 'ー') {
                    // Chōonpu (ー): lengthen previous vowel
                    if (sb.length() > 0) {
                        char lastChar = sb.charAt(sb.length() - 1);
                        if ("aeiou".contains(String.valueOf(lastChar))) {
                            sb.append(lastChar);
                        }
                    }
                } else if (c == 'ン' || c == 'ン') {
                    sb.append("n");
                } else {
                    sb.append(c);
                }
            }
            i++;
        }

        return sb.toString();
    }

    public static String convertKatakanaToHiragana(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }

        StringBuilder sb = new StringBuilder();
        int i = 0;
        int len = text.length();

        while (i < len) {
            char c = text.charAt(i);
            // Katakana range \u30a1 to \u30f6 maps to Hiragana by subtracting 0x60
            if (c >= '\u30a1' && c <= '\u30f6') {
                sb.append((char) (c - 0x60));
            } else if (c == '\u30f2') {
                // ヲ -> を
                sb.append('を');
            } else if (c == '\u30a2' || c == '\u30a4' || c == '\u30a6' || c == '\u30a8' || c == '\u30aa') {
                sb.append((char) (c - 0x60));
            } else {
                sb.append(c);
            }
            i++;
        }

        return sb.toString();
    }

    private static String getYoonRomaji(String baseKana, char smallKana) {
        String baseRomaji = charMap.get(baseKana);
        if (baseRomaji == null || baseRomaji.length() < 2) {
            return null;
        }

        // Get consonant part (everything except the last vowel)
        String consonant = baseRomaji.substring(0, baseRomaji.length() - 1);
        if (baseRomaji.equals("shi")) {
            consonant = "sh";
        } else if (baseRomaji.equals("chi")) {
            consonant = "ch";
        } else if (baseRomaji.equals("ji")) {
            consonant = "j";
        }

        char vowel = ' ';
        if (smallKana == 'ゃ' || smallKana == 'ャ') vowel = 'a';
        else if (smallKana == 'ゅ' || smallKana == 'ュ') vowel = 'u';
        else if (smallKana == 'ょ' || smallKana == 'ョ') vowel = 'o';

        if (consonant.equals("j") || consonant.equals("sh") || consonant.equals("ch")) {
            return consonant + vowel;
        } else {
            return consonant + "y" + vowel;
        }
    }
}
