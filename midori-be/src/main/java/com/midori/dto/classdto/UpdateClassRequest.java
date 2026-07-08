package com.midori.dto.classdto;

import com.midori.entity.GrammarLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateClassRequest {

    @NotBlank(message = "Class name is required")
    @Size(max = 255, message = "Class name must not exceed 255 characters")
    private String name;

    @NotNull(message = "Level is required")
    private GrammarLevel level;

    @NotNull(message = "Max students is required")
    private Integer maxStudents;

    private String description;

    private UUID teacherId;
}
