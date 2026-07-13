package com.midori.service.impl;

import com.midori.config.ShadowingSpeechConfig;
import com.midori.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpeechToTextServiceImpl implements SpeechToTextService {

    private final SpeechProvider speechProvider;
    private final SpeechModelSelector speechModelSelector;
    private final AudioValidator audioValidator;
    private final ShadowingSpeechConfig speechConfig;

    @Override
    public SpeechRecognitionResult transcribe(MultipartFile audioFile) throws IOException {
        if (audioFile == null || audioFile.isEmpty()) {
            throw new IOException("Audio file is empty");
        }

        AudioValidationResult validationResult = audioValidator.validate(
                audioFile.getBytes(),
                audioFile.getContentType(),
                speechConfig.getApiTimeoutSeconds() * 1000
        );

        if (!validationResult.isValid() || validationResult.getMetadata() == null) {
            throw new IOException("Invalid audio: " + validationResult.getReason());
        }

        String model = speechModelSelector.selectModel(validationResult.getMetadata());
        long start = System.currentTimeMillis();

        try {
            SpeechRecognitionResult result = speechProvider.transcribe(
                    audioFile.getBytes(),
                    validationResult.getMetadata(),
                    model
            );

            long processingTime = System.currentTimeMillis() - start;
            log.info("[SpeechToText] provider={} model={} transcript={} confidence={} language={} processingTime={}ms",
                    result.provider(), model, result.transcript(), result.confidence(), result.language(), processingTime);
            return result;
        } catch (Exception ex) {
            long processingTime = System.currentTimeMillis() - start;
            log.warn("[SpeechToText] provider={} model={} failed reason={} processingTime={}ms",
                    speechProvider.providerName(), model, ex.getMessage(), processingTime);
            throw new IOException("Audio transcription failed: " + ex.getMessage(), ex);
        }
    }
}
