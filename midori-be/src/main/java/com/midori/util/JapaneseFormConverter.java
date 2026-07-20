package com.midori.util;

import com.midori.dto.dictionary.DictionaryLookupResponse.GrammarForms;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for converting Japanese verb and adjective forms.
 * Supports both Ichidan (一段) and Godan (五段) verbs, as well as i-adjectives and na-adjectives.
 */
@Component
public class JapaneseFormConverter {

    // Godan verb ending mappings to base (u-row → i-row)
    private static final Map<Character, String> GODAN_TO_BASE = new HashMap<>();
    static {
        GODAN_TO_BASE.put('う', "い");
        GODAN_TO_BASE.put('く', "い");
        GODAN_TO_BASE.put('ぐ', "い");
        GODAN_TO_BASE.put('す', "し");
        GODAN_TO_BASE.put('つ', "って");
        GODAN_TO_BASE.put('ぬ', "ん");
        GODAN_TO_BASE.put('ぶ', "ん");
        GODAN_TO_BASE.put('む', "ん");
        GODAN_TO_BASE.put('る', "っ");
    }

    // Hiragana to Katakana mapping
    private static final Map<Character, Character> HIRAGANA_TO_KATAKANA = new HashMap<>();
    static {
        for (char c = 'あ'; c <= 'ん'; c++) {
            // Hiragana range: 3040-309F, Katakana range: 30A0-30FF
            // The offset between hiragana and katakana is 0x60
            if (c >= 0x3040 && c <= 0x309F) {
                HIRAGANA_TO_KATAKANA.put(c, (char) (c + 0x60));
            }
        }
    }

    /**
     * Convert a Japanese word to all its grammatical forms.
     *
     * @param surface The surface form of the word
     * @param reading The kana reading
     * @param isIchidan Whether the verb is ichidan (一段)
     * @param isGodan Whether the verb is godan (五段)
     * @return GrammarForms containing all the conjugated forms
     */
    public static GrammarForms convertForms(String surface, String reading, boolean isIchidan, boolean isGodan) {
        if (surface == null || surface.isEmpty()) {
            return null;
        }

        String base = getBaseForm(surface, reading, isIchidan, isGodan);
        if (base == null) {
            return null;
        }

        GrammarForms forms = new GrammarForms();

        if (isIchidan) {
            fillIchidanForms(surface, forms);
        } else if (isGodan) {
            fillGodanForms(surface, forms);
        } else if (isAdjective(surface)) {
            fillAdjectiveForms(surface, forms);
        }

        return forms;
    }

    /**
     * Convert a Japanese word to all its grammatical forms.
     * Automatically detects verb type.
     */
    private static String getBaseForm(String surface, String reading, boolean isIchidan, boolean isGodan) {
        if (surface == null || surface.isEmpty()) {
            return null;
        }

        // For ichidan verbs, remove る to get base
        if (isIchidan && surface.endsWith("る")) {
            return surface.substring(0, surface.length() - 1);
        }

        // For godan verbs, convert the ending
        if (isGodan) {
            return convertGodanEnding(surface);
        }

        // Auto-detect based on ending
        if (surface.endsWith("る") && !surface.endsWith("いる") && !surface.endsWith("える") 
            && !surface.endsWith("ある") && !surface.endsWith("分かる")) {
            // Could be ichidan (like 食べる, 見る)
            return surface.substring(0, surface.length() - 1);
        }

        // Check for godan verb endings
        char lastChar = surface.charAt(surface.length() - 1);
        if (GODAN_TO_BASE.containsKey(lastChar)) {
            return convertGodanEnding(surface);
        }

        return surface; // Return as-is for nouns, etc.
    }

    private static String convertGodanEnding(String surface) {
        if (surface == null || surface.isEmpty()) {
            return surface;
        }

        char lastChar = surface.charAt(surface.length() - 1);
        String replacement = String.valueOf(GODAN_TO_BASE.get(lastChar));
        
        if (replacement == null) {
            return surface;
        }

        return surface.substring(0, surface.length() - 1) + replacement;
    }

    private static void fillIchidanForms(String surface, GrammarForms forms) {
        // Base for ichidan (remove る)
        String base = surface.substring(0, surface.length() - 1);

        // Masu form: ます
        forms.setMasu(base + "ます");
        
        // Te form: て
        forms.setTe(base + "て");
        
        // Ta form: た
        forms.setTa(base + "た");
        
        // Nai form: ない
        forms.setNai(base + "ない");
        
        // Potential: られる
        forms.setPotential(base + "られる");
        
        // Passive: られる
        forms.setPassive(base + "られる");
        
        // Causative: させる
        forms.setCausative(base + "させる");
        
        // Volitional: よう
        forms.setVolitional(base + "よう");
        
        // Te kudasai: てください
        forms.setTeKudasai(base + "てください");
        
        // Tai: たい
        forms.setTai(base + "たい");
        
        // Tai to omoimasu: たいと思います
        forms.setTaiToOmoimasu(base + "たいと思います");
        
        // Nakute: なくて
        forms.setNakute(base + "なくて");
        
        // Nakereba: なければならない
        forms.setNakereba(base + "なければならない");
    }

    private static void fillGodanForms(String surface, GrammarForms forms) {
        if (surface == null || surface.isEmpty()) {
            return;
        }

        char lastChar = surface.charAt(surface.length() - 1);
        
        // Get the base form (u-row → i-row)
        String baseI = convertGodanEnding(surface);

        // Masu form: ます
        forms.setMasu(baseI + "す");
        
        // Te form: て (special cases for く, ぐ, ぬ, ぶ, む, う, つ, る)
        forms.setTe(getTeForm(surface));
        
        // Ta form: た (same pattern as te)
        forms.setTa(getTaForm(surface));
        
        // Nai form: ない
        forms.setNai(baseI + "ない");
        
        // Potential: える
        forms.setPotential(baseI + "える");
        
        // Passive: られる
        forms.setPassive(baseI + "られる");
        
        // Causative: せる
        forms.setCausative(baseI + "せる");
        
        // Volitional: う (special for godan)
        forms.setVolitional(getVolitionalForm(surface));
        
        // Te kudasai
        forms.setTeKudasai(getTeForm(surface).substring(0, getTeForm(surface).length() - 1) + "てください");
        
        // Tai: たい
        forms.setTai(baseI + "たい");
        
        // Tai to omoimasu
        forms.setTaiToOmoimasu(baseI + "たいと思います");
        
        // Nakute
        forms.setNakute(baseI + "なくて");
        
        // Nakereba
        forms.setNakereba(baseI + "なければならない");
    }

    private static String getTeForm(String surface) {
        if (surface == null || surface.isEmpty()) {
            return surface;
        }
        char last = surface.charAt(surface.length() - 1);
        String base = surface.substring(0, surface.length() - 1);
        
        switch (last) {
            case 'く':
                return base + "いて";
            case 'ぐ':
                return base + "いで";
            case 'ぬ':
            case 'ぶ':
            case 'む':
                return base + "んで";
            case 'う':
            case 'つ':
            case 'る':
                return base + "って";
            case 'す':
                return base + "して";
            default:
                return surface + "て";
        }
    }

    private static String getTaForm(String surface) {
        // Same pattern as te form, but with た/だ/った
        if (surface == null || surface.isEmpty()) {
            return surface;
        }
        char last = surface.charAt(surface.length() - 1);
        String base = surface.substring(0, surface.length() - 1);
        
        switch (last) {
            case 'く':
                return base + "いた";
            case 'ぐ':
                return base + "いだ";
            case 'ぬ':
            case 'ぶ':
            case 'む':
                return base + "んだ";
            case 'う':
            case 'つ':
            case 'る':
                return base + "った";
            case 'す':
                return base + "した";
            default:
                return surface + "た";
        }
    }

    private static String getVolitionalForm(String surface) {
        if (surface == null || surface.isEmpty()) {
            return surface;
        }
        char last = surface.charAt(surface.length() - 1);
        
        // For く → こう, ぐ → ごう, む/ぬ/ぶ → もう, う → おう, つ → とう, る → ろう, す → そう
        switch (last) {
            case 'く':
                return surface.substring(0, surface.length() - 1) + "こう";
            case 'ぐ':
                return surface.substring(0, surface.length() - 1) + "ごう";
            case 'む':
            case 'ぬ':
            case 'ぶ':
                return surface.substring(0, surface.length() - 1) + "もう";
            case 'う':
                return surface.substring(0, surface.length() - 1) + "おう";
            case 'つ':
                return surface.substring(0, surface.length() - 1) + "とう";
            case 'る':
                return surface.substring(0, surface.length() - 1) + "ろう";
            case 'す':
                return surface.substring(0, surface.length() - 1) + "そう";
            default:
                return surface + "よう";
        }
    }

    private static boolean isAdjective(String surface) {
        if (surface == null || surface.isEmpty()) {
            return false;
        }
        // i-adjectives end in い (except ない which is technically a verb)
        // na-adjectives typically end in な or just a noun-like form
        return surface.endsWith("い") || surface.endsWith("な");
    }

    private static void fillAdjectiveForms(String surface, GrammarForms forms) {
        if (surface == null || surface.isEmpty()) {
            return;
        }

        // i-adjective
        if (surface.endsWith("い")) {
            String base = surface.substring(0, surface.length() - 1);
            
            // Te form
            forms.setTe(base + "くて");
            
            // Ta form
            forms.setTa(base + "かった");
            
            // Nai form
            forms.setNai(base + "くない");
            
            // Potential (ない form can express impossibility)
            forms.setPotential(base + "くない"); // can be expressed as ありえない
            
            // Tai form
            forms.setTai(surface + "い");
            forms.setTaiToOmoimasu(surface + "いと思います");
            
            // Volitional (not common for adjectives)
            forms.setVolitional(null);
            
            // Nakute
            forms.setNakute(base + "くなくて");
            
            // Nakereba narimasen (なければありません)
            forms.setNakereba(base + "くなければなりません");
        }
    }

    /**
     * Convert hiragana to katakana.
     */
    public static String hiraganaToKatakana(String hiragana) {
        if (hiragana == null) {
            return null;
        }
        StringBuilder katakana = new StringBuilder();
        for (char c : hiragana.toCharArray()) {
            Character katakanaChar = HIRAGANA_TO_KATAKANA.get(c);
            katakana.append(katakanaChar != null ? katakanaChar : c);
        }
        return katakana.toString();
    }

    /**
     * Detect if a word is a verb and what type.
     * 
     * @param surface The surface form
     * @return "ichidan", "godan", "suru", or null if not a verb
     */
    public static String detectVerbType(String surface) {
        if (surface == null || surface.isEmpty()) {
            return null;
        }

        // Check for suru verbs
        if (surface.endsWith("する")) {
            return "suru";
        }

        // Check for ichidan (irregular ichidan)
        if (surface.endsWith("来る") || surface.endsWith("くる")) {
            return "ichidan";
        }

        // Ichidan: える, まれる, られる, すぎる, etc.
        if (surface.matches(".*[えみられりが](る|れ)$")) {
            return "ichidan";
        }

        // Check common ichidan patterns
        String[] ichidanSuffixes = {"得る", "える", "じる", "ずる", "びる", "きり", "ちり", 
                                    "にる", "ひる", "み内", "める", "れる", "せる"};
        for (String suffix : ichidanSuffixes) {
            if (surface.endsWith(suffix)) {
                return "ichidan";
            }
        }

        // Check for godan by checking u-row ending
        char lastChar = surface.charAt(surface.length() - 1);
        if ("いうくぐすつつぬぶむる".indexOf(lastChar) >= 0) {
            return "godan";
        }

        return null;
    }
}
