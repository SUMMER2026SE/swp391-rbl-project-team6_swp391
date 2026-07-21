package com.midori.service.impl;

import com.midori.dto.response.PublicTeacherCertificateResponse;
import com.midori.dto.response.PublicTeacherResponse;
import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
import com.midori.repository.TeacherCertificateRepository;
import com.midori.repository.UserRepository;
import com.midori.service.PublicTeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicTeacherServiceImpl implements PublicTeacherService {

    private final UserRepository userRepository;
    private final TeacherCertificateRepository certificateRepository;

    @Override
    public List<PublicTeacherResponse> getActiveTeachers() {
        List<User> teachers = userRepository.findByRoleWithProfile(Role.TEACHER);
        return teachers.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public PublicTeacherResponse getTeacherDetail(UUID teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));

        if (teacher.getRole() != Role.TEACHER) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found");
        }

        return mapToResponse(teacher);
    }

    private PublicTeacherResponse mapToResponse(User user) {
        String displayName = (user.getProfile() != null && user.getProfile().getDisplayName() != null && !user.getProfile().getDisplayName().isBlank())
                ? user.getProfile().getDisplayName()
                : (user.getEmail() != null ? user.getEmail().split("@")[0] : "Giáo viên MIDORI");

        String professionalTitle = (user.getProfile() != null && user.getProfile().getProfessionalTitle() != null && !user.getProfile().getProfessionalTitle().isBlank())
                ? user.getProfile().getProfessionalTitle()
                : "Giảng viên Tiếng Nhật MIDORI";

        String teachingLevels = (user.getProfile() != null && user.getProfile().getTeachingLevels() != null && !user.getProfile().getTeachingLevels().isBlank())
                ? user.getProfile().getTeachingLevels()
                : "N5, N4, N3";

        String specializations = (user.getProfile() != null && user.getProfile().getSpecializations() != null && !user.getProfile().getSpecializations().isBlank())
                ? user.getProfile().getSpecializations()
                : "Luyện thi JLPT, Ngữ pháp & Giao tiếp";

        Integer years = (user.getProfile() != null && user.getProfile().getYearsOfExperience() != null)
                ? user.getProfile().getYearsOfExperience()
                : 3;

        String bio = (user.getProfile() != null && user.getProfile().getBio() != null && !user.getProfile().getBio().isBlank())
                ? user.getProfile().getBio()
                : "Giảng viên nhiệt tình, tận tâm hỗ trợ học viên đạt mục tiêu JLPT.";

        List<PublicTeacherCertificateResponse> certificates = certificateRepository.findByTeacherIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(cert -> PublicTeacherCertificateResponse.builder()
                        .id(cert.getId())
                        .title(cert.getTitle())
                        .issuer(cert.getIssuer())
                        .imageUrl(cert.getImageUrl())
                        .build())
                .collect(Collectors.toList());

        return PublicTeacherResponse.builder()
                .id(user.getId())
                .fullName(displayName)
                .avatarUrl(user.getProfile() != null ? user.getProfile().getAvatarUrl() : null)
                .professionalTitle(professionalTitle)
                .teachingLevels(teachingLevels)
                .specializations(specializations)
                .yearsOfExperience(years)
                .shortBiography(bio)
                .certificates(certificates)
                .build();
    }
}
