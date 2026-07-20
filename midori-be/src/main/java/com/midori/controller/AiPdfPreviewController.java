package com.midori.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.dto.AiQuizGenerationResponse;
import com.midori.ai.util.AiExistingQuestionParser;
import com.midori.common.ApiResponse;
import com.midori.dto.response.AiPdfPreviewResponse;
import com.midori.service.PdfTextExtractor;
import com.midori.service.AiLearningContentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/ai")
public class AiPdfPreviewController {

    private static final Logger log = LoggerFactory.getLogger(AiPdfPreviewController.class);

    private static final Set<String> VALID_SKILLS = Set.of("VOCABULARY", "GRAMMAR", "READING");

    private final PdfTextExtractor pdfTextExtractor;
    private final AiCoreService aiCoreService;
    private final AiLearningContentService aiLearningContentService;
    private final ObjectMapper objectMapper;

    public AiPdfPreviewController(PdfTextExtractor pdfTextExtractor, AiCoreService aiCoreService, AiLearningContentService aiLearningContentService) {
        this.pdfTextExtractor = pdfTextExtractor;
        this.aiCoreService = aiCoreService;
        this.aiLearningContentService = aiLearningContentService;
        this.objectMapper = new ObjectMapper();
    }

    @PostMapping(value = "/questions/generate-from-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<AiPdfPreviewResponse>> generateQuestionsFromPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mode", defaultValue = "IMPORT_EXISTING_QUESTIONS") String mode,
            @RequestParam(value = "level", required = false) String level,
            @RequestParam(value = "count", defaultValue = "10") Integer count,
            @RequestParam(value = "questionType", defaultValue = "MULTIPLE_CHOICE") String questionType,
            @RequestParam(value = "difficulty", defaultValue = "MEDIUM") String difficulty,
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

        // Validate targetSkills - at least one skill is required
        if (targetSkills == null || targetSkills.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("At least one target skill is required."));
        }

        // Validate each skill
        Set<String> normalizedSkills = new HashSet<>();
        for (String skill : targetSkills) {
            if (skill == null || skill.isBlank()) continue;
            String normalized = skill.toUpperCase().trim();
            if (!VALID_SKILLS.contains(normalized)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Invalid target skill: " + skill + ". Must be one of: VOCABULARY, GRAMMAR, READING"));
            }
            normalizedSkills.add(normalized);
        }

        if (normalizedSkills.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("At least one target skill is required."));
        }

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

        // Validate mode
        if (!mode.equals("IMPORT_EXISTING_QUESTIONS") && !mode.equals("GENERATE_FROM_CONTENT")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid mode. Must be IMPORT_EXISTING_QUESTIONS or GENERATE_FROM_CONTENT"));
        }

        try {
            // Step 1: Extract text from PDF
            PdfTextExtractor.ExtractionResult extraction = pdfTextExtractor.extract(file);
            log.info("PDF extracted: {} chars from {} pages, scanned={}",
                    extraction.fullText().length(), extraction.pageCount(), extraction.likelyScanned());

            // Check for empty or scanned PDF
            if (extraction.fullText() == null || extraction.fullText().trim().isEmpty()) {
                return buildErrorResponse(mode, "PDF may be scanned or contains no readable text. Please try a text-based PDF.");
            }

            if (extraction.likelyScanned() && extraction.fullText().length() < 100) {
                return buildErrorResponse(mode, "PDF appears to be scanned with little or no extractable text. Please try a different PDF.");
            }

            // Step 2: Generate questions based on mode
            AiPdfPreviewResponse response;

            if ("GENERATE_FROM_CONTENT".equals(mode)) {
                // Generate new questions from learning content
                log.info("Generating questions from content, count={}, type={}, difficulty={}, selectedSkills={}", count, questionType, difficulty, selectedSkills);
                response = generateFromContent(extraction, mode, filename, count, questionType, difficulty, level, selectedSkills);
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
                    log.info("Importing existing questions from PDF (provider={}, selectedSkills={})", aiCoreService.getCurrentProvider().getName(), selectedSkills);
                    response = importExistingQuestions(extraction, mode, filename, selectedSkills);
                }
            }

            // Add warning if scanned
            if (extraction.likelyScanned() && extraction.fullText().length() < 500) {
                response.setWarning("PDF may be scanned. Results may be incomplete.");
            }

            return ResponseEntity.ok(ApiResponse.success(response));

        } catch (Exception e) {
            log.error("PDF preview failed: {}", e.getMessage(), e);
            String errorPrefix = "GENERATE_FROM_CONTENT".equals(mode)
                    ? "Failed to generate questions. Please try again. (" + e.getMessage() + ")"
                    : "Failed to process PDF: " + e.getMessage();
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error(errorPrefix));
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
        if (sourcePassage == null || sourcePassage.isBlank()) {
            log.warn("[generate-sanitize] no Reading passage detected in source PDF (filename={})", filename);
        }

        // Delegate to the robust AiLearningContentService
        AiExamParseResponse parseResponse = aiLearningContentService.generateQuestions(
                filename,
                extraction.fullText(),
                count,
                difficulty,
                selectedSkills,
                sourcePassage
        );

        if (parseResponse.getQuestions() == null || parseResponse.getQuestions().isEmpty()) {
            throw new IllegalArgumentException("AI returned an invalid or empty response. Please try again.");
        }

        // Map sanitized questions to the preview response shape.
        List<AiPdfPreviewResponse.QuestionPreview> questions = new ArrayList<>();
        for (var q : parseResponse.getQuestions()) {
            questions.add(toPreviewQuestion(q, questionType, difficulty));
        }

        return AiPdfPreviewResponse.builder()
                .mode(mode)
                .title(filename)
                .description("Generated from learning content")
                .pageCount(extraction.pageCount())
                .extractedTextLength(extraction.fullText().length())
                .likelyScanned(extraction.likelyScanned())
                .questions(questions)
                .build();
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
        qp.setDifficulty(difficulty);
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
     * @param selectedSkills list of target skills to filter questions (VOCABULARY, GRAMMAR, READING)
     */
    private AiPdfPreviewResponse importExistingQuestions(
            PdfTextExtractor.ExtractionResult extraction,
            String mode,
            String filename,
            List<String> selectedSkills) {

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
                    .errorMessage("AI could not process this PDF: " + e.getMessage())
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

        log.info("AI parsed: {} questions from provider {}",
                aiResult.getQuestions() != null ? aiResult.getQuestions().size() : 0,
                aiCoreService.getCurrentProvider().getName());

        // EVIDENCE GUARD: drop any question that did not actually come from
        // the PDF. Without this, an LLM can fabricate a passage (e.g. a
        // "Tanaka" reading passage) and surface it as an extracted question.
        AiExamParseResponse filtered = AiExistingQuestionParser.filterByEvidence(
                aiResult, extraction.fullText(), filename);
        int dropped = (aiResult.getQuestions() != null ? aiResult.getQuestions().size() : 0)
                - (filtered.getQuestions() != null ? filtered.getQuestions().size() : 0);
        if (dropped > 0) {
            log.info("Evidence filter dropped {} question(s) without source evidence", dropped);
        }

        if (filtered.getQuestions() == null || filtered.getQuestions().isEmpty()) {
            log.warn("No evidence-backed questions for {}", filename);
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

        AiPdfPreviewResponse response = mapParseExamResponse(filtered, mode, extraction, selectedSkills);
        applyReadingOnlyWarningIfApplicable(response, extraction.fullText(), selectedSkills);
        return response;
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

    private ResponseEntity<ApiResponse<AiPdfPreviewResponse>> buildErrorResponse(String mode, String message) {
        AiPdfPreviewResponse response = AiPdfPreviewResponse.builder()
                .mode(mode)
                .errorMessage(message)
                .questions(new ArrayList<>())
                .build();
        return ResponseEntity.badRequest()
                .body(ApiResponse.success(response));
    }
}
