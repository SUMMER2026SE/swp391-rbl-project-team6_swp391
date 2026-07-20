package com.midori.scheduler;

import com.midori.service.DictionaryTranslationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DictionaryTranslationScheduler {

    private final DictionaryTranslationService translationService;

    /**
     * Periodically translates a batch of English meanings into Vietnamese.
     * Runs every 5 minutes by default.
     */
    @Scheduled(fixedDelayString = "${midori.dictionary.translation.scheduler.fixed-delay-ms:300000}",
            initialDelayString = "${midori.dictionary.translation.scheduler.initial-delay-ms:60000}")
    public void translatePendingEntries() {
        try {
            log.info("Starting scheduled dictionary translation worker task...");
            int processed = translationService.translatePendingEntries(20);
            if (processed > 0) {
                log.info("DictionaryTranslationScheduler processed and saved {} entry translations", processed);
            } else {
                log.info("No dictionary entries found needing translation.");
            }
        } catch (Exception ex) {
            log.error("DictionaryTranslationScheduler encountered an error", ex);
        }
    }
}
