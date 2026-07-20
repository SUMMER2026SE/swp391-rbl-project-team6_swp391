package com.midori.service.impl;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamReader;
import java.io.InputStream;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class LocalDictionaryRegistry {

    @Data
    @Builder
    public static class LocalEntry {
        private String surface;
        private String reading;
        private String partOfSpeech;
        private List<String> meanings;
    }

    private final Map<String, List<LocalEntry>> dictionaryMap = new ConcurrentHashMap<>();
    private boolean loaded = false;

    @PostConstruct
    public void init() {
        Thread thread = new Thread(this::loadDictionary, "local-dict-loader");
        thread.setDaemon(true);
        thread.start();
    }

    private void loadDictionary() {
        log.info("Loading local JMdict.xml from resources in background...");
        long startTime = System.currentTimeMillis();
        int count = 0;

        try {
            ClassPathResource resource = new ClassPathResource("dictionary/JMdict.xml");
            if (!resource.exists()) {
                log.warn("Local JMdict.xml not found at classpath:dictionary/JMdict.xml. Local lookup will be unavailable.");
                return;
            }

            try (InputStream is = resource.getInputStream()) {
                System.setProperty("jdk.xml.entityExpansionLimit", "0");
                XMLInputFactory factory = XMLInputFactory.newInstance();
                factory.setProperty(XMLInputFactory.SUPPORT_DTD, true);
                factory.setProperty(XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES, false);
                factory.setProperty(XMLInputFactory.IS_REPLACING_ENTITY_REFERENCES, true);
                factory.setXMLResolver((publicId, systemId, baseURI, namespace) ->
                    new java.io.ByteArrayInputStream("".getBytes())
                );

                XMLStreamReader reader = factory.createXMLStreamReader(is);

                String currentTag = "";
                List<String> kebList = new ArrayList<>();
                List<String> rebList = new ArrayList<>();
                List<String> posList = new ArrayList<>();
                List<String> glossList = new ArrayList<>();

                while (reader.hasNext()) {
                    int event = reader.next();

                    switch (event) {
                        case XMLStreamConstants.START_ELEMENT:
                            currentTag = reader.getLocalName();
                            if ("entry".equals(currentTag)) {
                                kebList.clear();
                                rebList.clear();
                                posList.clear();
                                glossList.clear();
                            }
                            break;

                        case XMLStreamConstants.CHARACTERS:
                            String text = reader.getText().trim();
                            if (text.isEmpty()) break;

                            switch (currentTag) {
                                case "keb":
                                    kebList.add(text);
                                    break;
                                case "reb":
                                    rebList.add(text);
                                    break;
                                case "pos":
                                    if (!posList.contains(text)) posList.add(text);
                                    break;
                                case "gloss":
                                    if (!glossList.contains(text) && glossList.size() < 5) {
                                        glossList.add(text);
                                    }
                                    break;
                            }
                            break;

                        case XMLStreamConstants.END_ELEMENT:
                            String endTag = reader.getLocalName();
                            if ("entry".equals(endTag)) {
                                if (!rebList.isEmpty() && !glossList.isEmpty()) {
                                    String surface = kebList.isEmpty() ? rebList.get(0) : kebList.get(0);
                                    String reading = rebList.get(0);
                                    String partOfSpeech = posList.isEmpty() ? "" : String.join(", ", posList);

                                    LocalEntry entry = LocalEntry.builder()
                                            .surface(surface)
                                            .reading(reading)
                                            .partOfSpeech(partOfSpeech)
                                            .meanings(new ArrayList<>(glossList))
                                            .build();

                                    // Map by surface/keb
                                    dictionaryMap.computeIfAbsent(surface, k -> new ArrayList<>()).add(entry);
                                    // Also map by reading/reb if different
                                    if (!reading.equals(surface)) {
                                        dictionaryMap.computeIfAbsent(reading, k -> new ArrayList<>()).add(entry);
                                    }
                                    count++;
                                }
                            }
                            currentTag = "";
                            break;
                    }
                }
                reader.close();
            }

            loaded = true;
            long duration = System.currentTimeMillis() - startTime;
            log.info("Successfully loaded {} local dictionary entries in {} ms", count, duration);

        } catch (Exception e) {
            log.error("Failed to load local dictionary JMdict.xml: {}", e.getMessage(), e);
        }
    }

    public List<LocalEntry> lookup(String word) {
        if (!loaded || word == null) {
            return Collections.emptyList();
        }
        return dictionaryMap.getOrDefault(word.trim(), Collections.emptyList());
    }

    public boolean isLoaded() {
        return loaded;
    }
}
