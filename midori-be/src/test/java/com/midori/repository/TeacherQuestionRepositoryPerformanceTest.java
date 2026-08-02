package com.midori.repository;

import com.midori.entity.Role;
import com.midori.entity.TeacherQuestion;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("local")
@Transactional
class TeacherQuestionRepositoryPerformanceTest {

    @Autowired
    private TeacherQuestionRepository teacherQuestionRepository;

    @Autowired
    private UserRepository userRepository;

    private User testTeacher;

    @BeforeEach
    void setup() {
        testTeacher = User.builder()
                .email("test_perf_" + UUID.randomUUID() + "@midori.com")
                .passwordHash("hash")
                .role(Role.TEACHER)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build();
        userRepository.save(testTeacher);
    }

    @Test
    @DisplayName("findAllWithTeacherAndLesson returns questions with options, without options, distinct rows, and order by createdAt desc")
    void findAllWithOptions_verifiesPerformanceAndCorrectnessRequirements() throws InterruptedException {
        // Create Question 1: earliest timestamp, WITH 4 options
        TeacherQuestion q1 = TeacherQuestion.builder()
                .teacher(testTeacher)
                .level("N5")
                .prompt("Question With Options " + UUID.randomUUID())
                .questionType("MULTIPLE_CHOICE")
                .status("ACTIVE")
                .correctAnswerIndex(0)
                .options(new ArrayList<>(List.of("Option 1", "Option 2", "Option 3", "Option 4")))
                .build();
        teacherQuestionRepository.saveAndFlush(q1);

        // Sleep 50ms to guarantee distinct createdAt timestamps for ordering test
        Thread.sleep(50);

        // Create Question 2: later timestamp, WITHOUT options (empty options list)
        TeacherQuestion q2 = TeacherQuestion.builder()
                .teacher(testTeacher)
                .level("N5")
                .prompt("Question Without Options " + UUID.randomUUID())
                .questionType("ESSAY")
                .status("ACTIVE")
                .correctAnswerIndex(0)
                .options(new ArrayList<>())
                .build();
        teacherQuestionRepository.saveAndFlush(q2);

        // Invoke the optimized ADMIN query method
        List<TeacherQuestion> results = teacherQuestionRepository.findAllWithTeacherAndLesson();

        // Find our test questions in the results
        List<TeacherQuestion> matchingQ1 = results.stream().filter(q -> q.getId().equals(q1.getId())).toList();
        List<TeacherQuestion> matchingQ2 = results.stream().filter(q -> q.getId().equals(q2.getId())).toList();

        // 1. ADMIN optimized list query returns questions with options
        assertThat(matchingQ1).hasSize(1);
        assertThat(matchingQ1.get(0).getOptions()).containsExactly("Option 1", "Option 2", "Option 3", "Option 4");

        // 2. Questions without options are still returned
        assertThat(matchingQ2).hasSize(1);
        assertThat(matchingQ2.get(0).getOptions()).isEmpty();

        // 3. DISTINCT prevents duplicated TeacherQuestion rows (q1 has 4 options, should appear exactly once)
        assertThat(matchingQ1.size()).isEqualTo(1);
        long q1Count = results.stream().filter(q -> q.getId().equals(q1.getId())).count();
        assertThat(q1Count).isEqualTo(1);

        // 4. Existing ordering is preserved (createdAt DESC -> q2 created later must appear before q1)
        int indexQ1 = results.indexOf(matchingQ1.get(0));
        int indexQ2 = results.indexOf(matchingQ2.get(0));
        assertThat(indexQ2).isLessThan(indexQ1);
    }
}
