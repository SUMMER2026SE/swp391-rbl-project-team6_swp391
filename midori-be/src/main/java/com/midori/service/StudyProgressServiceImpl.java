package com.midori.service;

import com.midori.dto.progress.ProgressResponse;
import com.midori.dto.progress.ProgressStatsResponse;
import com.midori.dto.progress.ProgressUpdateRequest;
import com.midori.dto.progress.StudentProgressResponse;
import com.midori.dto.progress.WeeklyStudyData;
import com.midori.entity.ClassEntity;
import com.midori.entity.ContentType;
import com.midori.entity.User;
import com.midori.entity.UserLearningProgress;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class StudyProgressServiceImpl implements StudyProgressService {

    private final UserLearningProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final StudentExamRepository studentExamRepository;
    private final ClassRepository classRepository;
    private final HomeworkRepository homeworkRepository;
    private final ExamRepository examRepository;

    // ============================================================
    // Upsert Helper
    // ============================================================

    private UserLearningProgress getOrCreate(UUID userId, ContentType contentType, String contentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        UserLearningProgress progress = progressRepository.findByUserIdAndContentTypeAndContentId(userId, contentType, contentId)
                .orElseGet(() -> UserLearningProgress.builder()
                        .user(user)
                        .contentType(contentType)
                        .contentId(contentId)
                        .learned(false)
                        .mastered(false)
                        .favorite(false)
                        .completed(false)
                        .progressPercent(0)
                        .build());
        return progress;
    }

    private ProgressResponse toResponse(UserLearningProgress progress) {
        return ProgressResponse.builder()
                .id(progress.getId())
                .contentType(progress.getContentType().name())
                .contentId(progress.getContentId())
                .learned(progress.getLearned())
                .mastered(progress.getMastered())
                .favorite(progress.getFavorite())
                .completed(progress.getCompleted())
                .progressPercent(progress.getProgressPercent())
                .viewCount(progress.getViewCount())
                .lastStudiedAt(progress.getLastStudiedAt())
                .createdAt(progress.getCreatedAt())
                .updatedAt(progress.getUpdatedAt())
                .build();
    }

    private UserLearningProgress applyUpdate(UserLearningProgress progress, ProgressUpdateRequest request) {
        if (request.getLearned() != null) {
            progress.setLearned(request.getLearned());
        }
        if (request.getMastered() != null) {
            progress.setMastered(request.getMastered());
        }
        if (request.getFavorite() != null) {
            progress.setFavorite(request.getFavorite());
        }
        if (request.getCompleted() != null) {
            progress.setCompleted(request.getCompleted());
        }
        if (request.getProgressPercent() != null) {
            int percent = Math.max(0, Math.min(100, request.getProgressPercent()));
            progress.setProgressPercent(percent);
        }
        progress.setLastStudiedAt(Instant.now());
        return progress;
    }

    // ============================================================
    // Progress List
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public List<ProgressResponse> getProgressList(UUID userId) {
        return progressRepository.findAllByUserIdOrdered(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProgressResponse> getProgressListByType(UUID userId, ContentType contentType) {
        return progressRepository.findAllByUserIdAndContentType(userId, contentType).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ============================================================
    // Upsert / Update
    // ============================================================

    @Override
    public ProgressResponse updateProgress(UUID userId, ContentType contentType, String contentId, ProgressUpdateRequest request) {
        UserLearningProgress progress = getOrCreate(userId, contentType, contentId);
        applyUpdate(progress, request);
        progress = progressRepository.save(progress);
        return toResponse(progress);
    }

    // ============================================================
    // Action Shortcuts
    // ============================================================

    @Override
    public ProgressResponse markAsLearned(UUID userId, ContentType contentType, String contentId) {
        UserLearningProgress progress = getOrCreate(userId, contentType, contentId);
        progress.setLearned(true);
        progress.setProgressPercent(Math.max(progress.getProgressPercent(), 50));
        progress.setLastStudiedAt(Instant.now());
        progress = progressRepository.save(progress);
        return toResponse(progress);
    }

    @Override
    public ProgressResponse unmarkAsLearned(UUID userId, ContentType contentType, String contentId) {
        UserLearningProgress progress = progressRepository.findByUserIdAndContentTypeAndContentId(userId, contentType, contentId)
                .orElse(null);
        if (progress == null) {
            return null;
        }
        progress.setLearned(false);
        progress.setMastered(false);
        progress.setProgressPercent(0);
        progress.setLastStudiedAt(Instant.now());
        progress = progressRepository.save(progress);
        return toResponse(progress);
    }

    @Override
    public ProgressResponse markAsMastered(UUID userId, ContentType contentType, String contentId) {
        UserLearningProgress progress = getOrCreate(userId, contentType, contentId);
        progress.setLearned(true);
        progress.setMastered(true);
        progress.setProgressPercent(100);
        progress.setLastStudiedAt(Instant.now());
        progress = progressRepository.save(progress);
        return toResponse(progress);
    }

    @Override
    public ProgressResponse unmarkAsMastered(UUID userId, ContentType contentType, String contentId) {
        UserLearningProgress progress = progressRepository.findByUserIdAndContentTypeAndContentId(userId, contentType, contentId)
                .orElse(null);
        if (progress == null) {
            return null;
        }
        progress.setMastered(false);
        progress.setLearned(true);
        progress.setProgressPercent(50);
        progress.setLastStudiedAt(Instant.now());
        progress = progressRepository.save(progress);
        return toResponse(progress);
    }

    @Override
    public ProgressResponse markAsFavorite(UUID userId, ContentType contentType, String contentId) {
        UserLearningProgress progress = getOrCreate(userId, contentType, contentId);
        boolean newValue = !Boolean.TRUE.equals(progress.getFavorite());
        progress.setFavorite(newValue);
        progress.setLastStudiedAt(Instant.now());
        progress = progressRepository.save(progress);
        return toResponse(progress);
    }

    @Override
    public ProgressResponse markAsCompleted(UUID userId, ContentType contentType, String contentId) {
        UserLearningProgress progress = getOrCreate(userId, contentType, contentId);
        progress.setCompleted(true);
        progress.setProgressPercent(Math.max(progress.getProgressPercent(), 100));
        progress.setLastStudiedAt(Instant.now());
        progress = progressRepository.save(progress);
        return toResponse(progress);
    }

    @Override
    public ProgressResponse unmarkAsCompleted(UUID userId, ContentType contentType, String contentId) {
        UserLearningProgress progress = progressRepository.findByUserIdAndContentTypeAndContentId(userId, contentType, contentId)
                .orElse(null);
        if (progress == null) {
            return null;
        }
        progress.setCompleted(false);
        progress.setProgressPercent(Math.max(progress.getProgressPercent(), 50));
        progress.setLastStudiedAt(Instant.now());
        progress = progressRepository.save(progress);
        return toResponse(progress);
    }

    @Override
    public ProgressResponse recordView(UUID userId, ContentType contentType, String contentId) {
        UserLearningProgress progress = getOrCreate(userId, contentType, contentId);
        progress.setViewCount(progress.getViewCount() + 1);
        progress.setLastStudiedAt(Instant.now());
        progress = progressRepository.save(progress);
        return toResponse(progress);
    }

    // ============================================================
    // Teacher: Student Progress View
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public StudentProgressResponse getStudentProgressForTeacher(UUID classId, UUID studentId, UUID teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", teacherId));
        
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));

        boolean isAdmin = teacher.getRole() == com.midori.entity.Role.ADMIN;
        if (!classEntity.getTeacher().getId().equals(teacherId) && !isAdmin) {
            throw new com.midori.exception.AccessDeniedException("You are not allowed to view progress for this class");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", studentId));

        String avatar = student.getProfile() != null ? student.getProfile().getAvatarUrl() : null;
        String fullName = student.getProfile() != null ? student.getProfile().getDisplayName() : null;
        String studentDisplayName = fullName != null ? fullName : student.getEmail().split("@")[0];

        long totalHomework = homeworkRepository.countByAssignedClassId(classId);
        long totalExams = examRepository.findByAssignedClassId(classId).size();

        // Count submitted homework (any status with submittedAt)
        List<com.midori.entity.HomeworkSubmission> submissions = homeworkSubmissionRepository.findByStudentId(studentId);
        long submittedHomework = submissions.stream()
                .filter(s -> s.getSubmittedAt() != null)
                .count();

        // Count completed exams
        List<com.midori.entity.StudentExam> studentExams = studentExamRepository.findByStudentId(studentId);
        long examsCompleted = studentExams.stream()
                .filter(e -> e.getSubmittedAt() != null)
                .count();

        // Calculate overall progress based on homework and exam submissions
        long totalItems = totalHomework + totalExams;
        long completedItems = submittedHomework + examsCompleted;
        Integer overallProgress = totalItems > 0 ? (int) ((completedItems * 100) / totalItems) : null;

        // Homework completed (graded)
        long homeworkCompleted = submissions.stream()
                .filter(s -> s.getStatus() == com.midori.entity.HomeworkSubmission.SubmissionStatus.GRADED)
                .count();

        // Calculate average score from all graded submissions and exams
        double totalScore = 0;
        int scoreCount = 0;

        // Homework scores
        for (com.midori.entity.HomeworkSubmission sub : submissions) {
            if (sub.getStatus() == com.midori.entity.HomeworkSubmission.SubmissionStatus.GRADED && sub.getScore() != null) {
                totalScore += sub.getScore();
                scoreCount++;
            }
        }

        // Exam scores
        for (com.midori.entity.StudentExam exam : studentExams) {
            if (exam.getPercentage() != null) {
                totalScore += exam.getPercentage();
                scoreCount++;
            }
        }

        double averageScore = scoreCount > 0 ? (totalScore / scoreCount) : 0;

        StudentProgressResponse.StudentInfo studentInfo = StudentProgressResponse.StudentInfo.builder()
                .id(student.getId().toString())
                .fullName(studentDisplayName)
                .email(student.getEmail())
                .avatar(avatar != null ? avatar : "")
                .className(classEntity.getName())
                .build();

        StudentProgressResponse.OverallProgress overallProgressData = StudentProgressResponse.OverallProgress.builder()
                .progressPercent(overallProgress)
                .build();

        StudentProgressResponse.LearningSummary learningSummary = StudentProgressResponse.LearningSummary.builder()
                .homeworkCompleted(homeworkCompleted)
                .totalHomework(totalHomework)
                .examsCompleted(examsCompleted)
                .totalExams(totalExams)
                .averageScore(Math.round(averageScore * 10.0) / 10.0)
                .build();

        List<StudentProgressResponse.RecentActivity> recentActivities = new ArrayList<>();

        for (com.midori.entity.HomeworkSubmission submission : submissions) {
            if (submission.getSubmittedAt() != null) {
                String timestamp = submission.getSubmittedAt().toString();
                if (submission.getSubmittedAt().atZone(ZoneOffset.UTC).toLocalDate().equals(LocalDate.now(ZoneOffset.UTC))) {
                    timestamp = "Today";
                } else {
                    timestamp = DateTimeFormatter.ofPattern("MMM d").format(submission.getSubmittedAt().atZone(ZoneOffset.UTC));
                }
                recentActivities.add(StudentProgressResponse.RecentActivity.builder()
                        .type("HOMEWORK")
                        .title("Completed " + submission.getHomework().getTitle())
                        .description(submission.getStatus() == com.midori.entity.HomeworkSubmission.SubmissionStatus.GRADED
                                ? "Graded: " + submission.getScore() + "/" + submission.getHomework().getMaxScore()
                                : "Pending grading")
                        .timestamp(timestamp)
                        .completedAt(submission.getSubmittedAt().toString())
                        .build());
            }
        }

        for (com.midori.entity.StudentExam exam : studentExams) {
            if (exam.getSubmittedAt() != null && exam.getExam() != null) {
                String timestamp = exam.getSubmittedAt().toString();
                if (exam.getSubmittedAt().atZone(ZoneOffset.UTC).toLocalDate().equals(LocalDate.now(ZoneOffset.UTC))) {
                    timestamp = "Today";
                } else {
                    timestamp = DateTimeFormatter.ofPattern("MMM d").format(exam.getSubmittedAt().atZone(ZoneOffset.UTC));
                }
                recentActivities.add(StudentProgressResponse.RecentActivity.builder()
                        .type("EXAM")
                        .title("Finished " + exam.getExam().getTitle())
                        .description(exam.getPercentage() != null
                                ? "Score: " + String.format("%.1f", exam.getPercentage()) + "%"
                                : "In progress")
                        .timestamp(timestamp)
                        .completedAt(exam.getSubmittedAt().toString())
                        .build());
            }
        }

        List<UserLearningProgress> progressList = progressRepository.findAllByUserIdOrdered(studentId);
        for (UserLearningProgress progress : progressList) {
            if (progress.getUpdatedAt() != null) {
                String timestamp = progress.getUpdatedAt().toString();
                if (progress.getUpdatedAt().atZone(ZoneOffset.UTC).toLocalDate().equals(LocalDate.now(ZoneOffset.UTC))) {
                    timestamp = "Today";
                } else {
                    timestamp = DateTimeFormatter.ofPattern("MMM d").format(progress.getUpdatedAt().atZone(ZoneOffset.UTC));
                }
                String contentTitle = progress.getContentType().name() + " - " + progress.getContentId();
                String description = progress.getCompleted() ? "Completed" :
                        progress.getMastered() ? "Mastered" :
                        progress.getLearned() ? "Learning" : "Started";
                recentActivities.add(StudentProgressResponse.RecentActivity.builder()
                        .type(progress.getContentType().name())
                        .title("Studied " + contentTitle)
                        .description(description)
                        .timestamp(timestamp)
                        .completedAt(progress.getUpdatedAt().toString())
                        .build());
            }
        }

        recentActivities.sort((a, b) -> {
            String t1 = a.getCompletedAt() != null ? a.getCompletedAt() : "";
            String t2 = b.getCompletedAt() != null ? b.getCompletedAt() : "";
            return t2.compareTo(t1);
        });

        if (recentActivities.size() > 5) {
            recentActivities = recentActivities.subList(0, 5);
        }

        return StudentProgressResponse.builder()
                .student(studentInfo)
                .overallProgress(overallProgressData)
                .learningSummary(learningSummary)
                .recentActivities(recentActivities)
                .studentId(student.getId().toString())
                .studentName(studentDisplayName)
                .studentEmail(student.getEmail())
                .avatarUrl(avatar != null ? avatar : "")
                .overallProgressVal(overallProgress)
                .homeworkCompleted(homeworkCompleted)
                .totalHomework(totalHomework)
                .examsCompleted(examsCompleted)
                .totalExams(totalExams)
                .averageScore(Math.round(averageScore * 10.0) / 10.0)
                .build();
    }

    // ============================================================
    // Stats
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public ProgressStatsResponse getProgressStats(UUID userId) {
        long learnedWords = progressRepository.countLearnedByUserId(userId);
        long masteredWords = progressRepository.countMasteredByUserId(userId);
        long favoriteWords = progressRepository.countFavoriteByUserId(userId);
        long completedLessons = progressRepository.countCompletedByUserId(userId);

        long vocabularyLearned = progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.VOCABULARY);
        long vocabularyMastered = progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.VOCABULARY);
        long vocabularyCompleted = progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.VOCABULARY);
        long vocabularyFavorite = progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.VOCABULARY);

        long grammarLearned = progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.GRAMMAR);
        long grammarMastered = progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.GRAMMAR);
        long grammarCompleted = progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.GRAMMAR);
        long grammarFavorite = progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.GRAMMAR);

        int overallPercent = 0;
        long totalItems = learnedWords;
        if (totalItems > 0) {
            overallPercent = (int) ((masteredWords * 100) / totalItems);
            overallPercent = Math.min(100, overallPercent);
        }

        List<UserLearningProgress> allProgress = progressRepository.findAllByUserIdOrdered(userId);
        int learningStreak = calculateStreak(allProgress);

        List<WeeklyStudyData> weeklyStudyData = buildWeeklyStudyData(allProgress);

        return ProgressStatsResponse.builder()
                .completedLessons(completedLessons)
                .learnedWords(learnedWords)
                .masteredWords(masteredWords)
                .favoriteWords(favoriteWords)
                .progressPercent(overallPercent)
                .learningStreak(learningStreak)
                .weeklyStudyData(weeklyStudyData)
                .vocabularyLearned(vocabularyLearned)
                .vocabularyMastered(vocabularyMastered)
                .vocabularyCompleted(vocabularyCompleted)
                .vocabularyFavorite(vocabularyFavorite)
                .grammarLearned(grammarLearned)
                .grammarMastered(grammarMastered)
                .grammarCompleted(grammarCompleted)
                .grammarFavorite(grammarFavorite)
                .build();
    }

    private int calculateStreak(List<UserLearningProgress> allProgress) {
        if (allProgress.isEmpty()) {
            return 0;
        }
        Instant now = Instant.now();
        LocalDate today = now.atZone(ZoneOffset.UTC).toLocalDate();

        List<LocalDate> studyDates = allProgress.stream()
                .map(p -> {
                    Instant studiedAt = p.getLastStudiedAt();
                    return studiedAt != null ? studiedAt : p.getUpdatedAt();
                })
                .filter(Objects::nonNull)
                .map(a -> a.atZone(ZoneOffset.UTC).toLocalDate())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        if (studyDates.isEmpty()) {
            return 0;
        }

        int streak = 0;
        LocalDate checkDate = today;

        for (int i = 0; i < 365; i++) {
            LocalDate dateToCheck = checkDate.minus(i, ChronoUnit.DAYS);
            boolean studiedOnDate = studyDates.stream()
                    .anyMatch(d -> d.equals(dateToCheck));
            if (studiedOnDate) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        return streak;
    }

    private List<WeeklyStudyData> buildWeeklyStudyData(List<UserLearningProgress> allProgress) {
        if (allProgress.isEmpty()) {
            return new ArrayList<>();
        }

        Instant now = Instant.now();
        LocalDate today = now.atZone(ZoneOffset.UTC).toLocalDate();
        String[] dayNames = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};

        List<WeeklyStudyData> result = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minus(i, ChronoUnit.DAYS);

            List<UserLearningProgress> entriesOnDay = allProgress.stream()
                    .filter(p -> {
                        Instant studiedAt = p.getLastStudiedAt();
                        Instant effectiveAt = studiedAt != null ? studiedAt : p.getUpdatedAt();
                        return effectiveAt != null && effectiveAt.atZone(ZoneOffset.UTC).toLocalDate().equals(date);
                    })
                    .collect(Collectors.toList());

            int totalCount = entriesOnDay.size();
            int vocabCount = (int) entriesOnDay.stream()
                    .filter(p -> p.getContentType() == ContentType.VOCABULARY)
                    .count();
            int grammarCount = (int) entriesOnDay.stream()
                    .filter(p -> p.getContentType() == ContentType.GRAMMAR)
                    .count();

            result.add(WeeklyStudyData.builder()
                    .day(dayNames[date.getDayOfWeek().getValue() % 7])
                    .count(totalCount)
                    .vocabCount(vocabCount)
                    .grammarCount(grammarCount)
                    .build());
        }
        return result;
    }
}
