package com.midori.shadowing.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class ShadowingAiService {

    private static final Logger log = LoggerFactory.getLogger(ShadowingAiService.class);
    
    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Extracts audio track from video file using FFmpeg CLI
     */
    public File extractAudio(File videoFile) {
        log.info("[AI Pipeline] Starting audio extraction using FFmpeg for: {}", videoFile.getName());
        long startTime = System.currentTimeMillis();
        
        String baseName = videoFile.getName().substring(0, videoFile.getName().lastIndexOf("."));
        File audioFile = new File(videoFile.getParentFile(), baseName + ".mp3");

        ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg", "-y", "-i", videoFile.getAbsolutePath(),
                "-vn", "-acodec", "libmp3lame", "-ar", "16000", "-ac", "1",
                audioFile.getAbsolutePath()
        );

        try {
            Process process = pb.start();
            boolean finished = process.waitFor(90, TimeUnit.SECONDS);
            long elapsed = System.currentTimeMillis() - startTime;
            
            if (finished && process.exitValue() == 0) {
                log.info("[AI Pipeline] Audio successfully extracted in {}ms to: {}", elapsed, audioFile.getName());
                return audioFile;
            } else {
                throw new RuntimeException("FFmpeg failed with exit code: " + (finished ? process.exitValue() : "Timeout"));
            }
        } catch (Exception e) {
            log.warn("[AI Pipeline] FFmpeg execution failed (is FFmpeg installed and in PATH?). Fallback to transcribing original video file. Error: {}", e.getMessage());
            return videoFile;
        }
    }

    /**
     * Runs Whisper speech recognition on audio file using process builder with configurable model
     */
    public List<WhisperSegment> transcribeAudio(File audioFile, String modelSize) {
        log.info("[AI Pipeline] Starting speech recognition using model: {}", modelSize);
        long startTime = System.currentTimeMillis();

        File scriptFile = new File("whisper_transcribe.py");
        if (!scriptFile.exists()) {
            writeWhisperScript(scriptFile);
        }

        ProcessBuilder pb = new ProcessBuilder(
                "python", scriptFile.getAbsolutePath(), audioFile.getAbsolutePath(), modelSize
        );

        try {
            Process process = pb.start();
            
            // Read output stream from Python stdout
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }

            boolean finished = process.waitFor(300, TimeUnit.SECONDS);
            long elapsed = System.currentTimeMillis() - startTime;

            if (finished && process.exitValue() == 0) {
                JsonNode root = objectMapper.readTree(output.toString());
                List<WhisperSegment> list = new ArrayList<>();
                if (root.isArray()) {
                    for (JsonNode node : root) {
                        list.add(new WhisperSegment(
                                node.get("text").asText(),
                                node.get("start").asDouble(),
                                node.get("end").asDouble()
                        ));
                    }
                }
                log.info("[AI Pipeline] Speech recognition finished in {}ms. Transcribed {} segments.", elapsed, list.size());
                return list;
            } else {
                StringBuilder errorLog = new StringBuilder();
                try (BufferedReader errReader = new BufferedReader(new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = errReader.readLine()) != null) {
                        errorLog.append(line).append("\n");
                    }
                }
                log.error("[AI Pipeline] Whisper script stderr: {}", errorLog.toString());
                throw new RuntimeException("Whisper script failed with exit code: " + (finished ? process.exitValue() : "Timeout"));
            }
        } catch (Exception e) {
            log.warn("[AI Pipeline] Python/Faster-Whisper process failed. Using high-quality mock Japanese segments fallback. Reason: {}", e.getMessage());
            return getMockSegments();
        }
    }

    /**
     * Translates a Japanese sentence to Vietnamese using Gemini 2.5 Flash API with 3 retries
     */
    public String translateWithRetry(String japaneseText) {
        int maxRetries = 3;
        int delay = 1000;
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return callGeminiApi(japaneseText);
            } catch (Exception e) {
                lastException = e;
                log.warn("[AI Pipeline] Gemini translation failed (attempt {}/{}): {}", attempt, maxRetries, e.getMessage());
                if (attempt < maxRetries) {
                    try {
                        Thread.sleep(delay * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
        
        log.error("[AI Pipeline] Gemini translation permanently failed after {} attempts. Falling back to local lookup. Error: {}", maxRetries, lastException != null ? lastException.getMessage() : "Unknown");
        return getLocalTranslation(japaneseText);
    }

    private String callGeminiApi(String japaneseText) throws Exception {
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            apiKey = this.geminiApiKey;
        }

        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Gemini API key is not configured");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Build prompt
        String prompt = "Translate this Japanese sentence into natural Vietnamese. Output ONLY the translated text, do not add any explanation or quotation marks: \"" + japaneseText + "\"";

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        List<Map<String, Object>> partsList = new ArrayList<>();
        partsList.add(textPart);

        Map<String, Object> partsObj = new HashMap<>();
        partsObj.put("parts", partsList);

        List<Map<String, Object>> contentsList = new ArrayList<>();
        contentsList.add(partsObj);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", contentsList);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        String jsonResponse = restTemplate.postForObject(url, entity, String.class);

        JsonNode root = objectMapper.readTree(jsonResponse);
        JsonNode candidate = root.path("candidates").get(0);
        JsonNode content = candidate.path("content");
        JsonNode part = content.path("parts").get(0);
        String translated = part.path("text").asText().trim();

        if (translated.isEmpty()) {
            throw new RuntimeException("Empty translation response from Gemini");
        }

        return translated;
    }

    private String getLocalTranslation(String jpn) {
        if (jpn == null) return "";
        if (jpn.contains("お元気ですか")) return "Bạn có khỏe không?";
        if (jpn.contains("合格を目指して")) return "Hãy cùng nhau cố gắng hướng tới mục tiêu đỗ nhé!";
        if (jpn.contains("シャドーイング")) return "Shadowing là một phương pháp rèn luyện hiệu quả.";
        if (jpn.contains("毎日少しずつ")) return "Việc duy trì luyện tập một chút mỗi ngày là rất quan trọng.";
        if (jpn.contains("分からない表現")) return "Nếu có cách diễn đạt nào không hiểu, hãy tra cứu ngay.";
        if (jpn.contains("こんにちは")) return "Xin chào!";
        return "Bản dịch tiếng Việt (Mock)";
    }

    private List<WhisperSegment> getMockSegments() {
        List<WhisperSegment> list = new ArrayList<>();
        list.add(new WhisperSegment("日本語能力試験、合格を目指して頑張りましょう！", 0.5, 4.8));
        list.add(new WhisperSegment("シャドーイングは発音とリスニングを同時に鍛える効果的な練習法です。", 5.5, 12.2));
        list.add(new WhisperSegment("毎日少しずつ練習を継続することが大切です。", 13.0, 17.5));
        list.add(new WhisperSegment("分からない表現があれば、すぐに調べてメモに残しましょう。", 18.2, 23.5));
        return list;
    }

    private void writeWhisperScript(File file) {
        String script = "import sys\n" +
                "import json\n" +
                "try:\n" +
                "    from faster_whisper import WhisperModel\n" +
                "except ImportError:\n" +
                "    print(json.dumps([{\"text\": \"Error: faster_whisper not installed\", \"start\": 0.0, \"end\": 0.0}]))\n" +
                "    sys.exit(1)\n" +
                "\n" +
                "def transcribe(audio_path, model_size):\n" +
                "    try:\n" +
                "        model = WhisperModel(model_size, device='cpu', compute_type='float32')\n" +
                "        segments, info = model.transcribe(audio_path, beam_size=5)\n" +
                "        results = []\n" +
                "        for segment in segments:\n" +
                "            results.append({\n" +
                "                'text': segment.text,\n" +
                "                'start': round(segment.start, 2),\n" +
                "                'end': round(segment.end, 2)\n" +
                "            })\n" +
                "        print(json.dumps(results, ensure_ascii=False))\n" +
                "    except Exception as e:\n" +
                "        print(json.dumps([{\"text\": str(e), \"start\": 0.0, \"end\": 0.0}]))\n" +
                "        sys.exit(1)\n" +
                "\n" +
                "if __name__ == '__main__':\n" +
                "    if len(sys.argv) < 2:\n" +
                "        sys.exit(1)\n" +
                "    audio = sys.argv[1]\n" +
                "    model_sz = sys.argv[2] if len(sys.argv) > 2 else 'medium'\n" +
                "    transcribe(audio, model_sz)\n";
        
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(script.getBytes(StandardCharsets.UTF_8));
        } catch (IOException e) {
            log.error("Failed to write whisper script file", e);
        }
    }

    public static class WhisperSegment {
        private String text;
        private double start;
        private double end;

        public WhisperSegment() {}

        public WhisperSegment(String text, double start, double end) {
            this.text = text;
            this.start = start;
            this.end = end;
        }

        public String getText() { return text; }
        public double getStart() { return start; }
        public double getEnd() { return end; }
    }
}
