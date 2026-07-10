package com.midori.config;

import com.midori.websocket.NotificationWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * Registers the raw-WebSocket endpoint used for push notifications.
 *
 * We deliberately use plain WebSocket (no STOMP) so the frontend can connect
 * with the browser-native {@link WebSocket} API and a single JSON contract.
 * Authentication is performed inside the handler using a `token` query
 * parameter, which is the standard workaround for browsers that cannot send
 * custom headers on the WS upgrade request.
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final NotificationWebSocketHandler notificationWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(notificationWebSocketHandler, "/ws/notifications")
                .setAllowedOrigins(
                        "http://localhost:5173",
                        "http://localhost:8081",
                        "http://localhost:3000",
                        "http://127.0.0.1:5173",
                        "http://127.0.0.1:8081",
                        "http://127.0.0.1:3000"
                );
    }
}