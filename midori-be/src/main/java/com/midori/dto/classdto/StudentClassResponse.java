package com.midori.dto.classdto;

import com.midori.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentClassResponse {
    private UUID studentId;
    private String fullName;
    private String email;
    private String avatar;
    private UserStatus status;
}
