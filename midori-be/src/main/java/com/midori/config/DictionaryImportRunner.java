package com.midori.config;

import com.midori.service.impl.DictionaryImporter;
import com.midori.service.impl.KanjiImporter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

@Slf4j
@Component
@RequiredArgsConstructor
public class DictionaryImportRunner implements CommandLineRunner {

    private final DictionaryImporter dictionaryImporter;
    private final KanjiImporter kanjiImporter;

    @Value("${kanjidic2.path:#{null}}")
    private String kanjiDictPathConfig;

    @Value("${jmdict.path:#{null}}")
    private String jmDictPathConfig;

    @Override
    public void run(String... args) throws Exception {
        boolean shouldImportDict = false;
        boolean shouldImportKanji = false;
        String customPath = null;

        for (String arg : args) {
            if ("--import-dictionary".equalsIgnoreCase(arg)) {
                shouldImportDict = true;
            } else if ("--import-kanji".equalsIgnoreCase(arg)) {
                shouldImportKanji = true;
            } else if (arg.startsWith("--file=")) {
                customPath = arg.substring(7);
            }
        }

        if (shouldImportDict) {
            log.info("Dictionary import requested via CommandLineRunner.");
            InputStream inputStream = null;

            // Priority 1: Command-line --file argument
            if (customPath != null && !customPath.isEmpty()) {
                File file = new File(customPath);
                if (file.exists() && file.isFile()) {
                    log.info("Using custom JMdict file path: {}", file.getAbsolutePath());
                    inputStream = new FileInputStream(file);
                } else {
                    log.error("Custom JMdict file not found at: {}", file.getAbsolutePath());
                    return;
                }
            } else {
                // Priority 2: jmdict.path property / JMDICT_PATH env var
                String envPath = System.getenv("JMDICT_PATH");
                String configuredPath = jmDictPathConfig != null ? jmDictPathConfig : envPath;
                
                if (configuredPath != null && !configuredPath.isBlank()) {
                    File file = new File(configuredPath.trim());
                    if (file.exists() && file.isFile()) {
                        log.info("Using JMDICT_PATH: {}", file.getAbsolutePath());
                        inputStream = new FileInputStream(file);
                    } else {
                        log.warn("JMDICT_PATH configured but file not found: {}", configuredPath);
                    }
                }
                
                if (inputStream == null) {
                    File defaultFile = new File("src/main/resources/dictionary/JMdict.xml");
                    if (defaultFile.exists() && defaultFile.isFile()) {
                        log.info("Using default JMdict file path: {}", defaultFile.getAbsolutePath());
                        inputStream = new FileInputStream(defaultFile);
                    } else {
                        ClassPathResource resource = new ClassPathResource("dictionary/JMdict.xml");
                        if (resource.exists()) {
                            log.info("Using classpath resource for JMdict.xml");
                            inputStream = resource.getInputStream();
                        } else {
                            log.error("Could not find JMdict.xml in default file path or classpath resources!");
                            return;
                        }
                    }
                }
            }

            try {
                dictionaryImporter.importDictionary(inputStream);
            } finally {
                if (inputStream != null) {
                    inputStream.close();
                }
            }
        }

        if (shouldImportKanji) {
            log.info("Kanji dictionary import requested via CommandLineRunner.");
            InputStream inputStream = null;

            // Priority 1: Command-line --file argument
            if (customPath != null && !customPath.isEmpty()) {
                File file = new File(customPath);
                if (file.exists() && file.isFile()) {
                    log.info("Using custom KANJIDIC2 file path: {}", file.getAbsolutePath());
                    inputStream = new FileInputStream(file);
                } else {
                    log.error("Custom KANJIDIC2 file not found at: {}", file.getAbsolutePath());
                    return;
                }
            } else {
                // Priority 2: kanjidic2.path property / KANJIDIC2_PATH env var
                String envPath = System.getenv("KANJIDIC2_PATH");
                String configuredPath = kanjiDictPathConfig != null ? kanjiDictPathConfig : envPath;
                
                if (configuredPath != null && !configuredPath.isBlank()) {
                    File file = new File(configuredPath.trim());
                    if (file.exists() && file.isFile()) {
                        log.info("Using KANJIDIC2_PATH: {}", file.getAbsolutePath());
                        inputStream = new FileInputStream(file);
                    } else {
                        log.warn("KANJIDIC2_PATH configured but file not found: {}", configuredPath);
                    }
                }
                
                if (inputStream == null) {
                    File defaultFile = new File("src/main/resources/dictionary/KANJIDIC2.xml");
                    if (defaultFile.exists() && defaultFile.isFile()) {
                        log.info("Using default KANJIDIC2 file path: {}", defaultFile.getAbsolutePath());
                        inputStream = new FileInputStream(defaultFile);
                    } else {
                        ClassPathResource resource = new ClassPathResource("dictionary/KANJIDIC2.xml");
                        if (resource.exists()) {
                            log.info("Using classpath resource for KANJIDIC2.xml");
                            inputStream = resource.getInputStream();
                        } else {
                            log.error("Could not find KANJIDIC2.xml in default file path or classpath resources!");
                            log.info("Download KANJIDIC2.xml from: https://www.edrdg.org/wiki/index.php/KANJIDIC2");
                            return;
                        }
                    }
                }
            }

            try {
                kanjiImporter.importKanji(inputStream);
            } finally {
                if (inputStream != null) {
                    inputStream.close();
                }
            }
        }
    }
}
