package com.midori.config;

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.deser.InstantDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.InstantSerializer;

import java.time.Instant;

/**
 * Centralised Jackson configuration for the application.
 *
 * <p>By default, {@code Jackson2ObjectMapperBuilder} serialises {@code Instant}
 * as the number of epoch milliseconds since 1970-01-01T00:00:00Z.  This causes
 * JavaScript {@code Date} constructors and {@code Date.parse()} to receive a
 * raw number instead of an ISO-8601 string, which is inconsistent with how
 * browsers normally exchange timestamps.
 *
 * <p>This config replaces the default {@code ObjectMapper} with one that
 * registers the built-in {@code JavaTimeModule} so that {@code Instant} is
 * always serialised as an ISO-8601 string such as
 * {@code "2026-07-17T07:40:54.141Z"} — which JavaScript can parse directly.
 *
 * <p>Explicit {@code @JsonFormat} annotations on individual DTO fields remain
 * honoured because the {@code JavaTimeModule} respects per-property overrides.
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        return JsonMapper.builder()
                .addModule(new JavaTimeModule())
                // Write dates as ISO-8601 strings, not as timestamps (numbers).
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();
    }
}
