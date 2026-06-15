package com.midori.service;

import com.midori.dto.progress.ProgressResponse;
import com.midori.dto.progress.ProgressStatsResponse;
import com.midori.dto.progress.ProgressUpdateRequest;
import com.midori.entity.ContentType;

import java.util.List;
import java.util.UUID;

public interface StudyProgressService {

    // ===== Student: Progress list =====
    List<ProgressResponse> getProgressList(UUID userId);

    List<ProgressResponse> getProgressListByType(UUID userId, ContentType contentType);

    ProgressStatsResponse getProgressStats(UUID userId);

    // ===== Student: Upsert progress (create or update) =====
    ProgressResponse updateProgress(UUID userId, ContentType contentType, String contentId, ProgressUpdateRequest request);

    // ===== Student: Action shortcuts =====
    ProgressResponse markAsLearned(UUID userId, ContentType contentType, String contentId);

    ProgressResponse unmarkAsLearned(UUID userId, ContentType contentType, String contentId);

    ProgressResponse markAsMastered(UUID userId, ContentType contentType, String contentId);

    ProgressResponse unmarkAsMastered(UUID userId, ContentType contentType, String contentId);

    ProgressResponse markAsFavorite(UUID userId, ContentType contentType, String contentId);

    ProgressResponse markAsCompleted(UUID userId, ContentType contentType, String contentId);

    ProgressResponse unmarkAsCompleted(UUID userId, ContentType contentType, String contentId);

    ProgressResponse recordView(UUID userId, ContentType contentType, String contentId);
}
