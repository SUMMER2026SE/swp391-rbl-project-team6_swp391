package com.midori.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicTeacherResponse {
    private UUID id;
    private String fullName;
    private String avatarUrl;
    private String professionalTitle;
    private String teachingLevels;
    private String specializations;
    private Integer yearsOfExperience;
    private String shortBiography;
    private List<PublicTeacherCertificateResponse> certificates;
}
