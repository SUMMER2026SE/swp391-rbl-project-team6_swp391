package com.midori.service;

import com.midori.dto.certificate.TeacherCertificateRequest;
import com.midori.dto.certificate.TeacherCertificateResponse;

import java.util.List;
import java.util.UUID;

public interface TeacherCertificateService {

    List<TeacherCertificateResponse> listCertificates(UUID currentUserId);

    TeacherCertificateResponse getCertificate(UUID certificateId, UUID currentUserId);

    TeacherCertificateResponse createCertificate(TeacherCertificateRequest request, UUID currentUserId);

    TeacherCertificateResponse updateCertificate(UUID certificateId, TeacherCertificateRequest request, UUID currentUserId);

    void deleteCertificate(UUID certificateId, UUID currentUserId);
}
