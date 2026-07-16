package com.midori.ai;

public class AiParsingException extends RuntimeException {

    public AiParsingException(String message) {
        super(message);
    }

    public AiParsingException(String message, Throwable cause) {
        super(message, cause);
    }
}
