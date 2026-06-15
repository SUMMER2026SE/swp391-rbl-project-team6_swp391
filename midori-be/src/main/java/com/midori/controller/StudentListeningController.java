package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.listening.ListeningDetailResponse;
import com.midori.dto.listening.ListeningResponse;
import com.midori.service.ListeningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/listenings")
@RequiredArgsConstructor
public class StudentListeningController {

    private final ListeningService listeningService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ListeningResponse>>> getListeningList(
            @RequestParam(required = false) String level) {
        List<ListeningResponse> response = listeningService.getListeningListForStudent(level);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ListeningDetailResponse>> getListeningDetail(@PathVariable UUID id) {
        ListeningDetailResponse response = listeningService.getListeningDetailForStudent(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
