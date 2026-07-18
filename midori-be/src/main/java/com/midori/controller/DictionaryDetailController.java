package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.dictionary.DictionaryDetailResponse;
import com.midori.service.DictionaryDetailService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestController
@RequestMapping("/api/dictionary")
@RequiredArgsConstructor
@Validated
public class DictionaryDetailController {

    private final DictionaryDetailService detailService;

    @GetMapping("/detail")
    public ResponseEntity<ApiResponse<DictionaryDetailResponse>> getDetail(
            @RequestParam(value = "word", defaultValue = "") String word) {
        if (word == null || word.trim().isEmpty()) {
            throw new IllegalArgumentException("Parameter 'word' must not be blank");
        }
        DictionaryDetailResponse response = detailService.getDetail(word);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
