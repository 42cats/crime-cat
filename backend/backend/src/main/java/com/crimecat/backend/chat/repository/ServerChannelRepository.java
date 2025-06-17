package com.crimecat.backend.chat.repository;

import com.crimecat.backend.chat.domain.ServerChannel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServerChannelRepository extends JpaRepository<ServerChannel, Long> {

    // 서버의 활성 채널 조회
    List<ServerChannel> findByServerIdAndIsActiveTrue(Long serverId);
    
    Page<ServerChannel> findByServerIdAndIsActiveTrue(Long serverId, Pageable pageable);

    // 서버 내에서 채널명으로 조회
    Optional<ServerChannel> findByServerIdAndNameAndIsActiveTrue(Long serverId, String name);

    // 채널명 중복 확인 (서버 내에서)
    boolean existsByServerIdAndNameAndIsActiveTrue(Long serverId, String name);

    // 특정 사용자가 생성한 채널 조회
    List<ServerChannel> findByCreatedByAndIsActiveTrue(UUID createdBy);

    // 채널 타입별 조회
    @Query("SELECT sc FROM ServerChannel sc WHERE sc.server.id = :serverId AND sc.channelType = :channelType AND sc.isActive = true")
    List<ServerChannel> findByServerIdAndChannelType(@Param("serverId") Long serverId, @Param("channelType") ServerChannel.ChannelType channelType);

    // 텍스트 채널 조회
    @Query("SELECT sc FROM ServerChannel sc WHERE sc.server.id = :serverId AND (sc.channelType = 'TEXT' OR sc.channelType = 'BOTH') AND sc.isActive = true")
    List<ServerChannel> findTextChannelsByServerId(@Param("serverId") Long serverId);

    // 음성 채널 조회
    @Query("SELECT sc FROM ServerChannel sc WHERE sc.server.id = :serverId AND (sc.channelType = 'VOICE' OR sc.channelType = 'BOTH') AND sc.isActive = true")
    List<ServerChannel> findVoiceChannelsByServerId(@Param("serverId") Long serverId);

    // 특정 기간 동안 생성된 채널 조회
    @Query("SELECT sc FROM ServerChannel sc WHERE sc.server.id = :serverId AND sc.createdAt BETWEEN :startDate AND :endDate AND sc.isActive = true")
    List<ServerChannel> findByServerIdAndCreatedAtBetween(
            @Param("serverId") Long serverId,
            @Param("startDate") LocalDateTime startDate, 
            @Param("endDate") LocalDateTime endDate
    );

    // 멤버 수 기준 조회
    @Query("SELECT sc FROM ServerChannel sc WHERE sc.server.id = :serverId AND SIZE(sc.members) >= :minMembers AND sc.isActive = true")
    List<ServerChannel> findByServerIdAndMemberCountGreaterThanEqual(@Param("serverId") Long serverId, @Param("minMembers") int minMembers);

    // 채널 통계 조회 (멤버 포함)
    @Query("SELECT sc FROM ServerChannel sc LEFT JOIN FETCH sc.members m WHERE sc.id = :channelId AND sc.isActive = true")
    Optional<ServerChannel> findByIdWithMembers(@Param("channelId") Long channelId);

    // 사용자가 참여한 채널 조회
    @Query("SELECT DISTINCT sc FROM ServerChannel sc JOIN sc.members cm WHERE cm.userId = :userId AND cm.isActive = true AND sc.isActive = true")
    List<ServerChannel> findChannelsByUserId(@Param("userId") UUID userId);

    // 서버 내에서 사용자가 참여한 채널 조회
    @Query("SELECT DISTINCT sc FROM ServerChannel sc JOIN sc.members cm WHERE sc.server.id = :serverId AND cm.userId = :userId AND cm.isActive = true AND sc.isActive = true")
    List<ServerChannel> findChannelsByServerIdAndUserId(@Param("serverId") Long serverId, @Param("userId") UUID userId);

    // 인기 채널 조회 (멤버 수 기준)
    @Query("SELECT sc FROM ServerChannel sc WHERE sc.server.id = :serverId AND sc.isActive = true ORDER BY SIZE(sc.members) DESC")
    Page<ServerChannel> findPopularChannelsByServerId(@Param("serverId") Long serverId, Pageable pageable);

    // 최근 활성 채널 조회
    @Query("SELECT DISTINCT sc FROM ServerChannel sc JOIN sc.members cm WHERE sc.server.id = :serverId AND cm.lastActivityAt >= :since AND sc.isActive = true ORDER BY cm.lastActivityAt DESC")
    List<ServerChannel> findRecentlyActiveChannelsByServerId(@Param("serverId") Long serverId, @Param("since") LocalDateTime since);

    // 채널 수 조회
    @Query("SELECT COUNT(sc) FROM ServerChannel sc WHERE sc.server.id = :serverId AND sc.isActive = true")
    long countByServerIdAndIsActiveTrue(@Param("serverId") Long serverId);

    // 서버의 기본 채널 조회 (첫 번째 생성된 채널)
    @Query("SELECT sc FROM ServerChannel sc WHERE sc.server.id = :serverId AND sc.isActive = true ORDER BY sc.createdAt ASC")
    List<ServerChannel> findFirstChannelByServerId(@Param("serverId") Long serverId, Pageable pageable);
}