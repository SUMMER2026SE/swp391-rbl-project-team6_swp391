package com.midori.service.impl;

import com.midori.config.ShadowingSpeechConfig;
import com.midori.service.AudioMetadata;
import com.midori.service.SpeechProvider;
import com.midori.service.SpeechRecognitionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GroqSpeechProvider implements SpeechProvider {

    private final ShadowingSpeechConfig speechConfig;
    private final RestTemplate restTemplate = new RestTemplate();

    @org.springframework.beans.factory.annotation.Value("${groq.api-key:}")
    private String apiKey;

    @Override
    public String providerName() {
        return "groq";
    }

    private final java.util.concurrent.atomic.AtomicInteger keyIndex = new java.util.concurrent.atomic.AtomicInteger(0);

    @Override
    public SpeechRecognitionResult transcribe(byte[] audio, AudioMetadata metadata, String model) throws IOException {
        long start = System.currentTimeMillis();

        String rawKeys = (apiKey != null && !apiKey.isBlank()) ? apiKey : System.getenv("GROQ_API_KEY");
        if (rawKeys == null || rawKeys.isBlank()) {
            throw new IOException("Groq API Key is not configured. Please set 'groq.api-key' in configuration or 'GROQ_API_KEY' in environment variables.");
        }
        
        String[] keys = Arrays.stream(rawKeys.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
                
        if (keys.length == 0) {
            throw new IOException("No valid Groq API Keys found in configuration.");
        }

        int attempt = 0;
        int maxAttempts = keys.length;
        Exception lastException = null;

        while (attempt < maxAttempts) {
            int idx = Math.abs(keyIndex.getAndIncrement() % keys.length);
            String currentKey = keys[idx];
            log.info("[GroqSpeechProvider] Using API key index {} (total keys: {})", idx, keys.length);

            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setBearerAuth(currentKey);
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                String filename = buildFilename(metadata);

                org.springframework.util.LinkedMultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
                body.add("file", new org.springframework.core.io.ByteArrayResource(audio) {
                    @Override
                    public String getFilename() {
                        return filename;
                    }
                });
                body.add("model", model);
                body.add("response_format", "verbose_json");

                HttpEntity<org.springframework.util.MultiValueMap<String, Object>> requestEntity =
                        new HttpEntity<>(body, headers);

                ResponseEntity<Map> response = restTemplate.exchange(
                        "https://api.groq.com/openai/v1/audio/transcriptions",
                        HttpMethod.POST,
                        requestEntity,
                        Map.class
                );

                Map bodyMap = response.getBody();
                String transcript = bodyMap != null ? (String) bodyMap.get("text") : null;
                if (transcript == null || transcript.isBlank()) {
                    transcript = "";
                }

                double confidence = estimateConfidence(bodyMap);
                double durationSeconds = estimateDurationSeconds(bodyMap);
                String language = extractLanguage(bodyMap);
                java.util.List<java.util.Map<String, Object>> segments = extractSegments(bodyMap);

                long processingTime = System.currentTimeMillis() - start;
                log.info("[GroqSpeechProvider] model={} transcript={} confidence={} language={} segments={} processingTime={}ms responseSize={} requestId={}",
                        model, transcript, confidence, language, segments.size(), processingTime, bodyMap != null ? bodyMap.hashCode() : 0, buildRequestId());

                return new SpeechRecognitionResult(
                        transcript.trim(),
                        confidence,
                        language,
                        durationSeconds,
                        model,
                        providerName(),
                        processingTime,
                        segments
                );
            } catch (Exception e) {
                log.warn("[GroqSpeechProvider] Attempt {} failed with key index {}: {}", attempt + 1, idx, e.getMessage());
                lastException = e;
                attempt++;
            }
        }

        throw new IOException("All configured Groq API keys failed. Last error: " + (lastException != null ? lastException.getMessage() : "unknown"), lastException);
    }

    private String buildFilename(AudioMetadata metadata) {
        if (metadata == null || metadata.getMimeType() == null) {
            return "recording.wav";
        }
        String mime = metadata.getMimeType();
        if (mime.contains("webm")) {
            return "recording.webm";
        } else if (mime.contains("mp4") || mime.contains("m4a")) {
            return "recording.m4a";
        } else if (mime.contains("ogg")) {
            return "recording.ogg";
        } else if (mime.contains("mp3")) {
            return "recording.mp3";
        }
        return "recording.wav";
    }

    private String buildRequestId() {
        return java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private double estimateConfidence(Map<String, Object> bodyMap) {
        try {
            if (bodyMap == null) {
                return 0.5;
            }
            Object segmentsObj = bodyMap.get("segments");
            if (segmentsObj instanceof Iterable<?> segments) {
                int count = 0;
                double sum = 0;
                for (Object item : segments) {
                    if (item instanceof Map<?, ?> map) {
                        Object avgLogProb = map.get("avg_logprob");
                        if (avgLogProb instanceof Number number) {
                            sum += number.doubleValue();
                            count++;
                        }
                    }
                }
                if (count > 0) {
                    double avg = sum / count;
                    return Math.min(1.0, Math.max(0.0, Math.exp(avg)));
                }
            }
        } catch (Exception ex) {
            log.debug("[GroqSpeechProvider] confidence estimation failed", ex);
        }
        return 0.5;
    }

    private double estimateDurationSeconds(Map<String, Object> bodyMap) {
        try {
            if (bodyMap == null) {
                return 0;
            }
            if (bodyMap.containsKey("duration") && bodyMap.get("duration") instanceof Number number) {
                return number.doubleValue();
            }
        } catch (Exception ex) {
            log.debug("[GroqSpeechProvider] duration parsing failed", ex);
        }
        return 0;
    }

    private String extractLanguage(Map<String, Object> bodyMap) {
        try {
            if (bodyMap == null) {
                return "ja";
            }
            Object language = bodyMap.get("language");
            if (language instanceof String string && !string.isBlank()) {
                return string;
            }
        } catch (Exception ex) {
            log.debug("[GroqSpeechProvider] language extraction failed", ex);
        }
        return "ja";
    }

    private java.util.List<java.util.Map<String, Object>> extractSegments(Map<String, Object> bodyMap) {
        java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        try {
            if (bodyMap == null) {
                return result;
            }
            Object segmentsObj = bodyMap.get("segments");
            if (segmentsObj instanceof Iterable<?> segments) {
                int index = 0;
                for (Object item : segments) {
                    if (item instanceof Map<?, ?> map) {
                        String text = (String) map.get("text");
                        Number startNum = (Number) map.get("start");
                        Number endNum = (Number) map.get("end");
                        
                        if (text != null) {
                            java.util.Map<String, Object> segment = new java.util.HashMap<>();
                            segment.put("index", index++);
                            segment.put("text", text.trim());
                            segment.put("start", startNum != null ? startNum.doubleValue() : 0.0);
                            segment.put("end", endNum != null ? endNum.doubleValue() : 0.0);
                            result.add(segment);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.debug("[GroqSpeechProvider] segments parsing failed", ex);
        }
        return result;
    }
}
