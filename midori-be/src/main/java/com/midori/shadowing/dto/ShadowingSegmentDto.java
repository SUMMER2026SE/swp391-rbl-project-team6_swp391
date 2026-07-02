package com.midori.shadowing.dto;

public class ShadowingSegmentDto {
    private String id;
    private String japaneseText;
    private String vietnameseTranslation;
    private double startTime;
    private double endTime;

    public ShadowingSegmentDto() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getJapaneseText() {
        return japaneseText;
    }

    public void setJapaneseText(String japaneseText) {
        this.japaneseText = japaneseText;
    }

    public String getVietnameseTranslation() {
        return vietnameseTranslation;
    }

    public void setVietnameseTranslation(String vietnameseTranslation) {
        this.vietnameseTranslation = vietnameseTranslation;
    }

    public double getStartTime() {
        return startTime;
    }

    public void setStartTime(double startTime) {
        this.startTime = startTime;
    }

    public double getEndTime() {
        return endTime;
    }

    public void setEndTime(double endTime) {
        this.endTime = endTime;
    }
}
