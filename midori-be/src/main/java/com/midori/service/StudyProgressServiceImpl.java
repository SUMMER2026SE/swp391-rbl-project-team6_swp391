package com.midori.service;

import com.midori.dto.progress.ProgressResponse;
import com.midori.dto.progress.ProgressStatsResponse;
import com.midori.dto.progress.ProgressUpdateRequest;
import com.midori.dto.progress.WeeklyStudyData;
import com.midori.entity.ContentType;
import com.midori.entity.User;
import com.midori.entity.UserLearningProgress;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.UserLearningProgressRepository;
import com.midori.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class StudyProgressServiceImpl implements StudyProgressService {

    private final UserLearningProgressRepository progressRepository;
    private final UserRepository userRepository;

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

        int overallPercent = 0;
        long totalItems = learnedWords;
        if (totalItems > 0) {
            long masteredCount = progressRepository.countMasteredByUserId(userId);
            overallPercent = (int) ((masteredCount * 100) / totalItems);
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
                .build();
    }

    private int calculateStreak(List<UserLearningProgress> allProgress) {
        if (allProgress.isEmpty()) {
            return 0;
        }
        Instant now = Instant.now();
        LocalDate today = now.atZone(ZoneOffset.UTC).toLocalDate();

        List<LocalDate> studyDates = allProgress.stream()
                .filter(p -> p.getLastStudiedAt() != null)
                .map(p -> p.getLastStudiedAt().atZone(ZoneOffset.UTC).toLocalDate())
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
            final LocalDate targetDate = date;

            long count = allProgress.stream()
                    .filter(p -> p.getLastStudiedAt() != null)
                    .filter(p -> p.getLastStudiedAt().atZone(ZoneOffset.UTC).toLocalDate().equals(targetDate))
                    .count();

            result.add(WeeklyStudyData.builder()
                    .day(dayNames[date.getDayOfWeek().getValue() % 7])
                    .count((int) count)
                    .build());
        }
        return result;
    }
}
