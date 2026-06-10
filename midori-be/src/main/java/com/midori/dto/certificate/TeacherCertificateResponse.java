package com.midori.dto.certificate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherCertificateResponse {

    private UUID id;
    private String title;
    private String issuer;
    private LocalDate issuedDate;
    private String certificateUrl;
    private String imageUrl;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
}
