package com.crimecat.backend.chat.repository;

import com.crimecat.backend.chat.domain.ServerRole;
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
public interface ServerRoleRepository extends JpaRepository<ServerRole, UUID> {

    // 서버의 모든 활성 역할 조회
    List<ServerRole> findByServerIdAndIsActiveTrue(UUID serverId);
    
    Page<ServerRole> findByServerIdAndIsActiveTrue(UUID serverId, Pageable pageable);

    // 서버 내에서 역할명으로 조회
    Optional<ServerRole> findByServerIdAndNameAndIsActiveTrue(UUID serverId, String name);

    // 역할명 중복 확인 (서버 내에서)
    boolean existsByServerIdAndNameAndIsActiveTrue(UUID serverId, String name);

    // 특정 사용자가 생성한 역할 조회
    List<ServerRole> findByCreatedByAndIsActiveTrue(UUID createdBy);

    // 특정 권한을 가진 역할 조회
    @Query("SELECT sr FROM ServerRole sr WHERE sr.server.id = :serverId AND CAST(JSON_CONTAINS(sr.permissions, :permission) AS boolean) = true AND sr.isActive = true")
    List<ServerRole> findByServerIdAndPermission(@Param("serverId") UUID serverId, @Param("permission") String permission);

    // 관리자 권한을 가진 역할 조회
    @Query("SELECT sr FROM ServerRole sr WHERE sr.server.id = :serverId AND CAST(JSON_CONTAINS(sr.permissions, '\"canManageServer\"') AS boolean) = true AND sr.isActive = true")
    List<ServerRole> findAdminRolesByServerId(@Param("serverId") UUID serverId);

    // 특정 기간 동안 생성된 역할 조회
    @Query("SELECT sr FROM ServerRole sr WHERE sr.server.id = :serverId AND sr.createdAt BETWEEN :startDate AND :endDate AND sr.isActive = true")
    List<ServerRole> findByServerIdAndCreatedAtBetween(
            @Param("serverId") UUID serverId,
            @Param("startDate") LocalDateTime startDate, 
            @Param("endDate") LocalDateTime endDate
    );

    // 역할 수 조회
    @Query("SELECT COUNT(sr) FROM ServerRole sr WHERE sr.server.id = :serverId AND sr.isActive = true")
    long countByServerIdAndIsActiveTrue(@Param("serverId") UUID serverId);

    // 색상별 역할 조회
    List<ServerRole> findByServerIdAndColorAndIsActiveTrue(UUID serverId, String color);

    // 역할 ID 목록으로 조회 (멤버 권한 확인용)
    @Query("SELECT sr FROM ServerRole sr WHERE sr.id IN :roleIds AND sr.server.id = :serverId AND sr.isActive = true")
    List<ServerRole> findByIdsAndServerId(@Param("roleIds") List<UUID> roleIds, @Param("serverId") UUID serverId);

    // 특정 권한들을 모두 가진 역할 조회
    @Query("SELECT sr FROM ServerRole sr WHERE sr.server.id = :serverId AND sr.isActive = true")
    List<ServerRole> findAllByServerId(@Param("serverId") UUID serverId);

    // 기본 역할 조회 (Admin, Member 등)
    @Query("SELECT sr FROM ServerRole sr WHERE sr.server.id = :serverId AND sr.name IN ('Admin', 'Member') AND sr.isActive = true ORDER BY sr.name")
    List<ServerRole> findDefaultRolesByServerId(@Param("serverId") UUID serverId);

    // 커스텀 역할만 조회 (기본 역할 제외)
    @Query("SELECT sr FROM ServerRole sr WHERE sr.server.id = :serverId AND sr.name NOT IN ('Admin', 'Member') AND sr.isActive = true ORDER BY sr.createdAt")
    List<ServerRole> findCustomRolesByServerId(@Param("serverId") UUID serverId);

    // 역할 생성 순서로 조회
    List<ServerRole> findByServerIdAndIsActiveTrueOrderByCreatedAt(UUID serverId);

    // 역할명으로 정렬하여 조회
    List<ServerRole> findByServerIdAndIsActiveTrueOrderByName(UUID serverId);

    // 특정 멤버가 가진 역할들 조회
    @Query("SELECT sr FROM ServerRole sr WHERE sr.id IN :roleIds AND sr.isActive = true")
    List<ServerRole> findByIdInAndIsActiveTrue(@Param("roleIds") List<UUID> roleIds);

    // 삭제된 역할 조회 (복구용)
    List<ServerRole> findByServerIdAndIsActiveFalse(UUID serverId);

    // 서버의 모든 역할 조회 (활성/비활성 모두)
    List<ServerRole> findByServerIdOrderByIsActiveDescCreatedAtAsc(UUID serverId);
}