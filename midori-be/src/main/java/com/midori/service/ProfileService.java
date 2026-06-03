package com.midori.service;

import com.midori.dto.request.UpdateProfileRequest;
import com.midori.dto.response.ProfileResponse;
import com.midori.entity.User;
import com.midori.entity.UserProfile;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.UserProfileRepository;
import com.midori.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional(readOnly = true)
    public ProfileResponse getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user"));

        return toProfileResponse(profile);
    }

    @Transactional
    public ProfileResponse updateCurrentUserProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserProfile newProfile = UserProfile.builder()
                            .user(user)
                            .build();
                    return userProfileRepository.save(newProfile);
                });

        if (request.getDisplayName() != null) {
            profile.setDisplayName(request.getDisplayName());
        }
        String avatarUrl = request.getAvatarUrl();
        if (avatarUrl != null) {
            profile.setAvatarUrl(avatarUrl.isBlank() ? null : avatarUrl);
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getPhone() != null) {
            profile.setPhone(request.getPhone());
        }
        if (request.getLocation() != null) {
            profile.setLocation(request.getLocation());
        }
        if (request.getDateOfBirth() != null) {
            profile.setDateOfBirth(request.getDateOfBirth());
        }

        profile = userProfileRepository.save(profile);
        return toProfileResponse(profile);
    }

    private ProfileResponse toProfileResponse(UserProfile profile) {
        return ProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .displayName(profile.getDisplayName())
                .avatarUrl(profile.getAvatarUrl())
                .bio(profile.getBio())
                .phone(profile.getPhone())
                .location(profile.getLocation())
                .dateOfBirth(profile.getDateOfBirth())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
