package com.midori.dto.classdto;

import com.midori.entity.ClassEntity.ClassStatus;
import com.midori.entity.GrammarLevel;
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
public class ClassResponse {
    private UUID id;
    private String name;
    private GrammarLevel level;
    private Integer maxStudents;
    private String description;
    private ClassStatus status;
    private UUID teacherId;
    private String teacherName;
    private Integer studentCount;
    private Integer homeworkCount;
    private Integer upcomingExamCount;
    private Instant createdAt;
    private Instant updatedAt;
}
