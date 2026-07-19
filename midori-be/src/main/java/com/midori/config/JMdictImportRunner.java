package com.midori.config;

import com.midori.service.impl.JMdictParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Slf4j
@Component
@ConditionalOnProperty(name = "midori.jmdict.import.enabled", havingValue = "true")
@RequiredArgsConstructor
@Order(1)
public class JMdictImportRunner implements CommandLineRunner {

    private final JMdictParser jmdictParser;

    @Override
    public void run(String... args) {
        log.info("=== Starting JMdict Full Import ===");
        System.out.println("=== Starting JMdict Full Import ===");

        try (InputStream is = getClass().getResourceAsStream("/dictionary/JMdict.xml")) {
            if (is == null) {
                log.error("JMdict.xml not found in resources!");
                System.err.println("ERROR: JMdict.xml not found!");
                return;
            }

            JMdictParser.ImportResult result = jmdictParser.importJMdict(is);
            log.info("=== JMdict Import Complete: {} entries imported in {} ms ===",
                    result.imported(), result.durationMs());
            System.out.println("=== JMdict Import Complete ===");
            System.out.println("Imported: " + result.imported());
            System.out.println("Skipped: " + result.skipped());
            System.out.println("Failed: " + result.failed());
            System.out.println("Duration: " + (result.durationMs() / 1000) + " seconds");

        } catch (Exception e) {
            log.error("JMdict import failed: {}", e.getMessage(), e);
            System.err.println("JMdict import failed: " + e.getMessage());
        }
    }
}
