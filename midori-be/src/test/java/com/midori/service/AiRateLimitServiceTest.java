package com.midori.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for AiRateLimitService focusing on:
 * - Basic rate limiting
 * - Retry-After value
 * - Error message content
 */
class AiRateLimitServiceTest {

    private AiRateLimitService rateLimitService;
    private Clock fixedClock;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2026-07-19T10:00:00Z"), ZoneId.of("UTC"));
        rateLimitService = new AiRateLimitService(fixedClock);
    }

    @Nested
    @DisplayName("Basic Rate Limiting Tests")
    class BasicRateLimitingTests {

        @Test
        @DisplayName("Chat: first request should pass")
        void chat_firstRequest() {
            UUID userId = UUID.randomUUID();
            assertDoesNotThrow(() -> rateLimitService.checkAndIncrementChat(userId));
        }

        @Test
        @DisplayName("Quiz: first request should pass")
        void quiz_firstRequest() {
            UUID userId = UUID.randomUUID();
            assertDoesNotThrow(() -> rateLimitService.checkAndIncrementQuizGeneration(userId));
        }

        @Test
        @DisplayName("After hitting chat limit, rate limit exception is thrown")
        void chat_hitsLimit() {
            UUID userId = UUID.randomUUID();

            for (int i = 0; i < 20; i++) {
                rateLimitService.checkAndIncrementChat(userId);
            }

            AiRateLimitService.RateLimitExceededException exception = assertThrows(
                    AiRateLimitService.RateLimitExceededException.class,
                    () -> rateLimitService.checkAndIncrementChat(userId)
            );

            assertTrue(exception.getRetryAfterSeconds() > 0);
        }

        @Test
        @DisplayName("After hitting quiz limit, rate limit exception is thrown")
        void quiz_hitsLimit() {
            UUID userId = UUID.randomUUID();

            for (int i = 0; i < 10; i++) {
                rateLimitService.checkAndIncrementQuizGeneration(userId);
            }

            AiRateLimitService.RateLimitExceededException exception = assertThrows(
                    AiRateLimitService.RateLimitExceededException.class,
                    () -> rateLimitService.checkAndIncrementQuizGeneration(userId)
            );

            assertTrue(exception.getRetryAfterSeconds() > 0);
        }
    }

    @Nested
    @DisplayName("Remaining Requests Tests")
    class RemainingRequestsTests {

        @Test
        @DisplayName("New user should have full limit remaining")
        void remaining_newUser() {
            UUID userId = UUID.randomUUID();

            assertEquals(20, rateLimitService.getRemainingChatRequests(userId));
            assertEquals(10, rateLimitService.getRemainingQuizRequests(userId));
        }

        @Test
        @DisplayName("Different users have independent limits")
        void remaining_differentUsers() {
            UUID user1 = UUID.randomUUID();
            UUID user2 = UUID.randomUUID();

            for (int i = 0; i < 20; i++) {
                rateLimitService.checkAndIncrementChat(user1);
            }

            int remaining1 = rateLimitService.getRemainingChatRequests(user1);
            int remaining2 = rateLimitService.getRemainingChatRequests(user2);

            assertTrue(remaining1 < 20, "User 1 remaining should be less than full limit");
            assertEquals(20, remaining2, "User 2 should still have full limit");
        }
    }

    @Nested
    @DisplayName("Error Message Tests")
    class ErrorMessageTests {

        @Test
        @DisplayName("Error message should be in Vietnamese")
        void errorMessage_vietnamese() {
            UUID userId = UUID.randomUUID();

            for (int i = 0; i < 20; i++) {
                rateLimitService.checkAndIncrementChat(userId);
            }

            AiRateLimitService.RateLimitExceededException exception = assertThrows(
                    AiRateLimitService.RateLimitExceededException.class,
                    () -> rateLimitService.checkAndIncrementChat(userId)
            );

            assertTrue(exception.getMessage().contains("giây"),
                    "Error message should contain 'giây' (Vietnamese for seconds)");
        }

        @Test
        @DisplayName("Error message should not expose API keys or tokens")
        void errorMessage_noSensitiveData() {
            UUID userId = UUID.randomUUID();

            for (int i = 0; i < 20; i++) {
                rateLimitService.checkAndIncrementChat(userId);
            }

            AiRateLimitService.RateLimitExceededException exception = assertThrows(
                    AiRateLimitService.RateLimitExceededException.class,
                    () -> rateLimitService.checkAndIncrementChat(userId)
            );

            String lowerMessage = exception.getMessage().toLowerCase();
            assertFalse(lowerMessage.contains("api"), "Should not contain 'api'");
            assertFalse(lowerMessage.contains("key"), "Should not contain 'key'");
            assertFalse(lowerMessage.contains("token"), "Should not contain 'token'");
            assertFalse(lowerMessage.contains("secret"), "Should not contain 'secret'");
        }

        @Test
        @DisplayName("Retry-After should be positive")
        void retryAfter_positive() {
            UUID userId = UUID.randomUUID();

            for (int i = 0; i < 20; i++) {
                rateLimitService.checkAndIncrementChat(userId);
            }

            AiRateLimitService.RateLimitExceededException exception = assertThrows(
                    AiRateLimitService.RateLimitExceededException.class,
                    () -> rateLimitService.checkAndIncrementChat(userId)
            );

            assertTrue(exception.getRetryAfterSeconds() > 0,
                    "Retry-After should be positive");
        }
    }
}
