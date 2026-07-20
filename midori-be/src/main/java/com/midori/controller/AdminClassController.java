package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.classdto.AdminClassResponse;
import com.midori.dto.classdto.StudentClassResponse;
import com.midori.dto.homeworkdto.HomeworkResponse;
import com.midori.dto.response.ExamResponse;
import com.midori.service.AdminClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/classes")
@RequiredArgsConstructor
public class AdminClassController {

    private final AdminClassService adminClassService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminClassResponse>>> getAdminClasses() {
        List<AdminClassResponse> classes = adminClassService.getAdminClasses();
        return ResponseEntity.ok(ApiResponse.success(classes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminClassResponse>> getAdminClassById(@PathVariable UUID id) {
        AdminClassResponse classResponse = adminClassService.getAdminClassById(id);
        return ResponseEntity.ok(ApiResponse.success(classResponse));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<ApiResponse<List<StudentClassResponse>>> getClassStudents(@PathVariable UUID id) {
        List<StudentClassResponse> students = adminClassService.getClassStudents(id);
        return ResponseEntity.ok(ApiResponse.success(students));
    }

    @GetMapping("/{id}/homeworks")
    public ResponseEntity<ApiResponse<List<HomeworkResponse>>> getClassHomeworks(@PathVariable UUID id) {
        List<HomeworkResponse> homeworks = adminClassService.getClassHomeworks(id);
        return ResponseEntity.ok(ApiResponse.success(homeworks));
    }

    @GetMapping("/{id}/exams")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getClassExams(@PathVariable UUID id) {
        List<ExamResponse> exams = adminClassService.getClassExams(id);
        return ResponseEntity.ok(ApiResponse.success(exams));
    }
}
