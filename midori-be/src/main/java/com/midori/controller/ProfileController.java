package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.request.UpdateProfileRequest;
import com.midori.dto.response.ProfileResponse;
import com.midori.security.CustomUserDetails;
import com.midori.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponse>> getCurrentProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ProfileResponse profile = profileService.getCurrentUserProfile(userDetails.getEmail());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateCurrentProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        ProfileResponse profile = profileService.updateCurrentUserProfile(
                userDetails.getEmail(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }
}
