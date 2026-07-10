package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.listening.ListeningDetailResponse;
import com.midori.dto.listening.ListeningLessonResponse;
import com.midori.service.ListeningLessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/listening")
@RequiredArgsConstructor
public class ListeningStudentController {

    private final ListeningLessonService listeningLessonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ListeningLessonResponse>>> getListeningList(
            @RequestParam(required = false) String level) {
        List<ListeningLessonResponse> listenings;
        if (level != null && !level.isBlank()) {
            listenings = listeningLessonService.getActiveListeningLessonsByLevel(level);
        } else {
            listenings = listeningLessonService.getActiveListeningLessons();
        }
        return ResponseEntity.ok(ApiResponse.success(listenings));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ListeningDetailResponse>> getListeningDetail(
            @PathVariable UUID id) {
        ListeningDetailResponse detail = listeningLessonService.getListeningLessonDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @GetMapping("/level/{jlptLevel}")
    public ResponseEntity<ApiResponse<List<ListeningLessonResponse>>> getListeningByLevel(
            @PathVariable String jlptLevel) {
        List<ListeningLessonResponse> listenings = listeningLessonService.getActiveListeningLessonsByLevel(jlptLevel);
        return ResponseEntity.ok(ApiResponse.success(listenings));
    }
}
