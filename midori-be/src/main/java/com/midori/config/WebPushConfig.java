package com.midori.config;

import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.PushService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.security.Security;

/**
 * Configuration for Web Push notification.
 * VAPID keys are loaded from environment variables.
 */
@Slf4j
@Configuration
public class WebPushConfig {

    @Value("${webpush.vapid.public-key:}")
    private String vapidPublicKey;

    @Value("${webpush.vapid.private-key:}")
    private String vapidPrivateKey;

    @Value("${webpush.vapid.subject:}")
    private String vapidSubject;

    @Value("${webpush.enabled:true}")
    private boolean webPushEnabled;

    @Bean
    public PushService webPush() {
        // Register BouncyCastle for elliptic curve cryptography
        if (Security.getProvider("BC") == null) {
            Security.addProvider(new org.bouncycastle.jce.provider.BouncyCastleProvider());
        }

        // Check if we have valid VAPID keys
        if (vapidPublicKey == null || vapidPublicKey.isBlank() || vapidPublicKey.equals("YOUR_VAPID_PUBLIC_KEY_HERE") ||
            vapidPrivateKey == null || vapidPrivateKey.isBlank() || vapidPrivateKey.equals("YOUR_VAPID_PRIVATE_KEY_HERE")) {
            
            log.warn("WebPush VAPID keys not configured or placeholder values detected. " +
                     "Push notifications will be disabled. " +
                     "Set webpush.vapid.public-key and webpush.vapid.private-key properties with valid VAPID keys.");
            webPushEnabled = false;
            return null;
        }

        try {
            PushService pushService;
            if (vapidSubject != null && !vapidSubject.isBlank()) {
                pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
            } else {
                pushService = new PushService(vapidPublicKey, vapidPrivateKey);
            }
            
            log.info("WebPush configured successfully with VAPID keys (enabled={})", webPushEnabled);
            return pushService;
        } catch (Exception e) {
            log.error("Failed to initialize WebPush with VAPID keys: {}", e.getMessage());
            webPushEnabled = false;
            return null;
        }
    }

    @Bean
    public boolean isWebPushEnabled() {
        return webPushEnabled && 
               vapidPublicKey != null && !vapidPublicKey.isBlank() &&
               vapidPrivateKey != null && !vapidPrivateKey.isBlank() &&
               !vapidPublicKey.equals("YOUR_VAPID_PUBLIC_KEY_HERE") &&
               !vapidPrivateKey.equals("YOUR_VAPID_PRIVATE_KEY_HERE");
    }

    @Bean
    public String vapidPublicKeyValue() {
        if (vapidPublicKey == null || vapidPublicKey.isBlank() || 
            vapidPublicKey.equals("YOUR_VAPID_PUBLIC_KEY_HERE")) {
            return "";
        }
        return vapidPublicKey;
    }
}
