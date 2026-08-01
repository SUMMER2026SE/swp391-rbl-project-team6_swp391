package com.midori.service;

import com.midori.entity.ClassEntity;
import com.midori.entity.GrammarLevel;
import com.midori.entity.StudentLearningAccess;
import com.midori.entity.User;
import com.midori.repository.StudentLearningAccessRepository;
import com.midori.service.impl.LearningAccessServiceImpl;
import com.midori.exception.LearningJourneyAccessDeniedException;
import com.midori.exception.LearningJourneyAccessExpiredException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import java.util.Map;
import java.util.Set;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LearningAccessServiceTest {

    @Mock
    private StudentLearningAccessRepository accessRepository;

    @InjectMocks
    private LearningAccessServiceImpl learningAccessService;

    private User student;
    private ClassEntity classEntity;

    @BeforeEach
    void setUp() {
        student = User.builder().id(UUID.randomUUID()).build();
        classEntity = ClassEntity.builder().level(GrammarLevel.N5).build();
    }

    @Test
    void grantOrExtendAccess_CreatesNewAccess_WhenNotExists() {
        when(accessRepository.findByStudentIdAndLevel(student.getId(), "N5")).thenReturn(Optional.empty());

        learningAccessService.grantOrExtendAccess(student, classEntity);

        ArgumentCaptor<StudentLearningAccess> captor = ArgumentCaptor.forClass(StudentLearningAccess.class);
        verify(accessRepository).save(captor.capture());

        StudentLearningAccess savedAccess = captor.getValue();
        assertThat(savedAccess.getStudent()).isEqualTo(student);
        assertThat(savedAccess.getLevel()).isEqualTo("N5");
        assertThat(savedAccess.getStatus()).isEqualTo(StudentLearningAccess.AccessStatus.ACTIVE);
        assertThat(savedAccess.getAccessExpireAt()).isAfter(Instant.now().plus(360, ChronoUnit.DAYS));
    }

    @Test
    void grantOrExtendAccess_ExtendsAccess_WhenExists() {
        Instant oldExpire = Instant.now().plus(10, ChronoUnit.DAYS);
        StudentLearningAccess existingAccess = StudentLearningAccess.builder()
                .student(student)
                .level("N5")
                .accessExpireAt(oldExpire)
                .status(StudentLearningAccess.AccessStatus.ACTIVE)
                .build();

        when(accessRepository.findByStudentIdAndLevel(student.getId(), "N5")).thenReturn(Optional.of(existingAccess));

        learningAccessService.grantOrExtendAccess(student, classEntity);

        verify(accessRepository).save(existingAccess);
        assertThat(existingAccess.getAccessExpireAt()).isAfter(oldExpire);
    }

    @Test
    void checkAccess_ThrowsAccessDenied_WhenNullLevel() {
        assertThatThrownBy(() -> learningAccessService.checkAccess(student.getId(), null))
                .isInstanceOf(LearningJourneyAccessDeniedException.class);
    }

    @Test
    void checkAccess_ThrowsAccessDenied_WhenNotFound() {
        when(accessRepository.findByStudentIdAndLevel(student.getId(), "N5")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> learningAccessService.checkAccess(student.getId(), "N5"))
                .isInstanceOf(LearningJourneyAccessDeniedException.class);
    }

    @Test
    void checkAccess_ThrowsAccessExpired_WhenExpired() {
        StudentLearningAccess existingAccess = StudentLearningAccess.builder()
                .student(student)
                .level("N5")
                .accessExpireAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .status(StudentLearningAccess.AccessStatus.ACTIVE)
                .build();

        when(accessRepository.findByStudentIdAndLevel(student.getId(), "N5")).thenReturn(Optional.of(existingAccess));

        assertThatThrownBy(() -> learningAccessService.checkAccess(student.getId(), "N5"))
                .isInstanceOf(LearningJourneyAccessExpiredException.class);
    }

    @Test
    void checkAccess_DoesNotThrow_WhenActive() {
        StudentLearningAccess existingAccess = StudentLearningAccess.builder()
                .student(student)
                .level("N5")
                .accessExpireAt(Instant.now().plus(1, ChronoUnit.DAYS))
                .status(StudentLearningAccess.AccessStatus.ACTIVE)
                .build();

        when(accessRepository.findByStudentIdAndLevel(student.getId(), "N5")).thenReturn(Optional.of(existingAccess));

        learningAccessService.checkAccess(student.getId(), "N5");
        // No exception thrown
    }
}
