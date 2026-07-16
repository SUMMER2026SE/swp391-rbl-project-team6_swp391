package com.midori.service.impl;

import com.midori.dto.response.AdminDashboardSummaryResponse;
import com.midori.dto.response.JlptDistributionResponse;
import com.midori.dto.response.RecentActivitiesResponse;
import com.midori.entity.ClassEntity;
import com.midori.entity.Exam;
import com.midori.entity.FlashcardSet;
import com.midori.entity.Grammar;
import com.midori.entity.GrammarLevel;
import com.midori.entity.GrammarStatus;
import com.midori.entity.Notification;
import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
import com.midori.repository.ClassRepository;
import com.midori.repository.ExamRepository;
import com.midori.repository.FlashcardSetRepository;
import com.midori.repository.GrammarRepository;
import com.midori.repository.ListeningLessonRepository;
import com.midori.repository.NotificationRepository;
import com.midori.repository.UserLearningProgressRepository;
import com.midori.repository.UserRepository;
import com.midori.repository.VocabularyLessonRepository;
import com.midori.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private static final int RECENT_PER_SOURCE = 5;
    private static final List<String> JLPT_LEVELS = List.of("N5", "N4", "N3", "N2", "N1");

    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final GrammarRepository grammarRepository;
    private final FlashcardSetRepository flashcardSetRepository;
    private final ListeningLessonRepository listeningLessonRepository;
    private final VocabularyLessonRepository vocabularyLessonRepository;
    private final UserLearningProgressRepository userLearningProgressRepository;
    private final NotificationRepository notificationRepository;
    private final ExamRepository examRepository;

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
        long pendingFlashcardSets = flashcardSetRepository.countByStatus(com.midori.entity.FlashcardSetStatus.PENDING);
        long approvedFlashcardSets = flashcardSetRepository.countByStatus(com.midori.entity.FlashcardSetStatus.APPROVED);

        long totalListeningLessons = listeningLessonRepository.count();
        long inactiveListeningLessons = listeningLessonRepository.countByIsActive(false);
        long activeListeningLessons = listeningLessonRepository.countByIsActive(true);

        long totalVocabularyLessons = vocabularyLessonRepository.count();
        long publishedVocabularyLessons = vocabularyLessonRepository.countByIsPublished(true);

        long pendingContent = pendingGrammar + pendingFlashcardSets + inactiveListeningLessons;
        long totalProgressRecords = userLearningProgressRepository.count();

        long activeClasses = classRepository.findByStatus(ClassEntity.ClassStatus.ACTIVE).size();

        long learningCompletionRate = 0;
        if (totalProgressRecords > 0) {
            long completedProgress = userLearningProgressRepository.countByCompletedTrueJpql();
            learningCompletionRate = Math.round((completedProgress * 100.0) / totalProgressRecords);
        }

        return AdminDashboardSummaryResponse.builder()
                .totalUsers(totalUsers)
                .totalStudents(totalStudents)
                .totalTeachers(totalTeachers)
                .totalActiveUsers(totalActiveUsers)
                .activeClasses(activeClasses)
                .learningCompletionRate(learningCompletionRate)
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
    public JlptDistributionResponse getJlptDistribution() {
        long totalClasses = classRepository.count();

        List<JlptDistributionResponse.JlptLevelCount> levels = new ArrayList<>();
        for (String level : JLPT_LEVELS) {
            long count = 0;
            try {
                count = classRepository.findByLevel(GrammarLevel.valueOf(level)).size();
            } catch (IllegalArgumentException ignored) {
                count = 0;
            }
            double percentage = totalClasses == 0 ? 0.0 : Math.round((count * 10000.0) / totalClasses) / 100.0;
            levels.add(JlptDistributionResponse.JlptLevelCount.builder()
                    .level(level)
                    .count(count)
                    .percentage(percentage)
                    .build());
        }

        return JlptDistributionResponse.builder()
                .totalClasses(totalClasses)
                .levels(levels)
                .build();
    }

    @Override
    public RecentActivitiesResponse getRecentActivities(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));

        List<RecentActivitiesResponse.RecentActivity> activities = new ArrayList<>();

        // 1. Recently created classes — "Teacher tạo lớp"
        for (ClassEntity c : classRepository.findRecent(PageRequest.of(0, RECENT_PER_SOURCE))) {
            String teacherEmail = c.getTeacher() != null ? c.getTeacher().getEmail() : "Teacher";
            activities.add(RecentActivitiesResponse.RecentActivity.builder()
                    .id("class:" + c.getId())
                    .type("class")
                    .action("Teacher created class by " + teacherEmail)
                    .detail("Created class \"" + c.getName() + "\"")
                    .actor(teacherEmail)
                    .timestamp(c.getCreatedAt())
                    .build());
        }

        // 2. Recently created exams — "Exam được tạo"
        for (Exam e : examRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, RECENT_PER_SOURCE))) {
            String creator = e.getCreatedBy() != null ? e.getCreatedBy().getEmail() : "Teacher";
            activities.add(RecentActivitiesResponse.RecentActivity.builder()
                    .id("exam:" + e.getId())
                    .type("exam")
                    .action("Exam created")
                    .detail(e.getTitle())
                    .actor(creator)
                    .timestamp(e.getCreatedAt())
                    .build());
        }

        // 3. Recently created notifications — "Notification được gửi"
        for (Notification n : notificationRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, RECENT_PER_SOURCE))) {
            activities.add(RecentActivitiesResponse.RecentActivity.builder()
                    .id("notification:" + n.getId())
                    .type("notification")
                    .action("Notification sent")
                    .detail(n.getTitle())
                    .actor("System")
                    .timestamp(n.getCreatedAt())
                    .build());
        }

        // 4. Recently created grammars (pending) — "Teacher uploaded content"
        for (Grammar g : grammarRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, RECENT_PER_SOURCE))) {
            if (g.getStatus() != GrammarStatus.PENDING) {
                continue;
            }
            String creator = g.getCreatedBy() != null ? g.getCreatedBy().getEmail() : "Teacher";
            activities.add(RecentActivitiesResponse.RecentActivity.builder()
                    .id("grammar:" + g.getId())
                    .type("content")
                    .action("Teacher uploaded content")
                    .detail(g.getTitle())
                    .actor(creator)
                    .timestamp(g.getCreatedAt())
                    .build());
        }

        // 5. Recently created flashcard sets (pending) — "Teacher uploaded content"
        for (FlashcardSet fs : flashcardSetRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, RECENT_PER_SOURCE))) {
            if (fs.getStatus() != com.midori.entity.FlashcardSetStatus.PENDING) {
                continue;
            }
            String creator = fs.getTeacher() != null ? fs.getTeacher().getEmail() : "Teacher";
            activities.add(RecentActivitiesResponse.RecentActivity.builder()
                    .id("flashcard:" + fs.getId())
                    .type("content")
                    .action("Teacher uploaded flashcard set")
                    .detail(fs.getTitle())
                    .actor(creator)
                    .timestamp(fs.getCreatedAt())
                    .build());
        }

        // 6. Recently approved teachers — "Teacher được approve"
        List<User> recentlyApproved = userRepository.findAll(PageRequest.of(
                0,
                RECENT_PER_SOURCE,
                Sort.by(Sort.Direction.DESC, "updatedAt"))).getContent();
        for (User u : recentlyApproved) {
            if (u.getRole() == Role.TEACHER && u.getStatus() == UserStatus.ACTIVE) {
                String name = Optional.ofNullable(u.getProfile())
                        .map(p -> p.getDisplayName())
                        .orElse(u.getEmail());
                activities.add(RecentActivitiesResponse.RecentActivity.builder()
                        .id("teacher_approved:" + u.getId())
                        .type("teacher")
                        .action("Teacher approved")
                        .detail(name)
                        .actor("Admin")
                        .timestamp(u.getUpdatedAt())
                        .build());
            }
        }

        // 7. Recently enrolled students — "Student đăng ký"
        List<User> recentlyRegistered = userRepository.findAll(PageRequest.of(
                0,
                RECENT_PER_SOURCE,
                Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
        for (User u : recentlyRegistered) {
            if (u.getRole() == Role.STUDENT) {
                String name = Optional.ofNullable(u.getProfile())
                        .map(p -> p.getDisplayName())
                        .orElse(u.getEmail());
                activities.add(RecentActivitiesResponse.RecentActivity.builder()
                        .id("student_joined:" + u.getId())
                        .type("student")
                        .action("New student registered")
                        .detail(name)
                        .actor(name)
                        .timestamp(u.getCreatedAt())
                        .build());
            }
        }

        activities.sort(Comparator.comparing(
                RecentActivitiesResponse.RecentActivity::getTimestamp,
                Comparator.nullsLast(Comparator.reverseOrder())));

        List<RecentActivitiesResponse.RecentActivity> top = activities.size() > safeLimit
                ? activities.subList(0, safeLimit)
                : activities;

        return RecentActivitiesResponse.builder()
                .activities(top)
                .build();
    }
}
