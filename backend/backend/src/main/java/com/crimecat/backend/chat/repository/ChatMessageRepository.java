package com.crimecat.backend.chat.repository;

import com.crimecat.backend.chat.domain.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * 최근 메시지를 페이징으로 조회
     */
    Page<ChatMessage> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * 특정 사용자의 메시지 조회
     */
    Page<ChatMessage> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    /**
     * 특정 시간 이후의 메시지 조회
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.createdAt > :since ORDER BY cm.createdAt ASC")
    List<ChatMessage> findMessagesSince(@Param("since") LocalDateTime since);

    /**
     * 메시지 타입별 조회
     */
    Page<ChatMessage> findByMessageTypeOrderByCreatedAtDesc(ChatMessage.MessageType messageType, Pageable pageable);

    /**
     * 키워드로 메시지 검색
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.content LIKE %:keyword% ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findByContentContaining(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 특정 기간의 메시지 수 조회
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.createdAt BETWEEN :startDate AND :endDate")
    Long countMessagesBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 최근 N개 메시지 조회 (실시간 채팅용)
     */
    @Query("SELECT cm FROM ChatMessage cm ORDER BY cm.createdAt DESC LIMIT :limit")
    List<ChatMessage> findRecentMessages(@Param("limit") int limit);
}