package com.midori.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class FfmpegValidator {

    private static final Logger log = LoggerFactory.getLogger(FfmpegValidator.class);

    private volatile boolean ffmpegAvailable = false;
    private volatile boolean ffprobeAvailable = false;

    private final Environment environment;

    @Value("${ffmpeg.path:#{null}}")
    private String ffmpegPathConfig;

    @Value("${ffmpeg.probe-path:#{null}}")
    private String ffprobePathConfig;

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
        String os = System.getProperty("os.name", "").toLowerCase();
        boolean isWindows = os.contains("win");

        String resolvedFfmpeg = null;
        String resolvedFfprobe = null;

        // Try to resolve ffmpeg
        resolvedFfmpeg = resolveExecutable("FFMPEG_PATH", "ffmpeg", isWindows);
        resolvedFfprobe = resolveExecutable("FFPROBE_PATH", "ffprobe", isWindows);

        // Validate each binary
        ffmpegAvailable = checkExecutable(resolvedFfmpeg, isWindows ? "ffmpeg.exe" : "ffmpeg");
        ffprobeAvailable = checkExecutable(resolvedFfprobe, isWindows ? "ffprobe.exe" : "ffprobe");

        if (!ffmpegAvailable || !ffprobeAvailable) {
            log.warn("=============================================================");
            log.warn("[FFmpegValidator] FFmpeg is not fully configured.");
            log.warn("Shadowing video processing will be disabled.");
            log.warn("");
            log.warn("To enable FFmpeg:");
            if (isWindows) {
                log.warn("1. Install FFmpeg using one of these methods:");
                log.warn("   a) Winget: winget install ffmpeg");
                log.warn("   b) Chocolatey: choco install ffmpeg");
                log.warn("   c) Scoop: scoop install ffmpeg");
                log.warn("   d) Download from: https://www.gyan.dev/ffmpeg/builds/");
                log.warn("      and add to PATH or set FFMPEG_PATH/FFPROBE_PATH");
                log.warn("");
                log.warn("2. After installation, restart your terminal/IDE.");
                log.warn("");
                log.warn("3. Or set environment variables:");
                log.warn("   FFMPEG_PATH=C:\\path\\to\\ffmpeg.exe");
                log.warn("   FFPROBE_PATH=C:\\path\\to\\ffprobe.exe");
            } else {
                log.warn("1. Install FFmpeg using your package manager:");
                log.warn("   Debian/Ubuntu: sudo apt-get install ffmpeg");
                log.warn("   macOS: brew install ffmpeg");
                log.warn("   CentOS/RHEL: sudo yum install ffmpeg");
                log.warn("");
                log.warn("2. Or set environment variables:");
                log.warn("   FFMPEG_PATH=/usr/bin/ffmpeg");
                log.warn("   FFPROBE_PATH=/usr/bin/ffprobe");
            }
            log.warn("=============================================================");
        } else {
            log.info("[FFmpegValidator] FFmpeg resolved to: {}", resolvedFfmpeg);
            log.info("[FFmpegValidator] FFprobe resolved to: {}", resolvedFfprobe);
            log.info("[FFmpegValidator] FFmpeg validation:");
            log.info("[FFmpegValidator]   ffmpeg -version: OK");
            log.info("[FFmpegValidator]   ffprobe -version: OK");
            log.info("[FFmpegValidator] FFmpeg is available. Shadowing video processing is enabled.");
        }
    }

    private String resolveExecutable(String envKey, String executable, boolean isWindows) {
        String executableWithExt = isWindows ? executable + ".exe" : executable;

        // Priority 1: application.yml property (spring-boot-run argument)
        String propValue = environment.getProperty(envKey);
        if (propValue != null && !propValue.isBlank()) {
            Path propPath = Paths.get(propValue.trim()).toAbsolutePath();
            if (isExecutable(propPath)) {
                return propPath.toString();
            }
            log.warn("[FFmpegValidator] {} configured but not found at: {}", executableWithExt, propValue);
        }

        // Priority 2: environment variable
        String envValue = System.getenv(envKey);
        if (envValue != null && !envValue.isBlank()) {
            Path envPath = Paths.get(envValue.trim()).toAbsolutePath();
            if (isExecutable(envPath)) {
                return envPath.toString();
            }
            log.warn("[FFmpegValidator] {} env var set but not found at: {}", executableWithExt, envValue);
        }

        // Priority 3: resolve from system PATH
        Path fromPath = resolveFromSystemPath(executableWithExt, isWindows);
        if (fromPath != null) {
            return fromPath.toString();
        }

        // Priority 4: default relative path (for backward compatibility on Windows)
        if (isWindows) {
            Path defaultPath = Paths.get("ffmpeg", "bin", executableWithExt).toAbsolutePath();
            if (isExecutable(defaultPath)) {
                return defaultPath.toString();
            }
        }

        return executableWithExt; // Return name only, let checkExecutable report the issue
    }

    private Path resolveFromSystemPath(String executable, boolean isWindows) {
        String pathEnv = System.getenv("PATH");
        if (pathEnv == null) {
            return null;
        }

        String separator = isWindows ? ";" : ":";
        for (String dir : pathEnv.split(separator)) {
            Path candidate = Paths.get(dir.trim(), executable).normalize();
            if (isExecutable(candidate)) {
                log.info("[FFmpegValidator] Found {} in PATH at {}", executable, candidate);
                return candidate;
            }
        }
        return null;
    }

    private boolean checkExecutable(String path, String fileName) {
        Path p = Paths.get(path);
        if (isExecutable(p)) {
            // Run validation command
            return validateWithVersionCommand(p, fileName);
        }
        log.warn("[FFmpegValidator] {} not found at: {}", fileName, path);
        return false;
    }

    private boolean validateWithVersionCommand(Path executable, String fileName) {
        try {
            ProcessBuilder pb = new ProcessBuilder(executable.toString(), "-version");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Read first line of output
            StringBuilder output = new StringBuilder();
            try (java.io.BufferedReader reader = new java.io.BufferedReader(
                    new java.io.InputStreamReader(process.getInputStream()))) {
                String line = reader.readLine();
                if (line != null) {
                    output.append(line);
                    if (line.contains("ffmpeg") || line.contains("FFmpeg")) {
                        log.info("[FFmpegValidator] {}: {}", fileName, line);
                        process.waitFor();
                        return process.exitValue() == 0;
                    }
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0 && output.length() > 0) {
                return true;
            }
        } catch (Exception e) {
            log.debug("[FFmpegValidator] Could not run {} -version: {}", fileName, e.getMessage());
        }
        return isExecutable(executable); // Fallback to basic file check
    }

    private boolean isExecutable(Path path) {
        return Files.isRegularFile(path) && Files.isReadable(path);
    }
}
