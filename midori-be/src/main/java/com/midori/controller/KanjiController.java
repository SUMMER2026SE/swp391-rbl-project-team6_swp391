package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.kanji.KanjiResponse;
import com.midori.service.KanjiService;
import com.midori.service.KanjiSvgService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/kanji")
@RequiredArgsConstructor
@Tag(name = "Kanji Dictionary", description = "Endpoints for lookup of Japanese Kanji characters")
public class KanjiController {

    private final KanjiService kanjiService;
    private final KanjiSvgService kanjiSvgService;

    @Operation(summary = "Get Kanji details",
            description = "Returns stroke counts, readings, meanings, and SVG availability for a single character.")
    @GetMapping("/{kanji}")
    public ResponseEntity<ApiResponse<KanjiResponse>> getKanji(@PathVariable("kanji") String kanji) {
        KanjiResponse response = kanjiService.getKanjiInfo(kanji);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Get Kanji SVG stroke order",
            description = "Returns raw KanjiVG SVG content for stroke order animation. " +
                    "Uses the kanji's database UUID — no Unicode computation at request time.")
    @GetMapping(value = "/{id}/svg", produces = "image/svg+xml")
    public ResponseEntity<String> getKanjiSvg(@PathVariable("id") UUID id) {
        String svgContent = kanjiSvgService.getKanjiSvgById(id);
        return ResponseEntity.ok(svgContent);
    }
}
