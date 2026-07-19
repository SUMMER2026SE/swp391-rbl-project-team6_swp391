package com.midori.entity;

public enum ProcessingStep {
    DOWNLOAD_VIDEO,
    EXTRACT_AUDIO,
    TRANSCRIBE,
    TRANSLATE,
    SAVE_DATABASE,
    COMPLETE
}
