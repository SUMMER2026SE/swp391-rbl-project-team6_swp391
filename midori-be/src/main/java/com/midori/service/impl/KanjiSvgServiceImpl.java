package com.midori.service.impl;

import com.midori.entity.KanjiEntry;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.KanjiEntryRepository;
import com.midori.service.KanjiSvgService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class KanjiSvgServiceImpl implements KanjiSvgService {

    private final KanjiEntryRepository kanjiEntryRepository;

    @PostConstruct
    public void checkKanjiVgDataset() {
        Resource checkResource = new ClassPathResource("dictionary/kanjivg/04e00.svg");
        if (!checkResource.exists()) {
            log.warn("=============================================================");
            log.warn("[KanjiSvgService] KanjiVG dataset is missing from the classpath (dictionary/kanjivg/).");
            log.warn("Stroke order animations will be unavailable.");
            log.warn("Please follow instructions in README.md to download and install KanjiVG.");
            log.warn("=============================================================");
        } else {
            log.info("[KanjiSvgService] KanjiVG dataset detected and successfully loaded.");
        }
    }

    /**
     * Simple in-memory cache for SVG content.
     * Key: svg filename, Value: SVG content string.
     * SVG files are static and never change, so caching is safe.
     */
    private final Map<String, String> svgCache = new ConcurrentHashMap<>();

    @Override
    public String getKanjiSvgById(UUID kanjiId) {
        // Step 1: Query PostgreSQL for the kanji entry
        KanjiEntry entry = kanjiEntryRepository.findById(kanjiId)
                .orElseThrow(() -> new ResourceNotFoundException("KanjiEntry", "id", kanjiId.toString()));

        // Step 2: Check if svg_file is available
        String svgFile = entry.getSvgFile();
        if (svgFile == null || svgFile.isBlank()) {
            throw new ResourceNotFoundException("Kanji SVG", "id", kanjiId.toString());
        }

        // Pad 4-digit hex filename to 5-digit to match KanjiVG official dataset file naming (e.g. 98df.svg -> 098df.svg)
        if (svgFile.length() == 8) {
            svgFile = "0" + svgFile;
        }

        // Step 3: Check cache first
        String cached = svgCache.get(svgFile);
        if (cached != null) {
            return cached;
        }

        // Step 4: Load SVG from classpath resources or fallback to GitHub KanjiVG raw
        Resource resource = new ClassPathResource("dictionary/kanjivg/" + svgFile);
        if (resource.exists()) {
            try (InputStream inputStream = resource.getInputStream()) {
                String content = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
                svgCache.put(svgFile, content);
                return content;
            } catch (IOException e) {
                log.error("Failed to read SVG file from classpath: {}", svgFile, e);
            }
        }

        // Fallback: Fetch directly from official KanjiVG GitHub raw repository
        String githubUrl = "https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/" + svgFile;
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(githubUrl))
                    .GET()
                    .build();
            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 && response.body() != null && !response.body().isBlank()) {
                String content = response.body();
                svgCache.put(svgFile, content);
                return content;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch SVG from GitHub fallback URL: {}", githubUrl, e);
        }

        log.warn("SVG file not found in classpath or GitHub: {}", svgFile);
        throw new ResourceNotFoundException("Kanji SVG file", "filename", svgFile);
    }
}
