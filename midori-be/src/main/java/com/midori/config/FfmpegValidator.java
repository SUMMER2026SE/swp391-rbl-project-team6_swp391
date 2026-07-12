package com.midori.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
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

    private final Environment environment;

    public FfmpegValidator(Environment environment) {
        this.environment = environment;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void validateFfmpeg() {
        List<String> missing = new ArrayList<>();
        String ffmpeg = resolve("FFMPEG_PATH", DEFAULT_FFMPEG, "ffmpeg.exe", missing);
        String ffprobe = resolve("FFPROBE_PATH", DEFAULT_FFPROBE, "ffprobe.exe", missing);

        if (!missing.isEmpty()) {
            StringBuilder message = new StringBuilder();
            message.append("FFmpeg is not configured or missing. Missing binaries: ");
            message.append(String.join(", ", missing));
            message.append(System.lineSeparator()).append(System.lineSeparator());
            message.append("Windows quick fix:").append(System.lineSeparator());
            message.append("1. Download FFmpeg from https://www.gyan.dev/ffmpeg/builds/").append(System.lineSeparator());
            message.append("2. Extract it into: midori-be/ffmpeg/").append(System.lineSeparator());
            message.append("3. The expected structure is:").append(System.lineSeparator());
            message.append("   midori-be/ffmpeg/bin/ffmpeg.exe").append(System.lineSeparator());
            message.append("   midori-be/ffmpeg/bin/ffprobe.exe").append(System.lineSeparator());
            message.append("4. Or set environment variables before starting the backend:").append(System.lineSeparator());
            message.append("   FFMPEG_PATH=<path-to-ffmpeg.exe>").append(System.lineSeparator());
            message.append("   FFPROBE_PATH=<path-to-ffprobe.exe>").append(System.lineSeparator());
            message.append("5. Run .\\scripts\\setup-ffmpeg.ps1 to validate installation.").append(System.lineSeparator());
            message.append(System.lineSeparator());
            message.append("Resolved paths:").append(System.lineSeparator());
            message.append("ffmpeg: ").append(ffmpeg).append(System.lineSeparator());
            message.append("ffprobe: ").append(ffprobe).append(System.lineSeparator());

            throw new IllegalStateException(message.toString());
        }

        log.info("FFmpeg resolved to {}", ffmpeg);
        log.info("FFprobe resolved to {}", ffprobe);
    }

    private String resolve(String envKey, String fallbackRelative, String expectedFileName, List<String> missing) {
        String envValue = environment.getProperty(envKey);
        if (envValue != null && !envValue.isBlank()) {
            Path envPath = Path.of(envValue.trim()).toAbsolutePath();
            if (isExecutable(envPath)) {
                return envPath.toString();
            }
        }

        Path fallback = Path.of(fallbackRelative).toAbsolutePath();
        if (!expectedFileName.equals(fallback.getFileName().toString()) || !isExecutable(fallback)) {
            missing.add(expectedFileName);
        }

        return fallback.toString();
    }

    private boolean isExecutable(Path path) {
        return Files.isRegularFile(path) && Files.isReadable(path);
    }
}
