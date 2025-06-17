package com.crimecat.backend.chat.repository;

import com.crimecat.backend.chat.domain.ChannelMember;
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
public interface ChannelMemberRepository extends JpaRepository<ChannelMember, Long> {

    // 채널의 모든 활성 멤버 조회
    List<ChannelMember> findByChannelIdAndIsActiveTrue(Long channelId);
    
    Page<ChannelMember> findByChannelIdAndIsActiveTrue(Long channelId, Pageable pageable);

    // 특정 사용자가 특정 채널의 멤버인지 확인
    Optional<ChannelMember> findByChannelIdAndUserIdAndIsActiveTrue(Long channelId, UUID userId);

    // 특정 사용자가 참여한 모든 채널 조회
    List<ChannelMember> findByUserIdAndIsActiveTrue(UUID userId);

    // 채널의 모더레이터 조회
    @Query("SELECT cm FROM ChannelMember cm WHERE cm.channel.id = :channelId AND cm.role = 'MODERATOR' AND cm.isActive = true")
    List<ChannelMember> findModeratorsByChannelId(@Param("channelId") Long channelId);

    // 특정 사용자가 특정 채널의 모더레이터인지 확인
    @Query("SELECT cm FROM ChannelMember cm WHERE cm.channel.id = :channelId AND cm.userId = :userId AND cm.role = 'MODERATOR' AND cm.isActive = true")
    Optional<ChannelMember> findModeratorByChannelIdAndUserId(@Param("channelId") Long channelId, @Param("userId") UUID userId);

    // 채널 멤버 수 조회
    @Query("SELECT COUNT(cm) FROM ChannelMember cm WHERE cm.channel.id = :channelId AND cm.isActive = true")
    long countByChannelIdAndIsActiveTrue(@Param("channelId") Long channelId);

    // 최근 활성 멤버 조회
    @Query("SELECT cm FROM ChannelMember cm WHERE cm.channel.id = :channelId AND cm.lastActivityAt >= :since AND cm.isActive = true ORDER BY cm.lastActivityAt DESC")
    List<ChannelMember> findRecentlyActiveMembersByChannelId(@Param("channelId") Long channelId, @Param("since") LocalDateTime since);

    // 특정 기간 동안 가입한 멤버 조회
    @Query("SELECT cm FROM ChannelMember cm WHERE cm.channel.id = :channelId AND cm.joinedAt BETWEEN :startDate AND :endDate AND cm.isActive = true")
    List<ChannelMember> findByChannelIdAndJoinedAtBetween(
            @Param("channelId") Long channelId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // 멤버 역할별 조회
    @Query("SELECT cm FROM ChannelMember cm WHERE cm.channel.id = :channelId AND cm.role = :role AND cm.isActive = true")
    List<ChannelMember> findByChannelIdAndRole(@Param("channelId") Long channelId, @Param("role") ChannelMember.ChannelRole role);

    // 사용자의 채널 모더레이터 권한 확인
    @Query("SELECT CASE WHEN COUNT(cm) > 0 THEN true ELSE false END FROM ChannelMember cm WHERE cm.channel.id = :channelId AND cm.userId = :userId AND cm.role = 'MODERATOR' AND cm.isActive = true")
    boolean isUserModeratorOfChannel(@Param("channelId") Long channelId, @Param("userId") UUID userId);

    // 사용자의 채널 멤버십 확인
    @Query("SELECT CASE WHEN COUNT(cm) > 0 THEN true ELSE false END FROM ChannelMember cm WHERE cm.channel.id = :channelId AND cm.userId = :userId AND cm.isActive = true")
    boolean isUserMemberOfChannel(@Param("channelId") Long channelId, @Param("userId") UUID userId);

    // 채널 내 온라인 멤버 조회 (최근 활동 기준)
    @Query("SELECT cm FROM ChannelMember cm WHERE cm.channel.id = :channelId AND cm.lastActivityAt >= :onlineThreshold AND cm.isActive = true")
    List<ChannelMember> findOnlineMembersByChannelId(@Param("channelId") Long channelId, @Param("onlineThreshold") LocalDateTime onlineThreshold);

    // 서버 내 사용자의 모든 채널 멤버십 조회
    @Query("SELECT cm FROM ChannelMember cm WHERE cm.channel.server.id = :serverId AND cm.userId = :userId AND cm.isActive = true")
    List<ChannelMember> findByServerIdAndUserId(@Param("serverId") Long serverId, @Param("userId") UUID userId);

    // 서버 내에서 사용자가 모더레이터인 채널 조회
    @Query("SELECT cm FROM ChannelMember cm WHERE cm.channel.server.id = :serverId AND cm.userId = :userId AND cm.role = 'MODERATOR' AND cm.isActive = true")
    List<ChannelMember> findModeratorChannelsByServerIdAndUserId(@Param("serverId") Long serverId, @Param("userId") UUID userId);

    // 특정 서버의 모든 채널 멤버 수 조회
    @Query("SELECT COUNT(cm) FROM ChannelMember cm WHERE cm.channel.server.id = :serverId AND cm.isActive = true")
    long countByServerIdAndIsActiveTrue(@Param("serverId") Long serverId);
    
    // 채널 멤버 존재 여부 확인
    boolean existsByChannelIdAndUserIdAndIsActiveTrue(Long channelId, UUID userId);
}