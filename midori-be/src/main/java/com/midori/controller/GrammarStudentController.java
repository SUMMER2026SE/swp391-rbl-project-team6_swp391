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

    @GetMapping
    public ResponseEntity<ApiResponse<List<GrammarLessonResponse>>> getGrammarList(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String level) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        
        if (isStudent && level != null && !level.isBlank()) {
            if (!classService.isStudentEnrolledInLevel(userDetails.getId(), level)) {
                throw new com.midori.exception.AccessDeniedException("You are not enrolled in a class for level " + level);
            }
        }

        List<GrammarLessonResponse> grammars;
        if (level != null && !level.isBlank()) {
            grammars = grammarLessonService.getActiveGrammarLessonsByLevel(level);
        } else {
            grammars = grammarLessonService.getActiveGrammarLessons();
        }

        if (isStudent && (level == null || level.isBlank())) {
            Set<String> activeLevels = classService.getStudentActiveLevels(userDetails.getId());
            grammars = grammars.stream()
                    .filter(g -> g.getJlptLevel() != null && activeLevels.contains(g.getJlptLevel()))
                    .toList();
        }

        return ResponseEntity.ok(ApiResponse.success(grammars));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GrammarDetailResponse>> getGrammarDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        GrammarDetailResponse detail = grammarLessonService.getGrammarLessonDetail(id);
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && detail != null && detail.getJlptLevel() != null) {
            if (!classService.isStudentEnrolledInLevel(userDetails.getId(), detail.getJlptLevel())) {
                throw new com.midori.exception.AccessDeniedException("You are not enrolled in a class for level " + detail.getJlptLevel());
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @GetMapping("/level/{jlptLevel}")
    public ResponseEntity<ApiResponse<List<GrammarLessonResponse>>> getGrammarByLevel(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String jlptLevel) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && jlptLevel != null && !jlptLevel.isBlank()) {
            if (!classService.isStudentEnrolledInLevel(userDetails.getId(), jlptLevel)) {
                throw new com.midori.exception.AccessDeniedException("You are not enrolled in a class for level " + jlptLevel);
            }
        }
        
        List<GrammarLessonResponse> grammars = grammarLessonService.getActiveGrammarLessonsByLevel(jlptLevel);
        return ResponseEntity.ok(ApiResponse.success(grammars));
    }
}
