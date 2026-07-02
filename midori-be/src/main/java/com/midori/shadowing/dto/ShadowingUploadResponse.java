package com.midori.shadowing.dto;

public class ShadowingUploadResponse {
    private String videoId;
    private String videoUrl;
    private double duration;

    public ShadowingUploadResponse() {}

    public ShadowingUploadResponse(String videoId, String videoUrl, double duration) {
        this.videoId = videoId;
        this.videoUrl = videoUrl;
        this.duration = duration;
    }

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
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
}
