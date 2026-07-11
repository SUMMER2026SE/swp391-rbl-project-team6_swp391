package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.request.CreateExamRequest;
import com.midori.dto.request.SubmitExamRequest;
import com.midori.dto.request.UpdateExamQuestionsRequest;
import com.midori.dto.request.UpdateExamRequest;
import com.midori.dto.response.ExamResponse;
import com.midori.dto.response.StudentExamResponse;
import com.midori.service.ExamGenerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamGenerationService examGenerationService;

    @PostMapping
    public ResponseEntity<ApiResponse<ExamResponse>> createExam(
            @Valid @RequestBody CreateExamRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ExamResponse exam = examGenerationService.createExam(request, userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Exam created successfully", exam));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getAllExams() {
        List<ExamResponse> exams = examGenerationService.getAllExams();
        return ResponseEntity.ok(ApiResponse.success(exams));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamResponse>> getExam(@PathVariable UUID id) {
        ExamResponse exam = examGenerationService.getExamById(id);
        return ResponseEntity.ok(ApiResponse.success(exam));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getExamsByTeacher(@PathVariable UUID teacherId) {
        List<ExamResponse> exams = examGenerationService.getExamsByTeacher(teacherId);
        return ResponseEntity.ok(ApiResponse.success(exams));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<ExamResponse>> publishExam(@PathVariable UUID id) {
        ExamResponse exam = examGenerationService.publishExam(id);
        return ResponseEntity.ok(ApiResponse.success("Exam published successfully", exam));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExam(@PathVariable UUID id) {
        examGenerationService.deleteExam(id);
        return ResponseEntity.ok(ApiResponse.success("Exam deleted successfully", null));
    }

    @PostMapping("/{id}/assign/{classId}")
    public ResponseEntity<ApiResponse<ExamResponse>> assignExamToClass(
            @PathVariable UUID id,
            @PathVariable UUID classId) {
        ExamResponse exam = examGenerationService.assignExamToClass(id, classId);
        return ResponseEntity.ok(ApiResponse.success("Exam assigned successfully", exam));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<ApiResponse<StudentExamResponse>> startExam(
            @PathVariable UUID id,
            @RequestParam UUID studentId) {
        StudentExamResponse studentExam = examGenerationService.startStudentExam(id, studentId);
        return ResponseEntity.ok(ApiResponse.success("Exam started successfully", studentExam));
    }

    @GetMapping("/student-exams/{studentExamId}")
    public ResponseEntity<ApiResponse<StudentExamResponse>> getStudentExam(@PathVariable UUID studentExamId) {
        StudentExamResponse studentExam = examGenerationService.getStudentExam(studentExamId);
        return ResponseEntity.ok(ApiResponse.success(studentExam));
    }

    @GetMapping("/student-exams/student/{studentId}")
    public ResponseEntity<ApiResponse<List<StudentExamResponse>>> getStudentExams(@PathVariable UUID studentId) {
        List<StudentExamResponse> exams = examGenerationService.getStudentExams(studentId);
        return ResponseEntity.ok(ApiResponse.success(exams));
    }

    @PostMapping("/student-exams/{studentExamId}/submit")
    public ResponseEntity<ApiResponse<StudentExamResponse>> submitExam(
            @PathVariable UUID studentExamId,
            @Valid @RequestBody SubmitExamRequest request) {
        StudentExamResponse result = examGenerationService.submitStudentExam(studentExamId, request.getAnswers());
        return ResponseEntity.ok(ApiResponse.success("Exam submitted successfully", result));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getExamsByClass(@PathVariable UUID classId) {
        List<ExamResponse> exams = examGenerationService.getExamsByClass(classId);
        return ResponseEntity.ok(ApiResponse.success(exams));
    }

    @GetMapping("/class/{classId}/results")
    public ResponseEntity<ApiResponse<List<StudentExamResponse>>> getStudentExamResultsByClass(@PathVariable UUID classId) {
        List<StudentExamResponse> results = examGenerationService.getStudentExamResultsByClass(classId);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamResponse>> updateExam(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateExamRequest request) {
        ExamResponse exam = examGenerationService.updateExam(id, request);
        return ResponseEntity.ok(ApiResponse.success("Exam updated successfully", exam));
    }

    @PutMapping("/{id}/questions")
    public ResponseEntity<ApiResponse<ExamResponse>> updateExamQuestions(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateExamQuestionsRequest request) {
        ExamResponse exam = examGenerationService.updateExamQuestions(id, request);
        return ResponseEntity.ok(ApiResponse.success("Exam questions synced successfully", exam));
    }
}
