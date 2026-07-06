package com.midori.shadowing.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class ShadowingAiService {

    private static final Logger log = LoggerFactory.getLogger(ShadowingAiService.class);

    private static final String GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
    private static final String GROQ_WHISPER_MODEL = "whisper-large-v3";

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @Value("${groq.api-key:}")
    private String groqApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public ShadowingAiService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(30000);
        factory.setReadTimeout(120000);
        this.restTemplate = new RestTemplate(factory);
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Extracts audio track from video file using FFmpeg CLI
     */
    public File extractAudio(File videoFile) {
        log.info("[AI Pipeline] Starting audio extraction using FFmpeg for: {}", videoFile.getName());
        long startTime = System.currentTimeMillis();

        String baseName = videoFile.getName().substring(0, videoFile.getName().lastIndexOf("."));
        File audioFile = new File(videoFile.getParentFile(), baseName + ".mp3");

        File localFfmpeg = new File("ffmpeg-8.1.2-full_build/bin/ffmpeg.exe");
        String ffmpegPath;
        if (localFfmpeg.exists()) {
            ffmpegPath = localFfmpeg.getAbsolutePath();
            log.info("[AI Pipeline] Using local FFmpeg: {}", ffmpegPath);
        } else {
            ffmpegPath = "ffmpeg";
            log.warn("[AI Pipeline] Local FFmpeg not found, using system FFmpeg");
        }

        ProcessBuilder pb = new ProcessBuilder(
                ffmpegPath, "-y", "-i", videoFile.getAbsolutePath(),
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
            log.warn("[AI Pipeline] FFmpeg execution failed. Fallback to transcribing original video file. Error: {}", e.getMessage());
            return videoFile;
        }
    }

    /**
     * Runs Whisper speech recognition on audio file via Groq API
     */
    public List<WhisperSegment> transcribeAudio(File audioFile, String modelSize) {
        WhisperResult result = transcribeAudioWithTiming(audioFile, modelSize);
        return result.segments;
    }

    /**
     * Runs Whisper with detailed timing for transcription
     */
    public WhisperResult transcribeAudioWithTiming(File audioFile, String modelSize) {
        log.info("[AI Pipeline] Starting speech recognition using Groq Whisper API");
        long overallStart = System.currentTimeMillis();

        String apiKey = getGroqApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new WhisperTranscriptionException(
                "Groq API key is not configured. " +
                "Please set the GROQ_API_KEY environment variable or configure groq.api-key in application.yml. " +
                "Get your API key at: https://console.groq.com/keys"
            );
        }

        try {
            return callGroqWhisperApi(audioFile, apiKey, overallStart);
        } catch (WhisperTranscriptionException e) {
            throw e;
        } catch (Exception e) {
            log.error("[AI Pipeline] Groq Whisper API call failed: {}", e.getMessage());
            throw new WhisperTranscriptionException("Groq Whisper API call failed: " + e.getMessage());
        }
    }

    /**
     * Retrieves Groq API key from environment variable or configuration
     */
    private String getGroqApiKey() {
        String apiKey = System.getenv("GROQ_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            apiKey = this.groqApiKey;
        }
        return apiKey;
    }

    /**
     * Calls Groq Whisper API for transcription
     */
    private WhisperResult callGroqWhisperApi(File audioFile, String apiKey, long overallStart) throws Exception {
        log.info("[AI Pipeline] Calling Groq Whisper API for transcription...");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("Authorization", "Bearer " + apiKey);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(audioFile));
        body.add("model", GROQ_WHISPER_MODEL);
        body.add("language", "ja");
        body.add("response_format", "verbose_json");
        body.add("timestamp_granularities[]", "word");

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        long transcribeStart = System.currentTimeMillis();
        ResponseEntity<String> response = restTemplate.exchange(
            GROQ_WHISPER_URL,
            HttpMethod.POST,
            requestEntity,
            String.class
        );
        long transcribeTime = System.currentTimeMillis() - transcribeStart;
        long overallElapsed = System.currentTimeMillis() - overallStart;

        if (response.getStatusCode() != HttpStatus.OK) {
            String errorBody = response.getBody();
            String errorMessage = "Groq API returned status " + response.getStatusCode();
            
            try {
                JsonNode errorNode = objectMapper.readTree(errorBody);
                if (errorNode.has("error") && errorNode.get("error").has("message")) {
                    errorMessage = errorNode.get("error").get("message").asText();
                }
            } catch (Exception ignored) {}
            
            throw new WhisperTranscriptionException("Groq Whisper API error: " + errorMessage);
        }

        JsonNode root = objectMapper.readTree(response.getBody());

        if (root.has("error")) {
            String errorMessage = root.path("error").path("message").asText("Unknown Groq API error");
            throw new WhisperTranscriptionException("Groq Whisper API error: " + errorMessage);
        }

        List<WhisperSegment> segments = new ArrayList<>();

        if (root.has("words") && root.get("words").isArray()) {
            JsonNode words = root.get("words");
            List<WhisperWord> wordList = new ArrayList<>();
            for (JsonNode wordNode : words) {
                wordList.add(new WhisperWord(
                    wordNode.get("word").asText(),
                    wordNode.get("start").asDouble(),
                    wordNode.get("end").asDouble()
                ));
            }
            segments = groupWordsIntoSegments(wordList);
        } else if (root.has("segments") && root.get("segments").isArray()) {
            JsonNode segNodes = root.get("segments");
            for (JsonNode seg : segNodes) {
                segments.add(new WhisperSegment(
                    seg.get("text").asText(),
                    seg.get("start").asDouble(),
                    seg.get("end").asDouble()
                ));
            }
        } else if (root.has("text")) {
            String fullText = root.get("text").asText();
            double duration = root.has("duration") ? root.get("duration").asDouble() : 0;
            segments.add(new WhisperSegment(fullText.trim(), 0.0, duration));
        }

        if (segments.isEmpty()) {
            throw new WhisperTranscriptionException(
                "Groq Whisper API returned empty transcription. Audio file may be empty or corrupted: " + audioFile.getName()
            );
        }

        log.info("[AI Pipeline] Speech recognition finished in {}ms (Groq API). Segments: {}",
                 overallElapsed, segments.size());
        
        return new WhisperResult(segments, 0, transcribeTime);
    }

    /**
     * Groups individual words into segments similar to Faster-Whisper output
     */
    private List<WhisperSegment> groupWordsIntoSegments(List<WhisperWord> words) {
        if (words.isEmpty()) {
            return new ArrayList<>();
        }

        List<WhisperSegment> segments = new ArrayList<>();
        StringBuilder currentText = new StringBuilder();
        double segmentStart = words.get(0).start;
        double segmentEnd = words.get(0).end;

        for (WhisperWord word : words) {
            if (currentText.length() == 0) {
                segmentStart = word.start;
            }
            
            if (currentText.length() > 0) {
                currentText.append(" ");
            }
            currentText.append(word.word);
            segmentEnd = word.end;

            if (currentText.length() >= 50 || isSentenceEnd(word.word)) {
                String text = currentText.toString().trim();
                if (!text.isEmpty()) {
                    segments.add(new WhisperSegment(text, segmentStart, segmentEnd));
                }
                currentText = new StringBuilder();
            }
        }

        if (currentText.length() > 0) {
            String text = currentText.toString().trim();
            if (!text.isEmpty()) {
                segments.add(new WhisperSegment(text, segmentStart, segmentEnd));
            }
        }

        return segments;
    }

    /**
     * Simple heuristic to detect sentence boundaries
     */
    private boolean isSentenceEnd(String word) {
        if (word == null || word.isEmpty()) {
            return false;
        }
        char lastChar = word.charAt(word.length() - 1);
        return lastChar == '。' || lastChar == '！' || lastChar == '？' || lastChar == '.';
    }

    /**
     * Helper class to hold word-level data from Groq API
     */
    private static class WhisperWord {
        final String word;
        final double start;
        final double end;

        WhisperWord(String word, double start, double end) {
            this.word = word;
            this.start = start;
            this.end = end;
        }
    }

    /**
     * Custom exception for Whisper transcription errors with descriptive messages.
     */
    public static class WhisperTranscriptionException extends RuntimeException {
        public WhisperTranscriptionException(String message) {
            super(message);
        }
    }

    /**
     * Translates a batch of Japanese sentences to Vietnamese using Gemini 2.5 Flash API with 3 retries.
     */
    public List<String> translateBatchWithRetry(List<String> japaneseTexts) {
        if (japaneseTexts == null || japaneseTexts.isEmpty()) {
            return new ArrayList<>();
        }

        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            apiKey = this.geminiApiKey;
        }

        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new GeminiConfigurationException(
                "Gemini API key is not configured. " +
                "Please set the GEMINI_API_KEY environment variable or configure gemini.api-key in application.yml. " +
                "Get your API key at: https://aistudio.google.com/apikey"
            );
        }

        int maxRetries = 3;
        int delay = 1000;
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return callGeminiBatchApi(japaneseTexts, apiKey);
            } catch (Exception e) {
                lastException = e;
                log.warn("[AI Pipeline] Gemini batch translation failed (attempt {}/{}): {}", attempt, maxRetries, e.getMessage());
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

        throw new GeminiApiException(
            "Gemini API batch translation failed after " + maxRetries + " attempts. Last error: " +
            (lastException != null ? lastException.getMessage() : "Unknown error")
        );
    }

    /**
     * Translates a Japanese sentence to Vietnamese using Gemini 2.5 Flash API with 3 retries.
     */
    public String translateWithRetry(String japaneseText) {
        if (japaneseText == null || japaneseText.trim().isEmpty()) {
            return "";
        }
        
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            apiKey = this.geminiApiKey;
        }
        
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new GeminiConfigurationException(
                "Gemini API key is not configured. " +
                "Please set the GEMINI_API_KEY environment variable or configure gemini.api-key in application.yml. " +
                "Get your API key at: https://aistudio.google.com/apikey"
            );
        }
        
        int maxRetries = 3;
        int delay = 1000;
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return callGeminiApi(japaneseText, apiKey);
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
        
        throw new GeminiApiException(
            "Gemini API translation failed after " + maxRetries + " attempts. Last error: " + 
            (lastException != null ? lastException.getMessage() : "Unknown error")
        );
    }

    private String callGeminiApi(String japaneseText, String apiKey) throws Exception {
        try {
            return callGeminiApiWithModel(japaneseText, apiKey, "gemini-2.5-flash");
        } catch (Exception e) {
            log.warn("[AI Pipeline] Gemini 2.5 Flash translation failed. Falling back to Gemini 2.0 Flash. Error: {}", e.getMessage());
            return callGeminiApiWithModel(japaneseText, apiKey, "gemini-2.0-flash");
        }
    }

    private String callGeminiApiWithModel(String japaneseText, String apiKey, String modelName) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

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

        log.info("[AI Pipeline] Calling Gemini API ({}) for translation...", modelName);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        String jsonResponse = restTemplate.postForObject(url, entity, String.class);

        JsonNode root = objectMapper.readTree(jsonResponse);
        
        if (root.has("error")) {
            JsonNode error = root.get("error");
            String errorMessage = error.has("message") ? error.get("error").get("message").asText() : "Unknown Gemini API error";
            throw new GeminiApiException("Gemini API returned error: " + errorMessage);
        }

        JsonNode candidate = root.path("candidates").get(0);
        JsonNode content = candidate.path("content");
        JsonNode part = content.path("parts").get(0);
        String translated = part.path("text").asText().trim();

        if (translated.isEmpty()) {
            throw new GeminiApiException("Empty translation response from Gemini");
        }

        log.info("[AI Pipeline] Translation successful: {} -> {}", japaneseText, translated);
        return translated;
    }

    /**
     * Batch translate multiple Japanese sentences in a single Gemini API call.
     */
    private List<String> callGeminiBatchApi(List<String> japaneseTexts, String apiKey) throws Exception {
        try {
            return callGeminiBatchApiWithModel(japaneseTexts, apiKey, "gemini-2.5-flash");
        } catch (Exception e) {
            log.warn("[AI Pipeline] Gemini 2.5 Flash batch translation failed. Falling back to Gemini 2.0 Flash. Error: {}", e.getMessage());
            return callGeminiBatchApiWithModel(japaneseTexts, apiKey, "gemini-2.0-flash");
        }
    }

    private List<String> callGeminiBatchApiWithModel(List<String> japaneseTexts, String apiKey, String modelName) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("Translate these Japanese sentences into natural Vietnamese. Output ONLY the translations, one per line, in the same order as provided. Do not add any explanation or numbers:\n");
        for (int i = 0; i < japaneseTexts.size(); i++) {
            promptBuilder.append((i + 1)).append(". ").append(japaneseTexts.get(i)).append("\n");
        }

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", promptBuilder.toString());

        List<Map<String, Object>> partsList = new ArrayList<>();
        partsList.add(textPart);

        Map<String, Object> partsObj = new HashMap<>();
        partsObj.put("parts", partsList);

        List<Map<String, Object>> contentsList = new ArrayList<>();
        contentsList.add(partsObj);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", contentsList);

        log.info("[AI Pipeline] Calling Gemini API ({}) for batch translation of {} segments...", modelName, japaneseTexts.size());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        String jsonResponse = restTemplate.postForObject(url, entity, String.class);

        JsonNode root = objectMapper.readTree(jsonResponse);

        if (root.has("error")) {
            JsonNode error = root.get("error");
            String errorMessage = error.has("message") ? error.get("error").get("message").asText() : "Unknown Gemini API error";
            throw new GeminiApiException("Gemini API returned error: " + errorMessage);
        }

        JsonNode candidate = root.path("candidates").get(0);
        JsonNode content = candidate.path("content");
        JsonNode part = content.path("parts").get(0);
        String translated = part.path("text").asText().trim();

        if (translated.isEmpty()) {
            throw new GeminiApiException("Empty translation response from Gemini");
        }

        List<String> translations = new ArrayList<>();
        String[] lines = translated.split("\n");
        for (String line : lines) {
            String cleaned = line.replaceFirst("^\\d+[.)]\\s*", "").trim();
            if (!cleaned.isEmpty()) {
                translations.add(cleaned);
            }
        }

        if (translations.size() < japaneseTexts.size()) {
            log.warn("[AI Pipeline] Gemini returned fewer translations ({} vs {}) than requested. Padding with originals.",
                     translations.size(), japaneseTexts.size());
            while (translations.size() < japaneseTexts.size()) {
                int idx = translations.size();
                translations.add(japaneseTexts.get(idx));
            }
        } else if (translations.size() > japaneseTexts.size()) {
            log.warn("[AI Pipeline] Gemini returned more translations ({} vs {}) than requested. Truncating.",
                     translations.size(), japaneseTexts.size());
            translations = translations.subList(0, japaneseTexts.size());
        }

        log.info("[AI Pipeline] Batch translation successful: {} segments", translations.size());
        return translations;
    }

    private String getGeminiApiKey() {
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            apiKey = this.geminiApiKey;
        }
        return apiKey;
    }

    public Map<String, Object> evaluatePronunciation(String expectedText, String spokenText, double duration) {
        log.info("[AI Pipeline] Evaluating speech. Expected: '{}', Spoken: '{}', Duration: {}s", expectedText, spokenText, duration);
        String apiKey = getGeminiApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new GeminiConfigurationException("Gemini API key is not configured.");
        }

        int transcriptLength = spokenText != null ? spokenText.length() : 0;
        double speakingSpeed = duration > 0 ? (double) transcriptLength / duration : 0;

        String prompt = "You are an expert Japanese speech and pronunciation coach.\n" +
                "Analyze the user's spoken Japanese text against the expected Japanese text.\n\n" +
                "Expected (Reference): \"" + expectedText + "\"\n" +
                "Spoken (User Transcript): \"" + spokenText + "\"\n" +
                "User Speaking Speed: " + String.format("%.2f", speakingSpeed) + " char/sec (based on duration " + duration + "s and transcript length " + transcriptLength + " chars)\n\n" +
                "Compare the spoken text with the expected text and evaluate:\n" +
                "1. Missing words: Words that are in expected but missing in spoken.\n" +
                "2. Extra words: Words that are in spoken but not in expected.\n" +
                "3. Incorrect particles: Particles (は, が, を, ni, etc.) that were mispronounced or omitted.\n" +
                "4. Grammar mistakes.\n" +
                "5. Vocabulary mistakes.\n" +
                "6. Context/Pronunciation mistakes.\n\n" +
                "Calculate:\n" +
                "- pronunciationScore (0-100): phonetic accuracy.\n" +
                "- pitchAccentScore (0-100): pitch accent accuracy.\n" +
                "- fluencyScore (0-100): speech flow, rhythm.\n" +
                "- speedScore (0-100): matches standard speaking speed.\n" +
                "- overallScore (0-100): overall accuracy score based on transcript comparison.\n" +
                "- speedRecommendation: analysis of speaking speed (too fast, too slow, or natural) and advice.\n\n" +
                "Identify incorrect words/tokens in the expected text that were spoken incorrectly or omitted, so they can be highlighted in the UI. Output them in the `incorrectWords` list.\n\n" +
                "Provide structured feedback in Vietnamese:\n" +
                "- strengths: list of strengths in their speech.\n" +
                "- improvements: list of areas for improvement.\n" +
                "- advice: personalized learning advice.\n" +
                "- retries: recommended number of retries (1, 2, 3, etc. depending on mistakes).\n\n" +
                "Return ONLY a valid JSON object matching the following structure (no markdown wrappers like ```json, no extra text, just raw JSON):\n" +
                "{\n" +
                "  \"pronunciation\": 90,\n" +
                "  \"pitchAccent\": 85,\n" +
                "  \"fluency\": 80,\n" +
                "  \"speed\": 85,\n" +
                "  \"overallScore\": 85,\n" +
                "  \"feedback\": \"...\",\n" +
                "  \"strengths\": [\"...\", \"...\"],\n" +
                "  \"improvements\": [\"...\", \"...\"],\n" +
                "  \"advice\": \"...\",\n" +
                "  \"retries\": 2,\n" +
                "  \"speedRecommendation\": \"...\",\n" +
                "  \"incorrectWords\": [\"word1\", \"word2\"],\n" +
                "  \"spokenText\": \"...\"\n" +
                "}";

        try {
            String jsonResponse = callGeminiRawApi(prompt, apiKey);
            Map<String, Object> responseMap = objectMapper.readValue(jsonResponse, Map.class);
            
            // Compute token diff for highlighting
            List<Map<String, Object>> diff = computeDiff(expectedText, spokenText);
            responseMap.put("diff", diff);
            
            return responseMap;
        } catch (Exception e) {
            log.error("[AI Pipeline] Speech evaluation failed: {}", e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            
            List<Map<String, Object>> diff = computeDiff(expectedText, spokenText);
            
            int correctChars = 0;
            int totalExpectedChars = 0;
            for (Map<String, Object> token : diff) {
                String text = (String) token.get("text");
                String status = (String) token.get("status");
                if (text != null) {
                    String clean = text.replaceAll("[\\s、。！？「」『』（）〔〕【】〈〉《》〜…――]+", "");
                    if (!clean.isEmpty()) {
                        int len = clean.length();
                        if ("correct".equals(status)) {
                            correctChars += len;
                            totalExpectedChars += len;
                        } else if ("incorrect".equals(status) || "missing".equals(status)) {
                            totalExpectedChars += len;
                        }
                    }
                }
            }
            int calculatedScore = totalExpectedChars > 0 ? (int) Math.round((double) correctChars / totalExpectedChars * 100) : 0;

            fallback.put("pronunciation", calculatedScore);
            fallback.put("pitchAccent", calculatedScore);
            fallback.put("fluency", calculatedScore);
            fallback.put("speed", calculatedScore);
            fallback.put("overallScore", calculatedScore);
            fallback.put("feedback", "Độ khớp phát âm được tính dựa trên văn bản nhận dạng được.");
            fallback.put("strengths", new ArrayList<>());
            fallback.put("improvements", new ArrayList<>());
            fallback.put("advice", "Hãy tiếp tục luyện tập.");
            fallback.put("retries", 1);
            fallback.put("speedRecommendation", "Bình thường");
            fallback.put("incorrectWords", new ArrayList<>());
            fallback.put("spokenText", spokenText);
            fallback.put("diff", diff);
            
            return fallback;
        }
    }

    public List<Map<String, Object>> computeDiff(String expected, String spoken) {
        if (expected == null) expected = "";
        if (spoken == null) spoken = "";

        int m = expected.length();
        int n = spoken.length();
        int[][] dp = new int[m + 1][n + 1];

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (expected.charAt(i - 1) == spoken.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        class Edit {
            char type;
            String text;
            Edit(char type, String text) {
                this.type = type;
                this.text = text;
            }
        }

        List<Edit> edits = new ArrayList<>();
        int i = m;
        int j = n;
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && expected.charAt(i - 1) == spoken.charAt(j - 1)) {
                edits.add(0, new Edit('C', String.valueOf(expected.charAt(i - 1))));
                i--;
                j--;
            } else if (j > 0 && (i == 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                edits.add(0, new Edit('E', String.valueOf(spoken.charAt(j - 1))));
                j--;
            } else {
                edits.add(0, new Edit('M', String.valueOf(expected.charAt(i - 1))));
                i--;
            }
        }

        class GroupedEdit {
            char type;
            String text;
            GroupedEdit(char type, String text) {
                this.type = type;
                this.text = text;
            }
        }

        List<GroupedEdit> grouped = new ArrayList<>();
        for (Edit edit : edits) {
            if (grouped.isEmpty()) {
                grouped.add(new GroupedEdit(edit.type, edit.text));
            } else {
                GroupedEdit last = grouped.get(grouped.size() - 1);
                if (last.type == edit.type) {
                    last.text += edit.text;
                } else {
                    grouped.add(new GroupedEdit(edit.type, edit.text));
                }
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        int k = 0;
        while (k < grouped.size()) {
            GroupedEdit current = grouped.get(k);
            if (k < grouped.size() - 1) {
                GroupedEdit next = grouped.get(k + 1);
                if ((current.type == 'M' && next.type == 'E') || (current.type == 'E' && next.type == 'M')) {
                    String missingText = current.type == 'M' ? current.text : next.text;
                    String extraText = current.type == 'E' ? current.text : next.text;

                    Map<String, Object> tokenInc = new HashMap<>();
                    tokenInc.put("text", missingText);
                    tokenInc.put("status", "incorrect");
                    result.add(tokenInc);

                    Map<String, Object> tokenExt = new HashMap<>();
                    tokenExt.put("text", extraText);
                    tokenExt.put("status", "extra");
                    result.add(tokenExt);

                    k += 2;
                    continue;
                }
            }

            Map<String, Object> token = new HashMap<>();
            token.put("text", current.text);
            if (current.type == 'C') {
                token.put("status", "correct");
            } else if (current.type == 'M') {
                token.put("status", "missing");
            } else {
                token.put("status", "extra");
            }
            result.add(token);
            k++;
        }

        return result;
    }

    public Map<String, Object> explainText(String text, String sentence) {
        log.info("[AI Pipeline] Explaining text: '{}' in sentence: '{}'", text, sentence);
        String apiKey = getGeminiApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new GeminiConfigurationException("Gemini API key is not configured.");
        }

        String prompt = "You are an expert Japanese language teacher.\n" +
                "Analyze the Japanese word or phrase: \"" + text + "\"\n" +
                "In the context of this sentence: \"" + sentence + "\"\n\n" +
                "Identify if it is a vocabulary word, a grammar pattern, or a contextual expression, and return a structured JSON object.\n\n" +
                "Structure if it is a vocabulary word (vocab):\n" +
                "{\n" +
                "  \"type\": \"vocab\",\n" +
                "  \"kanji\": \"Kanji form (or Hiragana if no Kanji exists)\",\n" +
                "  \"hiragana\": \"Hiragana reading\",\n" +
                "  \"meaning\": \"Meaning in Vietnamese\",\n" +
                "  \"jlpt\": \"Estimated JLPT Level (N5, N4, N3, N2, N1)\",\n" +
                "  \"example\": \"An example sentence in Japanese with its Vietnamese translation in parentheses\",\n" +
                "  \"relatedWords\": [\"Related word 1 (Meaning)\", \"Related word 2 (Meaning)\"],\n" +
                "  \"collocations\": [\"Collocation 1 (Meaning)\", \"Collocation 2 (Meaning)\"]\n" +
                "}\n\n" +
                "Structure if it is a grammar pattern (grammar):\n" +
                "{\n" +
                "  \"type\": \"grammar\",\n" +
                "  \"pattern\": \"Grammar pattern name\",\n" +
                "  \"meaning\": \"Meaning in Vietnamese\",\n" +
                "  \"explanation\": \"Clear explanation of how to use it in Vietnamese\",\n" +
                "  \"examples\": [\"Example sentence 1 in Japanese (Vietnamese translation in parentheses)\", \"Example sentence 2 in Japanese (Vietnamese translation in parentheses)\"]\n" +
                "}\n\n" +
                "Structure if it is a contextual expression (expression):\n" +
                "{\n" +
                "  \"type\": \"expression\",\n" +
                "  \"expression\": \"The expression\",\n" +
                "  \"meaning\": \"Natural, context-aware meaning in Vietnamese\",\n" +
                "  \"contextExplanation\": \"Detailed explanation of the social and cultural context in Vietnamese, explaining when to use it and why literal translation does not work\",\n" +
                "  \"examples\": [\"Example 1 in Japanese (Vietnamese translation in parentheses)\", \"Example 2 in Japanese (Vietnamese translation in parentheses)\"]\n" +
                "}\n\n" +
                "Return ONLY a valid JSON object. No markdown wrappers, no comments.";

        try {
            String jsonResponse = callGeminiRawApi(prompt, apiKey);
            return objectMapper.readValue(jsonResponse, Map.class);
        } catch (Exception e) {
            log.error("[AI Pipeline] Explain text failed: {}", e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("type", "vocab");
            fallback.put("kanji", text);
            fallback.put("hiragana", text);
            fallback.put("meaning", "Không thể lấy giải nghĩa lúc này. Vui lòng thử lại.");
            fallback.put("jlpt", "N/A");
            fallback.put("example", "");
            fallback.put("relatedWords", new ArrayList<>());
            fallback.put("collocations", new ArrayList<>());
            return fallback;
        }
    }

    private String callGeminiRawApi(String prompt, String apiKey) throws Exception {
        try {
            return callGeminiRawApiWithModel(prompt, apiKey, "gemini-2.5-flash");
        } catch (Exception e) {
            log.warn("[AI Pipeline] Gemini 2.5 Flash raw call failed. Falling back to Gemini 2.0 Flash. Error: {}", e.getMessage());
            return callGeminiRawApiWithModel(prompt, apiKey, "gemini-2.0-flash");
        }
    }

    private String callGeminiRawApiWithModel(String prompt, String apiKey, String modelName) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

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
        if (root.has("error")) {
            JsonNode error = root.get("error");
            String errorMessage = error.has("message") ? error.get("message").asText() : "Unknown Gemini API error";
            throw new GeminiApiException("Gemini API error: " + errorMessage);
        }

        JsonNode candidate = root.path("candidates").get(0);
        JsonNode content = candidate.path("content");
        JsonNode part = content.path("parts").get(0);
        String responseText = part.path("text").asText().trim();

        if (responseText.startsWith("```json")) {
            responseText = responseText.substring(7);
        } else if (responseText.startsWith("```")) {
            responseText = responseText.substring(3);
        }
        if (responseText.endsWith("```")) {
            responseText = responseText.substring(0, responseText.length() - 3);
        }
        return responseText.trim();
    }

    /**
     * Custom exception for Gemini API configuration errors
     */
    public static class GeminiConfigurationException extends RuntimeException {
        public GeminiConfigurationException(String message) {
            super(message);
        }
    }

    /**
     * Custom exception for Gemini API call failures
     */
    public static class GeminiApiException extends RuntimeException {
        public GeminiApiException(String message) {
            super(message);
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

    public static class WhisperResult {
        public List<WhisperSegment> segments;
        public long loadTimeMs;
        public long transcribeTimeMs;

        public WhisperResult(List<WhisperSegment> segments, long loadTimeMs, long transcribeTimeMs) {
            this.segments = segments;
            this.loadTimeMs = loadTimeMs;
            this.transcribeTimeMs = transcribeTimeMs;
        }
    }
}
