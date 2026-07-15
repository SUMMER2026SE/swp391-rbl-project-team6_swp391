package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.service.DictionaryService;
import com.midori.service.impl.DictionaryImporter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.InputStreamResource;

import java.io.InputStream;

@Slf4j
@RestController
@RequestMapping("/api/admin/dictionary")
@RequiredArgsConstructor
@Tag(name = "Admin Dictionary", description = "Admin endpoints for dictionary management")
public class AdminDictionaryController {

    private final DictionaryImporter dictionaryImporter;

    @Operation(
            summary = "Import JMdict dictionary",
            description = "Triggers import of JMdict dictionary data from the classpath resource"
    )
    @PostMapping("/import/jmdict")
    public ResponseEntity<ApiResponse<DictionaryImportResponse>> importJMdict() {
        log.info("[AdminDictionary] Starting JMdict import...");
        long startTime = System.currentTimeMillis();
        
        try {
            InputStream inputStream;
            try {
                ClassPathResource resource = new ClassPathResource("dictionary/JMdict.xml");
                inputStream = resource.getInputStream();
                log.info("[AdminDictionary] Found JMdict.xml in classpath");
            } catch (Exception e) {
                log.error("[AdminDictionary] Could not find JMdict.xml: {}", e.getMessage());
                return ResponseEntity.badRequest().body(
                        ApiResponse.error("Could not find JMdict.xml in resources: " + e.getMessage())
                );
            }

            try {
                dictionaryImporter.importDictionary(inputStream);
            } finally {
                inputStream.close();
            }

            long duration = System.currentTimeMillis() - startTime;
            log.info("[AdminDictionary] JMdict import completed in {} ms", duration);

            return ResponseEntity.ok(ApiResponse.success(
                    new DictionaryImportResponse(true, "JMdict imported successfully", duration)
            ));
        } catch (Exception e) {
            log.error("[AdminDictionary] Import failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("Import failed: " + e.getMessage())
            );
        }
    }

    @Operation(
            summary = "Bulk import JMdict (180k entries)",
            description = "Optimized bulk import for full JMdict dictionary"
    )
    @PostMapping("/import/jmdict/bulk")
    public ResponseEntity<ApiResponse<DictionaryImportResponse>> bulkImportJMdict() {
        log.info("[AdminDictionary] Starting JMdict BULK import...");
        long startTime = System.currentTimeMillis();
        
        try {
            InputStream inputStream;
            try {
                ClassPathResource resource = new ClassPathResource("dictionary/JMdict.xml");
                inputStream = resource.getInputStream();
                log.info("[AdminDictionary] Found JMdict.xml for bulk import");
            } catch (Exception e) {
                log.error("[AdminDictionary] Could not find JMdict.xml: {}", e.getMessage());
                return ResponseEntity.badRequest().body(
                        ApiResponse.error("Could not find JMdict.xml in resources: " + e.getMessage())
                );
            }

            try {
                DictionaryImporter.BulkImportResult result = dictionaryImporter.bulkImportJMdict(inputStream);
                log.info("[AdminDictionary] Bulk import completed: {} imported, {} skipped, {} failed", 
                        result.imported(), result.skipped(), result.failed());
            } finally {
                inputStream.close();
            }

            long duration = System.currentTimeMillis() - startTime;
            log.info("[AdminDictionary] JMdict bulk import completed in {} ms", duration);

            return ResponseEntity.ok(ApiResponse.success(
                    new DictionaryImportResponse(true, "JMdict bulk import completed", duration)
            ));
        } catch (Exception e) {
            log.error("[AdminDictionary] Bulk import failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("Bulk import failed: " + e.getMessage())
            );
        }
    }

    @Operation(
            summary = "Get dictionary status",
            description = "Returns the current status of the dictionary"
    )
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<DictionaryStatusResponse>> getStatus() {
        try {
            // This is a simple status check - could be expanded to return actual counts
            return ResponseEntity.ok(ApiResponse.success(
                    new DictionaryStatusResponse(true, "Dictionary service is running")
            ));
        } catch (Exception e) {
            log.error("[AdminDictionary] Status check failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("Status check failed: " + e.getMessage())
            );
        }
    }

    public record DictionaryImportResponse(boolean success, String message, long durationMs) {}
    public record DictionaryStatusResponse(boolean available, String status) {}
}
