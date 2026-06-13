package com.midori.dto.progress;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressStatsResponse {

    private Long completedLessons;
    private Long learnedWords;
    private Long masteredWords;
    private Long favoriteWords;
    private Integer progressPercent;
    private Integer learningStreak;
    private List<WeeklyStudyData> weeklyStudyData;

    private Long vocabularyLearned;
    private Long vocabularyMastered;
    private Long vocabularyCompleted;
    private Long vocabularyFavorite;

    private Long grammarLearned;
    private Long grammarMastered;
    private Long grammarCompleted;
    private Long grammarFavorite;
}
