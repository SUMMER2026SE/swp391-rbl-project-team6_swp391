package com.midori.dto.response;

import java.time.Instant;
import java.util.UUID;

public class AiImportJobResponse {

    private UUID jobId;
    private String status;
    private String message;
    private UUID examId;
    private Integer questionCount;
    private Instant createdAt;
    private Instant completedAt;

    public UUID getJobId() { return jobId; }
    public void setJobId(UUID v) { this.jobId = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
    public String getMessage() { return message; }
    public void setMessage(String v) { this.message = v; }
    public UUID getExamId() { return examId; }
    public void setExamId(UUID v) { this.examId = v; }
    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer v) { this.questionCount = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant v) { this.completedAt = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final AiImportJobResponse r = new AiImportJobResponse();
        public Builder jobId(UUID v) { r.jobId = v; return this; }
        public Builder status(String v) { r.status = v; return this; }
        public Builder message(String v) { r.message = v; return this; }
        public Builder examId(UUID v) { r.examId = v; return this; }
        public Builder questionCount(Integer v) { r.questionCount = v; return this; }
        public Builder createdAt(Instant v) { r.createdAt = v; return this; }
        public Builder completedAt(Instant v) { r.completedAt = v; return this; }
        public AiImportJobResponse build() { return r; }
    }
}
