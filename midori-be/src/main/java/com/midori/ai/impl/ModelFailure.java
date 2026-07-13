package com.midori.ai.impl;

public class ModelFailure {
    private final String model;
    private final Integer httpStatus;
    private final String responseBody;
    private final String errorMessage;

    public ModelFailure(String model, Integer httpStatus, String responseBody, String errorMessage) {
        this.model = model;
        this.httpStatus = httpStatus;
        this.responseBody = responseBody;
        this.errorMessage = errorMessage;
    }

    public String getModel() {
        return model;
    }

    public Integer getHttpStatus() {
        return httpStatus;
    }

    public String getResponseBody() {
        return responseBody;
    }

    public String getErrorMessage() {
        return errorMessage;
    }
}
