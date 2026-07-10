package com.midori.shadowing.entities;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pending_video_uploads")
public class PendingVideoUpload {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "video_id", nullable = false, unique = true, length = 64)
    private String videoId;

    @Column(name = "storage_object_path", nullable = false, length = 512)
    private String storageObjectPath;

    @Column(name = "supabase_public_url", nullable = false, columnDefinition = "text")
    private String supabasePublicUrl;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public PendingVideoUpload() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }

    public String getStorageObjectPath() {
        return storageObjectPath;
    }

    public void setStorageObjectPath(String storageObjectPath) {
        this.storageObjectPath = storageObjectPath;
    }

    public String getSupabasePublicUrl() {
        return supabasePublicUrl;
    }

    public void setSupabasePublicUrl(String supabasePublicUrl) {
        this.supabasePublicUrl = supabasePublicUrl;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(Long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
