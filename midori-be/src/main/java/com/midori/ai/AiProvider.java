package com.midori.ai;

import com.midori.ai.dto.AiExamParseResponse;

public interface AiProvider {

    AiProviderType getType();

    String getName();

    AiExamParseResponse parseExamFromText(String extractedText, String filename) throws AiParsingException;
}
