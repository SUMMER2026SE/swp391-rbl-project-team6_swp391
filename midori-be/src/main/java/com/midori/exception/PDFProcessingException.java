package com.midori.exception;

/**
 * Exception thrown when PDF processing fails.
 */
public class PDFProcessingException extends RuntimeException {

    private final String errorCode;

    public PDFProcessingException(String message) {
        super(message);
        this.errorCode = null;
    }

    public PDFProcessingException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = null;
    }

    public PDFProcessingException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public PDFProcessingException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
