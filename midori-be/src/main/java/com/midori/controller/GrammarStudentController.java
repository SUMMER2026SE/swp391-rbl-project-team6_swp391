package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.grammar.GrammarDetailResponse;
import com.midori.dto.grammar.GrammarLessonResponse;
import com.midori.security.CustomUserDetails;
import com.midori.service.ClassService;
import com.midori.service.GrammarLessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/grammar")
@RequiredArgsConstructor
public class GrammarStudentController {

    private final GrammarLessonService grammarLessonService;
    private final ClassService classService;
    private final com.midori.service.LearningAccessService learningAccessService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GrammarLessonResponse>>> getGrammarList(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String level) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        
        if (isStudent && level != null && !level.isBlank()) {
            learningAccessService.checkAccess(userDetails.getId(), level);
        }

        List<GrammarLessonResponse> grammars;
        if (level != null && !level.isBlank()) {
            grammars = grammarLessonService.getActiveGrammarLessonsByLevel(level);
        } else {
            grammars = grammarLessonService.getActiveGrammarLessons();
        }

        if (isStudent && (level == null || level.isBlank())) {
            Set<String> activeLevels = learningAccessService.getStudentActiveLevels(userDetails.getId());
            grammars = grammars.stream()
                    .filter(g -> g.getJlptLevel() != null && activeLevels.contains(g.getJlptLevel()))
                    .toList();
        }

        ApiResponse<List<GrammarLessonResponse>> response = ApiResponse.success(grammars);
        if (isStudent && level != null && !level.isBlank()) {
            response.setMetadata(learningAccessService.getAccessMetadata(userDetails.getId(), level));
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GrammarDetailResponse>> getGrammarDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        GrammarDetailResponse detail = grammarLessonService.getGrammarLessonDetail(id);
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && detail != null && detail.getJlptLevel() != null) {
            learningAccessService.checkAccess(userDetails.getId(), detail.getJlptLevel());
        }
        
        ApiResponse<GrammarDetailResponse> response = ApiResponse.success(detail);
        if (isStudent && detail != null && detail.getJlptLevel() != null) {
            response.setMetadata(learningAccessService.getAccessMetadata(userDetails.getId(), detail.getJlptLevel()));
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/level/{jlptLevel}")
    public ResponseEntity<ApiResponse<List<GrammarLessonResponse>>> getGrammarByLevel(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String jlptLevel) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && jlptLevel != null && !jlptLevel.isBlank()) {
            learningAccessService.checkAccess(userDetails.getId(), jlptLevel);
        }
        
        List<GrammarLessonResponse> grammars = grammarLessonService.getActiveGrammarLessonsByLevel(jlptLevel);
        ApiResponse<List<GrammarLessonResponse>> response = ApiResponse.success(grammars);
        if (isStudent) {
            response.setMetadata(learningAccessService.getAccessMetadata(userDetails.getId(), jlptLevel));
        }
        return ResponseEntity.ok(response);
    }
}
