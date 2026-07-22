package com.midori.dto.push;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for VAPID public key (needed for frontend to subscribe).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VapidPublicKeyResponse {

    /**
     * The VAPID public key.
     */
    private String publicKey;
}
