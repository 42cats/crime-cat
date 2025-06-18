package com.crimecat.backend.chat.repository;

import com.crimecat.backend.chat.domain.ChatServer;
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
public interface ChatServerRepository extends JpaRepository<ChatServer, UUID> {

    // 활성 서버 조회
    List<ChatServer> findByIsActiveTrue();
    
    Page<ChatServer> findByIsActiveTrue(Pageable pageable);

    // 서버명으로 검색 (대소문자 무시)
    List<ChatServer> findByNameContainingIgnoreCaseAndIsActiveTrue(String name);

    // 특정 사용자가 생성한 서버 조회
    List<ChatServer> findByCreatedByAndIsActiveTrue(UUID createdBy);

    // 서버명 중복 확인 (활성 서버만)
    boolean existsByNameAndIsActiveTrue(String name);

    // 특정 기간 동안 생성된 서버 조회
    @Query("SELECT s FROM ChatServer s WHERE s.createdAt BETWEEN :startDate AND :endDate AND s.isActive = true")
    List<ChatServer> findByCreatedAtBetweenAndIsActiveTrue(
            @Param("startDate") LocalDateTime startDate, 
            @Param("endDate") LocalDateTime endDate
    );

    // 멤버 수 기준 조회
    @Query("SELECT s FROM ChatServer s WHERE SIZE(s.members) >= :minMembers AND s.isActive = true")
    List<ChatServer> findByMemberCountGreaterThanEqual(@Param("minMembers") int minMembers);

    // 서버 통계 조회
    @Query("SELECT s FROM ChatServer s LEFT JOIN FETCH s.members m WHERE s.id = :serverId AND s.isActive = true")
    Optional<ChatServer> findByIdWithMembers(@Param("serverId") UUID serverId);

    // 사용자가 참여한 서버 조회
    @Query("SELECT DISTINCT s FROM ChatServer s JOIN s.members m WHERE m.userId = :userId AND m.isActive = true AND s.isActive = true")
    List<ChatServer> findServersByUserId(@Param("userId") UUID userId);

    // 인기 서버 조회 (멤버 수 기준)
    @Query("SELECT s FROM ChatServer s WHERE s.isActive = true ORDER BY SIZE(s.members) DESC")
    Page<ChatServer> findPopularServers(Pageable pageable);

    // 최근 활성 서버 조회
    @Query("SELECT DISTINCT s FROM ChatServer s JOIN s.members m WHERE m.lastActivityAt >= :since AND s.isActive = true ORDER BY m.lastActivityAt DESC")
    List<ChatServer> findRecentlyActiveServers(@Param("since") LocalDateTime since);
    
    // 공개 서버 조회 (비밀번호가 없는 서버)
    @Query("SELECT s FROM ChatServer s WHERE s.passwordHash IS NULL AND s.isActive = true ORDER BY s.createdAt DESC")
    Page<ChatServer> findPublicServers(Pageable pageable);
}