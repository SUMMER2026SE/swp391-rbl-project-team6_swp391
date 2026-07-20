package com.midori.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class VideoUploadedEvent extends ApplicationEvent {

    private final UUID videoId;

    public VideoUploadedEvent(Object source, UUID videoId) {
        super(source);
        this.videoId = videoId;
    }
}
