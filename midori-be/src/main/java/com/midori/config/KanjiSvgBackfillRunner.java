package com.midori.config;

import com.midori.entity.KanjiEntry;
import com.midori.repository.KanjiEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

/**
 * One-time backfill for the svg_file column on kanji_entries.
 * Runs after application startup.
 * Computes svg_file from Unicode code point for any rows where svg_file is NULL.
 * After the first successful run, this is a no-op (no NULL rows remain).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KanjiSvgBackfillRunner {

    private final KanjiEntryRepository kanjiEntryRepository;
    private final TransactionTemplate transactionTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void backfillSvgFile() {
        List<KanjiEntry> nullSvgEntries = kanjiEntryRepository.findBySvgFileIsNull();

        if (nullSvgEntries.isEmpty()) {
            log.info("[KanjiSvgBackfill] All kanji entries already have svg_file. Nothing to do.");
            return;
        }

        log.info("[KanjiSvgBackfill] Found {} kanji entries with NULL svg_file. Starting backfill...", nullSvgEntries.size());

        int updated = 0;
        int svgMissing = 0;

        transactionTemplate.executeWithoutResult(status -> {
            for (KanjiEntry entry : nullSvgEntries) {
                String character = entry.getCharacter();
                if (character == null || character.isEmpty()) continue;

                int codePoint = character.codePointAt(0);
                String svgFilename = String.format("%05x.svg", codePoint);

                // Verify SVG file exists in classpath
                boolean exists = new ClassPathResource("dictionary/kanjivg/" + svgFilename).exists();

                if (exists) {
                    entry.setSvgFile(svgFilename);
                } else {
                    entry.setSvgFile(null); // Explicitly null — no SVG available
                }

                kanjiEntryRepository.save(entry);
            }
        });

        // Re-count for logging
        long afterNull = kanjiEntryRepository.findBySvgFileIsNull().size();
        long totalUpdated = nullSvgEntries.size() - afterNull;

        log.info("[KanjiSvgBackfill] Backfill complete. Updated: {}, Still NULL (no SVG file): {}", totalUpdated, afterNull);
    }
}
