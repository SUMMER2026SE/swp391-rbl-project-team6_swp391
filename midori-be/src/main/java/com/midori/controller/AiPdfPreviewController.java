package com.midori.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.dto.AiQuizGenerationResponse;
import com.midori.ai.util.AiExistingQuestionParser;
import com.midori.ai.util.DifficultyDistribution;
import com.midori.ai.util.QuestionTypeValidator;
import com.midori.common.ApiResponse;
import com.midori.dto.response.AiPdfPreviewResponse;
import com.midori.entity.Difficulty;
import com.midori.entity.QuestionType;
import com.midori.service.PdfTextExtractor;
import com.midori.service.AiLearningContentService;
import com.midori.validation.QuestionBankCompatibilityValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
public class AiPdfPreviewController {
    public static final String ERROR_CODE_PDF_UNREADABLE = "PDF_UNREADABLE";

    private static final Logger log = LoggerFactory.getLogger(AiPdfPreviewController.class);

    private final QuestionBankCompatibilityValidator compatibilityValidator;

    private final PdfTextExtractor pdfTextExtractor;
    private final AiCoreService aiCoreService;
    private final AiLearningContentService aiLearningContentService;
    private final ObjectMapper objectMapper;

    public AiPdfPreviewController(PdfTextExtractor pdfTextExtractor, AiCoreService aiCoreService,
                                  AiLearningContentService aiLearningContentService,
                                  QuestionBankCompatibilityValidator compatibilityValidator) {
        this.pdfTextExtractor = pdfTextExtractor;
        this.aiCoreService = aiCoreService;
        this.aiLearningContentService = aiLearningContentService;
        this.objectMapper = new ObjectMapper();
        this.compatibilityValidator = compatibilityValidator;
    }

    @Autowired
    public AiPdfPreviewController(PdfTextExtractor pdfTextExtractor, AiCoreService aiCoreService,
                                  AiLearningContentService aiLearningContentService,
                                  QuestionBankCompatibilityValidator compatibilityValidator,
                                  ObjectMapper objectMapper) {
        this.pdfTextExtractor = pdfTextExtractor;
        this.aiCoreService = aiCoreService;
        this.aiLearningContentService = aiLearningContentService;
        this.objectMapper = objectMapper;
        this.compatibilityValidator = compatibilityValidator;
    }

    @PostMapping(value = "/questions/generate-from-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<AiPdfPreviewResponse>> generateQuestionsFromPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mode", defaultValue = "IMPORT_EXISTING_QUESTIONS") String mode,
            @RequestParam(value = "level", required = false) String level,
            @RequestParam(value = "count", defaultValue = "10") Integer count,
            @RequestParam(value = "questionType", defaultValue = "MULTIPLE_CHOICE") String questionType,
            @RequestParam(value = "writingMode", required = false) String writingMode,
            @RequestParam(value = "questionFormat", required = false) String questionFormat,
            @RequestParam(value = "questionFormats", required = false) List<String> questionFormats,
            @RequestParam(value = "difficulty", required = false) String difficulty,
            @RequestParam(value = "easyPct", required = false) Integer easyPct,
            @RequestParam(value = "mediumPct", required = false) Integer mediumPct,
            @RequestParam(value = "hardPct", required = false) Integer hardPct,
            HttpServletRequest request) {

        // Robustly resolve targetSkills: support multiple naming conventions
        // that FE / browsers may send.
        //   1) targetSkills repeated for each value (FE default)
        //   2) targetSkills as a single CSV string "VOCABULARY,GRAMMAR"
        //   3) targetSkill (legacy singular)
        // We use HttpServletRequest.getParameterValues to ensure repeated
        // parameters with the same name are preserved (the @RequestParam
        // List<String> binding can collapse them depending on the binder).
        List<String> targetSkills = resolveTargetSkills(request);

        String filename = file != null ? file.getOriginalFilename() : "unknown.pdf";
        log.info("PDF preview request: file={}, size={}, mode={}, level={}, count={}, targetSkills={}",
                filename, file != null ? file.getSize() : 0, mode, level, count, targetSkills);

        // Validate mode first
        String normalizedMode = mode == null ? null : mode.trim().toUpperCase();
        if (normalizedMode == null || (!"IMPORT_EXISTING_QUESTIONS".equals(normalizedMode) && !"GENERATE_FROM_CONTENT".equals(normalizedMode))) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid or missing mode. Must be IMPORT_EXISTING_QUESTIONS or GENERATE_FROM_CONTENT"));
        }

        // Validate targetSkills - at least one skill is required ONLY for GENERATE_FROM_CONTENT
        if ("GENERATE_FROM_CONTENT".equals(normalizedMode)) {
            if (targetSkills == null || targetSkills.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("At least one target skill is required."));
            }
        }

        // Validate each skill if present
        Set<String> normalizedSkills = new HashSet<>();
        if (targetSkills != null && !targetSkills.isEmpty()) {
            for (String skill : targetSkills) {
                if (skill == null || skill.isBlank()) continue;
                String normalized = skill.toUpperCase().trim();
                if (!compatibilityValidator.getValidSkills().contains(normalized)) {
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("Invalid target skill: " + skill + ". Must be one of: " + compatibilityValidator.getValidSkills()));
                }
                normalizedSkills.add(normalized);
            }
        }

        if ("GENERATE_FROM_CONTENT".equals(normalizedMode)) {
            if (normalizedSkills.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("At least one target skill is required."));
            }
            if (normalizedSkills.contains("WRITING") && normalizedSkills.size() > 1) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("WRITING must be generated separately from Vocabulary, Grammar, and Reading."));
            }
        }

        // Validate questionFormat for GENERATE_FROM_CONTENT mode
        if ("GENERATE_FROM_CONTENT".equals(normalizedMode) && !normalizedSkills.contains("WRITING")) {
            if (questionFormat != null && !questionFormat.isBlank() && !"AUTO_DETECT".equalsIgnoreCase(questionFormat)) {
                String normalizedFormat = questionFormat.toUpperCase().trim();
                if (!compatibilityValidator.getValidFormats().contains(normalizedFormat)) {
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("Invalid questionFormat: " + questionFormat + ". Must be one of: " + compatibilityValidator.getValidFormats()));
                }
                // Validate skill-format compatibility using shared validator
                String compatibilityError = compatibilityValidator.validateSkillsAndFormats(normalizedSkills, normalizedFormat);
                if (compatibilityError != null) {
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error(compatibilityError));
                }
            }
        }

        // Resolve question formats for IMPORT mode
        List<String> resolvedFormats = resolveQuestionFormats(questionFormat, questionFormats);

        // Convert Set to List for passing to methods
        List<String> selectedSkills = new ArrayList<>(normalizedSkills);

        // Validate file
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("PDF file is required"));
        }

        if (filename == null || !filename.toLowerCase().endsWith(".pdf")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only PDF files are accepted"));
        }

        com.midori.ai.core.AiCoreService.startRequestTimer();
        try {
            // Reset the thread-local call count at start of user request
            com.midori.ai.core.AiCoreService.resetProviderCallCount();

            // Step 1: Extract text from PDF using Cache
            byte[] fileBytes = file.getBytes();
            String fileHash = computeHash(fileBytes);

            com.midori.util.PdfCacheManager.CacheData cached = com.midori.util.PdfCacheManager.get(fileHash);
            PdfTextExtractor.ExtractionResult extraction;
            List<AiLearningContentService.SourceRecord> sourceRecords;

            if (cached != null) {
                extraction = new PdfTextExtractor.ExtractionResult(
                        cached.extractedText,
                        new ArrayList<>(),
                        cached.likelyScanned,
                        cached.pageCount
                );
                sourceRecords = cached.sourceRecords != null ? cached.sourceRecords : new ArrayList<>();
            } else {
                extraction = pdfTextExtractor.extract(file);

                // Parse source records to cache them
                sourceRecords = aiLearningContentService.extractSourceRecords(extraction.fullText());

                com.midori.util.PdfCacheManager.CacheData newCache = new com.midori.util.PdfCacheManager.CacheData();
                newCache.extractedText = extraction.fullText();
                newCache.sourceRecords = sourceRecords;
                newCache.likelyScanned = extraction.likelyScanned();
                newCache.pageCount = extraction.pageCount();
                com.midori.util.PdfCacheManager.put(fileHash, newCache);
            }

            log.info("PDF extracted: {} chars from {} pages, scanned={}",
                    extraction.fullText().length(), extraction.pageCount(), extraction.likelyScanned());

            // Check for empty or scanned PDF
            if (extraction.fullText() == null || extraction.fullText().trim().isEmpty()) {
                return buildErrorResponse(mode, ERROR_CODE_PDF_UNREADABLE, "PDF may be scanned or contains no readable text. Please try a text-based PDF.");
            }

            if (extraction.likelyScanned() && extraction.fullText().length() < 100) {
                return buildErrorResponse(mode, ERROR_CODE_PDF_UNREADABLE, "PDF appears to be scanned with little or no extractable text. Please try a different PDF.");
            }

            // Step 2: Generate questions based on mode
            AiPdfPreviewResponse response;

            if ("GENERATE_FROM_CONTENT".equals(mode)) {
                log.info("Generating questions from content, count={}, type={}, difficulty={}, "
                                + "easyPct={}, mediumPct={}, hardPct={}, selectedSkills={}",
                        count, questionType, difficulty, easyPct, mediumPct, hardPct, selectedSkills);

                boolean isWriting = selectedSkills.contains("WRITING");
                String effectiveType;
                if (isWriting) {
                    effectiveType = (writingMode != null && !writingMode.isBlank()) ? writingMode : (com.midori.ai.dto.WritingMode.parse(questionType) != null ? questionType : "MIXED_WRITING");
                } else {
                    QuestionType normalizedType = QuestionTypeValidator.normalize(questionType);
                    if (normalizedType == null) {
                        return ResponseEntity.badRequest()
                                .body(ApiResponse.error("Unsupported questionType: " + questionType
                                        + ". Must be MULTIPLE_CHOICE, TRUE_FALSE, FILL_BLANK, SHORT_ANSWER, or MATCHING."));
                    }
                    effectiveType = normalizedType.name();
                }

                boolean hasDistribution = easyPct != null || mediumPct != null || hardPct != null;
                if (hasDistribution) {
                    // Strict distribution path: validate percentages, allocate
                    // counts, retry on shortfall.
                    if (easyPct == null || mediumPct == null || hardPct == null) {
                        return ResponseEntity.badRequest()
                                .body(ApiResponse.error("Difficulty percentages must be supplied together "
                                        + "(easyPct, mediumPct, hardPct)."));
                    }
                    try {
                        DifficultyDistribution.validateCount(count);
                        DifficultyDistribution.validatePercentages(easyPct, mediumPct, hardPct);
                    } catch (IllegalArgumentException ex) {
                        return ResponseEntity.badRequest()
                                .body(ApiResponse.error(ex.getMessage()));
                    }
                    response = generateFromContentWithDistribution(
                            extraction, sourceRecords, mode, filename, count,
                            effectiveType, easyPct, mediumPct, hardPct,
                            level, selectedSkills);
                } else {
                    // Legacy path: single-difficulty prompt for backwards
                    // compatibility with callers that don't yet send percentages.
                    response = generateFromContent(extraction, sourceRecords, mode, filename, count,
                            effectiveType, difficulty, level, selectedSkills);
                }
            } else {
                // Import existing questions from PDF — uses the language-neutral prompt so
                // a generic English/MCQ file parses correctly. Robust against null/empty
                // provider results and against JSON-shape mismatches (cleaner + sanitize
                // both live inside AiCoreService.parseExistingQuestionsFromText).
                // UNREADABLE-UNICODE GUARD: detect PDFs where the text layer
                // contains ASCII question-bank scaffolding but the Japanese /
                // accented content has collapsed into "?" because the PDF
                // embeds CID fonts without a ToUnicode CMap. Skip parsing in
                // that case so we don't surface fabricated rác questions.
                if (AiExistingQuestionParser.isUnreadableUnicodeText(extraction.fullText())) {
                    log.warn("PDF appears unreadable Unicode (likely missing ToUnicode CMap): {}",
                            AiExistingQuestionParser.summarizeForUnreadableLog(filename, extraction.fullText()));
                    String msg = AiExistingQuestionParser.unreadableUnicodeUserMessage();
                    response = AiPdfPreviewResponse.builder()
                            .mode(mode)
                            .title(filename)
                            .description("PDF text could not be read (font/Unicode issue).")
                            .pageCount(extraction.pageCount())
                            .extractedTextLength(extraction.fullText().length())
                            .likelyScanned(extraction.likelyScanned())
                            .questions(new ArrayList<>())
                            .errorMessage(msg)
                            .build();
                } else {
                    log.info("Importing existing questions from PDF (provider={}, selectedSkills={}, questionFormats={})",
                            aiCoreService.getCurrentProvider() != null ? aiCoreService.getCurrentProvider().getName() : "unknown",
                            selectedSkills, resolvedFormats);
                    response = importExistingQuestions(extraction, mode, filename, selectedSkills, resolvedFormats);
                }
            }

            // Add warning if scanned
            if (extraction.likelyScanned() && extraction.fullText().length() < 500) {
                response.setWarning("PDF may be scanned. Results may be incomplete.");
            }

            // Return error wrapper if the inner response signals failure,
            // so the outer ApiResponse.success field correctly reflects the actual state.
            if (response != null && !response.isSuccess()) {
                return ResponseEntity.ok(ApiResponse.<AiPdfPreviewResponse>builder()
                        .success(false)
                        .message(response.getErrorMessage() != null ? response.getErrorMessage() : "AI processing failed")
                        .data(response)
                        .build());
            }
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("PDF preview failed: {}", e.getMessage(), e);
            String errorCode = "AI_PROVIDER_UNAVAILABLE";

            // Map common exception keywords
            Throwable current = e;
            while (current != null) {
                if (current instanceof com.midori.exception.AiException ae) {
                    errorCode = ae.getCode();
                    break;
                }
                current = current.getCause();
            }

            if ("AI_PROVIDER_UNAVAILABLE".equals(errorCode)) {
                String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
                if (msg.contains("429") || msg.contains("quota") || msg.contains("exhausted")) {
                    errorCode = "AI_QUOTA_EXHAUSTED";
                } else if (msg.contains("rate limit") || msg.contains("cooldown")) {
                    errorCode = "AI_RATE_LIMITED";
                } else if (msg.contains("timeout") || msg.contains("timed out")) {
                    errorCode = "AI_PROVIDER_TIMEOUT";
                } else if (msg.contains("request timeout") || msg.contains("exceeded the maximum")
                        || msg.contains("max processing time") || msg.contains("processing deadline")) {
                    errorCode = "AI_REQUEST_TIMEOUT";
                }
            }

            String userMsg = "AI service is currently unavailable. Please try again later.";
            if ("AI_QUOTA_EXHAUSTED".equals(errorCode)) {
                userMsg = "AI quota is temporarily exhausted. Please try again later.";
            } else if ("AI_RATE_LIMITED".equals(errorCode)) {
                userMsg = "AI providers are temporarily rate-limited. Please try again later.";
            } else if ("AI_PROVIDER_TIMEOUT".equals(errorCode)) {
                userMsg = "The AI provider took too long to respond. Please try again.";
            } else if ("AI_PROVIDER_UNAVAILABLE".equals(errorCode)) {
                userMsg = "AI providers are temporarily unavailable. Please try again later.";
            } else if ("AI_REQUEST_TIMEOUT".equals(errorCode)) {
                userMsg = "The request exceeded the maximum processing time. Please try again.";
            } else if ("AI_INVALID_RESPONSE".equals(errorCode)) {
                userMsg = "AI service returned an invalid response. Please retry.";
            } else if ("AI_INVALID_API_KEY".equals(errorCode)
                    || "AI_PROVIDER_FORBIDDEN".equals(errorCode)
                    || "AI_PROVIDER_CALL_LIMIT_REACHED".equals(errorCode)) {
                userMsg = "AI service is temporarily unavailable. Please try again later.";
            }

            AiPdfPreviewResponse failedResponse = AiPdfPreviewResponse.builder()
                    .mode(mode)
                    .title(filename != null ? filename : "unknown")
                    .success(false)
                    .partial(false)
                    .code(errorCode)
                    .message(userMsg)
                    .errorMessage(userMsg)
                    .requestedCount(count != null ? count : 10)
                    .generatedCount(0)
                    .questions(new ArrayList<>())
                    .build();
            ApiResponse<AiPdfPreviewResponse> apiResponse = ApiResponse.<AiPdfPreviewResponse>builder()
                    .success(false)
                    .message(userMsg)
                    .data(failedResponse)
                    .build();
            return ResponseEntity.ok(apiResponse);
        } finally {
            // Print attempt traces log summary before clearing
            List<com.midori.ai.core.AiCoreService.AttemptTrace> traces = com.midori.ai.core.AiCoreService.getAttemptTraces();
            if (!traces.isEmpty()) {
                log.info("[AiCoreService] ==================== REQUEST ATTEMPT TRACE LOG ====================");
                for (var t : traces) {
                    log.info("[AiCoreService] Round: {}, Provider: {}, Model: {}, Key: {}, Status: {}, Action: {}, Time: {}ms",
                            t.generationRound(), t.provider(), t.model(), t.maskedKey(), t.httpCategory(), t.action(), t.elapsedTimeMs());
                }
                log.info("[AiCoreService] =====================================================================");
            }
            com.midori.ai.core.AiCoreService.clearRequestTimer();
        }
    }

    /**
     * Handle GENERATE_FROM_CONTENT mode.
     * Calls AI to generate new questions from learning content.
     *
     * <p>Defense in depth (mirrors the IMPORT_EXISTING_QUESTIONS pipeline):
     * <ol>
     *   <li>Pass {@code selectedSkills} to the prompt so the AI is told to
     *       assign each question a category from the user-selected skills.</li>
     *   <li>Re-infer category from content using
     *       {@link com.midori.ai.util.AiExistingQuestionParser#inferCategorySemantic}.</li>
     *   <li>Drop questions whose inferred category is not in
     *       {@code selectedSkills} (no off-skill coercion).</li>
     *   <li>Drop questions with duplicate options.</li>
     *   <li>Drop questions containing romaji (Japanese readings should be
     *       kana/kanji).</li>
     *   <li>Drop questions with 0 or &gt; 1 correct answer.</li>
     * </ol>
     */
    private AiPdfPreviewResponse generateFromContent(
            PdfTextExtractor.ExtractionResult extraction,
            List<AiLearningContentService.SourceRecord> sourceRecords,
            String mode,
            String filename,
            int count,
            String questionType,
            String difficulty,
            String level,
            List<String> selectedSkills) throws Exception {

        // Extract a Reading passage from the uploaded source PDF so we can
        // attach it to every AI-generated Reading question.
        String sourcePassage = com.midori.ai.util.AiExistingQuestionParser
                .extractReadingPassageFromSource(extraction.fullText());
        // Strip metadata headings ("MIDORI - JLPT N5 ...", "Passage N - ...",
        // "Reference question / answer", etc.) that were written by a test-material
        // generator and must not reach the romaji-check blob or the learner UI.
        sourcePassage = com.midori.ai.util.AiExistingQuestionParser
                .cleanReadingPassageForStorage(sourcePassage);
        if (sourcePassage == null || sourcePassage.isBlank()) {
            log.warn("[generate-sanitize] no Reading passage detected in source PDF (filename={})", filename);
        }

        String resolvedDifficulty = (difficulty == null || difficulty.isBlank()) ? "MEDIUM" : difficulty;

        // Delegate to the robust AiLearningContentService
        AiExamParseResponse parseResponse = aiLearningContentService.generateQuestions(
                filename,
                extraction.fullText(),
                sourceRecords,
                count,
                resolvedDifficulty,
                selectedSkills,
                sourcePassage
        );

        AiPdfPreviewResponse response = AiPdfPreviewResponse.builder()
                .mode(mode)
                .title(filename)
                .description("Generated from learning content")
                .pageCount(extraction.pageCount())
                .extractedTextLength(extraction.fullText().length())
                .likelyScanned(extraction.likelyScanned())
                .questions(new ArrayList<>())
                .success(parseResponse.isSuccess())
                .partial(parseResponse.isPartial())
                .code(parseResponse.getCode())
                .message(parseResponse.getErrorMessage())
                .requestedCount(parseResponse.getRequestedCount())
                .generatedCount(parseResponse.getGeneratedCount())
                .build();

        int generatedCount = 0;
        if (parseResponse.getQuestions() != null) {
            for (var q : parseResponse.getQuestions()) {
                response.getQuestions().add(toPreviewQuestion(q, questionType, resolvedDifficulty));
            }
            generatedCount = response.getQuestions().size();
        }

        if (generatedCount == 0) {
            response.setSuccess(false);
            response.setErrorMessage(parseResponse.getErrorMessage() != null ? parseResponse.getErrorMessage() : "No questions were generated.");
            response.setMessage(null);
        } else if (generatedCount < count) {
            response.setSuccess(true);
            response.setPartial(true);
            response.setErrorMessage(null);
            String warningMsg = generatedCount + " of " + count + " questions were generated. Please try again.";
            response.setMessage(warningMsg);
            response.setWarning(warningMsg);
        } else {
            response.setSuccess(true);
            response.setPartial(false);
            response.setErrorMessage(null);
            response.setMessage(null);
        }

        return response;
    }

    /**
     * Handle GENERATE_FROM_CONTENT mode with an explicit
     * {@code easyPct / mediumPct / hardPct} distribution.
     *
     * <p>This is the strict path used by the new "Generate from Content" UI:
     * <ol>
     *   <li>Validate that the percentages sum to 100.</li>
     *   <li>Compute deterministic per-difficulty counts via
     *       {@link DifficultyDistribution#allocate(int, int, int, int)}.</li>
     *   <li>Call {@link AiLearningContentService#generateQuestionsWithDistribution}
     *       so the prompt explicitly requests the exact split.</li>
     *   <li>Map the response into the preview shape; surface
     *       {@code errorMessage} when the AI could not produce the requested
     *       total.</li>
     * </ol>
     */
    private AiPdfPreviewResponse generateFromContentWithDistribution(
            PdfTextExtractor.ExtractionResult extraction,
            List<AiLearningContentService.SourceRecord> sourceRecords,
            String mode,
            String filename,
            int count,
            String questionType,
            int easyPct, int mediumPct, int hardPct,
            String level,
            List<String> selectedSkills) {

        String sourcePassage = AiExistingQuestionParser
                .extractReadingPassageFromSource(extraction.fullText());
        // Strip metadata headings before attaching the passage.
        sourcePassage = AiExistingQuestionParser
                .cleanReadingPassageForStorage(sourcePassage);
        if (sourcePassage == null || sourcePassage.isBlank()) {
            log.warn("[generate-distribution] no Reading passage detected in source PDF (filename={})",
                    filename);
        }

        AiExamParseResponse parseResponse = aiLearningContentService.generateQuestionsWithDistribution(
                filename,
                extraction.fullText(),
                sourceRecords,
                count,
                questionType,
                easyPct, mediumPct, hardPct,
                selectedSkills,
                sourcePassage);

        AiPdfPreviewResponse response = AiPdfPreviewResponse.builder()
                .mode(mode)
                .title(filename)
                .description("Generated from learning content")
                .pageCount(extraction.pageCount())
                .extractedTextLength(extraction.fullText().length())
                .likelyScanned(extraction.likelyScanned())
                .questions(new ArrayList<>())
                .success(parseResponse.isSuccess())
                .partial(parseResponse.isPartial())
                .code(parseResponse.getCode())
                .message(parseResponse.getErrorMessage())
                .requestedCount(parseResponse.getRequestedCount())
                .generatedCount(parseResponse.getGeneratedCount())
                .build();

        int generatedCount = 0;
        if (parseResponse.getQuestions() != null) {
            for (var q : parseResponse.getQuestions()) {
                response.getQuestions().add(toPreviewQuestion(q, questionType, /* defaultDifficulty */ null));
            }
            generatedCount = response.getQuestions().size();
        }

        if (generatedCount == 0) {
            response.setSuccess(false);
            response.setErrorMessage(parseResponse.getErrorMessage() != null ? parseResponse.getErrorMessage() : "No questions were generated.");
            response.setMessage(null);
        } else if (generatedCount < count) {
            response.setSuccess(true);
            response.setPartial(true);
            response.setErrorMessage(null);
            String warningMsg = generatedCount + " of " + count + " questions were generated. Please try again.";
            response.setMessage(warningMsg);
            response.setWarning(warningMsg);
        } else {
            response.setSuccess(true);
            response.setPartial(false);
            response.setErrorMessage(null);
            response.setMessage(null);
        }
        return response;
    }

    /**
     * Convert a raw AI quiz question into the normalized
     * {@link com.midori.ai.dto.AiExamParseResponse.AiQuestionDto} shape so it
     * can be sanitized and compared against other questions uniformly.
     */
    private static com.midori.ai.dto.AiExamParseResponse.AiQuestionDto toNormalizedQuestion(
            AiQuizGenerationResponse.QuizQuestion q, String questionType, String difficulty) {
        com.midori.ai.dto.AiExamParseResponse.AiQuestionDto dto =
                new com.midori.ai.dto.AiExamParseResponse.AiQuestionDto();
        dto.setType(q.getType() != null ? q.getType() : questionType);
        dto.setContent(q.getQuestion());
        // Prefer AI-returned difficulty when present and valid (EASY / MEDIUM / HARD).
        dto.setDifficulty(pickDifficulty(q.getDifficulty(), difficulty));
        dto.setExplanation(q.getExplanation());
        // Category from the AI is just a hint — sanitize() will override.
        dto.setCategory(q.getCategory());
        List<com.midori.ai.dto.AiExamParseResponse.AiAnswerDto> answers = new ArrayList<>();
        if (q.getOptions() != null) {
            String correctAnswer = q.getCorrectAnswer();
            for (String option : q.getOptions()) {
                com.midori.ai.dto.AiExamParseResponse.AiAnswerDto a =
                        new com.midori.ai.dto.AiExamParseResponse.AiAnswerDto();
                a.setContent(option);
                a.setIsCorrect(correctAnswer != null && correctAnswer.equals(option));
                answers.add(a);
            }
        }
        dto.setAnswers(answers);
        return dto;
    }

    /** Prefer aiDifficulty when it is a known level; otherwise fall back to default. */
    private static String pickDifficulty(String aiDifficulty, String defaultDifficulty) {
        if (aiDifficulty != null && !aiDifficulty.isBlank()) {
            String norm = aiDifficulty.trim().toUpperCase();
            if (norm.equals("EASY") || norm.equals("MEDIUM") || norm.equals("HARD")
                    || norm.equals("HARDER")) {
                // Normalize case to match DB enum (first letter upper, rest lower)
                return norm.charAt(0) + norm.substring(1).toLowerCase();
            }
        }
        return defaultDifficulty != null && !defaultDifficulty.isBlank() ? defaultDifficulty : "Medium";
    }

    /**
     * Convert a sanitized question into the preview-response shape used by
     * the FE.
     */
    private static AiPdfPreviewResponse.QuestionPreview toPreviewQuestion(
            com.midori.ai.dto.AiExamParseResponse.AiQuestionDto q,
            String questionType, String difficulty) {
        AiPdfPreviewResponse.QuestionPreview qp = new AiPdfPreviewResponse.QuestionPreview();
        qp.setType(q.getType() != null ? q.getType() : questionType);
        qp.setContent(q.getContent());
        // Prefer the per-question difficulty coming back from the AI / sanitizer
        // (especially important for the distribution-aware path). Fall back
        // to the request default when the AI didn't supply one.
        if (q.getDifficulty() != null && !q.getDifficulty().isBlank()) {
            qp.setDifficulty(q.getDifficulty());
        } else {
            qp.setDifficulty(difficulty);
        }
        qp.setExplanation(q.getExplanation());
        qp.setCategory(q.getCategory());
        List<AiPdfPreviewResponse.AnswerPreview> answers = new ArrayList<>();
        if (q.getAnswers() != null) {
            for (var a : q.getAnswers()) {
                AiPdfPreviewResponse.AnswerPreview ap = new AiPdfPreviewResponse.AnswerPreview();
                ap.setContent(a.getContent());
                ap.setIsCorrect(Boolean.TRUE.equals(a.getIsCorrect()));
                answers.add(ap);
            }
        }
        qp.setAnswers(answers);
        return qp;
    }

    /**
     * Handle IMPORT_EXISTING_QUESTIONS mode.
     * Calls AI to parse existing questions from PDF.
     *
     * <p>Uses the new language-neutral prompt path
     * ({@link AiCoreService#parseExistingQuestionsFromText(String, String, List)}).
     * The previous path's JLPT-biased prompt frequently caused empty
     * question arrays / parse failures on plain English MCQ PDFs. The new
     * path keeps the LLM response tolerant (no provider-side strict
     * validation that converts empty arrays into exceptions) and feeds the
     * result through the controller's defensive mapper that already handles
     * partial answers (no correct marker, multiple correct markers, missing
     * explanations).
     *
     * <p>Returns a populated preview response with a clear
     * {@code errorMessage} when the AI cannot extract any questions,
     * instead of bubbling up a NullPointerException.
     *
     * @param selectedSkills list of target skills to filter questions (VOCABULARY, GRAMMAR, READING, WRITING)
     * @param questionFormats optional format filters (AUTO_DETECT or empty means no filter)
     */
    private AiPdfPreviewResponse importExistingQuestions(
            PdfTextExtractor.ExtractionResult extraction,
            String mode,
            String filename,
            List<String> selectedSkills,
            List<String> questionFormats) {

        AiExamParseResponse aiResult;
        try {
            aiResult = aiCoreService.parseExistingQuestionsFromText(extraction.fullText(), filename, selectedSkills);
        } catch (Exception e) {
            log.error("AI parseExistingQuestionsFromText failed for {}: {}", filename, e.getMessage(), e);
            return AiPdfPreviewResponse.builder()
                    .mode(mode)
                    .title(filename)
                    .description("AI failed to parse the PDF.")
                    .pageCount(extraction.pageCount())
                    .extractedTextLength(extraction.fullText().length())
                    .likelyScanned(extraction.likelyScanned())
                    .questions(new ArrayList<>())
                    .code("AI_PROVIDER_UNAVAILABLE")
                    .errorMessage("AI providers are temporarily unavailable. Please try again later.")
                    .build();
        }

        if (aiResult == null) {
            log.warn("AI parseExistingQuestionsFromText returned null for {}", filename);
            return AiPdfPreviewResponse.builder()
                    .mode(mode)
                    .title(filename)
                    .description("AI returned no data for this PDF.")
                    .pageCount(extraction.pageCount())
                    .extractedTextLength(extraction.fullText().length())
                    .likelyScanned(extraction.likelyScanned())
                    .questions(new ArrayList<>())
                    .errorMessage("AI could not extract questions from this PDF. Please check that the PDF contains readable questions and answers.")
                    .build();
        }

        if (!aiResult.isSuccess() || "PARSER_BLOCK_SEGMENTATION_FAILED".equals(aiResult.getCode())) {
            log.warn("AI parseExistingQuestionsFromText failed with code: {}, message: {}", aiResult.getCode(), aiResult.getErrorMessage());
            return AiPdfPreviewResponse.builder()
                    .mode(mode)
                    .title(filename)
                    .description("Failed to parse PDF.")
                    .pageCount(extraction.pageCount())
                    .extractedTextLength(extraction.fullText().length())
                    .likelyScanned(extraction.likelyScanned())
                    .questions(new ArrayList<>())
                    .code(aiResult.getCode() != null ? aiResult.getCode() : "PARSER_BLOCK_SEGMENTATION_FAILED")
                    .errorMessage(aiResult.getErrorMessage() != null ? aiResult.getErrorMessage() : "Failed to segment question blocks from the PDF.")
                    .build();
        }

        int rawAiCount = aiResult.getQuestions() != null ? aiResult.getQuestions().size() : 0;
        log.info("[Import] Stage 2 (AI raw): {} questions from provider {}",
                rawAiCount,
                aiCoreService.getCurrentProvider() != null ? aiCoreService.getCurrentProvider().getName() : "unknown");

        // EVIDENCE GUARD: drop any question that did not actually come from
        // the PDF. Without this, an LLM can fabricate a passage (e.g. a
        // "Tanaka" reading passage) and surface it as an extracted question.
        AiExamParseResponse filtered = AiExistingQuestionParser.filterByEvidence(
                aiResult, extraction.fullText(), filename);
        int afterEvidence = filtered.getQuestions() != null ? filtered.getQuestions().size() : 0;
        int droppedByEvidence = rawAiCount - afterEvidence;
        log.info("[Import] Stage 3 (evidence filter): {} accepted, {} dropped", afterEvidence, droppedByEvidence);

        if (filtered.getQuestions() == null || filtered.getQuestions().isEmpty()) {
            log.warn("[Import] No evidence-backed questions for {}", filename);
            AiPdfPreviewResponse empty = AiPdfPreviewResponse.builder()
                    .mode(mode)
                    .title(filtered.getTitle() != null && !filtered.getTitle().isBlank() ? filtered.getTitle() : filename)
                    .description(filtered.getDescription())
                    .pageCount(extraction.pageCount())
                    .extractedTextLength(extraction.fullText().length())
                    .likelyScanned(extraction.likelyScanned())
                    .questions(new ArrayList<>())
                    .errorMessage("No existing questions were found in this PDF that match the selected skill(s). "
                            + "Please check the file contents or try a different PDF.")
                    .build();
            applyReadingOnlyWarningIfApplicable(empty, extraction.fullText(), selectedSkills);
            return empty;
        }

        // Apply format filter if specified (not AUTO_DETECT, not empty)
        AiExamParseResponse formatFiltered = applyFormatFilter(filtered, questionFormats);
        int afterFormat = formatFiltered.getQuestions() != null ? formatFiltered.getQuestions().size() : 0;
        log.info("[Import] Stage 4 (format filter): {} accepted (formats={})", afterFormat, questionFormats);

        AiPdfPreviewResponse response = mapParseExamResponse(formatFiltered, mode, extraction, selectedSkills);
        int finalCount = response.getQuestions() != null ? response.getQuestions().size() : 0;
        // Log per-skill and per-format breakdown
        if (response.getQuestions() != null && !response.getQuestions().isEmpty()) {
            java.util.Map<String, Long> bySkill = response.getQuestions().stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            q -> q.getCategory() != null ? q.getCategory() : "unknown",
                            java.util.stream.Collectors.counting()));
            java.util.Map<String, Long> byFormat = response.getQuestions().stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            q -> q.getType() != null ? q.getType() : "unknown",
                            java.util.stream.Collectors.counting()));
            log.info("[Import] Stage 5 (sanitize+skill): {} final questions | by-skill={} | by-format={}",
                    finalCount, bySkill, byFormat);
        } else {
            log.info("[Import] Stage 5 (sanitize+skill): 0 final questions");
        }
        log.info("[Import] SUMMARY file={} raw={} evidence_accepted={} evidence_dropped={} format_accepted={} final={}",
                filename, rawAiCount, afterEvidence, droppedByEvidence, afterFormat, finalCount);

        applyReadingOnlyWarningIfApplicable(response, extraction.fullText(), selectedSkills);
        return response;
    }

    /**
     * Apply format filter to questions if specific formats are requested.
     * AUTO_DETECT or empty means no filter is applied.
     */
    private AiExamParseResponse applyFormatFilter(AiExamParseResponse aiResult, List<String> questionFormats) {
        if (aiResult == null || aiResult.getQuestions() == null) return aiResult;

        // No filter if formats is null, empty, or contains only AUTO_DETECT
        if (questionFormats == null || questionFormats.isEmpty()) {
            return aiResult;
        }

        boolean hasAutoDetect = questionFormats.stream().anyMatch("AUTO_DETECT"::equalsIgnoreCase);
        if (hasAutoDetect) {
            return aiResult; // No filter
        }

        // Normalize formats to a set for filtering
        Set<String> normalizedFormats = new HashSet<>();
        for (String format : questionFormats) {
            if (format != null && !format.isBlank() && !format.equalsIgnoreCase("AUTO_DETECT")) {
                normalizedFormats.add(format.toUpperCase().trim());
            }
        }

        if (normalizedFormats.isEmpty()) {
            return aiResult; // No valid formats to filter by
        }

        log.info("Applying format filter: {} (filtered from {} questions)",
                normalizedFormats, aiResult.getQuestions().size());

        List<AiExamParseResponse.AiQuestionDto> filteredQuestions = aiResult.getQuestions().stream()
                .filter(q -> {
                    String qType = q.getType();
                    if (qType == null) return false;
                    return normalizedFormats.contains(qType.toUpperCase().trim());
                })
                .toList();

        log.info("Format filter result: {} of {} questions match {}", filteredQuestions.size(), aiResult.getQuestions().size(), normalizedFormats);

        AiExamParseResponse result = new AiExamParseResponse();
        result.setTitle(aiResult.getTitle());
        result.setDescription(aiResult.getDescription());
        result.setQuestions(filteredQuestions);
        return result;
    }

    /**
     * If the user picked ONLY Reading and the source PDF has no Reading-shaped
     * content (passage + question block, or a recognized reading-comprehension
     * keyword), force the response to zero questions and surface a clear
     * warning. This prevents a fabricated passage from being shown as
     * "extracted".
     */
    private void applyReadingOnlyWarningIfApplicable(
            AiPdfPreviewResponse response,
            String extractedText,
            List<String> selectedSkills) {
        if (response == null) return;
        if (selectedSkills == null || selectedSkills.isEmpty()) return;

        boolean onlyReading = selectedSkills.size() == 1
                && "READING".equalsIgnoreCase(selectedSkills.get(0));
        if (!onlyReading) return;

        boolean hasReadingQuestion = response.getQuestions() != null
                && response.getQuestions().stream()
                        .anyMatch(q -> "Reading".equalsIgnoreCase(q.getCategory()));

        boolean sourceHasReadingShape = sourceContainsReadingShape(extractedText);

        if (!hasReadingQuestion || !sourceHasReadingShape) {
            log.warn("Reading-only request but no Reading-shaped content found in source PDF");
            response.setQuestions(new ArrayList<>());
            response.setWarning("No existing Reading questions found in this PDF.");
        }
    }

    /**
     * Detect whether the extracted PDF text looks like it actually contains
     * Reading content: a passage block followed by reading-comprehension
     * keywords. Returns false when there is no passage and no explicit
     * "read the passage / đọc đoạn văn / 文章読解" phrasing.
     */
    private boolean sourceContainsReadingShape(String text) {
        if (text == null || text.isBlank()) return false;
        String lower = text.toLowerCase();
        boolean hasReadingKeyword = lower.contains("read the passage")
                || lower.contains("according to the passage")
                || lower.contains("đọc đoạn văn")
                || lower.contains("đọc bài đọc")
                || lower.contains("theo bài đọc")
                || lower.contains("theo đoạn văn")
                || lower.contains("読解")
                || lower.contains("文章読解")
                || lower.contains("bài đọc")
                || lower.contains("đoạn văn")
                || lower.contains("passage");
        boolean hasLongBlock = text.length() >= 200; // a passage is at least a paragraph
        return hasReadingKeyword && hasLongBlock;
    }

    /**
     * Map AiExamParseResponse to AiPdfPreviewResponse.
     *
     * <p>Tolerates partial responses: missing explanations default to empty
     * strings, missing correct-answer markers default to the first answer,
     * and missing answers produce a question with no options rather than
     * failing the whole response.
     *
     * @param selectedSkills list of target skills to filter questions
     */
    private AiPdfPreviewResponse mapParseExamResponse(
            AiExamParseResponse aiResult,
            String mode,
            PdfTextExtractor.ExtractionResult extraction,
            List<String> selectedSkills) {

        // Sanitize with selectedSkills for category normalization and filtering
        AiExamParseResponse sanitized = com.midori.ai.util.AiExistingQuestionParser.sanitizeWithSelectedSkills(aiResult, selectedSkills);

        List<AiPdfPreviewResponse.QuestionPreview> questions = new ArrayList<>();

        for (AiExamParseResponse.AiQuestionDto qdto : sanitized.getQuestions()) {
            AiPdfPreviewResponse.QuestionPreview qp = new AiPdfPreviewResponse.QuestionPreview();
            qp.setType(qdto.getType());
            qp.setContent(qdto.getContent());
            qp.setDifficulty(qdto.getDifficulty());
            qp.setExplanation(qdto.getExplanation() != null ? qdto.getExplanation() : "");
            qp.setCategory(qdto.getCategory());
            qp.setReadingPassage(qdto.getReadingPassage());
            qp.setSourcePassage(qdto.getSourcePassage());

            List<AiPdfPreviewResponse.AnswerPreview> answers = new ArrayList<>();
            if (qdto.getAnswers() != null) {
                for (AiExamParseResponse.AiAnswerDto adto : qdto.getAnswers()) {
                    AiPdfPreviewResponse.AnswerPreview ap = new AiPdfPreviewResponse.AnswerPreview();
                    ap.setContent(adto.getContent() != null ? adto.getContent() : "");
                    ap.setIsCorrect(Boolean.TRUE.equals(adto.getIsCorrect()));
                    answers.add(ap);
                }
            }

            // Ensure exactly one correct answer is marked so the FE preview is valid.
            long correctCount = answers.stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
            if (correctCount == 0 && !answers.isEmpty()) {
                answers.get(0).setIsCorrect(true);
            } else if (correctCount > 1) {
                boolean first = true;
                for (AiPdfPreviewResponse.AnswerPreview ap : answers) {
                    if (Boolean.TRUE.equals(ap.getIsCorrect())) {
                        if (!first) {
                            ap.setIsCorrect(false);
                        }
                        first = false;
                    }
                }
            }

            qp.setAnswers(answers);
            questions.add(qp);
        }

        return AiPdfPreviewResponse.builder()
                .mode(mode)
                .title(aiResult.getTitle() != null ? aiResult.getTitle() : "")
                .description(aiResult.getDescription())
                .pageCount(extraction.pageCount())
                .extractedTextLength(extraction.fullText().length())
                .likelyScanned(extraction.likelyScanned())
                .questions(questions)
                .build();
    }

    /**
     * Collect target skills from the multipart request, accepting:
     * <ul>
     *   <li>repeated {@code targetSkills} parameters (FE default),</li>
     *   <li>a single {@code targetSkills} value with comma-separated skills,</li>
     *   <li>a legacy singular {@code targetSkill} parameter.</li>
     * </ul>
     * Order is preserved, duplicates are removed (case-insensitive).
     */
    private List<String> resolveTargetSkills(HttpServletRequest request) {
        if (request == null) return Collections.emptyList();
        Set<String> seen = new LinkedHashSet<>();
        String[] repeated = request.getParameterValues("targetSkills");
        if (repeated != null) {
            for (String value : repeated) {
                if (value == null) continue;
                for (String token : value.split(",")) {
                    String trimmed = token.trim();
                    if (!trimmed.isEmpty()) seen.add(trimmed.toUpperCase());
                }
            }
        }
        String legacy = request.getParameter("targetSkill");
        if (legacy != null && !legacy.isBlank()) {
            for (String token : legacy.split(",")) {
                String trimmed = token.trim();
                if (!trimmed.isEmpty()) seen.add(trimmed.toUpperCase());
            }
        }
        return new ArrayList<>(seen);
    }

    /**
     * Resolve question formats from either the single questionFormat parameter
     * or the multiple questionFormats parameter.
     * Rules:
     * - If questionFormats contains AUTO_DETECT, return AUTO_DETECT only
     * - If questionFormats has other values, return them (normalized)
     * - If questionFormats is empty, fall back to questionFormat
     * - AUTO_DETECT cannot be combined with other formats
     */
    private List<String> resolveQuestionFormats(String questionFormat, List<String> questionFormats) {
        List<String> result = new ArrayList<>();

        // Priority 1: questionFormats parameter (multiple)
        if (questionFormats != null && !questionFormats.isEmpty()) {
            boolean hasAutoDetect = questionFormats.stream()
                    .anyMatch(f -> "AUTO_DETECT".equalsIgnoreCase(f));

            if (hasAutoDetect) {
                // AUTO_DETECT cannot be combined with other formats
                if (questionFormats.size() > 1) {
                    // Has both AUTO_DETECT and other formats - this is an error
                    // Return empty to indicate validation error, or just AUTO_DETECT
                    return List.of("AUTO_DETECT");
                }
                return List.of("AUTO_DETECT");
            }

            // Normalize and return the formats
            for (String format : questionFormats) {
                if (format != null && !format.isBlank()) {
                    result.add(format.toUpperCase().trim());
                }
            }
            return result;
        }

        // Priority 2: questionFormat parameter (single, legacy)
        if (questionFormat != null && !questionFormat.isBlank()) {
            result.add(questionFormat.toUpperCase().trim());
            return result;
        }

        // No format specified - return empty (no filtering)
        return Collections.emptyList();
    }

    private ResponseEntity<ApiResponse<AiPdfPreviewResponse>> buildErrorResponse(String mode, String errorCode, String message) {
        AiPdfPreviewResponse response = AiPdfPreviewResponse.builder()
                .mode(mode)
                .success(false)
                .code(errorCode)
                .errorMessage(message)
                .questions(new ArrayList<>())
                .build();
        // Keep ApiResponse.success so FE receives {data: {...}} structure it expects
        return ResponseEntity.badRequest()
                .body(ApiResponse.success(response));
    }

    private String computeHash(byte[] bytes) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }
}
