package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.homeworkdto.*;
import com.midori.dto.questiondto.TeacherQuestionResponse;
import com.midori.entity.ClassEntity;
import com.midori.entity.Homework;
import com.midori.entity.HomeworkSubmission;
import com.midori.entity.TeacherQuestion;
import com.midori.entity.User;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ClassRepository;
import com.midori.repository.UserRepository;
import com.midori.security.CustomUserDetails;
import com.midori.service.HomeworkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class HomeworkController {

    private final HomeworkService homeworkService;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final com.midori.repository.HomeworkSubmissionRepository homeworkSubmissionRepository;

    // --- TEACHER FLOWS ---

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/api/teacher/homeworks")
    public ResponseEntity<ApiResponse<HomeworkResponse>> createHomework(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateHomeworkRequest request) {
        ClassEntity classEntity = classRepository.findById(request.getClassId())
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", request.getClassId()));
        if (!classEntity.getTeacher().getId().equals(userDetails.getId())) {
            throw new com.midori.exception.AccessDeniedException("You do not own this class");
        }
        Homework homework = Homework.builder()
                .assignedClass(classEntity)
                .lessonId(request.getLessonId())
                .title(request.getTitle())
                .instructions(request.getInstructions())
                .dueDate(request.getDueDate())
                .maxScore(request.getMaxScore())
                .attempts(request.getAttempts() != null ? request.getAttempts() : 1)
                .timeLimit(request.getTimeLimit() != null ? request.getTimeLimit() : 0)
                .status(Homework.HomeworkStatus.DRAFT)
                .build();
        Homework saved = homeworkService.createHomework(homework, request.getQuestionIds());
        return ResponseEntity.ok(ApiResponse.success("Homework created successfully", mapToHomeworkResponse(saved)));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/api/teacher/homeworks/{id}")
    public ResponseEntity<ApiResponse<HomeworkResponse>> updateHomework(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateHomeworkRequest request) {
        Homework homework = homeworkService.findHomeworkById(id);
        if (!homework.getAssignedClass().getTeacher().getId().equals(userDetails.getId())) {
            throw new com.midori.exception.AccessDeniedException("You do not own this class");
        }
        Homework details = Homework.builder()
                .title(request.getTitle())
                .instructions(request.getInstructions())
                .dueDate(request.getDueDate())
                .maxScore(request.getMaxScore())
                .attempts(request.getAttempts() != null ? request.getAttempts() : 1)
                .timeLimit(request.getTimeLimit() != null ? request.getTimeLimit() : 0)
                .status(request.getStatus() != null ? Homework.HomeworkStatus.valueOf(request.getStatus().toUpperCase()) : Homework.HomeworkStatus.DRAFT)
                .build();
        Homework updated = homeworkService.updateHomework(id, details, request.getQuestionIds());
        return ResponseEntity.ok(ApiResponse.success("Homework updated successfully", mapToHomeworkResponse(updated)));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/api/teacher/homeworks/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHomework(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        Homework homework = homeworkService.findHomeworkById(id);
        if (!homework.getAssignedClass().getTeacher().getId().equals(userDetails.getId())) {
            throw new com.midori.exception.AccessDeniedException("You do not own this class");
        }
        homeworkService.deleteHomework(id);
        return ResponseEntity.ok(ApiResponse.success("Homework deleted successfully", null));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/api/teacher/homeworks")
    public ResponseEntity<ApiResponse<List<HomeworkResponse>>> getTeacherHomeworks(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Homework> homeworks = homeworkService.findHomeworksByTeacher(userDetails.getId());
        List<HomeworkResponse> responses = homeworks.stream().map(this::mapToHomeworkResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/api/teacher/homeworks/class/{classId}")
    public ResponseEntity<ApiResponse<List<HomeworkResponse>>> getTeacherHomeworksByClass(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID classId) {
        List<Homework> homeworks = homeworkService.findHomeworksByClassForTeacher(classId, userDetails.getId());
        List<HomeworkResponse> responses = homeworks.stream().map(this::mapToHomeworkResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/api/teacher/homeworks/{id}")
    public ResponseEntity<ApiResponse<HomeworkResponse>> getTeacherHomeworkById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        Homework homework = homeworkService.findHomeworkById(id);
        if (!homework.getAssignedClass().getTeacher().getId().equals(userDetails.getId())) {
            throw new com.midori.exception.AccessDeniedException("You do not own this class");
        }
        return ResponseEntity.ok(ApiResponse.success(mapToHomeworkResponse(homework)));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/api/teacher/homeworks/{id}/submissions")
    public ResponseEntity<ApiResponse<List<HomeworkSubmissionResponse>>> getHomeworkSubmissions(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        Homework homework = homeworkService.findHomeworkById(id);
        if (!homework.getAssignedClass().getTeacher().getId().equals(userDetails.getId())) {
            throw new com.midori.exception.AccessDeniedException("You do not own this class");
        }
        List<HomeworkSubmission> submissions = homeworkService.findSubmissionsByHomework(id);
        List<HomeworkSubmissionResponse> responses = submissions.stream().map(this::mapToSubmissionResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/api/teacher/homeworks/submissions/{submissionId}/grade")
    public ResponseEntity<ApiResponse<HomeworkSubmissionResponse>> gradeSubmission(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID submissionId,
            @Valid @RequestBody GradeHomeworkRequest request) {
        HomeworkSubmission submission = homeworkService.gradeSubmission(submissionId, request.getScore(), request.getFeedback(), userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Submission graded successfully", mapToSubmissionResponse(submission)));
    }

    // --- STUDENT FLOWS ---

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/api/student/homeworks")
    public ResponseEntity<ApiResponse<List<HomeworkResponse>>> getStudentHomeworks(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User student = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));
        if (student.getAssignedClass() == null) {
            return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyList()));
        }
        List<Homework> homeworks = homeworkService.findHomeworkByClass(student.getAssignedClass().getId());
        List<HomeworkResponse> responses = homeworks.stream().map(this::mapToHomeworkResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/api/student/homeworks/class/{classId}")
    public ResponseEntity<ApiResponse<List<HomeworkResponse>>> getStudentHomeworksByClass(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID classId) {
        List<Homework> homeworks = homeworkService.findHomeworksByClassForStudent(classId, userDetails.getId());
        List<HomeworkResponse> responses = homeworks.stream().map(this::mapToHomeworkResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/api/student/homeworks/{id}")
    public ResponseEntity<ApiResponse<HomeworkResponse>> getStudentHomeworkById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        User student = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));
        Homework homework = homeworkService.findHomeworkById(id);
        if (student.getAssignedClass() == null || !student.getAssignedClass().getId().equals(homework.getAssignedClass().getId())) {
            throw new com.midori.exception.AccessDeniedException("You are not enrolled in this class");
        }
        return ResponseEntity.ok(ApiResponse.success(mapToHomeworkResponse(homework)));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/api/student/homeworks/{id}/submit")
    public ResponseEntity<ApiResponse<HomeworkSubmissionResponse>> submitHomework(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody SubmitHomeworkRequest request) {
        User student = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));
        Homework homework = homeworkService.findHomeworkById(id);
        if (student.getAssignedClass() == null || !student.getAssignedClass().getId().equals(homework.getAssignedClass().getId())) {
            throw new com.midori.exception.AccessDeniedException("You are not enrolled in this class");
        }
        HomeworkSubmission submission = HomeworkSubmission.builder()
                .homework(homework)
                .student(student)
                .submissionText(request.getSubmissionText())
                .attachmentUrl(request.getAttachmentUrl())
                .status(HomeworkSubmission.SubmissionStatus.SUBMITTED)
                .build();
        HomeworkSubmission saved = homeworkService.submitHomework(submission, request.getAnswers());
        return ResponseEntity.ok(ApiResponse.success("Homework submitted successfully", mapToSubmissionResponse(saved)));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/api/student/homeworks/{id}/submission")
    public ResponseEntity<ApiResponse<HomeworkSubmissionResponse>> getStudentSubmission(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        User student = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));
        Homework homework = homeworkService.findHomeworkById(id);
        if (student.getAssignedClass() == null || !student.getAssignedClass().getId().equals(homework.getAssignedClass().getId())) {
            throw new com.midori.exception.AccessDeniedException("You are not enrolled in this class");
        }
        try {
            HomeworkSubmission submission = homeworkService.findSubmission(id, userDetails.getId());
            return ResponseEntity.ok(ApiResponse.success(mapToSubmissionResponse(submission)));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }
    }

    // --- HELPER MAPPERS ---

    private HomeworkResponse mapToHomeworkResponse(Homework homework) {
        if (homework == null) return null;
        
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isStudent = false;
        UUID studentId = null;
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) {
            CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
            isStudent = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
            if (isStudent) {
                studentId = userDetails.getId();
            }
        }

        Integer remainingAttempts = homework.getAttempts();
        boolean showAnswers = !isStudent;
        String submissionStatus = "NOT_STARTED";
        Integer score = null;
        String feedback = null;
        java.time.Instant gradedAt = null;
        java.time.Instant submittedAt = null;

        if (isStudent && studentId != null) {
            long count = homeworkSubmissionRepository.countByHomeworkIdAndStudentId(homework.getId(), studentId);
            remainingAttempts = Math.max(0, homework.getAttempts() - (int) count);
            
            java.util.Optional<HomeworkSubmission> submissionOpt = homeworkSubmissionRepository.findByHomeworkIdAndStudentId(homework.getId(), studentId);
            if (submissionOpt.isPresent()) {
                HomeworkSubmission sub = submissionOpt.get();
                submissionStatus = sub.getStatus().name();
                score = sub.getScore();
                feedback = sub.getFeedback();
                gradedAt = sub.getGradedAt();
                submittedAt = sub.getSubmittedAt();
                if (sub.getStatus() == HomeworkSubmission.SubmissionStatus.GRADED || remainingAttempts <= 0) {
                    showAnswers = true;
                }
            }
        }

        List<TeacherQuestionResponse> questionResponses = null;
        if (homework.getQuestions() != null) {
            final boolean finalShowAnswers = showAnswers;
            questionResponses = homework.getQuestions().stream()
                    .map(q -> {
                        TeacherQuestionResponse res = mapQuestionToResponse(q);
                        if (res != null && !finalShowAnswers) {
                            res.setCorrectAnswerIndex(null);
                            res.setExplanation(null);
                        }
                        return res;
                    })
                    .toList();
        }

        String teacherName = "";
        if (homework.getAssignedClass() != null && homework.getAssignedClass().getTeacher() != null) {
            User teacher = homework.getAssignedClass().getTeacher();
            if (teacher.getProfile() != null && teacher.getProfile().getDisplayName() != null) {
                teacherName = teacher.getProfile().getDisplayName();
            } else {
                teacherName = teacher.getEmail();
            }
        }

        long totalSub = homeworkSubmissionRepository.countByHomeworkId(homework.getId());
        long ungrSub = homeworkSubmissionRepository.countByHomeworkIdAndStatus(homework.getId(), com.midori.entity.HomeworkSubmission.SubmissionStatus.SUBMITTED);

        return HomeworkResponse.builder()
                .id(homework.getId())
                .classId(homework.getAssignedClass().getId())
                .lessonId(homework.getLessonId())
                .title(homework.getTitle())
                .instructions(homework.getInstructions())
                .dueDate(homework.getDueDate())
                .maxScore(homework.getMaxScore())
                .attempts(homework.getAttempts())
                .status(homework.getStatus())
                .createdAt(homework.getCreatedAt())
                .updatedAt(homework.getUpdatedAt())
                .questions(questionResponses)
                .totalQuestions(homework.getQuestions() != null ? homework.getQuestions().size() : 0)
                .submissionCount((int) totalSub)
                .ungradedCount((int) ungrSub)
                .timeLimit(homework.getTimeLimit())
                .teacherName(teacherName)
                .remainingAttempts(remainingAttempts)
                .submissionStatus(submissionStatus)
                .score(score)
                .feedback(feedback)
                .gradedAt(gradedAt)
                .submittedAt(submittedAt)
                .build();
    }

    private TeacherQuestionResponse mapQuestionToResponse(TeacherQuestion question) {
        if (question == null) return null;
        return TeacherQuestionResponse.builder()
                .id(question.getId())
                .teacherId(question.getTeacher().getId())
                .topicId(question.getTopicId())
                .prompt(question.getPrompt())
                .jpPrompt(question.getJpPrompt())
                .questionType(question.getQuestionType())
                .difficulty(question.getDifficulty())
                .correctAnswerIndex(question.getCorrectAnswerIndex())
                .explanation(question.getExplanation())
                .tags(question.getTags())
                .status(question.getStatus())
                .points(question.getPoints())
                .options(question.getOptions())
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .build();
    }

    private HomeworkSubmissionResponse mapToSubmissionResponse(HomeworkSubmission submission) {
        if (submission == null) return null;
        String studentName = "";
        if (submission.getStudent().getProfile() != null && submission.getStudent().getProfile().getDisplayName() != null) {
            studentName = submission.getStudent().getProfile().getDisplayName();
        } else {
            studentName = submission.getStudent().getEmail();
        }
        return HomeworkSubmissionResponse.builder()
                .id(submission.getId())
                .homeworkId(submission.getHomework().getId())
                .studentId(submission.getStudent().getId())
                .studentName(studentName)
                .studentEmail(submission.getStudent().getEmail())
                .submissionText(submission.getSubmissionText())
                .attachmentUrl(submission.getAttachmentUrl())
                .score(submission.getScore())
                .feedback(submission.getFeedback())
                .status(submission.getStatus())
                .submittedAt(submission.getSubmittedAt())
                .gradedAt(submission.getGradedAt())
                .gradedById(submission.getGradedBy() != null ? submission.getGradedBy().getId() : null)
                .build();
    }
}
