package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.classdto.ClassResponse;
import com.midori.dto.homeworkdto.HomeworkResponse;
import com.midori.dto.response.ExamResponse;
import com.midori.security.CustomUserDetails;
import com.midori.service.ClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/classes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentClassController {

    private final ClassService classService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getJoinedClasses(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ClassResponse> classes = classService.getStudentClasses(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(classes));
    }

    @GetMapping("/{classId}")
    public ResponseEntity<ApiResponse<ClassResponse>> getClassDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID classId) {
        ClassResponse classResponse = classService.getStudentClassDetail(userDetails.getId(), classId);
        return ResponseEntity.ok(ApiResponse.success(classResponse));
    }

    @GetMapping("/{classId}/lessons")
    public ResponseEntity<ApiResponse<List<Object>>> getClassLessons(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID classId) {
        List<Object> combinedLessons = classService.getClassLessons(userDetails.getId(), classId);
        return ResponseEntity.ok(ApiResponse.success(combinedLessons));
    }

    @GetMapping("/{classId}/homework")
    public ResponseEntity<ApiResponse<List<HomeworkResponse>>> getClassHomework(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID classId) {
        List<HomeworkResponse> responses = classService.getClassHomework(userDetails.getId(), classId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{classId}/exams")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getClassExams(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID classId) {
        List<ExamResponse> exams = classService.getClassExams(userDetails.getId(), classId);
        return ResponseEntity.ok(ApiResponse.success(exams));
    }
}


