package com.midori.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.service.DictionaryCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Slf4j
@Service
@RequiredArgsConstructor
public class DictionaryCacheServiceImpl implements DictionaryCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public <T> T getOrFetch(String key, Class<T> clazz, Supplier<T> dbFetch, long timeout, TimeUnit unit) {
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                log.debug("Cache hit for key: {}", key);
                return objectMapper.convertValue(cached, clazz);
            }
        } catch (Exception e) {
            log.warn("Redis read error for key {}: {}. Falling back to database.", key, e.getMessage());
        }

        // Cache miss or Redis error: fetch from DB
        T result = dbFetch.get();

        if (result != null) {
            try {
                redisTemplate.opsForValue().set(key, result, timeout, unit);
                log.debug("Cached value for key: {}", key);
            } catch (Exception e) {
                log.warn("Redis write error for key {}: {}", key, e.getMessage());
            }
        }

        return result;
    }

    @Override
    public void evict(String key) {
        try {
            redisTemplate.delete(key);
            log.info("Evicted cache key: {}", key);
        } catch (Exception e) {
            log.warn("Redis evict error for key {}: {}", key, e.getMessage());
        }
    }

    @Override
    public void evictAll(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("Evicted {} cache keys matching pattern {}", keys.size(), pattern);
            }
        } catch (Exception e) {
            log.warn("Redis evictAll error for pattern {}: {}", pattern, e.getMessage());
        }
    }
}
