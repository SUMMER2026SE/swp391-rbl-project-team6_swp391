package com.midori.repository;

import com.midori.entity.VideoGrammarPattern;
import com.midori.entity.VideoGrammarPatternId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VideoGrammarPatternRepository extends JpaRepository<VideoGrammarPattern, VideoGrammarPatternId> {

    @Query("SELECT vgp FROM VideoGrammarPattern vgp " +
           "JOIN FETCH vgp.grammarPattern gp " +
           "WHERE vgp.video.id = :videoId " +
           "ORDER BY gp.jlptLevel ASC, gp.pattern ASC")
    List<VideoGrammarPattern> findByVideoIdWithPattern(@Param("videoId") UUID videoId);

    boolean existsByIdVideoIdAndIdGrammarPatternId(UUID videoId, UUID grammarPatternId);

    long countByIdVideoId(UUID videoId);
}
