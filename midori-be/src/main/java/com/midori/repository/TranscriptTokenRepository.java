package com.midori.repository;

import com.midori.entity.TranscriptToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TranscriptTokenRepository extends JpaRepository<TranscriptToken, UUID> {
    List<TranscriptToken> findBySentenceId(UUID sentenceId);
    List<TranscriptToken> findBySentenceIdIn(List<UUID> sentenceIds);
    void deleteBySentenceId(UUID sentenceId);
}
