package com.midori.service;

/**
 * Reads all Hanabira grammar JSON files from classpath:dictionary/grammar/
 * and imports them into the grammar_patterns table.
 * <p>
 * Import is idempotent: existing patterns are skipped, never overwritten.
 */
public interface GrammarImporterService {

    /**
     * Import all grammar patterns from all JSON files.
     *
     * @return total number of new patterns imported (skipped patterns not counted)
     */
    int importAll();
}
