package com.midori.service;

import com.midori.dto.shadowing.*;

import java.util.List;
import java.util.UUID;

/**
 * Service for Shadowing Video operations.
 */
public interface ShadowingVideoService {

    /**
     * Upload a new shadowing video.
     * Stores the video file and creates a database record with status = PROCESSING.
     *
     * @param request The upload request containing title, description, and video file
     * @return Upload response with video details
     */
    ShadowingVideoUploadResponse uploadVideo(ShadowingVideoUploadRequest request);

    /**
     * Get all shadowing videos (admin view).
     *
     * @return List of all videos
     */
    List<ShadowingVideoUploadResponse> getAllVideos();

    /**
     * Get a shadowing video by ID (admin view).
     *
     * @param id The video ID
     * @return Video details
     */
    ShadowingVideoUploadResponse getVideoById(UUID id);

    /**
     * Delete a shadowing video by ID.
     *
     * @param id The video ID
     */
    void deleteVideo(UUID id);

    /**
     * Get the list of completed shadowing videos available for student practice.
     *
     * @return List of completed videos
     */
    List<ShadowingVideoSummaryResponse> getCompletedVideos();

    /**
     * Get video details for students.
     *
     * @param id The video ID
     * @return Video summary
     */
    ShadowingVideoSummaryResponse getVideoSummary(UUID id);

    /**
     * Get the full transcript (Japanese text + timestamps) for a video.
     *
     * @param id The video ID
     * @return Transcript with segments and timestamps
     */
    ShadowingTimestampsResponse getTimestamps(UUID id);

    /**
     * Get the Vietnamese translations for a video.
     *
     * @param id The video ID
     * @return Translation segments
     */
    ShadowingTranslationResponse getTranslation(UUID id);

    /**
     * Get the current AI processing status and logs for a video.
     *
     * @param id The video ID
     * @return Processing status with logs
     */
    ShadowingProcessingStatusResponse getProcessingStatus(UUID id);

    /**
     * Update shadowing video details, status, and transcript sentences.
     *
     * @param id The video ID
     * @param request The update details
     * @return Updated video details
     */
    ShadowingVideoUploadResponse updateVideo(UUID id, ShadowingVideoUpdateRequest request);
}
