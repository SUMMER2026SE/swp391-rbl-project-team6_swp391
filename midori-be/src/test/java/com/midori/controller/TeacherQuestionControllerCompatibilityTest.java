package com.midori.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.dto.ai.ErrorCorrectionMetadata;
import com.midori.dto.ai.TranslationMetadata;
import com.midori.dto.questiondto.BatchCreateQuestionsRequest;
import com.midori.dto.questiondto.CreateTeacherQuestionRequest;
import com.midori.entity.QuestionBankLesson;
import com.midori.entity.Role;
import com.midori.entity.TeacherQuestion;
import com.midori.entity.User;
import com.midori.repository.QuestionBankLessonRepository;
import com.midori.repository.TeacherQuestionRepository;
import com.midori.repository.UserRepository;
import com.midori.security.CustomUserDetails;
import com.midori.service.QuestionBankLessonService;
import com.midori.service.TeacherQuestionService;
import com.midori.validation.QuestionBankCompatibilityValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.ResponseEntity;
import com.midori.dto.questiondto.BatchQuestionsResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for skill-format compatibility validation in TeacherQuestionController.
 * Uses pure Mockito (no Spring context) to test the validation logic.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TeacherQuestionControllerCompatibilityTest {

    @Mock
    private TeacherQuestionService teacherQuestionService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TeacherQuestionRepository teacherQuestionRepository;

    @Mock
    private QuestionBankLessonRepository questionBankLessonRepository;

    @Mock
    private QuestionBankLessonService questionBankLessonService;

    @Mock
    private QuestionBankCompatibilityValidator compatibilityValidator;

    @InjectMocks
    private TeacherQuestionController controller;

    private UUID teacherId;
    private CustomUserDetails userDetails;
    private User teacher;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        teacherId = UUID.randomUUID();
        userDetails = CustomUserDetails.builder()
                .id(teacherId)
                .email("teacher@test.com")
                .password("pass")
                .role("TEACHER")
                .status("ACTIVE")
                .emailVerified(true)
                .build();

        teacher = User.builder().id(teacherId).email("teacher@test.com").role(Role.TEACHER).build();
        when(userRepository.findById(teacherId)).thenReturn(Optional.of(teacher));
    }

    // ─── Helper builders ─────────────────────────────────────────────────────────

    private CreateTeacherQuestionRequest vocabMcqRequest() {
        CreateTeacherQuestionRequest req = new CreateTeacherQuestionRequest();
        req.setSkill("VOCABULARY");
        req.setQuestionType("MULTIPLE_CHOICE");
        req.setPrompt("What is the meaning of 学校?");
        req.setCorrectAnswerIndex(0);
        req.setOptions(List.of("School", "Hospital"));
        req.setLevel("N5");
        return req;
    }

    private CreateTeacherQuestionRequest vocabTrueFalseRequest() {
        CreateTeacherQuestionRequest req = new CreateTeacherQuestionRequest();
        req.setSkill("VOCABULARY");
        req.setQuestionType("TRUE_FALSE");
        req.setPrompt("学校 means 'school'.");
        req.setCorrectAnswerIndex(0);
        req.setOptions(List.of("True", "False"));
        req.setLevel("N5");
        return req;
    }

    private CreateTeacherQuestionRequest vocabTranslationRequest() {
        CreateTeacherQuestionRequest req = new CreateTeacherQuestionRequest();
        req.setSkill("VOCABULARY");
        req.setQuestionType("TRANSLATION");
        req.setPrompt("Translate: 学校");
        req.setCorrectAnswerIndex(0);
        req.setOptions(List.of("School"));
        req.setLevel("N5");
        req.setTranslationMetadata(new TranslationMetadata());
        return req;
    }

    private CreateTeacherQuestionRequest writingErrorCorrectionRequest() {
        CreateTeacherQuestionRequest req = new CreateTeacherQuestionRequest();
        req.setSkill("WRITING");
        req.setQuestionType("ERROR_CORRECTION");
        req.setPrompt("Correct the sentence:");
        req.setCorrectAnswerIndex(0);
        req.setOptions(List.of("Corrected sentence"));
        req.setLevel("N5");
        ErrorCorrectionMetadata meta = new ErrorCorrectionMetadata();
        meta.setIncorrectText("私は 学校に 行きます。");
        meta.setCorrectedText("私は学校に行きます。");
        meta.setExplanation("No space needed");
        req.setErrorCorrectionMetadata(meta);
        return req;
    }

    private CreateTeacherQuestionRequest writingShortAnswerRequest() {
        CreateTeacherQuestionRequest req = new CreateTeacherQuestionRequest();
        req.setSkill("WRITING");
        req.setQuestionType("SHORT_ANSWER");
        req.setPrompt("Write about your hobbies.");
        req.setCorrectAnswerIndex(0);
        req.setOptions(List.of());
        req.setLevel("N5");
        return req;
    }

    private CreateTeacherQuestionRequest writingTranslationRequest() {
        CreateTeacherQuestionRequest req = new CreateTeacherQuestionRequest();
        req.setSkill("WRITING");
        req.setQuestionType("TRANSLATION");
        req.setPrompt("Translate this sentence.");
        req.setCorrectAnswerIndex(0);
        req.setOptions(List.of("Translation result"));
        req.setLevel("N5");
        req.setTranslationMetadata(new TranslationMetadata());
        return req;
    }

    private CreateTeacherQuestionRequest writingSentenceWritingRequest() {
        CreateTeacherQuestionRequest req = new CreateTeacherQuestionRequest();
        req.setSkill("WRITING");
        req.setQuestionType("SENTENCE_WRITING");
        req.setPrompt("Reorder: [school] [go] [to].");
        req.setCorrectAnswerIndex(0);
        req.setOptions(List.of("Go to school"));
        req.setLevel("N5");
        return req;
    }

    private CreateTeacherQuestionRequest invalidSkillRequest() {
        CreateTeacherQuestionRequest req = new CreateTeacherQuestionRequest();
        req.setSkill("Writing"); // Invalid format, lowercase
        req.setQuestionType("SHORT_ANSWER");
        req.setPrompt("Write about your hobbies.");
        req.setCorrectAnswerIndex(0);
        req.setOptions(List.of());
        req.setLevel("N5");
        return req;
    }

    private CreateTeacherQuestionRequest nullSkillRequest() {
        CreateTeacherQuestionRequest req = new CreateTeacherQuestionRequest();
        req.setSkill(null);
        req.setQuestionType("SHORT_ANSWER");
        req.setPrompt("Write about your hobbies.");
        req.setCorrectAnswerIndex(0);
        req.setOptions(List.of());
        req.setLevel("N5");
        return req;
    }

    // ─── Batch endpoint tests ──────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /batch — skill-format compatibility validation")
    class BatchCompatibilityValidation {

        @Test
        @DisplayName("VOCABULARY + MULTIPLE_CHOICE → compatible, no error")
        void vocabMcq_compatible() {
            when(compatibilityValidator.validateSkillsAndFormats(anyList(), eq("MULTIPLE_CHOICE")))
                    .thenReturn(null);
            when(teacherQuestionService.createQuestions(any())).thenReturn(List.of());

            BatchCreateQuestionsRequest batch = new BatchCreateQuestionsRequest();
            batch.setQuestions(List.of(vocabMcqRequest()));

            ResponseEntity<?> response = controller.createQuestionsBatch(userDetails, batch);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            verify(compatibilityValidator).validateSkillsAndFormats(anyList(), eq("MULTIPLE_CHOICE"));
        }

        @Test
        @DisplayName("VOCABULARY + TRUE_FALSE → incompatible, throws BadRequestException")
        void vocabTrueFalse_incompatible() {
            when(compatibilityValidator.validateSkillsAndFormats(anyList(), eq("TRUE_FALSE")))
                    .thenReturn("VOCABULARY does not support TRUE_FALSE questions.");

            BatchCreateQuestionsRequest batch = new BatchCreateQuestionsRequest();
            batch.setQuestions(List.of(vocabTrueFalseRequest()));

            try {
                controller.createQuestionsBatch(userDetails, batch);
                throw new AssertionError("Expected BadRequestException");
            } catch (com.midori.exception.BadRequestException e) {
                assertThat(e.getMessage()).contains("Skill-format validation failed");
                verify(compatibilityValidator).validateSkillsAndFormats(anyList(), eq("TRUE_FALSE"));
                verify(teacherQuestionService, never()).createQuestions(any());
            }
        }

        @Test
        @DisplayName("VOCABULARY + TRANSLATION → compatible, no error")
        void vocabTranslation_compatible() {
            when(compatibilityValidator.validateSkillsAndFormats(anyList(), eq("TRANSLATION")))
                    .thenReturn(null);
            when(teacherQuestionService.createQuestions(any())).thenReturn(List.of());

            BatchCreateQuestionsRequest batch = new BatchCreateQuestionsRequest();
            batch.setQuestions(List.of(vocabTranslationRequest()));

            ResponseEntity<?> response = controller.createQuestionsBatch(userDetails, batch);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
        }

        @Test
        @DisplayName("WRITING + ERROR_CORRECTION → compatible, no error")
        void writingErrorCorrection_compatible() {
            when(compatibilityValidator.validateSkillsAndFormats(anyList(), eq("ERROR_CORRECTION")))
                    .thenReturn(null);
            when(teacherQuestionService.createQuestions(any())).thenReturn(List.of());

            BatchCreateQuestionsRequest batch = new BatchCreateQuestionsRequest();
            batch.setQuestions(List.of(writingErrorCorrectionRequest()));

            ResponseEntity<?> response = controller.createQuestionsBatch(userDetails, batch);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
        }

        @Test
        @DisplayName("WRITING + SHORT_ANSWER → compatible, saved")
        void writingShortAnswer_compatible() {
            when(compatibilityValidator.validateSkillsAndFormats(anyList(), eq("SHORT_ANSWER")))
                    .thenReturn(null);
            when(teacherQuestionService.createQuestions(any())).thenReturn(List.of());

            BatchCreateQuestionsRequest batch = new BatchCreateQuestionsRequest();
            batch.setQuestions(List.of(writingShortAnswerRequest()));

            ResponseEntity<?> response = controller.createQuestionsBatch(userDetails, batch);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
        }

        @Test
        @DisplayName("WRITING + TRANSLATION → compatible, saved")
        void writingTranslation_compatible() {
            when(compatibilityValidator.validateSkillsAndFormats(anyList(), eq("TRANSLATION")))
                    .thenReturn(null);
            when(teacherQuestionService.createQuestions(any())).thenReturn(List.of());

            BatchCreateQuestionsRequest batch = new BatchCreateQuestionsRequest();
            batch.setQuestions(List.of(writingTranslationRequest()));

            ResponseEntity<?> response = controller.createQuestionsBatch(userDetails, batch);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
        }

        @Test
        @DisplayName("WRITING + SENTENCE_WRITING → compatible, saved")
        void writingSentenceWriting_compatible() {
            when(compatibilityValidator.validateSkillsAndFormats(anyList(), eq("SENTENCE_WRITING")))
                    .thenReturn(null);
            when(teacherQuestionService.createQuestions(any())).thenReturn(List.of());

            BatchCreateQuestionsRequest batch = new BatchCreateQuestionsRequest();
            batch.setQuestions(List.of(writingSentenceWritingRequest()));

            ResponseEntity<?> response = controller.createQuestionsBatch(userDetails, batch);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
        }

        @Test
        @DisplayName("Batch save with null skill → throws BadRequestException")
        void batchNullSkill_throwsBadRequest() {
            BatchCreateQuestionsRequest batch = new BatchCreateQuestionsRequest();
            batch.setQuestions(List.of(nullSkillRequest()));

            try {
                controller.createQuestionsBatch(userDetails, batch);
                throw new AssertionError("Expected BadRequestException");
            } catch (com.midori.exception.BadRequestException e) {
                assertThat(e.getMessage()).isEqualTo("Question skill is required.");
                verify(teacherQuestionService, never()).createQuestions(any());
            }
        }

        @Test
        @DisplayName("Batch save with invalid format 'Writing' → throws BadRequestException")
        void batchInvalidFormatWriting_throwsBadRequest() {
            CreateTeacherQuestionRequest req = writingShortAnswerRequest();
            req.setQuestionType("Writing");

            BatchCreateQuestionsRequest batch = new BatchCreateQuestionsRequest();
            batch.setQuestions(List.of(req));

            when(compatibilityValidator.validateSkillsAndFormats(anyList(), eq("Writing")))
                    .thenReturn("Invalid format: Writing.");

            try {
                controller.createQuestionsBatch(userDetails, batch);
                throw new AssertionError("Expected BadRequestException");
            } catch (com.midori.exception.BadRequestException e) {
                assertThat(e.getMessage()).contains("Skill-format validation failed");
                verify(teacherQuestionService, never()).createQuestions(any());
            }
        }

        @Test
        @DisplayName("Multiple questions: first incompatible → throws before saving any")
        void batchFirstIncompatible_abortsBeforeSaving() {
            when(compatibilityValidator.validateSkillsAndFormats(anyList(), anyString()))
                    .thenReturn("Incompatible.");

            BatchCreateQuestionsRequest batch = new BatchCreateQuestionsRequest();
            batch.setQuestions(List.of(vocabMcqRequest(), vocabTrueFalseRequest()));

            try {
                controller.createQuestionsBatch(userDetails, batch);
                throw new AssertionError("Expected BadRequestException");
            } catch (com.midori.exception.BadRequestException e) {
                verify(teacherQuestionService, never()).createQuestions(any());
            }
        }
    }

    // ─── Single endpoint tests ────────────────────────────────────────────────

    @Nested
    @DisplayName("POST / — skill-format compatibility validation")
    class SingleCompatibilityValidation {

        @Test
        @DisplayName("VOCABULARY + MULTIPLE_CHOICE → compatible, saved")
        void vocabMcq_saved() {
            when(compatibilityValidator.validateSkillsAndFormats(anyList(), eq("MULTIPLE_CHOICE")))
                    .thenReturn(null);
            when(teacherQuestionService.createQuestion(any())).thenAnswer(invocation -> {
                TeacherQuestion q = invocation.getArgument(0);
                q.setId(UUID.randomUUID());
                return q;
            });

            ResponseEntity<?> response = controller.createQuestion(userDetails, vocabMcqRequest());

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            verify(teacherQuestionService).createQuestion(any());
        }

        @Test
        @DisplayName("VOCABULARY + TRUE_FALSE → incompatible, throws BadRequestException")
        void vocabTrueFalse_rejected() {
            when(compatibilityValidator.validateSkillsAndFormats(anyList(), eq("TRUE_FALSE")))
                    .thenReturn("VOCABULARY does not support TRUE_FALSE questions.");

            try {
                controller.createQuestion(userDetails, vocabTrueFalseRequest());
                throw new AssertionError("Expected BadRequestException");
            } catch (com.midori.exception.BadRequestException e) {
                verify(teacherQuestionService, never()).createQuestion(any());
            }
        }

        @Test
        @DisplayName("Single save with null skill → throws BadRequestException")
        void singleNullSkill_throwsBadRequest() {
            try {
                controller.createQuestion(userDetails, nullSkillRequest());
                throw new AssertionError("Expected BadRequestException");
            } catch (com.midori.exception.BadRequestException e) {
                assertThat(e.getMessage()).isEqualTo("Question skill is required.");
                verify(teacherQuestionService, never()).createQuestion(any());
            }
        }
    }
}
