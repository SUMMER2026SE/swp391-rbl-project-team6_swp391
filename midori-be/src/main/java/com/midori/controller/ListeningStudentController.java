package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.listening.ListeningDetailResponse;
import com.midori.dto.listening.ListeningLessonResponse;
import com.midori.security.CustomUserDetails;
import com.midori.service.ClassService;
import com.midori.service.ListeningLessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/listening")
@RequiredArgsConstructor
public class ListeningStudentController {

    private final ListeningLessonService listeningLessonService;
    private final ClassService classService;
    private final com.midori.service.LearningAccessService learningAccessService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ListeningLessonResponse>>> getListeningList(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String level) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        
        if (isStudent && level != null && !level.isBlank()) {
            learningAccessService.checkAccess(userDetails.getId(), level);
        }

        List<ListeningLessonResponse> listenings;
        if (level != null && !level.isBlank()) {
            listenings = listeningLessonService.getActiveListeningLessonsByLevel(level);
        } else {
            listenings = listeningLessonService.getActiveListeningLessons();
        }

        if (isStudent && (level == null || level.isBlank())) {
            Set<String> activeLevels = learningAccessService.getStudentActiveLevels(userDetails.getId());
            listenings = listenings.stream()
                    .filter(l -> l.getJlptLevel() != null && activeLevels.contains(l.getJlptLevel()))
                    .toList();
        }

        ApiResponse<List<ListeningLessonResponse>> response = ApiResponse.success(listenings);
        if (isStudent && level != null && !level.isBlank()) {
            response.setMetadata(learningAccessService.getAccessMetadata(userDetails.getId(), level));
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ListeningDetailResponse>> getListeningDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        ListeningDetailResponse detail = listeningLessonService.getListeningLessonDetail(id);
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && detail != null && detail.getJlptLevel() != null) {
            learningAccessService.checkAccess(userDetails.getId(), detail.getJlptLevel());
        }
        
        ApiResponse<ListeningDetailResponse> response = ApiResponse.success(detail);
        if (isStudent && detail != null && detail.getJlptLevel() != null) {
            response.setMetadata(learningAccessService.getAccessMetadata(userDetails.getId(), detail.getJlptLevel()));
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/level/{jlptLevel}")
    public ResponseEntity<ApiResponse<List<ListeningLessonResponse>>> getListeningByLevel(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String jlptLevel) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        if (isStudent && jlptLevel != null && !jlptLevel.isBlank()) {
            learningAccessService.checkAccess(userDetails.getId(), jlptLevel);
        }
        
        List<ListeningLessonResponse> listenings = listeningLessonService.getActiveListeningLessonsByLevel(jlptLevel);
        ApiResponse<List<ListeningLessonResponse>> response = ApiResponse.success(listenings);
        if (isStudent) {
            response.setMetadata(learningAccessService.getAccessMetadata(userDetails.getId(), jlptLevel));
        }
        return ResponseEntity.ok(response);
    }
}
