package com.midori.service;

import com.midori.entity.User;
import com.midori.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class StreakService {

    private final UserRepository userRepository;

    /**
     * Updates the user's daily streak based on the current login date.
     * - First login ever: streak = 1
     * - Same day as last login: streak unchanged
     * - Next day after last login: streak + 1
     * - Any later gap (>= 2 days): streak reset to 1
     */
    @Transactional
    public void updateOnLogin(User user) {
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        LocalDate last = user.getLastLoginDate();

        Integer current = user.getCurrentStreak() == null ? 0 : user.getCurrentStreak();
        int nextStreak;

        if (last == null) {
            // First login ever
            nextStreak = 1;
        } else if (last.equals(today)) {
            // Already logged in today — keep current streak
            nextStreak = current;
        } else {
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(last, today);
            if (daysBetween == 1L) {
                nextStreak = current + 1;
            } else {
                // Missed at least one day — reset
                nextStreak = 1;
            }
        }

        user.setCurrentStreak(nextStreak);
        user.setLastLoginDate(today);
        userRepository.save(user);
    }
}
