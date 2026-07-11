package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.classdto.ClassResponse;
import com.midori.entity.ClassEntity;
import com.midori.exception.ResourceNotFoundException;
import com.midori.service.ClassService;
import com.midori.repository.UserRepository;
import com.midori.repository.HomeworkRepository;
import com.midori.repository.ExamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;import com.midori.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'STUDENT')")
public class ClassController {

    private final ClassService classService;
    private final UserRepository userRepository;
    private final HomeworkRepository homeworkRepository;
    private final ExamRepository examRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getAllClasses(
            @RequestParam(required = false) String status) {
        List<ClassEntity> allEntities = classService.getAllClasses(status);

        // Perform exactly 3 aggregated GROUP BY queries to get all counts
        Map<UUID, Long> studentCounts = userRepository.countStudentsPerClass().stream()
                .filter(arr -> arr[0] != null)
                .collect(Collectors.toMap(
                        arr -> (UUID) arr[0],
                        arr -> (Long) arr[1],
                        (v1, v2) -> v1
                ));

        Map<UUID, Long> homeworkCounts = homeworkRepository.countActiveHomeworkPerClass().stream()
                .filter(arr -> arr[0] != null)
                .collect(Collectors.toMap(
                        arr -> (UUID) arr[0],
                        arr -> (Long) arr[1],
                        (v1, v2) -> v1
                ));

        Map<UUID, Long> examCounts = examRepository.countUpcomingExamsPerClass().stream()
                .filter(arr -> arr[0] != null)
                .collect(Collectors.toMap(
                        arr -> (UUID) arr[0],
                        arr -> (Long) arr[1],
                        (v1, v2) -> v1
                ));

        List<ClassResponse> classes = allEntities.stream()
                .map(c -> mapToClassResponse(c, studentCounts, homeworkCounts, examCounts))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(classes));
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @PatchMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<ClassResponse>> archiveClass(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ClassResponse response = classService.archiveClass(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Class archived successfully", response));
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<ClassResponse>> restoreClass(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ClassResponse response = classService.restoreClass(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Class restored successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassResponse>> getClassById(@PathVariable UUID id) {
        ClassEntity classEntity = classService.getClassById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", id));
        
        // Single detail fetch fallback maps
        Map<UUID, Long> studentCounts = userRepository.countStudentsPerClass().stream()
                .filter(arr -> arr[0] != null)
                .collect(Collectors.toMap(arr -> (UUID) arr[0], arr -> (Long) arr[1], (v1, v2) -> v1));
        Map<UUID, Long> homeworkCounts = homeworkRepository.countActiveHomeworkPerClass().stream()
                .filter(arr -> arr[0] != null)
                .collect(Collectors.toMap(arr -> (UUID) arr[0], arr -> (Long) arr[1], (v1, v2) -> v1));
        Map<UUID, Long> examCounts = examRepository.countUpcomingExamsPerClass().stream()
                .filter(arr -> arr[0] != null)
                .collect(Collectors.toMap(arr -> (UUID) arr[0], arr -> (Long) arr[1], (v1, v2) -> v1));

        return ResponseEntity.ok(ApiResponse.success(mapToClassResponse(classEntity, studentCounts, homeworkCounts, examCounts)));
    }

    private ClassResponse mapToClassResponse(
            ClassEntity classEntity,
            Map<UUID, Long> studentCounts,
            Map<UUID, Long> homeworkCounts,
            Map<UUID, Long> examCounts) {
        if (classEntity == null) return null;

        int studentCount = studentCounts.getOrDefault(classEntity.getId(), 0L).intValue();
        int homeworkCount = homeworkCounts.getOrDefault(classEntity.getId(), 0L).intValue();
        int examCount = examCounts.getOrDefault(classEntity.getId(), 0L).intValue();

        return ClassResponse.builder()
                .id(classEntity.getId())
                .name(classEntity.getName())
                .level(classEntity.getLevel())
                .maxStudents(classEntity.getMaxStudents())
                .description(classEntity.getDescription())
                .status(classEntity.getStatus())
                .teacherId(classEntity.getTeacher() != null ? classEntity.getTeacher().getId() : null)
                .studentCount(studentCount)
                .homeworkCount(homeworkCount)
                .upcomingExamCount(examCount)
                .createdAt(classEntity.getCreatedAt())
                .updatedAt(classEntity.getUpdatedAt())
                .build();
    }
}
