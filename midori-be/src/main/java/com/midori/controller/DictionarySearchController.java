package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.service.DictionarySearchService;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
public class DictionarySearchController {

    private final DictionarySearchService searchService;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Object>> search(
            @RequestParam("query") @NotBlank(message = "Query parameter must not be blank") String query,
            @RequestParam(value = "page", defaultValue = "0") @Min(value = 0, message = "Page index must not be negative") int page,
            @RequestParam(value = "size", defaultValue = "20") @Min(value = 1, message = "Page size must be at least 1") int size,
            @RequestParam(value = "sortBy", defaultValue = "frequency") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc") String sortDir,
            @RequestParam(value = "autocomplete", defaultValue = "false") boolean autocomplete) {

        if (autocomplete) {
            Object suggestions = searchService.autocomplete(query);
            return ResponseEntity.ok(ApiResponse.success(suggestions));
        }

        Sort.Direction direction = Sort.Direction.DESC;
        if ("asc".equalsIgnoreCase(sortDir)) {
            direction = Sort.Direction.ASC;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Object searchResult = searchService.search(query, pageable);
        return ResponseEntity.ok(ApiResponse.success(searchResult));
    }
}
