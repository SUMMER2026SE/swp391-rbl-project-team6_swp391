package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.vocabulary.VocabularyDetailResponse;
import com.midori.dto.vocabulary.VocabularyLessonResponse;
import com.midori.security.CustomUserDetails;
import com.midori.service.ClassService;
import com.midori.service.VocabularyLessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/vocabulary")
@RequiredArgsConstructor
public class VocabularyStudentController {

    private final VocabularyLessonService vocabularyLessonService;
    private final ClassService classService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VocabularyLessonResponse>>> getVocabularyList(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String level) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        
        if (isStudent && level != null && !level.isBlank()) {
            if (!classService.isStudentEnrolledInLevel(userDetails.getId(), level)) {
                throw new com.midori.exception.AccessDeniedException("You are not enrolled in a class for level " + level);
            }
        }

        List<VocabularyLessonResponse> vocabularies;
        if (level != null && !level.isBlank()) {
            vocabularies = vocabularyLessonService.getActiveVocabularyLessonsByLevel(level);
        } else {
            vocabularies = vocabularyLessonService.getActiveVocabularyLessons();
        }

        if (isStudent && (level == null || level.isBlank())) {
            Set<String> activeLevels = classService.getStudentActiveLevels(userDetails.getId());
            vocabularies = vocabularies.stream()
                    .filter(v -> v.getJlptLevel() != null && activeLevels.contains(v.getJlptLevel()))
                    .toList();
        }

        return ResponseEntity.ok(ApiResponse.success(vocabularies));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VocabularyDetailResponse>> getVocabularyDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        VocabularyDetailResponse detail = vocabularyLessonService.getVocabularyLessonDetail(id);
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && detail != null && detail.getJlptLevel() != null) {
            if (!classService.isStudentEnrolledInLevel(userDetails.getId(), detail.getJlptLevel())) {
                throw new com.midori.exception.AccessDeniedException("You are not enrolled in a class for level " + detail.getJlptLevel());
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @GetMapping("/level/{jlptLevel}")
    public ResponseEntity<ApiResponse<List<VocabularyLessonResponse>>> getVocabularyByLevel(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String jlptLevel) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && jlptLevel != null && !jlptLevel.isBlank()) {
            if (!classService.isStudentEnrolledInLevel(userDetails.getId(), jlptLevel)) {
                throw new com.midori.exception.AccessDeniedException("You are not enrolled in a class for level " + jlptLevel);
            }
        }
        
        List<VocabularyLessonResponse> vocabularies = vocabularyLessonService.getActiveVocabularyLessonsByLevel(jlptLevel);
        return ResponseEntity.ok(ApiResponse.success(vocabularies));
    }
}