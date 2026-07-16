package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.request.CreateExamRequest;
import com.midori.dto.request.SubmitExamRequest;
import com.midori.dto.request.UpdateExamQuestionsRequest;
import com.midori.dto.request.UpdateExamRequest;
import com.midori.dto.response.ExamResponse;
import com.midori.dto.response.StudentExamResponse;
import com.midori.entity.ClassEntity;
import com.midori.entity.Exam;
import com.midori.entity.User;
import com.midori.exception.AccessDeniedException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ClassRepository;
import com.midori.repository.ExamRepository;
import com.midori.repository.UserRepository;
import com.midori.service.ExamGenerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final ExamRepository examRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<ExamResponse>> createExam(
            @Valid @RequestBody CreateExamRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ExamResponse exam = examGenerationService.createExam(request, userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Exam created successfully", exam));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
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
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getExamsByTeacher(@PathVariable UUID teacherId) {
        List<ExamResponse> exams = examGenerationService.getExamsByTeacher(teacherId);
        return ResponseEntity.ok(ApiResponse.success(exams));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<ExamResponse>> publishExam(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        checkExamOwnership(exam, userDetails);
        ExamResponse response = examGenerationService.publishExam(id);
        return ResponseEntity.ok(ApiResponse.success("Exam published successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<Void>> deleteExam(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        checkExamOwnership(exam, userDetails);
        examGenerationService.deleteExam(id);
        return ResponseEntity.ok(ApiResponse.success("Exam deleted successfully", null));
    }

    @PostMapping("/{id}/assign/{classId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<ExamResponse>> assignExamToClass(
            @PathVariable UUID id,
            @PathVariable UUID classId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        checkExamOwnership(exam, userDetails);
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));
        UUID teacherId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"))
                .getId();
        if (!classEntity.getTeacher().getId().equals(teacherId)) {
            throw new AccessDeniedException("You do not own this class");
        }
        ExamResponse response = examGenerationService.assignExamToClass(id, classId);
        return ResponseEntity.ok(ApiResponse.success("Exam assigned successfully", response));
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
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getExamsByClass(
            @PathVariable UUID classId,
            @AuthenticationPrincipal UserDetails userDetails) {
        checkClassOwnership(classId, userDetails);
        List<ExamResponse> exams = examGenerationService.getExamsByClass(classId);
        return ResponseEntity.ok(ApiResponse.success(exams));
    }

    @GetMapping("/class/{classId}/results")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<StudentExamResponse>>> getStudentExamResultsByClass(
            @PathVariable UUID classId,
            @AuthenticationPrincipal UserDetails userDetails) {
        checkClassOwnership(classId, userDetails);
        List<StudentExamResponse> results = examGenerationService.getStudentExamResultsByClass(classId);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<ExamResponse>> updateExam(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateExamRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        checkExamOwnership(exam, userDetails);
        ExamResponse response = examGenerationService.updateExam(id, request);
        return ResponseEntity.ok(ApiResponse.success("Exam updated successfully", response));
    }

    @PutMapping("/{id}/questions")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<ExamResponse>> updateExamQuestions(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateExamQuestionsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        checkExamOwnership(exam, userDetails);
        ExamResponse response = examGenerationService.updateExamQuestions(id, request);
        return ResponseEntity.ok(ApiResponse.success("Exam questions synced successfully", response));
    }

    private void checkExamOwnership(Exam exam, UserDetails userDetails) {
        User teacher = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (exam.getCreatedBy() == null || !exam.getCreatedBy().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("You do not own this exam");
        }
    }

    private void checkClassOwnership(UUID classId, UserDetails userDetails) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));
        User teacher = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (classEntity.getTeacher() == null || !classEntity.getTeacher().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("You do not own this class");
        }
    }
}
