package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.classdto.ClassResponse;
import com.midori.dto.classdto.CreateClassRequest;
import com.midori.dto.classdto.UpdateClassRequest;
import com.midori.dto.classdto.StudentClassResponse;
import com.midori.dto.progress.StudentProgressResponse;
import com.midori.security.CustomUserDetails;
import com.midori.service.ClassService;
import com.midori.service.StudyProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teacher/classes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherClassController {

    private final ClassService classService;
    private final StudyProgressService studyProgressService;

    @PostMapping
    public ResponseEntity<ApiResponse<ClassResponse>> createClass(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateClassRequest request) {
        ClassResponse classResponse = classService.createClass(request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Class created successfully", classResponse));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassResponse>> updateClass(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateClassRequest request) {
        ClassResponse classResponse = classService.updateClass(id, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Class updated successfully", classResponse));
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<ClassResponse>> archiveClass(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        ClassResponse classResponse = classService.archiveClass(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Class archived successfully", classResponse));
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<ClassResponse>> restoreClass(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        ClassResponse classResponse = classService.restoreClass(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Class restored successfully", classResponse));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<ApiResponse<List<StudentClassResponse>>> getClassStudents(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        List<StudentClassResponse> students = classService.getClassStudents(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(students));
    }

    @DeleteMapping("/{id}/students/{studentId}")
    public ResponseEntity<ApiResponse<Void>> removeStudentFromClass(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @PathVariable UUID studentId) {
        classService.removeStudentFromClass(id, studentId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Student removed from class successfully", null));
    }

    @PostMapping("/{id}/students")
    public ResponseEntity<ApiResponse<StudentClassResponse>> addStudentToClass(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestParam String email) {
        StudentClassResponse response = classService.addStudentToClass(id, email, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Student added to class successfully", response));
    }

    @GetMapping("/selectable")
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getSelectableClasses(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ClassResponse> response = classService.getSelectableClasses(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/students/{studentId}/progress")
    public ResponseEntity<ApiResponse<StudentProgressResponse>> getStudentProgress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @PathVariable UUID studentId) {
        StudentProgressResponse response = studyProgressService.getStudentProgressForTeacher(id, studentId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
