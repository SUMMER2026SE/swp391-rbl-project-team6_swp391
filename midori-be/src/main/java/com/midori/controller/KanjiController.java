package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.kanji.KanjiResponse;
import com.midori.service.KanjiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/kanji")
@RequiredArgsConstructor
@Tag(name = "Kanji Dictionary", description = "Endpoints for lookup of Japanese Kanji characters")
public class KanjiController {

    private final KanjiService kanjiService;

    @Operation(summary = "Get Kanji details", description = "Returns stroke counts, readings, and meanings for a single character.")
    @GetMapping("/{kanji}")
    public ResponseEntity<ApiResponse<KanjiResponse>> getKanji(@PathVariable("kanji") String kanji) {
        KanjiResponse response = kanjiService.getKanjiInfo(kanji);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
