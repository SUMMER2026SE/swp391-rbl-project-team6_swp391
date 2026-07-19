package com.midori.service;

import java.util.UUID;

public interface KanjiSvgService {
    /**
     * Load SVG content for a kanji by its database ID.
     * Queries PostgreSQL for the precomputed svg_file,
     * then reads the SVG from classpath resources.
     *
     * @param kanjiId UUID of the kanji entry
     * @return raw SVG content string
     */
    String getKanjiSvgById(UUID kanjiId);
}
