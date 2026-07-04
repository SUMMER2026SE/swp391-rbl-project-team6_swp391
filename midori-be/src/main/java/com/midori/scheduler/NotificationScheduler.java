package com.midori.scheduler;

import com.midori.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically picks up due scheduled notifications and dispatches them.
 * Activation is local to this class so that enabling scheduling does not
 * affect the rest of the application context.
 */
@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class NotificationScheduler {

    private final NotificationService notificationService;

    /**
     * Runs every minute. Looks for notifications whose scheduledAt has elapsed
     * but which have not been sent yet, then sends them.
     */
    @Scheduled(fixedDelayString = "${midori.notification.scheduler.fixed-delay-ms:60000}",
            initialDelayString = "${midori.notification.scheduler.initial-delay-ms:30000}")
    public void dispatchDueNotifications() {
        try {
            int processed = notificationService.processDueScheduledNotifications();
            if (processed > 0) {
                log.info("NotificationScheduler dispatched {} notification(s)", processed);
            }
        } catch (Exception ex) {
            // Never let scheduler errors break the application
            log.error("NotificationScheduler encountered an error", ex);
        }
    }
}