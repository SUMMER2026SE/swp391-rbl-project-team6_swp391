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
    private final com.midori.service.LearningAccessService learningAccessService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReadingLessonResponse>>> getReadingList(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String level) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        
        if (isStudent && level != null && !level.isBlank()) {
            learningAccessService.checkAccess(userDetails.getId(), level);
        }

        List<ReadingLessonResponse> readings;
        if (level != null && !level.isBlank()) {
            readings = readingLessonService.getActiveReadingLessonsByLevel(level);
        } else {
            readings = readingLessonService.getActiveReadingLessons();
        }

        if (isStudent && (level == null || level.isBlank())) {
            Set<String> activeLevels = learningAccessService.getStudentActiveLevels(userDetails.getId());
            readings = readings.stream()
                    .filter(r -> r.getJlptLevel() != null && activeLevels.contains(r.getJlptLevel()))
                    .toList();
        }

        ApiResponse<List<ReadingLessonResponse>> response = ApiResponse.success(readings);
        if (isStudent && level != null && !level.isBlank()) {
            response.setMetadata(learningAccessService.getAccessMetadata(userDetails.getId(), level));
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReadingDetailResponse>> getReadingDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        ReadingDetailResponse detail = readingLessonService.getReadingLessonDetail(id);
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && detail != null && detail.getJlptLevel() != null) {
            learningAccessService.checkAccess(userDetails.getId(), detail.getJlptLevel());
        }
        
        ApiResponse<ReadingDetailResponse> response = ApiResponse.success(detail);
        if (isStudent && detail != null && detail.getJlptLevel() != null) {
            response.setMetadata(learningAccessService.getAccessMetadata(userDetails.getId(), detail.getJlptLevel()));
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/level/{jlptLevel}")
    public ResponseEntity<ApiResponse<List<ReadingLessonResponse>>> getReadingByLevel(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String jlptLevel) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && jlptLevel != null && !jlptLevel.isBlank()) {
            learningAccessService.checkAccess(userDetails.getId(), jlptLevel);
        }
        
        List<ReadingLessonResponse> readings = readingLessonService.getActiveReadingLessonsByLevel(jlptLevel);
        ApiResponse<List<ReadingLessonResponse>> response = ApiResponse.success(readings);
        if (isStudent) {
            response.setMetadata(learningAccessService.getAccessMetadata(userDetails.getId(), jlptLevel));
        }
        return ResponseEntity.ok(response);
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
            learningAccessService.checkAccess(userDetails.getId(), detail.getJlptLevel());
        }

        ReadingSubmitResponse response = readingLessonService.submitAnswers(id, request);
        return ResponseEntity.ok(ApiResponse.success("Reading submission graded successfully", response));
    }
}
