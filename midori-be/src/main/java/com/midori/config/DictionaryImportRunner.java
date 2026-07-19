package com.midori.config;

import com.midori.service.impl.DictionaryImporter;
import com.midori.service.impl.KanjiImporter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
                        return;
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
