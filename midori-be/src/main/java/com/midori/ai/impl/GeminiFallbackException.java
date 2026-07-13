package com.midori.ai.impl;

import java.util.List;

public class GeminiFallbackException extends RuntimeException {
    private final List<ModelFailure> failures;

    public GeminiFallbackException(String message, List<ModelFailure> failures) {
        super(message);
        this.failures = failures;
    }

    public List<ModelFailure> getFailures() {
        return failures;
    }

    @Override
    public String getMessage() {
        StringBuilder sb = new StringBuilder(super.getMessage());
        sb.append(" details:\n");
        for (ModelFailure f : failures) {
            sb.append(String.format(" - Model: %s, Status: %s, Message: %s, Response: %s\n",
                    f.getModel(),
                    f.getHttpStatus() != null ? f.getHttpStatus() : "N/A",
                    f.getErrorMessage(),
                    f.getResponseBody() != null ? truncate(f.getResponseBody(), 200) : "N/A"));
        }
        return sb.toString();
    }

    private String truncate(String text, int max) {
        if (text == null) return "N/A";
        if (text.length() <= max) return text;
        return text.substring(0, max) + "...";
    }
}
