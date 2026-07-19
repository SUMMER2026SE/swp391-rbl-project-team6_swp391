package com.midori.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.service.impl.DictionaryCacheServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DictionaryCacheServiceTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    private ObjectMapper objectMapper = new ObjectMapper();

    private DictionaryCacheServiceImpl cacheService;

    @BeforeEach
    void setUp() {
        cacheService = new DictionaryCacheServiceImpl(redisTemplate, objectMapper);
    }

    @Test
    @DisplayName("should return cached value on cache hit")
    void testGetOrFetch_cacheHit() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("key")).thenReturn("cachedValue");

        Supplier<String> dbFetch = mock(Supplier.class);

        String result = cacheService.getOrFetch("key", String.class, dbFetch, 1, TimeUnit.HOURS);

        assertEquals("cachedValue", result);
        verify(valueOperations).get("key");
        verifyNoInteractions(dbFetch);
    }

    @Test
    @DisplayName("should call supplier and write to cache on cache miss")
    void testGetOrFetch_cacheMiss() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("key")).thenReturn(null);

        Supplier<String> dbFetch = () -> "newValue";

        String result = cacheService.getOrFetch("key", String.class, dbFetch, 1, TimeUnit.HOURS);

        assertEquals("newValue", result);
        verify(valueOperations).get("key");
        verify(valueOperations).set("key", "newValue", 1, TimeUnit.HOURS);
    }

    @Test
    @DisplayName("should fall back to database gracefully when Redis throws an exception")
    void testGetOrFetch_redisExceptionFallback() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("key")).thenThrow(new RuntimeException("Redis connection refused"));

        Supplier<String> dbFetch = () -> "newValue";

        String result = cacheService.getOrFetch("key", String.class, dbFetch, 1, TimeUnit.HOURS);

        assertEquals("newValue", result);
        verify(valueOperations).get("key");
    }

    @Test
    @DisplayName("should evict single key successfully")
    void testEvict() {
        cacheService.evict("key");
        verify(redisTemplate).delete("key");
    }

    @Test
    @DisplayName("should evict keys by pattern successfully")
    void testEvictAll() {
        Set<String> mockKeys = Set.of("key1", "key2");
        when(redisTemplate.keys("pattern*")).thenReturn(mockKeys);

        cacheService.evictAll("pattern*");

        verify(redisTemplate).keys("pattern*");
        verify(redisTemplate).delete(mockKeys);
    }
}
