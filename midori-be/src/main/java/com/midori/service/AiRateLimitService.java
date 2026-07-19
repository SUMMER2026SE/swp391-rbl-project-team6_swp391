package com.midori.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Per-user in-memory rate limiter for AI endpoints.
 *
 * <p>Implements sliding-window counters with automatic expiry.
 * Separate limits are maintained for:
 * <ul>
 *   <li>Chat: 20 requests per user per 1 minute</li>
 *   <li>Quiz generation: 10 requests per user per 1 minute</li>
 * </ul>
 *
 * <p><strong>Important:</strong> This limiter is per-JVM-instance.
 * In a multi-instance deployment, each instance maintains its own counters.
 * For distributed rate limiting, consider using Redis or similar.
 */
@Service
@Slf4j
public class AiRateLimitService {

    private static final int CHAT_REQUESTS_PER_WINDOW = 20;
    private static final Duration CHAT_WINDOW_DURATION = Duration.ofMinutes(1);

    private static final int QUIZ_REQUESTS_PER_WINDOW = 10;
    private static final Duration QUIZ_WINDOW_DURATION = Duration.ofMinutes(1);

    private static final Duration CLEANUP_INTERVAL = Duration.ofMinutes(5);

    private final Map<UUID, UserRateLimits> chatLimits = new ConcurrentHashMap<>();
    private final Map<UUID, UserRateLimits> quizLimits = new ConcurrentHashMap<>();

    private volatile Instant lastCleanup;
    private Clock clock = Clock.systemUTC();

    public AiRateLimitService() {
        this.lastCleanup = Instant.now();
    }

    AiRateLimitService(Clock clock) {
        this.clock = clock;
        this.lastCleanup = Instant.now(clock);
    }

    void setClock(Clock clock) {
        this.clock = clock;
    }

    private Instant now() {
        return Instant.now(clock);
    }

    private static class UserRateLimits {
        private final AtomicInteger count;
        private final Instant windowStart;

        UserRateLimits(Instant windowStart) {
            this.count = new AtomicInteger(0);
            this.windowStart = windowStart;
        }

        UserRateLimits(AtomicInteger count, Instant windowStart) {
            this.count = new AtomicInteger(count.get());
            this.windowStart = windowStart;
        }

        UserRateLimits(int initialCount, Instant windowStart) {
            this.count = new AtomicInteger(initialCount);
            this.windowStart = windowStart;
        }

        int getCount() {
            return count.get();
        }

        Instant getWindowStart() {
            return windowStart;
        }
    }

    /**
     * Check and increment chat rate limit counter for the given user.
     *
     * @param userId the authenticated user's UUID
     * @throws RateLimitExceededException if the rate limit is exceeded
     */
    public void checkAndIncrementChat(UUID userId) {
        checkAndIncrement(userId, chatLimits, CHAT_REQUESTS_PER_WINDOW, CHAT_WINDOW_DURATION, "chat");
    }

    /**
     * Check and increment quiz generation rate limit counter for the given user.
     *
     * @param userId the authenticated user's UUID
     * @throws RateLimitExceededException if the rate limit is exceeded
     */
    public void checkAndIncrementQuizGeneration(UUID userId) {
        checkAndIncrement(userId, quizLimits, QUIZ_REQUESTS_PER_WINDOW, QUIZ_WINDOW_DURATION, "quiz");
    }

    private void checkAndIncrement(UUID userId, Map<UUID, UserRateLimits> limits,
                                   int maxRequests, Duration windowDuration, String operation) {
        triggerPeriodicCleanup();
        Instant currentTime = now();

        UserRateLimits userLimit = limits.compute(userId, (key, existing) -> {
            if (existing == null) {
                return new UserRateLimits(currentTime);
            }

            Duration elapsed = Duration.between(existing.getWindowStart(), currentTime);
            if (elapsed.compareTo(windowDuration) >= 0) {
                return new UserRateLimits(currentTime);
            }

            existing.count.incrementAndGet();
            return existing;
        });

        int currentCount = userLimit.getCount();
        if (currentCount >= maxRequests) {
            Duration retryAfter = windowDuration.minus(Duration.between(userLimit.getWindowStart(), currentTime));
            long secondsRemaining = Math.max(1, retryAfter.getSeconds());
            log.warn("[AiRateLimitService] Rate limit exceeded for userId={} on {} operation: {} requests in window, max={}",
                    userId, operation, currentCount, maxRequests);
            throw new RateLimitExceededException(
                    "Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ khoảng " + secondsRemaining + " giây trước khi thử lại.",
                    secondsRemaining);
        }

        log.debug("[AiRateLimitService] {} operation for userId={}: {}/{} in current window",
                operation, userId, currentCount, maxRequests);
    }

    private void triggerPeriodicCleanup() {
        Instant now = now();
        if (Duration.between(lastCleanup, now).compareTo(CLEANUP_INTERVAL) >= 0) {
            synchronized (this) {
                if (Duration.between(lastCleanup, now).compareTo(CLEANUP_INTERVAL) >= 0) {
                    cleanupExpiredEntries();
                    lastCleanup = now;
                }
            }
        }
    }

    private void cleanupExpiredEntries() {
        Instant now = now();

        int chatRemoved = cleanupMap(chatLimits, now, CHAT_WINDOW_DURATION);
        int quizRemoved = cleanupMap(quizLimits, now, QUIZ_WINDOW_DURATION);

        if (chatRemoved > 0 || quizRemoved > 0) {
            log.info("[AiRateLimitService] Cleaned up {} expired chat entries and {} expired quiz entries",
                    chatRemoved, quizRemoved);
        }
    }

    private int cleanupMap(Map<UUID, UserRateLimits> limits, Instant now, Duration windowDuration) {
        int removed = 0;
        var iterator = limits.entrySet().iterator();
        while (iterator.hasNext()) {
            var entry = iterator.next();
            Duration elapsed = Duration.between(entry.getValue().getWindowStart(), now);
            if (elapsed.compareTo(windowDuration) >= 0) {
                iterator.remove();
                removed++;
            }
        }
        return removed;
    }

    /**
     * Get remaining requests for a user on chat operations.
     * Used for informational purposes (e.g., API responses).
     */
    public int getRemainingChatRequests(UUID userId) {
        return getRemainingRequests(userId, chatLimits, CHAT_REQUESTS_PER_WINDOW, CHAT_WINDOW_DURATION);
    }

    /**
     * Get remaining requests for a user on quiz generation operations.
     * Used for informational purposes (e.g., API responses).
     */
    public int getRemainingQuizRequests(UUID userId) {
        return getRemainingRequests(userId, quizLimits, QUIZ_REQUESTS_PER_WINDOW, QUIZ_WINDOW_DURATION);
    }

    private int getRemainingRequests(UUID userId, Map<UUID, UserRateLimits> limits,
                                    int maxRequests, Duration windowDuration) {
        Instant currentTime = now();
        UserRateLimits userLimit = limits.get(userId);
        if (userLimit == null) {
            return maxRequests;
        }

        Duration elapsed = Duration.between(userLimit.getWindowStart(), currentTime);
        if (elapsed.compareTo(windowDuration) >= 0) {
            return maxRequests;
        }

        return Math.max(0, maxRequests - userLimit.getCount());
    }

    /**
     * Exception thrown when rate limit is exceeded.
     */
    public static class RateLimitExceededException extends RuntimeException {
        private final long retryAfterSeconds;

        public RateLimitExceededException(String message, long retryAfterSeconds) {
            super(message);
            this.retryAfterSeconds = retryAfterSeconds;
        }

        public long getRetryAfterSeconds() {
            return retryAfterSeconds;
        }
    }
}
