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
public class StudentProgressResponse {

    // Existing fields for backward compatibility
    private StudentInfo student;
    private OverallProgress overallProgress;
    private LearningSummary learningSummary;
    private List<RecentActivity> recentActivities;

    // Requested fields (Direct/flat)
    private String studentId;
    private String studentName;
    private String studentEmail;
    private String avatarUrl;

    private Integer overallProgressVal;
    private Long homeworkCompleted;
    private Long totalHomework;
    private Long examsCompleted;
    private Long totalExams;
    private Double averageScore;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentInfo {
        private String id;
        private String fullName;
        private String email;
        private String avatar;
        private String className;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverallProgress {
        private Integer progressPercent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearningSummary {
        private Long homeworkCompleted;
        private Long totalHomework;
        private Long examsCompleted;
        private Long totalExams;
        private Double averageScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivity {
        private String type;
        private String title;
        private String description;
        private String timestamp;
        private String completedAt;
    }
}
