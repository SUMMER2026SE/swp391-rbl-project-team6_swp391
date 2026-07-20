package com.midori.service.impl;

import com.midori.dto.response.AdminDashboardSummaryResponse;
import com.midori.dto.response.AdminRecentActivitiesResponse;
import com.midori.dto.response.AdminRecentActivitiesResponse.ActivityType;
import com.midori.dto.response.AdminRecentActivitiesResponse.RecentActivityEntry;
import com.midori.entity.*;
import com.midori.repository.*;
import com.midori.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final GrammarRepository grammarRepository;
    private final FlashcardSetRepository flashcardSetRepository;
    private final ListeningLessonRepository listeningLessonRepository;
    private final VocabularyLessonV2Repository vocabularyLessonRepository;
    private final UserLearningProgressRepository userLearningProgressRepository;
    private final ClassMembershipRepository classMembershipRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final StudentExamRepository studentExamRepository;
    private final NotificationRepository notificationRepository;
    private final ClassRepository classRepository;

    private static final int DEFAULT_LIMIT = 20;

    @Override
    public AdminDashboardSummaryResponse getSummary() {
        long totalUsers = userRepository.count();
        long totalTeachers = userRepository.countByRole(Role.TEACHER);
        long totalStudents = userRepository.countByRole(Role.STUDENT);
        long totalActiveUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long pendingTeachers = userRepository.countByRoleAndStatus(Role.TEACHER, UserStatus.PENDING_APPROVAL);

        long totalGrammar = grammarRepository.count();
        long pendingGrammar = grammarRepository.countByStatus(GrammarStatus.PENDING);
        long approvedGrammar = grammarRepository.countByStatus(GrammarStatus.APPROVED);

        long totalFlashcardSets = flashcardSetRepository.count();
        long pendingFlashcardSets = flashcardSetRepository.countByStatus(FlashcardSetStatus.PENDING);
        long approvedFlashcardSets = flashcardSetRepository.countByStatus(FlashcardSetStatus.APPROVED);

        long totalListeningLessons = listeningLessonRepository.count();
        long inactiveListeningLessons = listeningLessonRepository.countByIsActive(false);
        long activeListeningLessons = listeningLessonRepository.countByIsActive(true);

        long totalVocabularyLessons = vocabularyLessonRepository.count();
        long publishedVocabularyLessons = vocabularyLessonRepository.countByIsPublished(true);

        long pendingContent = pendingGrammar + pendingFlashcardSets + inactiveListeningLessons;
        long totalProgressRecords = userLearningProgressRepository.count();

        return AdminDashboardSummaryResponse.builder()
                .totalUsers(totalUsers)
                .totalStudents(totalStudents)
                .totalTeachers(totalTeachers)
                .totalActiveUsers(totalActiveUsers)
                .pendingTeachers(pendingTeachers)
                .pendingContent(pendingContent)
                .totalVocabularyLessons(totalVocabularyLessons)
                .totalGrammar(totalGrammar)
                .pendingGrammar(pendingGrammar)
                .approvedGrammar(approvedGrammar)
                .totalFlashcardSets(totalFlashcardSets)
                .totalListeningLessons(totalListeningLessons)
                .pendingFlashcardSets(pendingFlashcardSets)
                .approvedFlashcardSets(approvedFlashcardSets)
                .pendingListeningLessons(inactiveListeningLessons)
                .approvedListeningLessons(activeListeningLessons)
                .publishedVocabularyLessons(publishedVocabularyLessons)
                .totalProgressRecords(totalProgressRecords)
                .build();
    }

    @Override
    public AdminRecentActivitiesResponse getRecentActivities() {
        return getRecentActivities(DEFAULT_LIMIT);
    }

    @Override
    public AdminRecentActivitiesResponse getRecentActivities(int limit) {
        PageRequest pageRequest = PageRequest.of(0, limit);
        List<RecentActivityEntry> allActivities = new ArrayList<>();

        // 1. Student registrations
        List<User> recentStudents = userRepository.findRecentUsersByRole(Role.STUDENT, pageRequest);
        for (User student : recentStudents) {
            allActivities.add(RecentActivityEntry.builder()
                    .id("student-" + student.getId())
                    .type(ActivityType.STUDENT_REGISTERED)
                    .title("New student registered")
                    .detail(student.getEmail())
                    .timestamp(student.getCreatedAt())
                    .actorEmail(student.getEmail())
                    .entityId(student.getId().toString())
                    .build());
        }

        // 2. Teacher registrations
        List<User> recentTeachers = userRepository.findRecentUsersByRole(Role.TEACHER, pageRequest);
        for (User teacher : recentTeachers) {
            allActivities.add(RecentActivityEntry.builder()
                    .id("teacher-" + teacher.getId())
                    .type(ActivityType.TEACHER_REGISTERED)
                    .title("Teacher account created")
                    .detail(teacher.getEmail())
                    .timestamp(teacher.getCreatedAt())
                    .actorEmail(teacher.getEmail())
                    .entityId(teacher.getId().toString())
                    .build());
        }

        // 3. Class creations
        List<ClassEntity> recentClasses = classRepository.findRecentClasses(pageRequest);
        for (ClassEntity cls : recentClasses) {
            String teacherEmail = cls.getTeacher() != null ? cls.getTeacher().getEmail() : "Unknown";
            allActivities.add(RecentActivityEntry.builder()
                    .id("class-" + cls.getId())
                    .type(ActivityType.CLASS_CREATED)
                    .title("Class \"" + cls.getName() + "\" created")
                    .detail(cls.getLevel() + " · Teacher: " + teacherEmail)
                    .timestamp(cls.getCreatedAt())
                    .actorEmail(teacherEmail)
                    .entityId(cls.getId().toString())
                    .build());
        }

        // 4. Student enrollments in classes
        List<ClassMembership> recentEnrollments = classMembershipRepository.findRecentEnrollments(pageRequest);
        for (ClassMembership enrollment : recentEnrollments) {
            String studentEmail = enrollment.getStudent() != null ? enrollment.getStudent().getEmail() : "Unknown";
            String className = enrollment.getClassEntity() != null ? enrollment.getClassEntity().getName() : "Unknown class";
            allActivities.add(RecentActivityEntry.builder()
                    .id("enrollment-" + enrollment.getId())
                    .type(ActivityType.STUDENT_ENROLLED)
                    .title("Student joined class")
                    .detail(studentEmail + " joined \"" + className + "\"")
                    .timestamp(enrollment.getJoinedAt())
                    .actorEmail(studentEmail)
                    .entityId(enrollment.getId().toString())
                    .build());
        }

        // 5. Homework submissions
        List<HomeworkSubmission> recentSubmissions = homeworkSubmissionRepository.findRecentSubmissions(pageRequest);
        for (HomeworkSubmission submission : recentSubmissions) {
            String studentEmail = submission.getStudent() != null ? submission.getStudent().getEmail() : "Unknown";
            String homeworkTitle = submission.getHomework() != null ? submission.getHomework().getTitle() : "Unknown homework";
            String statusDetail = submission.getStatus() == HomeworkSubmission.SubmissionStatus.GRADED
                    ? "Graded: " + submission.getScore() + " pts"
                    : "Pending grading";
            allActivities.add(RecentActivityEntry.builder()
                    .id("hw-" + submission.getId())
                    .type(ActivityType.HOMEWORK_SUBMITTED)
                    .title("Homework submitted: " + homeworkTitle)
                    .detail(statusDetail + " by " + studentEmail)
                    .timestamp(submission.getSubmittedAt())
                    .actorEmail(studentEmail)
                    .entityId(submission.getId().toString())
                    .build());
        }

        // 6. Exam completions
        List<StudentExam> recentExams = studentExamRepository.findRecentCompletedExams(pageRequest);
        for (StudentExam exam : recentExams) {
            String studentEmail = exam.getStudent() != null ? exam.getStudent().getEmail() : "Unknown";
            String examTitle = exam.getExam() != null ? exam.getExam().getTitle() : "Unknown exam";
            String scoreDetail = exam.getPercentage() != null
                    ? "Score: " + String.format("%.1f", exam.getPercentage()) + "%"
                    : "Completed";
            allActivities.add(RecentActivityEntry.builder()
                    .id("exam-" + exam.getId())
                    .type(ActivityType.EXAM_COMPLETED)
                    .title("Exam completed: " + examTitle)
                    .detail(scoreDetail + " by " + studentEmail)
                    .timestamp(exam.getSubmittedAt())
                    .actorEmail(studentEmail)
                    .entityId(exam.getId().toString())
                    .build());
        }

        // 7. Notifications sent
        List<Notification> recentNotifications = notificationRepository.findRecentNotifications(pageRequest);
        Map<Long, Long> recipientCounts = new HashMap<>();
        List<Long> notificationIds = recentNotifications.stream()
                .map(Notification::getId)
                .toList();
        if (!notificationIds.isEmpty()) {
            notificationRepository.countRecipientsByNotificationIds(notificationIds)
                    .forEach(rc -> recipientCounts.put(rc.getId(), rc.getTotal()));
        }
        for (Notification notification : recentNotifications) {
            String recipientCount = recipientCounts.getOrDefault(notification.getId(), 0L) + " recipients";
            allActivities.add(RecentActivityEntry.builder()
                    .id("notif-" + notification.getId())
                    .type(ActivityType.NOTIFICATION_SENT)
                    .title("Notification sent: " + notification.getTitle())
                    .detail(notification.getType() + " · " + recipientCount)
                    .timestamp(notification.getCreatedAt())
                    .entityId(notification.getId().toString())
                    .build());
        }

        // Sort all activities by timestamp descending (most recent first)
        allActivities.sort((a, b) -> {
            Instant ta = a.getTimestamp() != null ? a.getTimestamp() : Instant.MIN;
            Instant tb = b.getTimestamp() != null ? b.getTimestamp() : Instant.MIN;
            return tb.compareTo(ta);
        });

        // Trim to limit
        List<RecentActivityEntry> trimmed = allActivities.size() > limit
                ? allActivities.subList(0, limit)
                : allActivities;

        return AdminRecentActivitiesResponse.builder()
                .activities(trimmed)
                .total(allActivities.size())
                .build();
    }
}
