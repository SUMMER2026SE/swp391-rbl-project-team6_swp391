package com.midori.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardSummaryResponse {

    private long totalUsers;
    private long totalStudents;
    private long totalTeachers;
    private long totalActiveUsers;
    private long activeClasses;
    private long learningCompletionRate;
    private long pendingTeachers;
    private long pendingContent;
    private long totalVocabularyLessons;
    private long totalGrammar;
    private long pendingGrammar;
    private long approvedGrammar;
    private long totalFlashcardSets;
    private long totalListeningLessons;
    private long pendingFlashcardSets;
    private long approvedFlashcardSets;
    private long pendingListeningLessons;
    private long approvedListeningLessons;
    private long publishedVocabularyLessons;
    private long totalProgressRecords;
}
