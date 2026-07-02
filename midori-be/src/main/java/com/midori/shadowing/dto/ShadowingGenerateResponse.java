package com.midori.shadowing.dto;

import java.util.List;

public class ShadowingGenerateResponse {
    private String id;
    private String title;
    private String videoUrl;
    private double duration;
    private List<ShadowingSentenceDto> sentences;

    public ShadowingGenerateResponse() {}

    public ShadowingGenerateResponse(String id, String title, String videoUrl, double duration, List<ShadowingSentenceDto> sentences) {
        this.id = id;
        this.title = title;
        this.videoUrl = videoUrl;
        this.duration = duration;
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
}
