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

    private long completedLessons;
    private long learnedWords;
    private long masteredWords;
    private long favoriteWords;
    private Integer progressPercent;
    private Integer learningStreak;
    private List<WeeklyStudyData> weeklyStudyData;
}
