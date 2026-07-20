package com.midori.config;

import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserProfile;
import com.midori.entity.UserStatus;
import com.midori.repository.UserProfileRepository;
import com.midori.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Slf4j
@Configuration
@RequiredArgsConstructor
@Profile("local")
public class AdminBootstrapConfig {

    private final AdminBootstrapProperties adminProperties;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public ApplicationRunner adminBootstrapRunner() {
        return args -> {
            if (!adminProperties.isBootstrapEnabled()) {
                log.info("[AdminBootstrap] Bootstrap is disabled (app.admin.bootstrap-enabled=false). Skipping.");
                return;
            }

            String adminEmail = adminProperties.getEmail();
            String adminPassword = adminProperties.getPassword();

            java.util.Optional<User> existingUserOpt = userRepository.findByEmail(adminEmail);
            if (existingUserOpt.isPresent()) {
                User existingUser = existingUserOpt.get();
                if (existingUser.getRole() == Role.ADMIN) {
                    log.info("[AdminBootstrap] Admin {} already exists. Syncing/updating password to match configuration...", adminEmail);
                    existingUser.setPasswordHash(passwordEncoder.encode(adminPassword));
                    existingUser.setStatus(UserStatus.ACTIVE);
                    existingUser.setEmailVerified(true);
                    userRepository.save(existingUser);
                } else {
                    log.warn("[AdminBootstrap] Configured admin email {} already exists but is associated with role: {}. Skipping password update.",
                            adminEmail, existingUser.getRole());
                }
                return;
            }

            if (!userRepository.findByRoleAndStatus(Role.ADMIN, UserStatus.ACTIVE).isEmpty()) {
                log.info("[AdminBootstrap] Active admin already exists under a different email. Skip local bootstrap.");
                return;
            }

            User admin = User.builder()
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminProperties.getPassword()))
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .build();

            admin = userRepository.save(admin);
            log.info("[AdminBootstrap] Created local admin: {}", adminEmail);

            UserProfile adminProfile = UserProfile.builder()
                    .user(admin)
                    .displayName("Admin")
                    .build();
            userProfileRepository.save(adminProfile);
            log.info("[AdminBootstrap] Created profile for admin: {}", adminEmail);
        };
    }
}
