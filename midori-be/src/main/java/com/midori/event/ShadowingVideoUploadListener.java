package com.midori.event;

import com.midori.service.ShadowingAiProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class ShadowingVideoUploadListener {

    private final ShadowingAiProcessingService shadowingAiProcessingService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onVideoUploaded(VideoUploadedEvent event) {
        log.info("[Listener] VideoUploadedEvent received for videoId={}. Triggering async AI processing.",
                event.getVideoId());
        shadowingAiProcessingService.processVideoAsync(event.getVideoId());
    }
}
