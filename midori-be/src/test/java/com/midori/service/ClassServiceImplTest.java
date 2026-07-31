package com.midori.service;

import com.midori.entity.ClassEntity;
import com.midori.entity.User;
import com.midori.repository.ClassRepository;
import com.midori.repository.UserRepository;
import com.midori.service.ClassServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClassServiceImplTest {

    @Mock
    private ClassRepository classRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.midori.repository.ClassMembershipRepository classMembershipRepository;

    @Mock
    private com.midori.repository.HomeworkRepository homeworkRepository;

    @Mock
    private com.midori.repository.ExamRepository examRepository;

    @Mock
    private com.midori.repository.StudentExamRepository studentExamRepository;

    @Mock
    private com.midori.repository.HomeworkSubmissionRepository homeworkSubmissionRepository;

    @Mock
    private com.midori.repository.ClassStatusEventRepository classStatusEventRepository;

    @Mock
    private LearningAccessService learningAccessService;

    @InjectMocks
    private ClassServiceImpl classService;

    private User student;
    private User teacher;
    private ClassEntity classEntity;
    private UUID studentId;
    private UUID classId;
    private UUID teacherId;

    @BeforeEach
    void setUp() {
        studentId = UUID.randomUUID();
        classId = UUID.randomUUID();
        teacherId = UUID.randomUUID();

        student = User.builder().id(studentId).role(com.midori.entity.Role.STUDENT).email("test@test.com").build();
        teacher = User.builder().id(teacherId).role(com.midori.entity.Role.TEACHER).build();
        classEntity = ClassEntity.builder()
                .id(classId)
                .status(ClassEntity.ClassStatus.ACTIVE)
                .teacher(teacher)
                .maxStudents(30)
                .students(new java.util.ArrayList<>())
                .build();
    }

    @Test
    void addStudentToClass_GrantsLearningAccess() {
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(student));
        when(classRepository.findById(classId)).thenReturn(Optional.of(classEntity));

        classService.addStudentToClass(classId, "test@test.com", teacherId);

        verify(learningAccessService).grantOrExtendAccess(student, classEntity);
    }
}
