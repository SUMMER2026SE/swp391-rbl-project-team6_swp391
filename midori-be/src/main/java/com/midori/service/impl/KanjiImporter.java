package com.midori.service.impl;

import com.midori.entity.KanjiEntry;
import com.midori.repository.KanjiEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamReader;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class KanjiImporter {

    private final KanjiEntryRepository kanjiEntryRepository;
    private final TransactionTemplate transactionTemplate;

    public void importKanji(InputStream xmlInputStream) {
        long startTime = System.currentTimeMillis();
        log.info("Starting KANJIDIC2 import process...");

        int imported = 0;
        int skipped = 0;
        int failed = 0;
        int svgFound = 0;
        int svgMissing = 0;

        List<KanjiEntry> batch = new ArrayList<>();
        int batchSize = 1000;

        try {
            XMLInputFactory factory = XMLInputFactory.newInstance();
            // Disable DTD validation to prevent external network calls and errors
            factory.setProperty(XMLInputFactory.SUPPORT_DTD, false);
            XMLStreamReader reader = factory.createXMLStreamReader(xmlInputStream);

            String character = null;
            List<String> onyomiList = new ArrayList<>();
            List<String> kunyomiList = new ArrayList<>();
            Integer strokeCount = null;
            String radical = null;
            String jlpt = null;
            List<String> meanings = new ArrayList<>();

            String currentTag = "";
            String rType = "";
            String mLang = "";

            while (reader.hasNext()) {
                int event = reader.next();

                switch (event) {
                    case XMLStreamConstants.START_ELEMENT:
                        currentTag = reader.getLocalName();
                        if ("character".equals(currentTag)) {
                            character = null;
                            onyomiList.clear();
                            kunyomiList.clear();
                            strokeCount = null;
                            radical = null;
                            jlpt = null;
                            meanings.clear();
                        } else if ("reading".equals(currentTag)) {
                            rType = reader.getAttributeValue(null, "r_type");
                        } else if ("meaning".equals(currentTag)) {
                            mLang = reader.getAttributeValue(null, "m_lang");
                        } else if ("rad_value".equals(currentTag)) {
                            String radType = reader.getAttributeValue(null, "rad_type");
                            if ("classical".equals(radType)) {
                                radical = "classical"; // marker
                            }
                        }
                        break;

                    case XMLStreamConstants.CHARACTERS:
                        String text = reader.getText().trim();
                        if (text.isEmpty()) {
                            break;
                        }

                        if ("literal".equals(currentTag)) {
                            character = text;
                        } else if ("stroke_count".equals(currentTag)) {
                            try {
                                strokeCount = Integer.parseInt(text);
                            } catch (NumberFormatException ignored) {}
                        } else if ("jlpt".equals(currentTag)) {
                            jlpt = "N" + text;
                        } else if ("rad_value".equals(currentTag) && "classical".equals(radical)) {
                            radical = text;
                        } else if ("reading".equals(currentTag)) {
                            if ("ja_on".equals(rType)) {
                                onyomiList.add(text);
                            } else if ("ja_kun".equals(rType)) {
                                kunyomiList.add(text);
                            }
                        } else if ("meaning".equals(currentTag)) {
                            if (mLang == null || mLang.isEmpty()) {
                                meanings.add(text);
                            }
                        }
                        break;

                    case XMLStreamConstants.END_ELEMENT:
                        String endTag = reader.getLocalName();
                        if ("character".equals(endTag)) {
                            if (character != null && !character.isEmpty()) {
                                // Compute SVG filename from Unicode code point
                                String svgFile = computeSvgFilename(character);
                                boolean svgExists = verifySvgExists(svgFile);

                                if (svgExists) {
                                    svgFound++;
                                } else {
                                    svgMissing++;
                                    svgFile = null; // Don't store if file doesn't exist
                                }

                                KanjiEntry entry = KanjiEntry.builder()
                                        .character(character)
                                        .onyomi(String.join(", ", onyomiList))
                                        .kunyomi(String.join(", ", kunyomiList))
                                        .strokeCount(strokeCount)
                                        .radical(radical)
                                        .jlpt(jlpt)
                                        .meaning(String.join(", ", meanings))
                                        .svgFile(svgFile)
                                        .build();

                                batch.add(entry);

                                if (batch.size() >= batchSize) {
                                    saveBatch(batch);
                                    imported += batch.size();
                                    batch.clear();
                                    log.info("Imported {} kanji entries", imported);
                                }
                            } else {
                                skipped++;
                            }
                        }
                        currentTag = "";
                        rType = "";
                        mLang = "";
                        break;
                }
            }

            reader.close();

            if (!batch.isEmpty()) {
                saveBatch(batch);
                imported += batch.size();
                batch.clear();
            }

        } catch (Exception e) {
            log.error("KANJIDIC2 import error: {}", e.getMessage(), e);
            failed++;
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("KANJIDIC2 import completed.");
        log.info("Imported: {}", imported);
        log.info("Skipped: {}", skipped);
        log.info("Failed: {}", failed);
        log.info("SVG found: {}", svgFound);
        log.info("SVG missing: {}", svgMissing);
        log.info("Duration: {} ms", duration);

        System.out.println("Imported: " + imported);
        System.out.println("Skipped: " + skipped);
        System.out.println("Failed: " + failed);
        System.out.println("SVG found: " + svgFound);
        System.out.println("SVG missing: " + svgMissing);
        System.out.println("Duration: " + duration + " ms");
    }

    /**
     * Convert a kanji character to its KanjiVG SVG filename.
     * Example: 食 → codePoint 0x98DF → "098df.svg"
     */
    private String computeSvgFilename(String character) {
        int codePoint = character.codePointAt(0);
        return String.format("%05x.svg", codePoint);
    }

    /**
     * Verify that the SVG file exists in the classpath resources.
     */
    private boolean verifySvgExists(String svgFilename) {
        try {
            ClassPathResource resource = new ClassPathResource("dictionary/kanjivg/" + svgFilename);
            return resource.exists();
        } catch (Exception e) {
            return false;
        }
    }

    private void saveBatch(List<KanjiEntry> batch) {
        transactionTemplate.executeWithoutResult(status -> {
            for (KanjiEntry entry : batch) {
                if (!kanjiEntryRepository.existsByCharacter(entry.getCharacter())) {
                    kanjiEntryRepository.save(entry);
                }
            }
        });
    }
}
