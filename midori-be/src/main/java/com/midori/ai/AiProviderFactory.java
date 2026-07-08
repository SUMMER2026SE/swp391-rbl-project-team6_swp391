package com.midori.ai;

import com.midori.ai.config.AiConfigProperties;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AiProviderFactory {

    private static final Logger log = LoggerFactory.getLogger(AiProviderFactory.class);

    private final AiConfigProperties config;
    private final List<AiProvider> providers;

    public AiProviderFactory(AiConfigProperties config, List<AiProvider> providers) {
        this.config = config;
        this.providers = providers;
    }

    public AiProvider resolve() {
        AiProviderType requested = AiProviderType.valueOf(config.getProvider().toUpperCase());

        return providers.stream()
                .filter(p -> p.getType() == requested)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "AI provider '" + requested + "' is not available. " +
                        "Check that the corresponding library is on the classpath and api-key is configured."));
    }

    public AiProvider resolveOrDefault(AiProviderType preferred) {
        AiProvider primary = resolve();
        if (primary.getType() == preferred) {
            return primary;
        }
        log.warn("Primary AI provider '{}' is not configured ({}). Using '{}' instead.",
                preferred, primary.getName(), primary.getType());
        return primary;
    }

    public List<AiProvider> getAllAvailable() {
        return providers;
    }

    public AiProvider findFirstWorking() {
        for (AiProvider p : providers) {
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
