package com.midori.controller;

import com.midori.dto.request.CreateExamRequest;
import com.midori.dto.request.SubmitExamRequest;
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
    public ResponseEntity<ExamResponse> createExam(
            @Valid @RequestBody CreateExamRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ExamResponse exam = examGenerationService.createExam(request, userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(exam);
    }

    @GetMapping
    public ResponseEntity<List<ExamResponse>> getAllExams() {
        List<ExamResponse> exams = examGenerationService.getAllExams();
        return ResponseEntity.ok(exams);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamResponse> getExam(@PathVariable UUID id) {
        ExamResponse exam = examGenerationService.getExamById(id);
        return ResponseEntity.ok(exam);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<ExamResponse>> getExamsByTeacher(@PathVariable UUID teacherId) {
        List<ExamResponse> exams = examGenerationService.getExamsByTeacher(teacherId);
        return ResponseEntity.ok(exams);
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<ExamResponse> publishExam(@PathVariable UUID id) {
        ExamResponse exam = examGenerationService.publishExam(id);
        return ResponseEntity.ok(exam);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExam(@PathVariable UUID id) {
        examGenerationService.deleteExam(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/assign/{classId}")
    public ResponseEntity<ExamResponse> assignExamToClass(
            @PathVariable UUID id,
            @PathVariable UUID classId) {
        ExamResponse exam = examGenerationService.assignExamToClass(id, classId);
        return ResponseEntity.ok(exam);
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<StudentExamResponse> startExam(
            @PathVariable UUID id,
            @RequestParam UUID studentId) {
        StudentExamResponse studentExam = examGenerationService.startStudentExam(id, studentId);
        return ResponseEntity.ok(studentExam);
    }

    @GetMapping("/student-exams/{studentExamId}")
    public ResponseEntity<StudentExamResponse> getStudentExam(@PathVariable UUID studentExamId) {
        StudentExamResponse studentExam = examGenerationService.getStudentExam(studentExamId);
        return ResponseEntity.ok(studentExam);
    }

    @GetMapping("/student-exams/student/{studentId}")
    public ResponseEntity<List<StudentExamResponse>> getStudentExams(@PathVariable UUID studentId) {
        List<StudentExamResponse> exams = examGenerationService.getStudentExams(studentId);
        return ResponseEntity.ok(exams);
    }

    @PostMapping("/student-exams/{studentExamId}/submit")
    public ResponseEntity<StudentExamResponse> submitExam(
            @PathVariable UUID studentExamId,
            @Valid @RequestBody SubmitExamRequest request) {
        StudentExamResponse result = examGenerationService.submitStudentExam(studentExamId, request.getAnswers());
        return ResponseEntity.ok(result);
    }
}
