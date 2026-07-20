package com.midori.repository;

import com.midori.entity.ShadowingTranscript;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShadowingTranscriptRepository extends JpaRepository<ShadowingTranscript, UUID> {

    List<ShadowingTranscript> findByShadowingVideoIdOrderBySentenceOrderAsc(UUID videoId);

    void deleteByShadowingVideoId(UUID videoId);

    long countByShadowingVideoId(UUID videoId);
}
