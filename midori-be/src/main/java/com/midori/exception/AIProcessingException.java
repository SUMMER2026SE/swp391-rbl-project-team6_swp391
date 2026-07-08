package com.midori.exception;

/**
 * Exception thrown when AI processing fails.
 */
public class AIProcessingException extends RuntimeException {

    private final String provider;
    private final String errorCode;

    public AIProcessingException(String message) {
        super(message);
        this.provider = null;
        this.errorCode = null;
    }

    public AIProcessingException(String message, String provider) {
        super(message);
        this.provider = provider;
        this.errorCode = null;
    }

    public AIProcessingException(String message, String provider, Throwable cause) {
        super(message, cause);
        this.provider = provider;
        this.errorCode = null;
    }

    public AIProcessingException(String message, String provider, String errorCode) {
        super(message);
        this.provider = provider;
        this.errorCode = errorCode;
    }

    public String getProvider() {
        return provider;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
