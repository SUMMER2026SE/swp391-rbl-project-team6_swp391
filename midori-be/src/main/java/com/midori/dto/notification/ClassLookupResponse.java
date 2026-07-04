package com.midori.dto.notification;

import com.midori.entity.ClassEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassLookupResponse {
    private UUID id;
    private String name;
    private String level;
    private Integer maxStudents;
    private Integer studentCount;
    private UUID teacherId;
    private String teacherName;
    private String status;

    public static ClassLookupResponse from(ClassEntity entity, long studentCount) {
        return ClassLookupResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .level(entity.getLevel() != null ? entity.getLevel().name() : null)
                .maxStudents(entity.getMaxStudents())
                .studentCount((int) studentCount)
                .teacherId(entity.getTeacher() != null ? entity.getTeacher().getId() : null)
                .teacherName(entity.getTeacher() != null && entity.getTeacher().getProfile() != null
                        ? entity.getTeacher().getProfile().getDisplayName()
                        : null)
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .build();
    }
}
