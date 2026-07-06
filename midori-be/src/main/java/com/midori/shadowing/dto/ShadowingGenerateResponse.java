package com.midori.shadowing.dto;

import java.util.List;

public class ShadowingGenerateResponse {
    private String id;
    private String title;
    private String topic;
    private String videoUrl;
    private double duration;
    private List<ShadowingSentenceDto> sentences;
    private String jlptLevel;

    public ShadowingGenerateResponse() {}

    public ShadowingGenerateResponse(String id, String title, String videoUrl, double duration, String topic, List<ShadowingSentenceDto> sentences) {
        this.id = id;
        this.title = title;
        this.videoUrl = videoUrl;
        this.duration = duration;
        this.topic = topic;
        this.sentences = sentences;
    }

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

    public String getJlptLevel() { return jlptLevel; }
    public void setJlptLevel(String jlptLevel) { this.jlptLevel = jlptLevel; }
}
