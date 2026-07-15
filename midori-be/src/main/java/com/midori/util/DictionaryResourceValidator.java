package com.midori.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class DictionaryResourceValidator implements ApplicationRunner {

    private static final String JMDICT_PATH = "dictionary/JMdict.xml";
    private static final String KANJIDIC2_PATH = "dictionary/KANJIDIC2.xml";

    private static final String JMDICT_SOURCE_URL = "https://www.edrdg.org/jmdict/j_jmdict.html";
    private static final String KANJIDIC2_SOURCE_URL = "https://www.edrdg.org/wiki/index.php/KANJIDIC_Project";

    @Override
    public void run(ApplicationArguments args) {
        validate(JMDICT_PATH, JMDICT_SOURCE_URL);
        validate(KANJIDIC2_PATH, KANJIDIC2_SOURCE_URL);
    }

    private void validate(String resourcePath, String sourceUrl) {
        try {
            ClassPathResource resource = new ClassPathResource(resourcePath);
            if (!resource.exists()) {
                log.warn("Dictionary resource not found: src/main/resources/{}. "
                        + "Dictionary features may not work. Download from: {}",
                        resourcePath, sourceUrl);
            }
        } catch (Exception ex) {
            log.warn("Unable to validate dictionary resource: {} - {}", resourcePath, ex.getMessage());
        }
    }
}
