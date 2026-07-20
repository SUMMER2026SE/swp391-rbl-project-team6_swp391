package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.reading.ReadingDetailResponse;
import com.midori.dto.reading.ReadingLessonResponse;
import com.midori.dto.reading.ReadingSubmitRequest;
import com.midori.dto.reading.ReadingSubmitResponse;
import com.midori.security.CustomUserDetails;
import com.midori.service.ClassService;
import com.midori.service.ReadingLessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/reading")
@RequiredArgsConstructor
public class ReadingStudentController {

    private final ReadingLessonService readingLessonService;
    private final ClassService classService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReadingLessonResponse>>> getReadingList(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String level) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        
        if (isStudent && level != null && !level.isBlank()) {
            if (!classService.isStudentEnrolledInLevel(userDetails.getId(), level)) {
                throw new com.midori.exception.AccessDeniedException("You are not enrolled in a class for level " + level);
            }
        }

        List<ReadingLessonResponse> readings;
        if (level != null && !level.isBlank()) {
            readings = readingLessonService.getActiveReadingLessonsByLevel(level);
        } else {
            readings = readingLessonService.getActiveReadingLessons();
        }

        if (isStudent && (level == null || level.isBlank())) {
            Set<String> activeLevels = classService.getStudentActiveLevels(userDetails.getId());
            readings = readings.stream()
                    .filter(r -> r.getJlptLevel() != null && activeLevels.contains(r.getJlptLevel()))
                    .toList();
        }

        return ResponseEntity.ok(ApiResponse.success(readings));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReadingDetailResponse>> getReadingDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        ReadingDetailResponse detail = readingLessonService.getReadingLessonDetail(id);
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && detail != null && detail.getJlptLevel() != null) {
            if (!classService.isStudentEnrolledInLevel(userDetails.getId(), detail.getJlptLevel())) {
                throw new com.midori.exception.AccessDeniedException("You are not enrolled in a class for level " + detail.getJlptLevel());
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @GetMapping("/level/{jlptLevel}")
    public ResponseEntity<ApiResponse<List<ReadingLessonResponse>>> getReadingByLevel(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String jlptLevel) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && jlptLevel != null && !jlptLevel.isBlank()) {
            if (!classService.isStudentEnrolledInLevel(userDetails.getId(), jlptLevel)) {
                throw new com.midori.exception.AccessDeniedException("You are not enrolled in a class for level " + jlptLevel);
            }
        }
        
        List<ReadingLessonResponse> readings = readingLessonService.getActiveReadingLessonsByLevel(jlptLevel);
        return ResponseEntity.ok(ApiResponse.success(readings));
    }

    /**
     * Grade a Reading attempt on the server and return a detailed result.
     *
     * <p>This endpoint is the source of truth for the new Student Learning
     * Journey → Reading flow. The response intentionally extends the legacy
     * {@code score} field with the per-question breakdown that the Review
     * screen needs, without breaking any callers that only read {@code score}.
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<ReadingSubmitResponse>> submitAnswers(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody ReadingSubmitRequest request) {
        
        ReadingDetailResponse detail = readingLessonService.getReadingLessonDetail(id);
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && detail != null && detail.getJlptLevel() != null) {
            if (!classService.isStudentEnrolledInLevel(userDetails.getId(), detail.getJlptLevel())) {
                throw new com.midori.exception.AccessDeniedException("You are not enrolled in a class for level " + detail.getJlptLevel());
            }
        }

        ReadingSubmitResponse response = readingLessonService.submitAnswers(id, request);
        return ResponseEntity.ok(ApiResponse.success("Reading submission graded successfully", response));
    }
}
