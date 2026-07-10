package com.midori.shadowing.controller;

import com.midori.common.ApiResponse;
import com.midori.entity.UserProfile;
import com.midori.repository.UserProfileRepository;
import com.midori.security.CustomUserDetails;
import com.midori.shadowing.ai.ShadowingAiService;
import com.midori.shadowing.dto.ShadowingGenerateResponse;
import com.midori.shadowing.service.ShadowingService;
import com.midori.shadowing.storage.ShadowingStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.UrlResource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student/shadowing")
@RequiredArgsConstructor
public class StudentShadowingController {

    private final ShadowingService shadowingService;
    private final ShadowingAiService shadowingAiService;
    private final UserProfileRepository userProfileRepository;
    private final com.midori.repository.UserRepository userRepository;
    private final ShadowingStorageService shadowingStorageService;

    /**
     * Get list of shadowing lessons filtered by student's JLPT level.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ShadowingGenerateResponse>>> getAllShadowing(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String userLevel = "N5";
        try {
            if (userDetails != null) {
                var user = userRepository.findByEmail(userDetails.getEmail()).orElse(null);
                if (user != null) {
                    var profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
                    if (profile != null && profile.getJlptLevel() != null && !profile.getJlptLevel().isBlank()) {
                        userLevel = profile.getJlptLevel();
                    }
                }
            }
        } catch (Exception e) {
            // Fallback to N5 on any error
        }
        List<ShadowingGenerateResponse> all = shadowingService.getAllLessons(null);
        final String finalUserLevel = userLevel;
        List<ShadowingGenerateResponse> filtered = all.stream()
                .filter(l -> finalUserLevel.equalsIgnoreCase(l.getJlptLevel()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(filtered));
    }

    /**
     * Get details of a single shadowing lesson by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShadowingGenerateResponse>> getShadowingById(@PathVariable UUID id) {
        ShadowingGenerateResponse response = shadowingService.getLessonById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Evaluate student recorded audio pronunciation.
     */
    @PostMapping("/evaluate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> evaluate(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam("expectedText") String expectedText,
            @RequestParam("duration") double duration) {
        
        try {
            File tempFile = File.createTempFile("shadowing_user_audio_", ".webm");
            audioFile.transferTo(tempFile);
            
            File mp3File = null;
            try {
                mp3File = shadowingAiService.extractAudio(tempFile, (long) duration);
                
                List<ShadowingAiService.WhisperSegment> segments = shadowingAiService.transcribeAudio(mp3File);
                String spokenText = segments.stream()
                        .map(ShadowingAiService.WhisperSegment::getText)
                        .collect(Collectors.joining(" "));
                
                Map<String, Object> result = shadowingAiService.evaluatePronunciation(expectedText, spokenText, duration);
                return ResponseEntity.ok(ApiResponse.success(result));
            } finally {
                if (tempFile.exists()) {
                    tempFile.delete();
                }
                if (mp3File != null && mp3File.exists() && mp3File.getName().endsWith(".mp3")) {
                    mp3File.delete();
                }
            }
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("pronunciation", 0);
            errorResult.put("pitchAccent", 0);
            errorResult.put("fluency", 0);
            errorResult.put("speed", 0);
            errorResult.put("overallScore", 0);
            errorResult.put("feedback", "Không thể phân tích giọng nói lúc này. Lỗi: " + e.getMessage());
            errorResult.put("strengths", new ArrayList<>());
            errorResult.put("improvements", new ArrayList<>());
            errorResult.put("advice", "Vui lòng thử lại.");
            errorResult.put("retries", 1);
            errorResult.put("speedRecommendation", "N/A");
            errorResult.put("incorrectWords", new ArrayList<>());
            errorResult.put("spokenText", "");
            try {
                errorResult.put("diff", shadowingAiService.computeDiff(expectedText, ""));
            } catch (Exception ignored) {
                errorResult.put("diff", new ArrayList<>());
            }
            return ResponseEntity.ok(ApiResponse.success(errorResult));
        }
    }

    /**
     * Stream a shadowing video for an authenticated student.
     * If a Supabase public URL is available, redirects the client to it
     * (zero backend bandwidth). Otherwise streams the locally-uploaded file
     * with HTTP range support.
     */
    @GetMapping("/video/{videoId}")
    public ResponseEntity<?> streamVideo(
            @PathVariable String videoId,
            @RequestHeader HttpHeaders headers) {
        String supabaseUrl = shadowingStorageService.getSupabaseUrl(videoId);
        if (supabaseUrl != null && !supabaseUrl.isBlank()) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header(HttpHeaders.LOCATION, supabaseUrl)
                    .build();
        }

        File file = shadowingStorageService.getVideoFile(videoId);
        if (file == null || !file.exists()) {
            return ResponseEntity.notFound().build();
        }

        try {
            UrlResource video = new UrlResource(file.toURI());
            long contentLength = video.contentLength();
            long chunkSize = 1024 * 1024L;
            List<HttpRange> ranges = headers.getRange();
            ResourceRegion region;
            if (!ranges.isEmpty()) {
                HttpRange range = ranges.get(0);
                long start = range.getRangeStart(contentLength);
                long end = range.getRangeEnd(contentLength);
                long rangeLength = Math.min(chunkSize, end - start + 1);
                region = new ResourceRegion(video, start, rangeLength);
            } else {
                region = new ResourceRegion(video, 0, Math.min(chunkSize, contentLength));
            }
            MediaType mediaType = MediaTypeFactory.getMediaType(video).orElse(MediaType.APPLICATION_OCTET_STREAM);
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentType(mediaType)
                    .body(region);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get AI-generated explanation for a word or phrase in context.
     */
    @PostMapping("/explain")
    public ResponseEntity<ApiResponse<Map<String, Object>>> explain(
            @RequestParam("text") String text,
            @RequestParam("sentence") String sentence) {
        Map<String, Object> explanation = shadowingAiService.explainText(text, sentence);
        return ResponseEntity.ok(ApiResponse.success(explanation));
    }
}
