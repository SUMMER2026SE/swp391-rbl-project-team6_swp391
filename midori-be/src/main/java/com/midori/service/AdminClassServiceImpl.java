package com.midori.service;

import com.midori.entity.ClassEntity;
import com.midori.dto.classdto.AdminClassResponse;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminClassServiceImpl implements AdminClassService {

    private final ClassRepository classRepository;

    @Override
    public List<AdminClassResponse> getAdminClasses() {
        return classRepository.findAll().stream()
                .map(this::mapToAdminClassResponse)
                .toList();
    }

    @Override
    public AdminClassResponse getAdminClassById(UUID id) {
        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", id));
        return mapToAdminClassResponse(classEntity);
    }

    private AdminClassResponse mapToAdminClassResponse(ClassEntity classEntity) {
        if (classEntity == null) return null;
        String teacherName = "";
        UUID teacherId = null;
        if (classEntity.getTeacher() != null) {
            teacherId = classEntity.getTeacher().getId();
            if (classEntity.getTeacher().getProfile() != null && classEntity.getTeacher().getProfile().getDisplayName() != null) {
                teacherName = classEntity.getTeacher().getProfile().getDisplayName();
            } else {
                teacherName = classEntity.getTeacher().getEmail();
            }
        }
        return AdminClassResponse.builder()
                .id(classEntity.getId())
                .name(classEntity.getName())
                .teacher(teacherName)
                .teacherId(teacherId)
                .level(classEntity.getLevel())
                .students(classEntity.getStudents() != null ? classEntity.getStudents().size() : 0)
                .maxStudents(classEntity.getMaxStudents())
                .status(classEntity.getStatus())
                .createdAt(classEntity.getCreatedAt())
                .description(classEntity.getDescription())
                .build();
    }
}
