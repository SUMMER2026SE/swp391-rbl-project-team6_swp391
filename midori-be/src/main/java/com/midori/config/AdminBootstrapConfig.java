package com.midori.config;

import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
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
    private final PasswordEncoder passwordEncoder;

    @Bean
    public ApplicationRunner adminBootstrapRunner() {
        return args -> {
            if (!adminProperties.isBootstrapEnabled()) {
                log.info("[AdminBootstrap] Bootstrap is disabled (app.admin.bootstrap-enabled=false). Skipping.");
                return;
            }

            if (!userRepository.findByRoleAndStatus(Role.ADMIN, UserStatus.ACTIVE).isEmpty()) {
                log.info("[AdminBootstrap] Active admin already exists. Skip local bootstrap.");
                return;
            }

            String adminEmail = adminProperties.getEmail();

            if (userRepository.existsByEmail(adminEmail)) {
                log.warn("[AdminBootstrap] Configured admin email {} already exists but no active admin found. "
                        + "Skip bootstrap to avoid overwriting existing user.", adminEmail);
                return;
            }

            User admin = User.builder()
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminProperties.getPassword()))
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .build();

            userRepository.save(admin);
            log.info("[AdminBootstrap] Created local admin: {}", adminEmail);
        };
    }
}
