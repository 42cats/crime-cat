package com.crimecat.backend.chat.repository;

import com.crimecat.backend.chat.domain.ServerMember;
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
public interface ServerMemberRepository extends JpaRepository<ServerMember, Long> {

    // 서버의 모든 활성 멤버 조회
    List<ServerMember> findByServerIdAndIsActiveTrue(Long serverId);
    
    Page<ServerMember> findByServerIdAndIsActiveTrue(Long serverId, Pageable pageable);

    // 특정 사용자가 특정 서버의 멤버인지 확인
    Optional<ServerMember> findByServerIdAndUserIdAndIsActiveTrue(Long serverId, UUID userId);

    // 특정 사용자가 참여한 모든 서버 조회
    List<ServerMember> findByUserIdAndIsActiveTrue(UUID userId);

    // 서버의 관리자 조회
    @Query("SELECT sm FROM ServerMember sm WHERE sm.server.id = :serverId AND sm.role = 'ADMIN' AND sm.isActive = true")
    List<ServerMember> findAdminsByServerId(@Param("serverId") Long serverId);

    // 특정 사용자가 특정 서버의 관리자인지 확인
    @Query("SELECT sm FROM ServerMember sm WHERE sm.server.id = :serverId AND sm.userId = :userId AND sm.role = 'ADMIN' AND sm.isActive = true")
    Optional<ServerMember> findAdminByServerIdAndUserId(@Param("serverId") Long serverId, @Param("userId") UUID userId);

    // 서버 멤버 수 조회
    @Query("SELECT COUNT(sm) FROM ServerMember sm WHERE sm.server.id = :serverId AND sm.isActive = true")
    long countByServerIdAndIsActiveTrue(@Param("serverId") Long serverId);

    // 최근 활성 멤버 조회
    @Query("SELECT sm FROM ServerMember sm WHERE sm.server.id = :serverId AND sm.lastActivityAt >= :since AND sm.isActive = true ORDER BY sm.lastActivityAt DESC")
    List<ServerMember> findRecentlyActiveMembersByServerId(@Param("serverId") Long serverId, @Param("since") LocalDateTime since);

    // 특정 기간 동안 가입한 멤버 조회
    @Query("SELECT sm FROM ServerMember sm WHERE sm.server.id = :serverId AND sm.joinedAt BETWEEN :startDate AND :endDate AND sm.isActive = true")
    List<ServerMember> findByServerIdAndJoinedAtBetween(
            @Param("serverId") Long serverId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // 멤버 역할별 조회
    @Query("SELECT sm FROM ServerMember sm WHERE sm.server.id = :serverId AND sm.role = :role AND sm.isActive = true")
    List<ServerMember> findByServerIdAndRole(@Param("serverId") Long serverId, @Param("role") ServerMember.ServerRole role);

    // 사용자의 서버 관리자 권한 확인
    @Query("SELECT CASE WHEN COUNT(sm) > 0 THEN true ELSE false END FROM ServerMember sm WHERE sm.server.id = :serverId AND sm.userId = :userId AND sm.role = 'ADMIN' AND sm.isActive = true")
    boolean isUserAdminOfServer(@Param("serverId") Long serverId, @Param("userId") UUID userId);

    // 사용자의 서버 멤버십 확인
    @Query("SELECT CASE WHEN COUNT(sm) > 0 THEN true ELSE false END FROM ServerMember sm WHERE sm.server.id = :serverId AND sm.userId = :userId AND sm.isActive = true")
    boolean isUserMemberOfServer(@Param("serverId") Long serverId, @Param("userId") UUID userId);
    
    // 서버 멤버 존재 여부 확인
    boolean existsByServerIdAndUserIdAndIsActiveTrue(Long serverId, UUID userId);

    // 서버 내 온라인 멤버 조회 (최근 활동 기준)
    @Query("SELECT sm FROM ServerMember sm WHERE sm.server.id = :serverId AND sm.lastActivityAt >= :onlineThreshold AND sm.isActive = true")
    List<ServerMember> findOnlineMembersByServerId(@Param("serverId") Long serverId, @Param("onlineThreshold") LocalDateTime onlineThreshold);
}