package com.midori.exception;

public class DataConflictException extends RuntimeException {
    private final String code;

    public DataConflictException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
