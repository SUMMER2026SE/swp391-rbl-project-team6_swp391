package com.midori.dto.certificate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherCertificateRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @NotBlank(message = "Issuer is required")
    @Size(max = 255, message = "Issuer must not exceed 255 characters")
    private String issuer;

    private LocalDate issuedDate;

    private String certificateUrl;

    private String imageUrl;

    private String description;
}
