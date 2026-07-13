package com.midori.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Service for storing video files to Supabase Storage.
 */
public interface VideoStorageService {

    /**
     * Store a video file to Supabase Storage.
     *
     * @param file     The multipart file to store
     * @param fileName The original filename
     * @return The public URL of the stored file
     */
    VideoStorageResult storeVideo(MultipartFile file, String fileName);

    /**
     * Result of video storage operation.
     */
    record VideoStorageResult(String publicUrl, String storagePath) {}
}
