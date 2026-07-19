package com.midori.service;

import org.springframework.lang.NonNull;

import java.io.IOException;

public interface SpeechProvider {

    @NonNull
    String providerName();

    @NonNull
    SpeechRecognitionResult transcribe(@NonNull byte[] audio, @NonNull AudioMetadata metadata, @NonNull String model) throws IOException;
}
