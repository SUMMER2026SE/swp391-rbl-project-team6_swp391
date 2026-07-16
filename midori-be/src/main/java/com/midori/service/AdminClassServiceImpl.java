package com.midori.service;

import com.midori.entity.ClassEntity;
import com.midori.entity.UserStatus;
import com.midori.dto.classdto.AdminClassResponse;
import com.midori.dto.classdto.ClassResponse;
import com.midori.dto.classdto.CreateClassRequest;
import com.midori.dto.classdto.UpdateClassRequest;
import com.midori.dto.classdto.StudentClassResponse;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.ArrayList;

@Service
@Primary
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminClassServiceImpl implements AdminClassService {

    private final ClassRepository classRepository;
    private final ClassService classService;

    @Override
    public List<AdminClassResponse> getAdminClasses() {
        return classRepository.findAll().stream()
                .map(this::mapToAdminClassResponse)
                .toList();
    }

    @Override
    public List<AdminClassResponse> getAdminClassesByTeacher(UUID teacherId) {
        return classRepository.findByTeacherId(teacherId).stream()
                .map(this::mapToAdminClassResponse)
                .toList();
    }

    @Override
    public AdminClassResponse getAdminClassById(UUID id) {
        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", id));
        return mapToAdminClassResponse(classEntity);
    }

    @Override
    @Transactional
    public AdminClassResponse createClass(CreateClassRequest request, UUID teacherId) {
        classService.createClass(request, teacherId);
        // Re-fetch to get the full AdminClassResponse
        ClassEntity saved = classRepository.findAll().stream()
                .filter(c -> c.getName().equals(request.getName()) && c.getTeacher().getId().equals(teacherId))
                .reduce((a, b) -> b)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "name", request.getName()));
        return mapToAdminClassResponse(saved);
    }

    @Override
    @Transactional
    public AdminClassResponse updateClass(UUID classId, UpdateClassRequest request, UUID teacherId) {
        classService.updateClass(classId, request, teacherId);
        ClassEntity updated = classRepository.findByIdWithDetails(classId);
        return mapToAdminClassResponse(updated);
    }

    @Override
    @Transactional
    public AdminClassResponse archiveClass(UUID classId, UUID teacherId) {
        classService.archiveClass(classId, teacherId);
        ClassEntity updated = classRepository.findByIdWithDetails(classId);
        return mapToAdminClassResponse(updated);
    }

    @Override
    @Transactional
    public AdminClassResponse restoreClass(UUID classId, UUID teacherId) {
        classService.restoreClass(classId, teacherId);
        ClassEntity updated = classRepository.findByIdWithDetails(classId);
        return mapToAdminClassResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentClassResponse> getClassStudents(UUID classId) {
        ClassEntity classEntity = classRepository.findByIdWithDetails(classId);
        if (classEntity == null) {
            throw new ResourceNotFoundException("Class", "id", classId);
        }
        List<StudentClassResponse> list = new ArrayList<>();
        if (classEntity.getStudents() != null) {
            for (var student : classEntity.getStudents()) {
                String displayName = null;
                if (student.getProfile() != null) {
                    displayName = student.getProfile().getDisplayName();
                }
                list.add(StudentClassResponse.builder()
                        .studentId(student.getId())
                        .fullName(displayName)
                        .email(student.getEmail())
                        .avatar(student.getProfile() != null ? student.getProfile().getAvatarUrl() : null)
                        .status(student.getStatus() != null ? student.getStatus() : UserStatus.ACTIVE)
                        .build());
            }
        }
        return list;
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
