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
    private final com.midori.repository.ClassRepository classRepository;

    @GetMapping("/fix-class-codes")
    public ResponseEntity<ApiResponse<String>> fixClassCodes() {
        List<ClassEntity> classes = classRepository.findAll();
        int count = 0;
        for (ClassEntity c : classes) {
            if (c.getClassCode() == null || c.getClassCode().isEmpty()) {
                String levelName = c.getLevel().name();
                String code = "JP26" + levelName + String.format("%04d", count + 1);
                c.setClassCode(code);
                classRepository.save(c);
                count++;
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Fixed " + count + " class codes"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getAllClasses(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
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
                .filter(c -> !"TEACHER".equals(userDetails.getRole()) || (c.getTeacher() != null && c.getTeacher().getId().equals(userDetails.getId())))
                .map(c -> mapToClassResponse(c, studentCounts, homeworkCounts, examCounts))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(classes));
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteClass(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        classService.deleteClass(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Class deleted successfully", null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassResponse>> getClassById(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ClassEntity classEntity = classService.getClassById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", id));
        
        if ("TEACHER".equals(userDetails.getRole()) && 
                (classEntity.getTeacher() == null || !classEntity.getTeacher().getId().equals(userDetails.getId()))) {
            throw new com.midori.exception.UnauthorizedException("You are not authorized to view this class");
        }
        
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

        // Get teacher name from profile or use email as fallback
        String teacherName = null;
        if (classEntity.getTeacher() != null) {
            if (classEntity.getTeacher().getProfile() != null
                    && classEntity.getTeacher().getProfile().getDisplayName() != null) {
                teacherName = classEntity.getTeacher().getProfile().getDisplayName();
            } else {
                teacherName = classEntity.getTeacher().getEmail();
            }
        }

        return ClassResponse.builder()
                .id(classEntity.getId())
                .name(classEntity.getName())
                .level(classEntity.getLevel())
                .maxStudents(classEntity.getMaxStudents())
                .description(classEntity.getDescription())
                .classCode(classEntity.getClassCode())
                .status(classEntity.getStatus())
                .teacherId(classEntity.getTeacher() != null ? classEntity.getTeacher().getId() : null)
                .teacherName(teacherName)
                .studentCount(studentCount)
                .homeworkCount(homeworkCount)
                .upcomingExamCount(examCount)
                .createdAt(classEntity.getCreatedAt())
                .updatedAt(classEntity.getUpdatedAt())
                .build();
    }
    @GetMapping("/delete-archived")
    public ResponseEntity<ApiResponse<String>> deleteArchivedClasses() {
        List<ClassEntity> classes = classRepository.findAll();
        int count = 0;
        for (ClassEntity c : classes) {
            if (c.getStatus() == ClassEntity.ClassStatus.ARCHIVED) {
                // Manually break relationships to avoid constraint violations
                List<com.midori.entity.User> students = new java.util.ArrayList<>(c.getStudents());
                for (com.midori.entity.User student : students) {
                    student.getAssignedClasses().remove(c);
                    userRepository.save(student);
                }
                c.getStudents().clear();
                
                List<com.midori.entity.Exam> exams = examRepository.findByAssignedClassId(c.getId());
                if (!exams.isEmpty()) {
                    examRepository.deleteAll(exams);
                }
        
                List<com.midori.entity.Homework> homeworks = homeworkRepository.findByAssignedClassId(c.getId());
                if (!homeworks.isEmpty()) {
                    homeworkRepository.deleteAll(homeworks);
                }
                
                classRepository.delete(c);
                count++;
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Deleted " + count + " archived classes"));
    }
}
