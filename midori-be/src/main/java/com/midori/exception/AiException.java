package com.midori.exception;

public class AiException extends com.midori.ai.exception.AiProcessingException {
    private final String code;

    public AiException(String code, String message) {
        super(message);
        this.code = code;
    }

    public AiException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static class QuotaExhaustedException extends AiException {
        public QuotaExhaustedException(String message) {
            super("AI_QUOTA_EXHAUSTED", message);
        }
        public QuotaExhaustedException(String message, Throwable cause) {
            super("AI_QUOTA_EXHAUSTED", message, cause);
        }
    }

    public static class RateLimitedException extends AiException {
        public RateLimitedException(String message) {
            super("AI_RATE_LIMITED", message);
        }
        public RateLimitedException(String message, Throwable cause) {
            super("AI_RATE_LIMITED", message, cause);
        }
    }

    public static class ProviderTimeoutException extends AiException {
        public ProviderTimeoutException(String message) {
            super("AI_PROVIDER_TIMEOUT", message);
        }
        public ProviderTimeoutException(String message, Throwable cause) {
            super("AI_PROVIDER_TIMEOUT", message, cause);
        }
    }

    public static class ProviderUnavailableException extends AiException {
        public ProviderUnavailableException(String message) {
            super("AI_PROVIDER_UNAVAILABLE", message);
        }
        public ProviderUnavailableException(String message, Throwable cause) {
            super("AI_PROVIDER_UNAVAILABLE", message, cause);
        }
    }

    public static class InvalidResponseException extends AiException {
        public InvalidResponseException(String message) {
            super("AI_INVALID_RESPONSE", message);
        }
        public InvalidResponseException(String message, Throwable cause) {
            super("AI_INVALID_RESPONSE", message, cause);
        }
    }

    public static class RequestTimeoutException extends AiException {
        public RequestTimeoutException(String message) {
            super("AI_REQUEST_TIMEOUT", message);
        }
        public RequestTimeoutException(String message, Throwable cause) {
            super("AI_REQUEST_TIMEOUT", message, cause);
        }
    }

    public static class InvalidApiKeyException extends AiException {
        public InvalidApiKeyException(String message) {
            super("AI_INVALID_API_KEY", message);
        }
        public InvalidApiKeyException(String message, Throwable cause) {
            super("AI_INVALID_API_KEY", message, cause);
        }
    }

    public static class ProviderForbiddenException extends AiException {
        public ProviderForbiddenException(String message) {
            super("AI_PROVIDER_FORBIDDEN", message);
        }
        public ProviderForbiddenException(String message, Throwable cause) {
            super("AI_PROVIDER_FORBIDDEN", message, cause);
        }
    }

    public static class ProviderCallLimitReachedException extends AiException {
        public ProviderCallLimitReachedException(String message) {
            super("AI_PROVIDER_CALL_LIMIT_REACHED", message);
        }
        public ProviderCallLimitReachedException(String message, Throwable cause) {
            super("AI_PROVIDER_CALL_LIMIT_REACHED", message, cause);
        }
    }
}
