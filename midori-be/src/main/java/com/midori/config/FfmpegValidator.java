package com.midori.config;

import java.nio.file.Files;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class FfmpegValidator {

    private static final Logger log = LoggerFactory.getLogger(FfmpegValidator.class);
    private static final String DEFAULT_FFMPEG = "ffmpeg/bin/ffmpeg.exe";
    private static final String DEFAULT_FFPROBE = "ffmpeg/bin/ffprobe.exe";

    private volatile boolean ffmpegAvailable = false;
    private volatile boolean ffprobeAvailable = false;

    private final Environment environment;

    public FfmpegValidator(Environment environment) {
        this.environment = environment;
    }

    public boolean isFfmpegAvailable() {
        return ffmpegAvailable;
    }

    public boolean isFfprobeAvailable() {
        return ffprobeAvailable;
    }

    public boolean isFFmpegAvailable() {
        return ffmpegAvailable && ffprobeAvailable;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void validateFfmpeg() {
        String ffmpeg = resolve("FFMPEG_PATH", DEFAULT_FFMPEG, "ffmpeg.exe");
        String ffprobe = resolve("FFPROBE_PATH", DEFAULT_FFPROBE, "ffprobe.exe");

        ffmpegAvailable = checkExecutable(ffmpeg, "ffmpeg.exe");
        ffprobeAvailable = checkExecutable(ffprobe, "ffprobe.exe");

        if (!ffmpegAvailable || !ffprobeAvailable) {
            log.warn("=============================================================");
            log.warn("[FFmpegValidator] FFmpeg is not fully configured.");
            log.warn("Shadowing video processing will be disabled.");
            log.warn("");
            log.warn("To enable FFmpeg:");
            log.warn("1. Download FFmpeg from https://www.gyan.dev/ffmpeg/builds/");
            log.warn("2. Extract it into: midori-be/ffmpeg/");
            log.warn("3. Expected structure: midori-be/ffmpeg/bin/ffmpeg.exe");
            log.warn("   And: midori-be/ffmpeg/bin/ffprobe.exe");
            log.warn("4. Or set environment variables before starting the backend:");
            log.warn("   FFMPEG_PATH=<path-to-ffmpeg.exe>");
            log.warn("   FFPROBE_PATH=<path-to-ffprobe.exe>");
            log.warn("=============================================================");
        } else {
            log.info("[FFmpegValidator] FFmpeg resolved to {}", ffmpeg);
            log.info("[FFmpegValidator] FFprobe resolved to {}", ffprobe);
            log.info("[FFmpegValidator] FFmpeg is available. Shadowing video processing is enabled.");
        }
    }

    private String resolve(String envKey, String fallbackRelative, String expectedFileName) {
        String envValue = environment.getProperty(envKey);
        if (envValue != null && !envValue.isBlank()) {
            Path envPath = Path.of(envValue.trim()).toAbsolutePath();
            if (isExecutable(envPath)) {
                return envPath.toString();
            }
        }

        return Path.of(fallbackRelative).toAbsolutePath().toString();
    }

    private boolean checkExecutable(String path, String fileName) {
        Path p = Path.of(path);
        if (isExecutable(p)) {
            return true;
        }
        log.warn("[FFmpegValidator] {} not found at: {}", fileName, path);
        return false;
    }

    private boolean isExecutable(Path path) {
        return Files.isRegularFile(path) && Files.isReadable(path);
    }
}
