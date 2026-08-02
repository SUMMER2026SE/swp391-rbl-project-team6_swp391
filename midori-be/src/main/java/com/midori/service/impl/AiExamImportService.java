package com.midori.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.AiParsingException;
import com.midori.dto.response.AiImportJobResponse;
import com.midori.entity.*;
import com.midori.exception.BadRequestException;
import com.midori.repository.*;
import com.midori.service.PdfTextExtractor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * AI Exam Import Service.
 * 
 * This service handles PDF exam import using AiCoreService for AI operations.
 * All AI calls go through the centralized AiCoreService.
 */
@Service
public class AiExamImportService {

    private static final Logger log = LoggerFactory.getLogger(AiExamImportService.class);

    private final PdfTextExtractor pdfTextExtractor;
    private final AiCoreService aiCoreService;
    private final ExamRepository examRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final AiImportJobRepository aiImportJobRepository;
    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final ObjectMapper objectMapper;
    private final TeacherQuestionRepository teacherQuestionRepository;

    public AiExamImportService(
            PdfTextExtractor pdfTextExtractor,
            AiCoreService aiCoreService,
            ExamRepository examRepository,
            ExamQuestionRepository examQuestionRepository,
            AiImportJobRepository aiImportJobRepository,
            UserRepository userRepository,
            ClassRepository classRepository,
            ObjectMapper objectMapper,
            TeacherQuestionRepository teacherQuestionRepository) {
        this.pdfTextExtractor = pdfTextExtractor;
        this.aiCoreService = aiCoreService;
        this.examRepository = examRepository;
        this.examQuestionRepository = examQuestionRepository;
        this.aiImportJobRepository = aiImportJobRepository;
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.objectMapper = objectMapper;
        this.teacherQuestionRepository = teacherQuestionRepository;
    }

    public record ImportInitResult(UUID jobId) {}

    public ImportInitResult initImportJob(MultipartFile file, String classId, UserDetails userDetails) {
        validateFile(file);
        UUID userId = getUserId(userDetails);

        AiImportJob job = AiImportJob.builder()
                .status(AiImportJob.JobStatus.PENDING)
                .originalFilename(file.getOriginalFilename())
                .inputFileSize(file.getSize())
                .createdById(userId)
                .retryCount(0)
                .build();

        job = aiImportJobRepository.save(job);
        log.info("Created AI import job {} for user {} (file: {}, size: {})",
                job.getId(), userId, file.getOriginalFilename(), file.getSize());

        return new ImportInitResult(job.getId());
    }

    @Async("aiTaskExecutor")
    public void processImportAsync(UUID jobId, MultipartFile file, String classId, String level, String status) {
        log.info("Starting async processing for job {}", jobId);
        AiImportJob job = aiImportJobRepository.findById(jobId).orElse(null);
        if (job == null) {
            log.error("Job {} not found", jobId);
            return;
        }

        try {
            job.setStatus(AiImportJob.JobStatus.PROCESSING);
            job.setProcessingStartedAt(Instant.now());
            aiImportJobRepository.save(job);

            long startMs = System.currentTimeMillis();

            PdfTextExtractor.ExtractionResult extraction = pdfTextExtractor.extract(file);
            job.setExtractedText(extraction.fullText());
            job.setPageCount(extraction.pageCount());
            job.setLikelyScanned(extraction.likelyScanned());

            log.info("PDF extracted: {} chars from {} pages, scanned={}",
                    extraction.fullText().length(), extraction.pageCount(), extraction.likelyScanned());

            // Use AiCoreService instead of AiProviderFactory
            AiExamParseResponse aiResult = aiCoreService.parseExam(
                    extraction.fullText(),
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "exam.pdf"
            );

            job.setAiProvider(aiCoreService.getCurrentProvider().getType().name());

            long aiMs = System.currentTimeMillis() - startMs;
            log.info("AI parsed exam in {}ms: {} questions from provider {}",
                    aiMs, aiResult.getQuestions().size(), aiCoreService.getCurrentProvider().getName());

            String rawJson = objectMapper.writeValueAsString(aiResult);
            job.setAiRawResponse(rawJson);

            Exam exam = buildExam(aiResult, classId, level, status, job);
            List<ExamQuestion> questions = buildQuestions(exam, aiResult);

            exam = examRepository.save(exam);
            examQuestionRepository.saveAll(questions);

            job.setExamId(exam.getId());
            job.setExamTitle(exam.getTitle());
            job.setQuestionCount(questions.size());
            job.setStatus(AiImportJob.JobStatus.COMPLETED);
            job.setProcessingCompletedAt(Instant.now());

            aiImportJobRepository.save(job);
            log.info("Job {} completed: exam {} created with {} questions in {}ms total",
                    jobId, exam.getId(), questions.size(),
                    System.currentTimeMillis() - startMs);

        } catch (AiParsingException e) {
            log.error("AI parsing failed for job {}: {}", jobId, e.getMessage());
            job.setStatus(AiImportJob.JobStatus.FAILED);
            job.setErrorMessage("AI parsing failed: " + e.getMessage());
            job.setProcessingCompletedAt(Instant.now());
            aiImportJobRepository.save(job);

        } catch (Exception e) {
            log.error("Unexpected error processing job {}: {}", jobId, e.getMessage(), e);
            job.setStatus(AiImportJob.JobStatus.FAILED);
            job.setErrorMessage("Processing failed: " + e.getMessage());
            job.setProcessingCompletedAt(Instant.now());
            aiImportJobRepository.save(job);
        }
    }

    private Exam buildExam(AiExamParseResponse aiResult, String classId, String level, String status, AiImportJob job) {
        String title = aiResult.getTitle();
        if (title == null || title.isBlank()) {
            title = "AI-Imported Exam from " + (job.getOriginalFilename() != null
                    ? job.getOriginalFilename().replaceAll("\\.pdf$", "") : "PDF");
        }

        GrammarLevel grammarLevel;
        try {
            grammarLevel = GrammarLevel.valueOf((level != null && !level.isBlank() ? level : "N3").toUpperCase());
        } catch (Exception e) {
            grammarLevel = GrammarLevel.N3;
        }

        ExamStatus examStatus = ExamStatus.DRAFT;
        if ("PUBLISHED".equalsIgnoreCase(status)) {
            examStatus = ExamStatus.PUBLISHED;
        }

        Exam.ExamBuilder builder = Exam.builder()
                .title(title.trim())
                .level(grammarLevel)
                .totalQuestions(aiResult.getQuestions().size())
                .timeLimit(60)
                .examMode(ExamMode.SAME_FOR_ALL)
                .questionReuse(QuestionReuse.ALLOW_REUSE)
                .randomizeAnswers(false)
                .category("AI_IMPORTED")
                .status(examStatus)
                .difficultyEasy(0)
                .difficultyMedium(0)
                .difficultyHard(0);

        if (classId != null && !classId.isBlank()) {
            try {
                UUID classUuid = UUID.fromString(classId);
                classRepository.findById(classUuid).ifPresent(builder::assignedClass);
            } catch (Exception e) {
                log.warn("Could not assign exam to class {}: {}", classId, e.getMessage());
            }
        }

        if (job.getCreatedById() != null) {
            userRepository.findById(job.getCreatedById()).ifPresent(builder::createdBy);
        }

        return builder.build();
    }

    private List<ExamQuestion> buildQuestions(Exam exam, AiExamParseResponse aiResult) {
        List<ExamQuestion> questions = new ArrayList<>();
        int order = 1;
        for (AiExamParseResponse.AiQuestionDto qdto : aiResult.getQuestions()) {
            int correctIdx = 0;
            List<String> options = new ArrayList<>();
            for (int i = 0; i < qdto.getAnswers().size(); i++) {
                options.add(qdto.getAnswers().get(i).getContent() != null
                        ? qdto.getAnswers().get(i).getContent() : "");
                if (Boolean.TRUE.equals(qdto.getAnswers().get(i).getIsCorrect())) {
                    correctIdx = i;
                }
            }

            Difficulty difficulty;
            try {
                difficulty = Difficulty.valueOf(
                        (qdto.getDifficulty() != null ? qdto.getDifficulty().toUpperCase() : "MEDIUM"));
            } catch (Exception e) {
                difficulty = Difficulty.MEDIUM;
            }

            String formatMetadataStr = null;
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                if (qdto.getTranslationMetadata() != null) {
                    formatMetadataStr = mapper.writeValueAsString(qdto.getTranslationMetadata());
                } else if (qdto.getSentenceWritingMetadata() != null) {
                    formatMetadataStr = mapper.writeValueAsString(qdto.getSentenceWritingMetadata());
                } else if (qdto.getErrorCorrectionMetadata() != null) {
                    formatMetadataStr = mapper.writeValueAsString(qdto.getErrorCorrectionMetadata());
                } else if (qdto.getMatchingMetadata() != null) {
                    formatMetadataStr = mapper.writeValueAsString(qdto.getMatchingMetadata());
                }
            } catch (Exception ignored) {}

            ExamQuestion eq = ExamQuestion.builder()
                    .exam(exam)
                    .questionText(qdto.getContent() != null ? qdto.getContent() : "")
                    .options(options)
                    .correctAnswerIndex(correctIdx)
                    .explanation(qdto.getExplanation())
                    .difficulty(difficulty)
                    .displayOrder(order++)
                    .points(1)
                    .category(determineCategory(qdto.getType()))
                    .questionType(qdto.getType() != null ? qdto.getType() : "MULTIPLE_CHOICE")
                    .formatMetadata(formatMetadataStr)
                    .build();
            questions.add(eq);

            try {
                if (!teacherQuestionRepository.existsByTeacherIdAndPrompt(exam.getCreatedBy().getId(), eq.getQuestionText())) {
                    TeacherQuestion tq = TeacherQuestion.builder()
                            .teacher(exam.getCreatedBy())
                            .prompt(eq.getQuestionText())
                            .questionType("Multiple Choice")
                            .difficulty(difficulty.name())
                            .correctAnswerIndex(correctIdx)
                            .explanation(eq.getExplanation() != null ? eq.getExplanation() : "")
                            .tags(exam.getLevel().name() + ", AI Import")
                            .status("ACTIVE")
                            .points(1)
                            .options(new ArrayList<>(options))
                            .build();
                    teacherQuestionRepository.save(tq);
                }
            } catch (Exception e) {
                log.error("Failed to save AI imported question to bank", e);
            }
        }
        return questions;
    }

    private String determineCategory(String type) {
        if (type == null) return "Grammar";
        return switch (type.toUpperCase()) {
            case "MULTIPLE_CHOICE" -> "Grammar";
            case "TRUE_FALSE" -> "Mixed";
            case "FILL_IN_BLANK" -> "Vocabulary";
            case "SHORT_ANSWER" -> "Reading";
            default -> "Grammar";
        };
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("PDF file is required");
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".pdf")) {
            throw new BadRequestException("Only PDF files are accepted");
        }
        if (file.getSize() > 50 * 1024 * 1024) {
            throw new BadRequestException("File size must not exceed 50MB");
        }
    }

    private UUID getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    public AiImportJobResponse getJobStatus(UUID jobId, UUID userId) {
        AiImportJob job = aiImportJobRepository.findByIdAndUserId(jobId, userId)
                .orElseThrow(() -> new BadRequestException("Import job not found"));

        String message = switch (job.getStatus()) {
            case PENDING -> "Job is queued for processing";
            case PROCESSING -> "PDF is being extracted and analyzed by AI...";
            case COMPLETED -> "Import completed successfully!";
            case FAILED -> job.getErrorMessage() != null ? job.getErrorMessage() : "Import failed";
        };

        return AiImportJobResponse.builder()
                .jobId(job.getId())
                .status(job.getStatus().name())
                .message(message)
                .examId(job.getExamId())
                .questionCount(job.getQuestionCount())
                .createdAt(job.getCreatedAt())
                .completedAt(job.getProcessingCompletedAt())
                .build();
    }
}
