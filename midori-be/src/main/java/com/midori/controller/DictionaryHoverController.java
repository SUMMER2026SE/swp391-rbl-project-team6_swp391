package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.dictionary.DictionaryHoverResponse;
import com.midori.service.DictionaryHoverService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dictionary")
@RequiredArgsConstructor
@Validated
public class DictionaryHoverController {

    private final DictionaryHoverService hoverService;

    @GetMapping("/hover")
    public ResponseEntity<ApiResponse<DictionaryHoverResponse>> getHoverInfo(
            @RequestParam(value = "word", defaultValue = "") String word) {
        if (word == null || word.trim().isEmpty()) {
            throw new IllegalArgumentException("Parameter 'word' must not be blank");
        }
        DictionaryHoverResponse response = hoverService.getHoverInfo(word);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
