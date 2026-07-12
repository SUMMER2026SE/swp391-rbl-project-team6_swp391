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

    @Override
    public SpeechRecognitionResult transcribe(byte[] audio, AudioMetadata metadata, String model) throws IOException {
        long start = System.currentTimeMillis();

        HttpHeaders headers = new HttpHeaders();
        String effectiveKey = (apiKey != null && !apiKey.isBlank()) ? apiKey : System.getenv("GROQ_API_KEY");
        if (effectiveKey == null || effectiveKey.isBlank()) {
            throw new IOException("Groq API Key is not configured. Please set 'groq.api-key' in configuration or 'GROQ_API_KEY' in environment variables.");
        }
        headers.setBearerAuth(effectiveKey);
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

        long processingTime = System.currentTimeMillis() - start;
        log.info("[GroqSpeechProvider] model={} transcript={} confidence={} language={} processingTime={}ms responseSize={} requestId={}",
                model, transcript, confidence, language, processingTime, bodyMap != null ? bodyMap.hashCode() : 0, buildRequestId());

        return new SpeechRecognitionResult(
                transcript.trim(),
                confidence,
                language,
                durationSeconds,
                model,
                providerName(),
                processingTime
        );
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
}
