package com.midori.dto.classdto;

import com.midori.entity.GrammarLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelectableClassResponse {
    private UUID id;
    private String name;
    private GrammarLevel level;
    private String teacherName;
}
