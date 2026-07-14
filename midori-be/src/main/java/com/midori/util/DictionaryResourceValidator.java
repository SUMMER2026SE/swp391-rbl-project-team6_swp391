package com.midori.util;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

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
                throw new DictionaryResourceMissingException(resourcePath, sourceUrl);
            }
        } catch (DictionaryResourceMissingException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Unable to validate dictionary resource: " + resourcePath, ex);
        }
    }

    public static class DictionaryResourceMissingException extends IllegalStateException {
        public DictionaryResourceMissingException(String resourcePath, String sourceUrl) {
            super(buildMessage(resourcePath, sourceUrl));
        }

        private static String buildMessage(String resourcePath, String sourceUrl) {
            StringBuilder message = new StringBuilder(System.lineSeparator());
            message.append("Missing dictionary resource:").append(System.lineSeparator());
            message.append("src/main/resources/").append(resourcePath)
                    .append(System.lineSeparator());
            message.append(System.lineSeparator());
            message.append("Please download the dictionary from:").append(System.lineSeparator());
            message.append(sourceUrl).append(System.lineSeparator());
            return message.toString();
        }
    }
}
