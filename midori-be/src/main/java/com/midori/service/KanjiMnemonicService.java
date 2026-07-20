package com.midori.service;

import java.util.Optional;

/**
 * Service for generating mnemonic tips for kanji characters.
 * Uses KanjiVG stroke data to create meaningful memory aids.
 */
public interface KanjiMnemonicService {

    /**
     * Get mnemonic tip for a kanji character.
     * @param character the kanji character
     * @return mnemonic tip or empty if not available
     */
    Optional<String> getMnemonic(String character);
}
