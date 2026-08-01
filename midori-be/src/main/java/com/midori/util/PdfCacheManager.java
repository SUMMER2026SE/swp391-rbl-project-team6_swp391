package com.midori.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.service.AiLearningContentService.SourceRecord;
import lombok.extern.slf4j.Slf4j;
import java.io.File;
import java.util.List;

@Slf4j
public class PdfCacheManager {
    private static final String CACHE_DIR = "target/pdf-cache";
    private static final ObjectMapper mapper = new ObjectMapper();

    public static class CacheData {
        public String extractedText;
        public List<SourceRecord> sourceRecords;
        public boolean likelyScanned;
        public int pageCount;

        public String getExtractedText() { return extractedText; }
        public void setExtractedText(String v) { this.extractedText = v; }
        public List<SourceRecord> getSourceRecords() { return sourceRecords; }
        public void setSourceRecords(List<SourceRecord> v) { this.sourceRecords = v; }
        public boolean isLikelyScanned() { return likelyScanned; }
        public void setLikelyScanned(boolean v) { this.likelyScanned = v; }
        public int getPageCount() { return pageCount; }
        public void setPageCount(int v) { this.pageCount = v; }
    }

    public static CacheData get(String fileHash) {
        try {
            File file = new File(CACHE_DIR, fileHash + ".json");
            if (file.exists()) {
                log.info("[PdfCacheManager] Cache hit for file hash: {}", fileHash);
                return mapper.readValue(file, CacheData.class);
            }
        } catch (Exception e) {
            log.warn("[PdfCacheManager] Error reading cache: {}", e.getMessage());
        }
        return null;
    }

    public static void put(String fileHash, CacheData data) {
        try {
            File dir = new File(CACHE_DIR);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File file = new File(dir, fileHash + ".json");
            mapper.writeValue(file, data);
            log.info("[PdfCacheManager] Cached extraction for file hash: {}", fileHash);
        } catch (Exception e) {
            log.warn("[PdfCacheManager] Error writing cache: {}", e.getMessage());
        }
    }
}
