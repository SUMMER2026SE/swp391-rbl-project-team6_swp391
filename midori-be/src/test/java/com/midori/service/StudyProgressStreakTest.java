package com.midori.service;

import com.midori.dto.progress.ProgressStatsResponse;
import com.midori.entity.ContentType;
import com.midori.entity.UserLearningProgress;
import com.midori.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudyProgressStreakTest {

    @Mock
    private UserLearningProgressRepository progressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HomeworkSubmissionRepository homeworkSubmissionRepository;

    @Mock
    private StudentExamRepository studentExamRepository;

    @Mock
    private ClassRepository classRepository;

    @Mock
    private HomeworkRepository homeworkRepository;

    @Mock
    private ExamRepository examRepository;

    @Mock
    private com.midori.repository.UserLoginHistoryRepository userLoginHistoryRepository;

    @InjectMocks
    private StudyProgressServiceImpl studyProgressService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Nested
    @DisplayName("Login History Streak Calculation Tests")
    class LoginHistoryStreakTests {

        @Test
        @DisplayName("No login history returns zero streak")
        void noLoginHistory_returnsZero() {
            when(progressRepository.countLearnedByUserId(userId)).thenReturn(0L);
            when(progressRepository.countMasteredByUserId(userId)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserId(userId)).thenReturn(0L);
            when(progressRepository.countCompletedByUserId(userId)).thenReturn(0L);
            when(progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(userLoginHistoryRepository.findLoginDatesByUserId(userId)).thenReturn(Collections.emptyList());
            when(progressRepository.findAllByUserIdOrdered(userId)).thenReturn(Collections.emptyList());

            ProgressStatsResponse response = studyProgressService.getProgressStats(userId);

            assertEquals(0, response.getLearningStreak());
        }

        @Test
        @DisplayName("Consecutive login dates count correctly")
        void consecutiveLoginDates_countCorrectly() {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);

            List<LocalDate> loginDates = List.of(
                    today,
                    today.minusDays(1),
                    today.minusDays(2),
                    today.minusDays(3),
                    today.minusDays(4)
            );

            when(progressRepository.countLearnedByUserId(userId)).thenReturn(0L);
            when(progressRepository.countMasteredByUserId(userId)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserId(userId)).thenReturn(0L);
            when(progressRepository.countCompletedByUserId(userId)).thenReturn(0L);
            when(progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(userLoginHistoryRepository.findLoginDatesByUserId(userId)).thenReturn(loginDates);
            when(progressRepository.findAllByUserIdOrdered(userId)).thenReturn(Collections.emptyList());

            ProgressStatsResponse response = studyProgressService.getProgressStats(userId);

            assertEquals(5, response.getLearningStreak());
        }

        @Test
        @DisplayName("Gap in login dates resets the streak")
        void gapResetsStreak() {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);

            List<LocalDate> loginDates = List.of(
                    today,
                    today.minusDays(1),
                    today.minusDays(2),
                    today.minusDays(5),
                    today.minusDays(6),
                    today.minusDays(7)
            );

            when(progressRepository.countLearnedByUserId(userId)).thenReturn(0L);
            when(progressRepository.countMasteredByUserId(userId)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserId(userId)).thenReturn(0L);
            when(progressRepository.countCompletedByUserId(userId)).thenReturn(0L);
            when(progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(userLoginHistoryRepository.findLoginDatesByUserId(userId)).thenReturn(loginDates);
            when(progressRepository.findAllByUserIdOrdered(userId)).thenReturn(Collections.emptyList());

            ProgressStatsResponse response = studyProgressService.getProgressStats(userId);

            assertEquals(3, response.getLearningStreak());
        }

        @Test
        @DisplayName("Duplicate logins on the same date count once")
        void duplicateLoginsCountOnce() {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);

            List<LocalDate> loginDatesWithDuplicates = List.of(
                    today,
                    today,
                    today,
                    today.minusDays(1),
                    today.minusDays(1),
                    today.minusDays(2)
            );

            when(progressRepository.countLearnedByUserId(userId)).thenReturn(0L);
            when(progressRepository.countMasteredByUserId(userId)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserId(userId)).thenReturn(0L);
            when(progressRepository.countCompletedByUserId(userId)).thenReturn(0L);
            when(progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(userLoginHistoryRepository.findLoginDatesByUserId(userId)).thenReturn(loginDatesWithDuplicates);
            when(progressRepository.findAllByUserIdOrdered(userId)).thenReturn(Collections.emptyList());

            ProgressStatsResponse response = studyProgressService.getProgressStats(userId);

            assertEquals(3, response.getLearningStreak());
        }

        @Test
        @DisplayName("If today has no login but yesterday does, streak starts from yesterday")
        void todayNoLogin_streakStartsFromYesterday() {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            LocalDate yesterday = today.minusDays(1);

            List<LocalDate> loginDates = List.of(
                    yesterday,
                    yesterday.minusDays(1),
                    yesterday.minusDays(2)
            );

            when(progressRepository.countLearnedByUserId(userId)).thenReturn(0L);
            when(progressRepository.countMasteredByUserId(userId)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserId(userId)).thenReturn(0L);
            when(progressRepository.countCompletedByUserId(userId)).thenReturn(0L);
            when(progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(userLoginHistoryRepository.findLoginDatesByUserId(userId)).thenReturn(loginDates);
            when(progressRepository.findAllByUserIdOrdered(userId)).thenReturn(Collections.emptyList());

            ProgressStatsResponse response = studyProgressService.getProgressStats(userId);

            assertEquals(3, response.getLearningStreak());
        }

        @Test
        @DisplayName("Single login today returns streak of 1")
        void singleLoginToday_returnsOne() {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);

            List<LocalDate> loginDates = List.of(today);

            when(progressRepository.countLearnedByUserId(userId)).thenReturn(0L);
            when(progressRepository.countMasteredByUserId(userId)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserId(userId)).thenReturn(0L);
            when(progressRepository.countCompletedByUserId(userId)).thenReturn(0L);
            when(progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.VOCABULARY)).thenReturn(0L);
            when(progressRepository.countLearnedByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countMasteredByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countCompletedByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(progressRepository.countFavoriteByUserIdAndContentType(userId, ContentType.GRAMMAR)).thenReturn(0L);
            when(userLoginHistoryRepository.findLoginDatesByUserId(userId)).thenReturn(loginDates);
            when(progressRepository.findAllByUserIdOrdered(userId)).thenReturn(Collections.emptyList());

            ProgressStatsResponse response = studyProgressService.getProgressStats(userId);

            assertEquals(1, response.getLearningStreak());
        }
    }
}
