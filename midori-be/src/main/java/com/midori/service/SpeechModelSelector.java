package com.midori.service;

import org.springframework.lang.NonNull;

public interface SpeechModelSelector {

    @NonNull
    String selectModel(@NonNull AudioMetadata metadata);
}
