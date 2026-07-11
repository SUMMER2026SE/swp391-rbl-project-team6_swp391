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
public class AdminClassResponse {
    private UUID id;
    private String name;
    private String teacher;
    private UUID teacherId;
    private GrammarLevel level;
    private Integer students;
    private Integer maxStudents;
    private ClassStatus status;
    private Instant createdAt;
    private String description;
}
