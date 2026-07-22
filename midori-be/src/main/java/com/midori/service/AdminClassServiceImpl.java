package com.midori.service;

import com.midori.dto.classdto.AdminClassResponse;
import com.midori.dto.classdto.StudentClassResponse;
import com.midori.dto.homeworkdto.HomeworkResponse;
import com.midori.dto.response.ExamResponse;
import com.midori.entity.ClassEntity;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ClassRepository;
import com.midori.repository.ExamRepository;
import com.midori.repository.HomeworkRepository;
import com.midori.repository.HomeworkSubmissionRepository;
import com.midori.repository.UserLearningProgressRepository;
import com.midori.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminClassServiceImpl implements AdminClassService {

    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final HomeworkRepository homeworkRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final UserLearningProgressRepository userLearningProgressRepository;
    private final ExamRepository examRepository;

    @Override
    public List<AdminClassResponse> getAdminClasses() {
        return classRepository.findAll().stream()
                .map(this::mapToAdminClassResponse)
                .toList();
    }

    @Override
    public AdminClassResponse getAdminClassById(UUID id) {
        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", id));
        return mapToAdminClassResponse(classEntity);
    }

    @Override
    public List<StudentClassResponse> getClassStudents(UUID classId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));

        // The number of homework assignments the class has is shared by every
        // student response; compute once to avoid a per-student query.
        long totalHomework = homeworkRepository.countByAssignedClassId(classId);
        // Same idea for exam count — currently unused by the FE tab but the
        // DTO exposes it, so we keep the value honest.
        long totalExams = examRepository.findByAssignedClassId(classId).size();

        List<StudentClassResponse> students = new ArrayList<>();
        if (classEntity.getStudents() != null) {
            for (User student : classEntity.getStudents()) {
                UUID studentId = student.getId();

                // Homework progress: how many of the class's homework
                // assignments the student has at least one submission on.
                // Distinct is important so multi-attempt homeworks are not
                // double-counted.
                long submittedHomework = totalHomework == 0
                        ? 0L
                        : homeworkSubmissionRepository.countDistinctSubmittedHomeworksByStudentAndClass(
                                studentId, classId);

                // Progress percent: portion of the class's homework that the
                // student has submitted at least once.
                Integer progressPercent = null;
                if (totalHomework > 0) {
                    progressPercent = (int) Math.round(
                            (submittedHomework * 100.0) / totalHomework);
                }

                // Average score across graded submissions inside this class.
                Double averageScore = homeworkSubmissionRepository
                        .averageScoreByStudentAndClass(studentId, classId);

                // "Last active" = latest of (latest submission, latest study
                // activity, account update). Null when nothing is recorded
                // and the FE renders "—".
                Instant lastSubmissionAt = homeworkSubmissionRepository
                        .latestSubmissionAtByStudentAndClass(studentId, classId);
                Instant lastStudiedAt = userLearningProgressRepository
                        .latestStudiedAtByUserId(studentId);
                Instant lastActivityAt = maxNullable(lastSubmissionAt, lastStudiedAt);
                if (lastActivityAt == null) {
                    lastActivityAt = student.getUpdatedAt();
                }

                StudentClassResponse response = StudentClassResponse.builder()
                        .studentId(studentId)
                        .fullName(getDisplayName(student))
                        .email(student.getEmail())
                        .avatar(student.getProfile() != null ? student.getProfile().getAvatarUrl() : null)
                        .status(student.getStatus())
                        .joinedAt(student.getCreatedAt())
                        .progressPercent(progressPercent)
                        .submittedHomework((int) submittedHomework)
                        .totalHomework((int) totalHomework)
                        .completedExams(0)
                        .totalExams((int) totalExams)
                        .averageScore(averageScore)
                        .lastActivityAt(lastActivityAt)
                        .build();
                students.add(response);
            }
        }
        return students;
    }

    @Override
    public List<HomeworkResponse> getClassHomeworks(UUID classId) {
        // Verify class exists
        if (!classRepository.existsById(classId)) {
            throw new ResourceNotFoundException("Class", "id", classId);
        }

        return homeworkRepository.findByAssignedClassIdOrderByCreatedAtDesc(classId).stream()
                .map(homework -> {
                    // Per-homework submission count and average score. The
                    // previous implementation reused the class-level homework
                    // count which produced a value equal to `homeworks.length`
                    // for every row, so the admin dashboard "submission
                    // coverage" math was always 100%. Use the dedicated
                    // submission repository so each homework reports its
                    // own real number.
                    int submissionCount = (int) homeworkSubmissionRepository
                            .countByHomeworkId(homework.getId());
                    Double averageScore = homeworkSubmissionRepository
                            .averageScoreByHomework(homework.getId());
                    return HomeworkResponse.builder()
                            .id(homework.getId())
                            .classId(classId)
                            .title(homework.getTitle())
                            .instructions(homework.getInstructions())
                            .dueDate(homework.getDueDate())
                            .maxScore(homework.getMaxScore())
                            .attempts(homework.getAttempts())
                            .status(homework.getStatus())
                            .createdAt(homework.getCreatedAt())
                            .updatedAt(homework.getUpdatedAt())
                            .totalQuestions(homework.getQuestions() != null ? homework.getQuestions().size() : 0)
                            .submissionCount(submissionCount)
                            .averageScore(averageScore)
                            .timeLimit(homework.getTimeLimit())
                            .build();
                })
                .toList();
    }

    @Override
    public List<ExamResponse> getClassExams(UUID classId) {
        // Verify class exists
        if (!classRepository.existsById(classId)) {
            throw new ResourceNotFoundException("Class", "id", classId);
        }
        
        return examRepository.findByAssignedClassId(classId).stream()
                .map(exam -> ExamResponse.builder()
                        .id(exam.getId())
                        .title(exam.getTitle())
                        .level(exam.getLevel() != null ? exam.getLevel().name() : null)
                        .totalQuestions(exam.getQuestions() != null ? exam.getQuestions().size() : 0)
                        .timeLimit(exam.getTimeLimit())
                        .examMode(exam.getExamMode() != null ? exam.getExamMode().name() : null)
                        .questionReuse(exam.getQuestionReuse() != null ? exam.getQuestionReuse().name() : null)
                        .randomizeAnswers(exam.getRandomizeAnswers())
                        .difficultyEasy(exam.getDifficultyEasy())
                        .difficultyMedium(exam.getDifficultyMedium())
                        .difficultyHard(exam.getDifficultyHard())
                        .status(exam.getStatus() != null ? exam.getStatus().name() : null)
                        .createdAt(exam.getCreatedAt())
                        .updatedAt(exam.getUpdatedAt())
                        .assignedClassId(classId)
                        .build())
                .toList();
    }

    private AdminClassResponse mapToAdminClassResponse(ClassEntity classEntity) {
        if (classEntity == null) return null;
        String teacherName = "";
        UUID teacherId = null;
        if (classEntity.getTeacher() != null) {
            teacherId = classEntity.getTeacher().getId();
            if (classEntity.getTeacher().getProfile() != null && classEntity.getTeacher().getProfile().getDisplayName() != null) {
                teacherName = classEntity.getTeacher().getProfile().getDisplayName();
            } else {
                teacherName = classEntity.getTeacher().getEmail();
            }
        }
        return AdminClassResponse.builder()
                .id(classEntity.getId())
                .name(classEntity.getName())
                .teacher(teacherName)
                .teacherId(teacherId)
                .level(classEntity.getLevel() != null ? classEntity.getLevel().name() : null)
                .students(classEntity.getStudents() != null ? classEntity.getStudents().size() : 0)
                .maxStudents(classEntity.getMaxStudents())
                .status(classEntity.getStatus())
                .createdAt(classEntity.getCreatedAt())
                .description(classEntity.getDescription())
                .classCode(classEntity.getClassCode())
                .build();
    }

    private String getDisplayName(User user) {
        if (user.getProfile() != null && user.getProfile().getDisplayName() != null) {
            return user.getProfile().getDisplayName();
        }
        return user.getEmail();
    }

    /**
     * Returns the later of two nullable {@link Instant}s. Returns null when
     * both inputs are null. Used to combine "latest submission" with
     * "latest learning activity" into a single "last activity" timestamp
     * for a student.
     */
    private Instant maxNullable(Instant a, Instant b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isAfter(b) ? a : b;
    }
}
