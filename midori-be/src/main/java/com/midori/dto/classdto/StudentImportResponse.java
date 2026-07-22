package com.midori.dto.classdto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentImportResponse {
    private boolean success;
    private ImportSummary summary;
    private List<ImportDetail> details;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportSummary {
        private int total;
        private int added;
        private int alreadyInClass;
        private int accountNotFound;
        private int invalidEmail;
        private int duplicateInFile;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportDetail {
        private int row;
        private String email;
        private String status;
        private String message;
    }
}
