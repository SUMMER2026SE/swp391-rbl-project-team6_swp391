package com.midori.controller;

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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TeacherQuestionControllerPerformanceTest {

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
    private User teacher;
    private CustomUserDetails teacherDetails;
    private CustomUserDetails adminDetails;

    @BeforeEach
    void setup() {
        teacherId = UUID.randomUUID();
        teacher = User.builder().id(teacherId).email("teacher@midori.com").role(Role.TEACHER).build();
        teacherDetails = CustomUserDetails.builder()
                .id(teacherId)
                .email("teacher@midori.com")
                .password("pass")
                .role("TEACHER")
                .status("ACTIVE")
                .emailVerified(true)
                .build();
        adminDetails = CustomUserDetails.builder()
                .id(UUID.randomUUID())
                .email("admin@midori.com")
                .password("pass")
                .role("ADMIN")
                .status("ACTIVE")
                .emailVerified(true)
                .build();

        // Default: all skill-format combinations are compatible
        when(compatibilityValidator.validateSkillsAndFormats(anyList(), anyString())).thenReturn(null);
    }

    @Test
    @DisplayName("Batch creation resolves the same lesson only once and saves all questions and options correctly")
    void createQuestionsBatch_cachesLessonLookupAndSavesAll() {
        when(userRepository.findById(teacherId)).thenReturn(Optional.of(teacher));

        Integer testLessonId = 999;
        QuestionBankLesson lesson = QuestionBankLesson.builder().id(testLessonId).lessonName("Lesson 999").build();
        when(questionBankLessonRepository.findById(testLessonId)).thenReturn(Optional.of(lesson));

        List<CreateTeacherQuestionRequest> questionRequests = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            CreateTeacherQuestionRequest req = new CreateTeacherQuestionRequest();
            req.setLessonId(testLessonId);
            req.setPrompt("Question Prompt " + i);
            req.setQuestionType("MULTIPLE_CHOICE");
            req.setSkill("VOCABULARY");
            req.setCorrectAnswerIndex(0);
            req.setOptions(List.of("Opt A", "Opt B", "Opt C", "Opt D"));
            questionRequests.add(req);
        }

        BatchCreateQuestionsRequest batchRequest = new BatchCreateQuestionsRequest();
        batchRequest.setQuestions(questionRequests);

        when(teacherQuestionService.createQuestions(any())).thenAnswer(invocation -> {
            List<TeacherQuestion> toSave = invocation.getArgument(0);
            for (TeacherQuestion q : toSave) {
                q.setId(UUID.randomUUID());
            }
            return toSave;
        });

        controller.createQuestionsBatch(teacherDetails, batchRequest);

        // Verification 5: Batch creation resolves the same lesson only once
        verify(questionBankLessonRepository, times(1)).findById(testLessonId);

        // Verification 6: Batch creation still saves all questions and options correctly
        ArgumentCaptor<List<TeacherQuestion>> captor = ArgumentCaptor.forClass(List.class);
        verify(teacherQuestionService, times(1)).createQuestions(captor.capture());
        List<TeacherQuestion> captured = captor.getValue();
        assertThat(captured).hasSize(10);
        for (int i = 0; i < 10; i++) {
            TeacherQuestion q = captured.get(i);
            assertThat(q.getLesson()).isEqualTo(lesson);
            assertThat(q.getPrompt()).isEqualTo("Question Prompt " + (i + 1));
            assertThat(q.getOptions()).containsExactly("Opt A", "Opt B", "Opt C", "Opt D");
        }
    }

    @Test
    @DisplayName("Teacher-scoped access remains unchanged when calling getQuestions")
    void getQuestions_asTeacher_callsTeacherViewServiceMethod() {
        when(userRepository.findById(teacherId)).thenReturn(Optional.of(teacher));
        when(teacherQuestionService.findQuestionsForTeacherView(teacherId)).thenReturn(Collections.emptyList());

        controller.getQuestions(teacherDetails);

        // Verification 7: Teacher-scoped access remains unchanged
        verify(teacherQuestionService, times(1)).findQuestionsForTeacherView(teacherId);
        verify(teacherQuestionRepository, never()).findAll();
        verify(teacherQuestionRepository, never()).findAllWithOptions();
    }

    @Test
    @DisplayName("Admin calling getQuestions invokes optimized findAllWithOptions")
    void getQuestions_asAdmin_callsFindAllWithOptions() {
        User adminUser = User.builder().id(adminDetails.getId()).role(Role.ADMIN).build();
        when(userRepository.findById(adminDetails.getId())).thenReturn(Optional.of(adminUser));
        when(teacherQuestionRepository.findAllWithOptions()).thenReturn(Collections.emptyList());

        controller.getQuestions(adminDetails);

        // Verification 1 (Controller routing): Admin invokes findAllWithOptions instead of findAll()
        verify(teacherQuestionRepository, times(1)).findAllWithOptions();
        verify(teacherQuestionRepository, never()).findAll();
        verify(teacherQuestionService, never()).findQuestionsForTeacherView(any());
    }
}
