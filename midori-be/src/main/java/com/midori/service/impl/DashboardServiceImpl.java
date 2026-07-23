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
    private final TeacherStatusEventRepository teacherStatusEventRepository;
    private final ClassStatusEventRepository classStatusEventRepository;

    /**
     * Recent Activities card surfaces the 6 newest platform events. Anything
     * beyond the 6th row is dropped at the API layer so the FE does not have
     * to scroll inside a fixed-height card. The card sits at its own intrinsic
     * height (one row per activity) so the JLPT card on the same row is
     * never stretched by a long list. The constant lives here so the
     * controller default, the no-arg service overload, and any future
     * caller stay in lockstep.
     */
    private static final int DEFAULT_LIMIT = 6;

    @Override
    public AdminDashboardSummaryResponse getSummary() {
        List<Object[]> userStatsList = userRepository.getDashboardStats();
        Object[] userStats = userStatsList.isEmpty() ? new Object[]{0L, 0L, 0L, 0L, 0L} : userStatsList.get(0);
        long totalUsers = userStats[0] != null ? ((Number) userStats[0]).longValue() : 0L;
        long totalTeachers = userStats[1] != null ? ((Number) userStats[1]).longValue() : 0L;
        long totalStudents = userStats[2] != null ? ((Number) userStats[2]).longValue() : 0L;
        long totalActiveUsers = userStats[3] != null ? ((Number) userStats[3]).longValue() : 0L;
        long pendingTeachers = userStats[4] != null ? ((Number) userStats[4]).longValue() : 0L;

        List<Object[]> grammarStatsList = grammarRepository.getDashboardStats();
        Object[] grammarStats = grammarStatsList.isEmpty() ? new Object[]{0L, 0L, 0L} : grammarStatsList.get(0);
        long totalGrammar = grammarStats[0] != null ? ((Number) grammarStats[0]).longValue() : 0L;
        long pendingGrammar = grammarStats[1] != null ? ((Number) grammarStats[1]).longValue() : 0L;
        long approvedGrammar = grammarStats[2] != null ? ((Number) grammarStats[2]).longValue() : 0L;

        List<Object[]> flashcardStatsList = flashcardSetRepository.getDashboardStats();
        Object[] flashcardStats = flashcardStatsList.isEmpty() ? new Object[]{0L, 0L, 0L} : flashcardStatsList.get(0);
        long totalFlashcardSets = flashcardStats[0] != null ? ((Number) flashcardStats[0]).longValue() : 0L;
        long pendingFlashcardSets = flashcardStats[1] != null ? ((Number) flashcardStats[1]).longValue() : 0L;
        long approvedFlashcardSets = flashcardStats[2] != null ? ((Number) flashcardStats[2]).longValue() : 0L;

        List<Object[]> listeningStatsList = listeningLessonRepository.getDashboardStats();
        Object[] listeningStats = listeningStatsList.isEmpty() ? new Object[]{0L, 0L, 0L} : listeningStatsList.get(0);
        long totalListeningLessons = listeningStats[0] != null ? ((Number) listeningStats[0]).longValue() : 0L;
        long inactiveListeningLessons = listeningStats[1] != null ? ((Number) listeningStats[1]).longValue() : 0L;
        long activeListeningLessons = listeningStats[2] != null ? ((Number) listeningStats[2]).longValue() : 0L;

        List<Object[]> vocabStatsList = vocabularyLessonRepository.getDashboardStats();
        Object[] vocabStats = vocabStatsList.isEmpty() ? new Object[]{0L, 0L} : vocabStatsList.get(0);
        long totalVocabularyLessons = vocabStats[0] != null ? ((Number) vocabStats[0]).longValue() : 0L;
        long publishedVocabularyLessons = vocabStats[1] != null ? ((Number) vocabStats[1]).longValue() : 0L;

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

        // 1. Teacher status events (registered, approved, rejected)
        List<TeacherStatusEvent> teacherEvents = teacherStatusEventRepository.findRecentEvents(pageRequest);
        for (TeacherStatusEvent event : teacherEvents) {
            String teacherName = getDisplayName(event.getTeacher());
            String actorName = event.getPerformedBy() != null ? getDisplayName(event.getPerformedBy()) : "System";

            ActivityType activityType;
            String title;
            String detail;

            switch (event.getEventType()) {
                case REGISTERED:
                    activityType = ActivityType.TEACHER_REGISTERED;
                    title = "Teacher " + teacherName + " registered";
                    detail = "Waiting for approval";
                    break;
                case APPROVED:
                    activityType = ActivityType.TEACHER_APPROVED;
                    title = "Teacher " + teacherName + " was approved";
                    detail = "by " + actorName;
                    break;
                case REJECTED:
                    activityType = ActivityType.TEACHER_REJECTED;
                    title = "Teacher " + teacherName + " was rejected";
                    detail = "by " + actorName;
                    if (event.getReason() != null && !event.getReason().isBlank()) {
                        detail += ": " + event.getReason();
                    }
                    break;
                default:
                    continue;
            }

            allActivities.add(RecentActivityEntry.builder()
                    .id("teacher-event-" + event.getId())
                    .type(activityType)
                    .title(title)
                    .detail(detail)
                    .timestamp(event.getCreatedAt())
                    .actorEmail(event.getPerformedBy() != null ? event.getPerformedBy().getEmail() : null)
                    .entityId(event.getTeacher().getId().toString())
                    .build());
        }

        // 2. Class status events (created, archived, restored)
        List<ClassStatusEvent> classEvents = classStatusEventRepository.findRecentEvents(pageRequest);
        for (ClassStatusEvent event : classEvents) {
            String className = event.getClassEntity().getName();
            String actorName = getDisplayName(event.getPerformedBy());

            ActivityType activityType;
            String title;

            switch (event.getEventType()) {
                case CREATED:
                    activityType = ActivityType.CLASS_CREATED;
                    title = "Class \"" + className + "\" was created";
                    break;
                case ARCHIVED:
                    activityType = ActivityType.CLASS_ARCHIVED;
                    title = "Class \"" + className + "\" was archived";
                    break;
                case RESTORED:
                    activityType = ActivityType.CLASS_RESTORED;
                    title = "Class \"" + className + "\" was restored";
                    break;
                default:
                    continue;
            }

            allActivities.add(RecentActivityEntry.builder()
                    .id("class-event-" + event.getId())
                    .type(activityType)
                    .title(title)
                    .detail("by " + actorName)
                    .timestamp(event.getCreatedAt())
                    .actorEmail(event.getPerformedBy().getEmail())
                    .entityId(event.getClassEntity().getId().toString())
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

    private String getDisplayName(User user) {
        if (user == null) return "Unknown";
        if (user.getProfile() != null && user.getProfile().getDisplayName() != null) {
            return user.getProfile().getDisplayName();
        }
        return user.getEmail();
    }
}
