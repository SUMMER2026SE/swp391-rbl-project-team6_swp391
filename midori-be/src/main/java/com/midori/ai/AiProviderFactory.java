package com.midori.ai;

import com.midori.ai.config.AiConfigProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Factory for resolving AI providers based on configuration.
 * 
 * Replaces the old AiProviderFactory which only worked with the old AiProvider interface.
 */
@Slf4j
@Component
public class AiProviderFactory {

    private final AiConfigProperties config;
    private final List<AiProvider> providers;

    public AiProviderFactory(AiConfigProperties config, List<AiProvider> providers) {
        this.config = config;
        this.providers = providers;
    }

    /**
     * Resolve the configured provider.
     */
    public AiProvider resolve() {
        AiProviderType requested = AiProviderType.valueOf(config.getProvider().toUpperCase());
        return resolve(requested);
    }

    /**
     * Resolve a specific provider type.
     */
    public AiProvider resolve(AiProviderType requested) {
        return providers.stream()
                .filter(p -> p.getType() == requested)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "AI provider '" + requested + "' is not available. " +
                        "Check that the corresponding library is on the classpath and api-key is configured."));
    }

    /**
     * Try to resolve preferred provider, fallback to first available if not configured.
     */
    public AiProvider resolveOrDefault(AiProviderType preferred) {
        try {
            AiProvider preferredProvider = resolve(preferred);
            if (preferredProvider.isConfigured()) {
                return preferredProvider;
            }
        } catch (Exception e) {
            log.warn("Preferred AI provider '{}' not available or not configured.", preferred);
        }
        
        // Fall back to first configured provider
        return findFirstConfigured()
                .orElseThrow(() -> new IllegalStateException(
                        "No working AI provider found. Please configure at least one API key."));
    }

    /**
     * Find the first configured provider.
     */
    public java.util.Optional<AiProvider> findFirstConfigured() {
        return providers.stream()
                .filter(AiProvider::isConfigured)
                .findFirst();
    }

    /**
     * Get all available providers.
     */
    public List<AiProvider> getAllAvailable() {
        return providers;
    }

    /**
     * Get all configured providers.
     */
    public List<AiProvider> getAllConfigured() {
        return providers.stream()
                .filter(AiProvider::isConfigured)
                .toList();
    }

    /**
     * Find the first working provider by testing them.
     */
    public AiProvider findFirstWorking() {
        for (AiProvider p : providers) {
            if (!p.isConfigured()) {
                log.debug("Skipping {} - not configured", p.getName());
                continue;
            }
            try {
                log.info("Testing AI provider: {}", p.getName());
                return p;
            } catch (Exception e) {
                log.warn("Provider {} not available: {}", p.getName(), e.getMessage());
            }
        }
        throw new IllegalStateException("No working AI provider found. Please configure at least one API key.");
    }
}
