package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.lesson.LessonResponse;
import com.midori.security.CustomUserDetails;
import com.midori.service.ClassService;
import com.midori.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonService lessonService;
    private final ClassService classService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LessonResponse>>> getAllLessons(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String level) {
        
        boolean isStudent = userDetails != null && "STUDENT".equalsIgnoreCase(userDetails.getRole());
        
        if (isStudent) {
            if (level != null && !level.isBlank()) {
                if (!classService.isStudentEnrolledInLevel(userDetails.getId(), level)) {
                    throw new com.midori.exception.AccessDeniedException("You are not enrolled in a class for level " + level);
                }
            }
        }

        List<LessonResponse> lessons;
        if (level != null && !level.isBlank()) {
            lessons = lessonService.getLessonsByLevel(level);
        } else {
            lessons = lessonService.getAllLessons();
        }

        if (isStudent && (level == null || level.isBlank())) {
            Set<String> activeLevels = classService.getStudentActiveLevels(userDetails.getId());
            lessons = lessons.stream()
                    .filter(lesson -> lesson.getLevel() != null && activeLevels.contains(lesson.getLevel()))
                    .toList();
        }

        return ResponseEntity.ok(ApiResponse.success(lessons));
    }
}
