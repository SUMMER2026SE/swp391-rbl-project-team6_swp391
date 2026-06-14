package com.midori.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BanUserRequest {

    @NotBlank(message = "Ban reason is required")
    @Size(max = 1000, message = "Ban reason must not exceed 1000 characters")
    private String reason;
}
