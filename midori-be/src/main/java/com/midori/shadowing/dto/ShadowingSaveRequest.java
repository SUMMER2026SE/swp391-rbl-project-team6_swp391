package com.midori.shadowing.dto;

import java.util.List;

public class ShadowingSaveRequest {
    private String id;
    private String title;
    private String topic;
    private String videoUrl;
    private double duration;
    private List<ShadowingSentenceDto> sentences;
    private List<ShadowingSegmentDto> segments;

    public ShadowingSaveRequest() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public double getDuration() {
        return duration;
    }

    public void setDuration(double duration) {
        this.duration = duration;
    }

    public List<ShadowingSentenceDto> getSentences() {
        return sentences;
    }

    public void setSentences(List<ShadowingSentenceDto> sentences) {
        this.sentences = sentences;
    }

    public List<ShadowingSegmentDto> getSegments() {
        return segments;
    }

    public void setSegments(List<ShadowingSegmentDto> segments) {
        this.segments = segments;
    }
}
