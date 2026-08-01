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
    private final com.midori.service.LearningAccessService learningAccessService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VocabularyLessonResponse>>> getVocabularyList(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String level) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        
        if (isStudent && level != null && !level.isBlank()) {
            learningAccessService.checkAccess(userDetails.getId(), level);
        }

        List<VocabularyLessonResponse> vocabularies;
        if (level != null && !level.isBlank()) {
            vocabularies = vocabularyLessonService.getActiveVocabularyLessonsByLevel(level);
        } else {
            vocabularies = vocabularyLessonService.getActiveVocabularyLessons();
        }

        if (isStudent && (level == null || level.isBlank())) {
            Set<String> activeLevels = learningAccessService.getStudentActiveLevels(userDetails.getId());
            vocabularies = vocabularies.stream()
                    .filter(v -> v.getJlptLevel() != null && activeLevels.contains(v.getJlptLevel()))
                    .toList();
        }

        ApiResponse<List<VocabularyLessonResponse>> response = ApiResponse.success(vocabularies);
        if (isStudent && level != null && !level.isBlank()) {
            response.setMetadata(learningAccessService.getAccessMetadata(userDetails.getId(), level));
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VocabularyDetailResponse>> getVocabularyDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        VocabularyDetailResponse detail = vocabularyLessonService.getVocabularyLessonDetail(id);
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && detail != null && detail.getJlptLevel() != null) {
            learningAccessService.checkAccess(userDetails.getId(), detail.getJlptLevel());
        }
        
        ApiResponse<VocabularyDetailResponse> response = ApiResponse.success(detail);
        if (isStudent && detail != null && detail.getJlptLevel() != null) {
            response.setMetadata(learningAccessService.getAccessMetadata(userDetails.getId(), detail.getJlptLevel()));
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/level/{jlptLevel}")
    public ResponseEntity<ApiResponse<List<VocabularyLessonResponse>>> getVocabularyByLevel(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String jlptLevel) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && jlptLevel != null && !jlptLevel.isBlank()) {
            learningAccessService.checkAccess(userDetails.getId(), jlptLevel);
        }
        
        List<VocabularyLessonResponse> vocabularies = vocabularyLessonService.getActiveVocabularyLessonsByLevel(jlptLevel);
        ApiResponse<List<VocabularyLessonResponse>> response = ApiResponse.success(vocabularies);
        if (isStudent) {
            response.setMetadata(learningAccessService.getAccessMetadata(userDetails.getId(), jlptLevel));
        }
        return ResponseEntity.ok(response);
    }
}