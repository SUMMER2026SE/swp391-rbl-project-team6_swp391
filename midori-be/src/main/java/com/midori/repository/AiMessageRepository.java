package com.midori.repository;

import com.midori.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AiMessageRepository extends JpaRepository<AiMessage, UUID> {

    List<AiMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    @Query(value = """
            SELECT * FROM ai_messages
            WHERE conversation_id = :conversationId
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<AiMessage> findLatestMessagesByConversationId(
            @Param("conversationId") UUID conversationId,
            @Param("limit") int limit);

    @Query(value = """
            SELECT * FROM ai_messages
            WHERE conversation_id = :conversationId
              AND id != :excludeMessageId
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<AiMessage> findLatestMessagesExcluding(
            @Param("conversationId") UUID conversationId,
            @Param("excludeMessageId") UUID excludeMessageId,
            @Param("limit") int limit);
}
