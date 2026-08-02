package com.midori.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.common.ApiResponse;
import com.midori.dto.ai.ErrorCorrectionMetadata;
import com.midori.dto.ai.MatchingMetadata;
import com.midori.dto.ai.SentenceWritingMetadata;
import com.midori.dto.ai.TranslationMetadata;
import com.midori.dto.questiondto.CreateTeacherQuestionRequest;
import com.midori.dto.questiondto.TeacherQuestionResponse;
import com.midori.dto.questiondto.UpdateTeacherQuestionRequest;
import com.midori.entity.TeacherQuestion;
import com.midori.entity.User;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.UserRepository;
import com.midori.security.CustomUserDetails;
import com.midori.service.TeacherQuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.ArrayList;
import com.midori.dto.questiondto.BatchCreateQuestionsRequest;
import com.midori.dto.questiondto.BatchQuestionsResponse;
import com.midori.exception.BadRequestException;
import com.midori.validation.QuestionBankCompatibilityValidator;

@RestController
@RequestMapping("/api/teacher/questions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class TeacherQuestionController {

    private final TeacherQuestionService teacherQuestionService;
    private final UserRepository userRepository;
    private final com.midori.repository.TeacherQuestionRepository teacherQuestionRepository;
    private final com.midori.repository.QuestionBankLessonRepository questionBankLessonRepository;
    private final com.midori.service.QuestionBankLessonService questionBankLessonService;
    private final QuestionBankCompatibilityValidator compatibilityValidator;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String serializeMetadata(Object metadata) {
        if (metadata == null) return null;
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private String determineAndSerializeFormatMetadata(CreateTeacherQuestionRequest request) {
        // Determine which format metadata to use based on question type
        String questionType = request.getQuestionType();
        Object metadata = null;

        if (questionType != null) {
            switch (questionType.toUpperCase()) {
                case "TRANSLATION":
                    metadata = request.getTranslationMetadata();
                    break;
                case "SENTENCE_WRITING":
                    metadata = request.getSentenceWritingMetadata();
                    break;
                case "ERROR_CORRECTION":
                    metadata = request.getErrorCorrectionMetadata();
                    break;
                case "MATCHING":
                    metadata = request.getMatchingMetadata();
                    break;
                default:
                    // For other types, use the fallback formatMetadata if provided
                    if (request.getFormatMetadata() != null && !request.getFormatMetadata().isEmpty()) {
                        return request.getFormatMetadata();
                    }
                    break;
            }
        }

        if (metadata != null) {
            return serializeMetadata(metadata);
        }
        return null;
    }

    private String determineAndSerializeUpdateFormatMetadata(UpdateTeacherQuestionRequest request) {
        String questionType = request.getQuestionType();
        Object metadata = null;

        if (questionType != null) {
            switch (questionType.toUpperCase()) {
                case "TRANSLATION":
                    metadata = request.getTranslationMetadata();
                    break;
                case "SENTENCE_WRITING":
                    metadata = request.getSentenceWritingMetadata();
                    break;
                case "ERROR_CORRECTION":
                    metadata = request.getErrorCorrectionMetadata();
                    break;
                case "MATCHING":
                    metadata = request.getMatchingMetadata();
                    break;
                default:
                    if (request.getFormatMetadata() != null && !request.getFormatMetadata().isEmpty()) {
                        return request.getFormatMetadata();
                    }
                    break;
            }
        }

        if (metadata != null) {
            return serializeMetadata(metadata);
        }
        return null;
    }

    private <T> T deserializeMetadata(String json, Class<T> clazz) {
        if (json == null || json.isEmpty()) return null;
        try {
            return objectMapper.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private boolean isAdmin(CustomUserDetails userDetails) {
        if (userDetails == null) return false;
        return userRepository.findById(userDetails.getId())
                .map(u -> u.getRole() == com.midori.entity.Role.ADMIN)
                .orElse(false);
    }

    private void validateOptionsByQuestionType(String questionType, List<String> options) {
        if (questionType == null || questionType.trim().isEmpty()) {
            throw new BadRequestException("Question type must not be blank.");
        }
        String upper = questionType.toUpperCase().trim();
        if ("MULTIPLE_CHOICE".equals(upper) || "TRUE_FALSE".equals(upper)) {
            if (options == null || options.isEmpty()) {
                throw new BadRequestException("Options must not be empty for MULTIPLE_CHOICE or TRUE_FALSE questions.");
            }
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TeacherQuestionResponse>> createQuestion(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateTeacherQuestionRequest request) {

        if (request.getSkill() == null || request.getSkill().trim().isEmpty()) {
            throw new BadRequestException("Question skill is required.");
        }
        if (request.getQuestionType() == null || request.getQuestionType().trim().isEmpty()) {
            throw new BadRequestException("Question type must not be blank.");
        }

        validateOptionsByQuestionType(request.getQuestionType(), request.getOptions());

        // Validate skill-format compatibility before saving
        String error = compatibilityValidator.validateSkillsAndFormats(
                List.of(request.getSkill()),
                request.getQuestionType()
        );
        if (error != null) {
            throw new BadRequestException("Skill-format validation failed: " + error);
        }

        User teacher = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));

        com.midori.entity.QuestionBankLesson lesson = null;
        if (request.getLessonId() != null) {
            lesson = questionBankLessonRepository.findById(request.getLessonId()).orElse(null);
        }

        TeacherQuestion question = TeacherQuestion.builder()
                .teacher(teacher)
                .topicId(request.getTopicId())
                .level(request.getLevel())
                .skill(request.getSkill())
                .lesson(lesson)
                .source(request.getSource() != null ? request.getSource() : "HOMEWORK")
                .prompt(request.getPrompt())
                .jpPrompt(request.getJpPrompt())
                .questionType(request.getQuestionType())
                .difficulty(request.getDifficulty() != null ? request.getDifficulty().toUpperCase() : "MEDIUM")
                .correctAnswerIndex(request.getCorrectAnswerIndex())
                .explanation(request.getExplanation())
                .tags(request.getTags())
                .points(request.getPoints() != null ? request.getPoints() : 1)
                .options(request.getOptions() != null ? request.getOptions() : new ArrayList<>())
                .status(com.midori.entity.UserStatus.ACTIVE.name())
                .audioUrl(request.getAudioUrl())
                .audioFileName(request.getAudioFileName())
                .audioDuration(request.getAudioDuration())
                // Format metadata serialization
                .formatMetadata(determineAndSerializeFormatMetadata(request))
                .build();

        TeacherQuestion saved = teacherQuestionService.createQuestion(question);
        return ResponseEntity.ok(ApiResponse.success("Question created successfully", mapToResponse(saved)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TeacherQuestionResponse>> updateQuestion(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTeacherQuestionRequest request) {

        validateOptionsByQuestionType(request.getQuestionType(), request.getOptions());

        com.midori.entity.QuestionBankLesson lesson = null;
        if (request.getLessonId() != null) {
            lesson = questionBankLessonRepository.findById(request.getLessonId()).orElse(null);
        }

        TeacherQuestion details = TeacherQuestion.builder()
                .topicId(request.getTopicId())
                .level(request.getLevel())
                .skill(request.getSkill())
                .lesson(lesson)
                .prompt(request.getPrompt())
                .jpPrompt(request.getJpPrompt())
                .questionType(request.getQuestionType())
                .difficulty(request.getDifficulty() != null ? request.getDifficulty().toUpperCase() : "MEDIUM")
                .correctAnswerIndex(request.getCorrectAnswerIndex())
                .explanation(request.getExplanation())
                .tags(request.getTags())
                .points(request.getPoints() != null ? request.getPoints() : 1)
                .options(request.getOptions() != null ? request.getOptions() : new ArrayList<>())
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : com.midori.entity.UserStatus.ACTIVE.name())
                .audioUrl(request.getAudioUrl())
                .audioFileName(request.getAudioFileName())
                .audioDuration(request.getAudioDuration())
                .formatMetadata(determineAndSerializeUpdateFormatMetadata(request))
                .build();

        TeacherQuestion updated = teacherQuestionService.updateQuestion(id, details, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Question updated successfully", mapToResponse(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        teacherQuestionService.deleteQuestion(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Question deleted successfully", null));
    }

    @PostMapping("/batch")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<BatchQuestionsResponse>> createQuestionsBatch(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BatchCreateQuestionsRequest batchRequest) {

        User teacher = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));

        List<CreateTeacherQuestionRequest> requests = batchRequest.getQuestions();
        int requestedCount = requests.size();

        // Validate skill-format compatibility for the entire batch before saving
        for (CreateTeacherQuestionRequest request : requests) {
            if (request.getSkill() == null || request.getSkill().trim().isEmpty()) {
                throw new BadRequestException("Question skill is required.");
            }
            if (request.getQuestionType() == null || request.getQuestionType().trim().isEmpty()) {
                throw new BadRequestException("Question type must not be blank.");
            }
            String error = compatibilityValidator.validateSkillsAndFormats(
                    List.of(request.getSkill()),
                    request.getQuestionType()
            );
            if (error != null) {
                throw new BadRequestException("Skill-format validation failed: " + error);
            }
        }

        List<TeacherQuestion> questionsToSave = new ArrayList<>();
        java.util.Map<Integer, com.midori.entity.QuestionBankLesson> lessonCache = new java.util.HashMap<>();

        for (CreateTeacherQuestionRequest request : requests) {
            validateOptionsByQuestionType(request.getQuestionType(), request.getOptions());

            com.midori.entity.QuestionBankLesson lesson = null;
            if (request.getLessonId() != null) {
                Integer lessonId = request.getLessonId();
                if (!lessonCache.containsKey(lessonId)) {
                    lessonCache.put(lessonId, questionBankLessonRepository.findById(lessonId).orElse(null));
                }
                lesson = lessonCache.get(lessonId);
            }

            TeacherQuestion question = TeacherQuestion.builder()
                    .teacher(teacher)
                    .topicId(request.getTopicId())
                    .level(request.getLevel())
                    .skill(request.getSkill())
                    .lesson(lesson)
                    .source(request.getSource() != null ? request.getSource() : "HOMEWORK")
                    .prompt(request.getPrompt())
                    .jpPrompt(request.getJpPrompt())
                    .questionType(request.getQuestionType())
                    .difficulty(request.getDifficulty() != null ? request.getDifficulty().toUpperCase() : "MEDIUM")
                    .correctAnswerIndex(request.getCorrectAnswerIndex())
                    .explanation(request.getExplanation())
                    .tags(request.getTags())
                    .points(request.getPoints() != null ? request.getPoints() : 1)
                    .options(request.getOptions() != null ? request.getOptions() : new ArrayList<>())
                    .status(com.midori.entity.UserStatus.ACTIVE.name())
                    .audioUrl(request.getAudioUrl())
                    .audioFileName(request.getAudioFileName())
                    .audioDuration(request.getAudioDuration())
                    .formatMetadata(determineAndSerializeFormatMetadata(request))
                    .build();

            questionsToSave.add(question);
        }

        // Save atomically in a single transactional service call
        List<TeacherQuestion> saved = teacherQuestionService.createQuestions(questionsToSave);

        List<TeacherQuestionResponse> responses = saved.stream()
                .map(this::mapToResponse)
                .toList();

        BatchQuestionsResponse responseBody = BatchQuestionsResponse.builder()
                .requestedCount(requestedCount)
                .savedCount(saved.size())
                .savedQuestions(responses)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Batch questions created successfully", responseBody));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeacherQuestionResponse>>> getQuestions(
            @RequestParam(required = false) String level,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long start = System.nanoTime();
        
        long startUser = System.nanoTime();
        boolean admin = isAdmin(userDetails);
        long endUser = System.nanoTime();
        double userLookupMs = (endUser - startUser) / 1_000_000.0;
        
        long startRepo = System.nanoTime();
        List<TeacherQuestion> questions;
        if (level != null && !level.trim().isEmpty()) {
            String upperLevel = level.trim().toUpperCase();
            questions = admin
                    ? teacherQuestionRepository.findByLevelWithTeacherAndLesson(upperLevel)
                    : teacherQuestionRepository.findQuestionsForTeacherViewAndLevelWithTeacherAndLesson(userDetails.getId(), upperLevel);
        } else {
            questions = admin
                    ? teacherQuestionRepository.findAllWithTeacherAndLesson()
                    : teacherQuestionRepository.findQuestionsForTeacherViewWithTeacherAndLesson(userDetails.getId());
        }
        long endRepo = System.nanoTime();
        double repositoryMs = (endRepo - startRepo) / 1_000_000.0;
        
        java.util.Map<String, TeacherQuestion> uniqueMap = new java.util.LinkedHashMap<>();
        for (TeacherQuestion q : questions) {
            String key = q.getPrompt() != null ? q.getPrompt().trim() : "";
            if (!uniqueMap.containsKey(key)) {
                uniqueMap.put(key, q);
            }
        }
        
        long startMap = System.nanoTime();
        List<TeacherQuestionResponse> responses = uniqueMap.values().stream()
                .skip((long) page * size)
                .limit(size)
                .map(this::mapToResponse)
                .toList();
        long endMap = System.nanoTime();
        double mappingMs = (endMap - startMap) / 1_000_000.0;
        
        long endTotal = System.nanoTime();
        double totalMs = (endTotal - start) / 1_000_000.0;
        
        System.out.printf("[PROFILING] GET /questions level=%s page=%d size=%d: userLookupMs=%.2fms, repositoryMs=%.2fms, mappingMs=%.2fms, totalMs=%.2fms, resultCount=%d\n",
                level, page, size, userLookupMs, repositoryMs, mappingMs, totalMs, responses.size());
        
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.add("X-User-Lookup-Time-Ms", String.format("%.2f", userLookupMs));
        headers.add("X-Repository-Time-Ms", String.format("%.2f", repositoryMs));
        headers.add("X-Mapping-Time-Ms", String.format("%.2f", mappingMs));
        headers.add("X-Total-Time-Ms", String.format("%.2f", totalMs));
        headers.add("X-Result-Count", String.valueOf(responses.size()));
        
        return ResponseEntity.ok().headers(headers).body(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeacherQuestionResponse>> getQuestionById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        TeacherQuestion question = teacherQuestionService.findQuestionById(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(question)));
    }

    // ─── Lesson Centralized CRUD Routes (Admin only for writes) ─────────────────

    @GetMapping("/lessons")
    public ResponseEntity<ApiResponse<List<com.midori.entity.QuestionBankLesson>>> getLessons(
            @RequestParam(required = false) String level,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<com.midori.entity.QuestionBankLesson> lessons;
        
        if (level == null || level.trim().isEmpty()) {
            lessons = isAdmin(userDetails)
                    ? questionBankLessonService.findAllLessons()
                    : questionBankLessonService.findAllActiveLessons();
        } else {
            lessons = isAdmin(userDetails)
                    ? questionBankLessonService.findLessonsByLevel(level)
                    : questionBankLessonService.findActiveLessonsByLevel(level);
        }
        
        return ResponseEntity.ok(ApiResponse.success(lessons));
    }

    @PostMapping("/lessons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<com.midori.entity.QuestionBankLesson>> createLesson(
            @Valid @RequestBody com.midori.entity.QuestionBankLesson lesson) {
        com.midori.entity.QuestionBankLesson saved = questionBankLessonService.createLesson(lesson);
        return ResponseEntity.ok(ApiResponse.success("Lesson created successfully", saved));
    }

    @PutMapping("/lessons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<com.midori.entity.QuestionBankLesson>> updateLesson(
            @PathVariable Integer id,
            @RequestBody java.util.Map<String, Object> body) {
        String name = (String) body.get("lessonName");
        Integer number = body.get("lessonNumber") != null ? ((Number) body.get("lessonNumber")).intValue() : null;
        String status = (String) body.get("status");
        com.midori.entity.QuestionBankLesson updated = questionBankLessonService.updateLesson(id, name, number, status);
        return ResponseEntity.ok(ApiResponse.success("Lesson updated successfully", updated));
    }

    @DeleteMapping("/lessons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable Integer id) {
        questionBankLessonService.deleteLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Lesson deleted successfully", null));
    }

    @GetMapping("/lessons/{lessonId}/questions")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<TeacherQuestionResponse>>> getLessonQuestions(
            @PathVariable Integer lessonId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String difficulty) {
        
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<TeacherQuestion> questionPage = teacherQuestionRepository.findByLessonIdWithFilters(
            lessonId, search, type, difficulty, pageable
        );
        
        org.springframework.data.domain.Page<TeacherQuestionResponse> responsePage = questionPage.map(this::mapToResponse);
        return ResponseEntity.ok(ApiResponse.success(responsePage));
    }

    @GetMapping("/lessons/{lessonId}/statistics")
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> getLessonStatistics(@PathVariable Integer lessonId) {
        java.util.Map<String, Long> stats = teacherQuestionRepository.getLessonStatistics(lessonId);
        if (stats == null || stats.isEmpty()) {
            stats = new java.util.HashMap<>();
            stats.put("total", 0L);
            stats.put("vocabulary", 0L);
            stats.put("grammar", 0L);
            stats.put("reading", 0L);
            stats.put("listening", 0L);
        }
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    private TeacherQuestionResponse mapToResponse(TeacherQuestion question) {
        if (question == null) return null;

        String questionType = question.getQuestionType();
        TranslationMetadata translationMetadata = null;
        SentenceWritingMetadata sentenceWritingMetadata = null;
        ErrorCorrectionMetadata errorCorrectionMetadata = null;
        MatchingMetadata matchingMetadata = null;

        // Deserialize format metadata based on question type
        String formatMetadata = question.getFormatMetadata();
        if (formatMetadata != null && !formatMetadata.isEmpty()) {
            if ("TRANSLATION".equalsIgnoreCase(questionType)) {
                translationMetadata = deserializeMetadata(formatMetadata, TranslationMetadata.class);
            } else if ("SENTENCE_WRITING".equalsIgnoreCase(questionType)) {
                sentenceWritingMetadata = deserializeMetadata(formatMetadata, SentenceWritingMetadata.class);
            } else if ("ERROR_CORRECTION".equalsIgnoreCase(questionType)) {
                errorCorrectionMetadata = deserializeMetadata(formatMetadata, ErrorCorrectionMetadata.class);
            } else if ("MATCHING".equalsIgnoreCase(questionType)) {
                matchingMetadata = deserializeMetadata(formatMetadata, MatchingMetadata.class);
            }
        }

        return TeacherQuestionResponse.builder()
                .id(question.getId())
                .teacherId(question.getTeacher().getId())
                .topicId(question.getTopicId())
                .level(question.getLevel())
                .skill(question.getSkill())
                .lessonId(question.getLesson() != null ? question.getLesson().getId() : null)
                .source(question.getSource())
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
                .audioUrl(question.getAudioUrl())
                .audioFileName(question.getAudioFileName())
                .audioDuration(question.getAudioDuration())
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                // Format-specific metadata
                .translationMetadata(translationMetadata)
                .sentenceWritingMetadata(sentenceWritingMetadata)
                .errorCorrectionMetadata(errorCorrectionMetadata)
                .matchingMetadata(matchingMetadata)
                .build();
    }
}
