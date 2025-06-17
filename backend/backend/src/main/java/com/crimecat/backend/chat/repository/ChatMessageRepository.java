package com.crimecat.backend.chat.repository;

import com.crimecat.backend.chat.domain.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // ===== 채널별 메시지 조회 =====
    
    /**
     * 특정 채널의 최근 메시지를 페이징으로 조회
     */
    Page<ChatMessage> findByChannelIdOrderByCreatedAtDesc(Long channelId, Pageable pageable);

    /**
     * 특정 서버의 모든 메시지 조회
     */
    Page<ChatMessage> findByServerIdOrderByCreatedAtDesc(Long serverId, Pageable pageable);

    /**
     * 특정 채널의 최근 N개 메시지 조회
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.channel.id = :channelId ORDER BY cm.createdAt DESC LIMIT :limit")
    List<ChatMessage> findRecentMessagesByChannelId(@Param("channelId") Long channelId, @Param("limit") int limit);

    /**
     * 특정 서버-채널의 특정 시간 이후 메시지 조회
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.server.id = :serverId AND cm.channel.id = :channelId AND cm.createdAt > :since ORDER BY cm.createdAt ASC")
    List<ChatMessage> findMessagesSinceByServerAndChannel(@Param("serverId") Long serverId, @Param("channelId") Long channelId, @Param("since") LocalDateTime since);

    // ===== 사용자별 메시지 조회 =====
    
    /**
     * 특정 사용자의 메시지 조회 (UUID 기반)
     */
    Page<ChatMessage> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    /**
     * 특정 채널에서 특정 사용자의 메시지 조회
     */
    Page<ChatMessage> findByChannelIdAndUserIdOrderByCreatedAtDesc(Long channelId, UUID userId, Pageable pageable);

    /**
     * 특정 서버에서 특정 사용자의 메시지 조회
     */
    Page<ChatMessage> findByServerIdAndUserIdOrderByCreatedAtDesc(Long serverId, UUID userId, Pageable pageable);

    // ===== 검색 및 필터링 =====

    /**
     * 특정 채널에서 키워드로 메시지 검색
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.channel.id = :channelId AND cm.content LIKE %:keyword% ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findByChannelIdAndContentContaining(@Param("channelId") Long channelId, @Param("keyword") String keyword, Pageable pageable);

    /**
     * 특정 서버에서 키워드로 메시지 검색
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.server.id = :serverId AND cm.content LIKE %:keyword% ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findByServerIdAndContentContaining(@Param("serverId") Long serverId, @Param("keyword") String keyword, Pageable pageable);

    /**
     * 특정 채널의 메시지 타입별 조회
     */
    Page<ChatMessage> findByChannelIdAndMessageTypeOrderByCreatedAtDesc(Long channelId, ChatMessage.MessageType messageType, Pageable pageable);

    // ===== 통계 및 카운트 =====

    /**
     * 특정 채널의 메시지 수 조회
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.channel.id = :channelId")
    Long countByChannelId(@Param("channelId") Long channelId);

    /**
     * 특정 서버의 메시지 수 조회
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.server.id = :serverId")
    Long countByServerId(@Param("serverId") Long serverId);

    /**
     * 특정 채널의 특정 기간 메시지 수 조회
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.channel.id = :channelId AND cm.createdAt BETWEEN :startDate AND :endDate")
    Long countByChannelIdAndCreatedAtBetween(@Param("channelId") Long channelId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 특정 서버의 특정 기간 메시지 수 조회
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.server.id = :serverId AND cm.createdAt BETWEEN :startDate AND :endDate")
    Long countByServerIdAndCreatedAtBetween(@Param("serverId") Long serverId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // ===== 배치 처리용 =====

    /**
     * 특정 시간 이후의 모든 메시지 조회 (시스템용)
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.createdAt > :since ORDER BY cm.createdAt ASC")
    List<ChatMessage> findMessagesSince(@Param("since") LocalDateTime since);

    /**
     * 전체 최신 메시지 조회 (전역 채팅 피드용)
     */
    Page<ChatMessage> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // ===== 페이지네이션용 =====

    /**
     * 특정 채널에서 특정 메시지 이전의 메시지들 조회 (무한 스크롤용)
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.channel.id = :channelId AND cm.createdAt < :beforeTime ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findByChannelIdAndCreatedAtBeforeOrderByCreatedAtDesc(@Param("channelId") Long channelId, @Param("beforeTime") LocalDateTime beforeTime, Pageable pageable);

    /**
     * 특정 채널에서 특정 메시지 이후의 메시지들 조회 (신규 메시지 로딩용)
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.channel.id = :channelId AND cm.createdAt > :afterTime ORDER BY cm.createdAt ASC")
    List<ChatMessage> findByChannelIdAndCreatedAtAfterOrderByCreatedAtAsc(@Param("channelId") Long channelId, @Param("afterTime") LocalDateTime afterTime);

    // ===== 서버-채널 특화 메서드 =====

    /**
     * 특정 서버-채널의 최근 메시지 조회 (서버와 채널 모두 체크)
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.server.id = :serverId AND cm.channel.id = :channelId ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findByServerIdAndChannelIdOrderByCreatedAtDesc(@Param("serverId") Long serverId, @Param("channelId") Long channelId, Pageable pageable);

    /**
     * 특정 서버-채널의 최근 N개 메시지 조회
     */
    @Query(value = "SELECT * FROM chat_messages WHERE server_id = :serverId AND channel_id = :channelId ORDER BY created_at DESC LIMIT :limit", nativeQuery = true)
    List<ChatMessage> findRecentMessagesByServerAndChannel(@Param("serverId") Long serverId, @Param("channelId") Long channelId, @Param("limit") int limit);

    /**
     * 특정 서버-채널에서 키워드 검색
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.server.id = :serverId AND cm.channel.id = :channelId AND cm.content LIKE %:keyword% ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findByServerIdAndChannelIdAndContentContaining(@Param("serverId") Long serverId, @Param("channelId") Long channelId, @Param("keyword") String keyword, Pageable pageable);

    /**
     * 특정 서버-채널에서 특정 사용자의 메시지 조회
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.server.id = :serverId AND cm.channel.id = :channelId AND cm.userId = :userId ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findByServerIdAndChannelIdAndUserIdOrderByCreatedAtDesc(@Param("serverId") Long serverId, @Param("channelId") Long channelId, @Param("userId") UUID userId, Pageable pageable);

    /**
     * 특정 서버-채널의 메시지 수 조회
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.server.id = :serverId AND cm.channel.id = :channelId")
    Long countByServerIdAndChannelId(@Param("serverId") Long serverId, @Param("channelId") Long channelId);

    /**
     * 특정 서버-채널의 특정 기간 메시지 수 조회
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.server.id = :serverId AND cm.channel.id = :channelId AND cm.createdAt BETWEEN :startDate AND :endDate")
    Long countByServerIdAndChannelIdAndCreatedAtBetween(@Param("serverId") Long serverId, @Param("channelId") Long channelId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // ===== 배치 처리 특화 메서드 =====

    /**
     * 배치 저장을 위한 메시지 벌크 인서트 (Spring Data JPA saveAll 사용)
     */
    // Note: saveAll(Iterable<S> entities) 메서드는 JpaRepository에서 기본 제공

    /**
     * 특정 서버의 모든 채널에서 최근 활동 조회 (서버 대시보드용)
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.server.id = :serverId AND cm.createdAt >= :since ORDER BY cm.createdAt DESC")
    List<ChatMessage> findRecentActivityByServerId(@Param("serverId") Long serverId, @Param("since") LocalDateTime since);

    /**
     * 특정 채널의 마지막 메시지 조회 (채널 프리뷰용)
     */
    @Query(value = "SELECT * FROM chat_messages WHERE channel_id = :channelId ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    ChatMessage findLastMessageByChannelId(@Param("channelId") Long channelId);

    /**
     * 특정 서버의 각 채널별 마지막 메시지 조회 (서버 대시보드용)
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.server.id = :serverId AND cm.id IN (SELECT MAX(cm2.id) FROM ChatMessage cm2 WHERE cm2.server.id = :serverId GROUP BY cm2.channel.id)")
    List<ChatMessage> findLastMessagesPerChannelByServerId(@Param("serverId") Long serverId);

    // ===== 관리자용 메서드 =====

    /**
     * 특정 사용자의 특정 서버 내 모든 메시지 조회 (관리자용)
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.server.id = :serverId AND cm.userId = :userId ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findAllUserMessagesInServer(@Param("serverId") Long serverId, @Param("userId") UUID userId, Pageable pageable);

    /**
     * 특정 서버의 최근 N일간 활성 사용자별 메시지 수 조회 (통계용)
     */
    @Query("SELECT cm.userId, COUNT(cm) FROM ChatMessage cm WHERE cm.server.id = :serverId AND cm.createdAt >= :since GROUP BY cm.userId ORDER BY COUNT(cm) DESC")
    List<Object[]> findUserMessageCountsByServerIdSince(@Param("serverId") Long serverId, @Param("since") LocalDateTime since);

    /**
     * 특정 채널의 최근 N일간 시간대별 메시지 수 조회 (통계용)
     */
    @Query("SELECT HOUR(cm.createdAt), COUNT(cm) FROM ChatMessage cm WHERE cm.channel.id = :channelId AND cm.createdAt >= :since GROUP BY HOUR(cm.createdAt) ORDER BY HOUR(cm.createdAt)")
    List<Object[]> findHourlyMessageCountsByChannelIdSince(@Param("channelId") Long channelId, @Param("since") LocalDateTime since);

    // ===== 삭제 관련 메서드 (관리자용) =====

    /**
     * 특정 채널의 특정 기간 메시지 삭제 (배치 삭제)
     */
    @Modifying
    @Query("DELETE FROM ChatMessage cm WHERE cm.channel.id = :channelId AND cm.createdAt BETWEEN :startDate AND :endDate")
    void deleteByChannelIdAndCreatedAtBetween(@Param("channelId") Long channelId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 특정 사용자의 특정 서버 내 모든 메시지 삭제 (관리자용)
     */
    @Modifying
    @Query("DELETE FROM ChatMessage cm WHERE cm.server.id = :serverId AND cm.userId = :userId")
    void deleteAllUserMessagesInServer(@Param("serverId") Long serverId, @Param("userId") UUID userId);

    /**
     * 특정 서버의 모든 메시지 삭제 (서버 삭제 시)
     */
    @Modifying
    @Query("DELETE FROM ChatMessage cm WHERE cm.server.id = :serverId")
    void deleteAllByServerId(@Param("serverId") Long serverId);
}