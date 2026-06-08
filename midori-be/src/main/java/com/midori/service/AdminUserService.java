package com.midori.service;

import com.midori.dto.response.UserResponse;
import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserResponse> getPendingTeachers() {
        List<User> pendingTeachers = userRepository.findByRoleAndStatus(Role.TEACHER, UserStatus.PENDING_APPROVAL);
        return pendingTeachers.stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getActiveTeachers() {
        List<User> activeTeachers = userRepository.findByRoleAndStatus(Role.TEACHER, UserStatus.ACTIVE);
        return activeTeachers.stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse approveTeacher(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() != Role.TEACHER) {
            throw new BadRequestException("Only teacher accounts can be approved");
        }

        if (user.getStatus() != UserStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Teacher account is not pending approval");
        }

        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.save(user);

        log.info("Approved teacher: {} ({})", user.getEmail(), userId);
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse suspendUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setStatus(UserStatus.SUSPENDED);
        user = userRepository.save(user);

        log.info("Suspended user: {} ({})", user.getEmail(), userId);
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse activateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.save(user);

        log.info("Activated user: {} ({})", user.getEmail(), userId);
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .emailVerified(user.getEmailVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
