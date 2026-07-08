package com.midori.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AiImportRequest {

    @NotNull(message = "Class ID is required")
    private String classId;

    private String level;

    private String status;
}
