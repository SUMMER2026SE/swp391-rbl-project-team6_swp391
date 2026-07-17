package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Generic file upload endpoint used by the Admin UI to attach
 * media files (e.g. listening item audio) to library records.
 *
 * <p>The endpoint delegates to {@link FileStorageService} which
 * persists the file to Supabase storage and returns a public URL.</p>
 */
@RestController
@RequestMapping("/api/admin/uploads")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
public class AdminUploadController {

    private final FileStorageService fileStorageService;

    /**
     * Upload a single audio file and return the resulting public URL.
     *
     * @param file the multipart audio file
     * @return ApiResponse wrapping the public URL of the uploaded asset
     */
    @PostMapping(value = "/audio")
    public ResponseEntity<ApiResponse<String>> uploadAudio(@RequestParam("file") MultipartFile file) {
        String url = fileStorageService.storeFile(file);
        return ResponseEntity.ok(ApiResponse.success("Audio uploaded successfully", url));
    }
}