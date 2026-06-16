package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.listening.*;
import com.midori.security.CustomUserDetails;
import com.midori.service.ListeningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teacher/listenings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class TeacherListeningController {

    private final ListeningService listeningService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<ListeningDetailResponse>> createListening(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @ModelAttribute CreateListeningRequest request) {
        ListeningDetailResponse response = listeningService.createListening(request, userDetails.getId());
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success("Listening lesson created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ListeningResponse>>> getAllListenings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String status) {
        List<ListeningResponse> response = listeningService.getAllListenings(level, status, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ListeningDetailResponse>> getListeningById(@PathVariable UUID id) {
        ListeningDetailResponse response = listeningService.getListeningById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<ListeningDetailResponse>> updateListening(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @ModelAttribute UpdateListeningRequest request) {
        ListeningDetailResponse response = listeningService.updateListening(id, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Listening lesson updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteListening(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        listeningService.deleteListening(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Listening lesson deleted successfully", null));
    }
}
