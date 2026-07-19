package com.midori.service;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

public interface DictionaryCacheService {
    <T> T getOrFetch(String key, Class<T> clazz, Supplier<T> dbFetch, long timeout, TimeUnit unit);
    void evict(String key);
    void evictAll(String pattern);
}
