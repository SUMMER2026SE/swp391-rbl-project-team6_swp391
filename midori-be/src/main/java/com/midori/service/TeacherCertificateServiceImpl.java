package com.midori.service;

import com.midori.dto.certificate.TeacherCertificateRequest;
import com.midori.dto.certificate.TeacherCertificateResponse;
import com.midori.entity.TeacherCertificate;
import com.midori.entity.User;
import com.midori.exception.AccessDeniedException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.TeacherCertificateRepository;
import com.midori.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TeacherCertificateServiceImpl implements TeacherCertificateService {

    private final TeacherCertificateRepository teacherCertificateRepository;
    private final UserRepository userRepository;

    private boolean isOwner(TeacherCertificate certificate, UUID currentUserId) {
        if (certificate == null || currentUserId == null) {
            return false;
        }
        return certificate.getTeacher() != null && certificate.getTeacher().getId().equals(currentUserId);
    }

    private void checkOwnership(TeacherCertificate certificate, UUID currentUserId) {
        if (!isOwner(certificate, currentUserId)) {
            throw new AccessDeniedException("You can only manage your own certificates");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherCertificateResponse> listCertificates(UUID currentUserId) {
        return teacherCertificateRepository.findAllByTeacherIdWithTeacher(currentUserId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherCertificateResponse getCertificate(UUID certificateId, UUID currentUserId) {
        TeacherCertificate certificate = teacherCertificateRepository.findByIdWithTeacher(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException("TeacherCertificate", "id", certificateId));

        if (!isOwner(certificate, currentUserId)) {
            throw new AccessDeniedException("You can only view your own certificates");
        }

        return toResponse(certificate);
    }

    @Override
    public TeacherCertificateResponse createCertificate(TeacherCertificateRequest request, UUID currentUserId) {
        User teacher = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        TeacherCertificate certificate = TeacherCertificate.builder()
                .teacher(teacher)
                .title(trimToNull(request.getTitle()))
                .issuer(trimToNull(request.getIssuer()))
                .issuedDate(request.getIssuedDate())
                .certificateUrl(trimToNull(request.getCertificateUrl()))
                .imageUrl(trimToNull(request.getImageUrl()))
                .description(trimToNull(request.getDescription()))
                .build();

        certificate = teacherCertificateRepository.save(certificate);
        return toResponse(certificate);
    }

    @Override
    public TeacherCertificateResponse updateCertificate(UUID certificateId, TeacherCertificateRequest request, UUID currentUserId) {
        TeacherCertificate certificate = teacherCertificateRepository.findByIdWithTeacher(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException("TeacherCertificate", "id", certificateId));

        checkOwnership(certificate, currentUserId);

        applyUpdate(certificate, request);
        certificate = teacherCertificateRepository.save(certificate);
        return toResponse(certificate);
    }

    @Override
    public void deleteCertificate(UUID certificateId, UUID currentUserId) {
        TeacherCertificate certificate = teacherCertificateRepository.findByIdWithTeacher(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException("TeacherCertificate", "id", certificateId));

        checkOwnership(certificate, currentUserId);
        teacherCertificateRepository.deleteById(certificateId);
    }

    private void applyUpdate(TeacherCertificate certificate, TeacherCertificateRequest request) {
        certificate.setTitle(trimToNull(request.getTitle()));
        certificate.setIssuer(trimToNull(request.getIssuer()));
        certificate.setIssuedDate(request.getIssuedDate());
        certificate.setCertificateUrl(trimToNull(request.getCertificateUrl()));
        certificate.setImageUrl(trimToNull(request.getImageUrl()));
        certificate.setDescription(trimToNull(request.getDescription()));
    }

    private TeacherCertificateResponse toResponse(TeacherCertificate certificate) {
        return TeacherCertificateResponse.builder()
                .id(certificate.getId())
                .title(certificate.getTitle())
                .issuer(certificate.getIssuer())
                .issuedDate(certificate.getIssuedDate())
                .certificateUrl(certificate.getCertificateUrl())
                .imageUrl(certificate.getImageUrl())
                .description(certificate.getDescription())
                .createdAt(certificate.getCreatedAt())
                .updatedAt(certificate.getUpdatedAt())
                .build();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
