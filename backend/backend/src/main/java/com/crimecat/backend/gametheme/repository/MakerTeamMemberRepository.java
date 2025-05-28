package com.crimecat.backend.gametheme.repository;

import com.crimecat.backend.gametheme.domain.MakerTeamMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MakerTeamMemberRepository extends JpaRepository<MakerTeamMember, UUID> {

    /**
     * 특정 팀의 모든 멤버 조회
     */
    @EntityGraph(attributePaths = {"webUser"})
    List<MakerTeamMember> findByTeamId(UUID teamId);

    /**
     * 특정 팀의 멤버 중 댓글 알림을 받는 멤버들의 WebUser ID 조회
     * WebUser의 postComment 설정이 true인 멤버만 조회
     */
    @Query("SELECT m.webUserId FROM MakerTeamMember m " +
           "JOIN m.webUser w " +
           "WHERE m.team.id = :teamId " +
           "AND w.postComment = true")
    List<UUID> findWebUserIdsWithCommentNotificationByTeamId(@Param("teamId") UUID teamId);

    /**
     * 특정 사용자가 특정 팀의 멤버인지 확인
     */
    boolean existsByTeamIdAndWebUserId(UUID teamId, UUID webUserId);

    @Query("SELECT m FROM MakerTeamMember m " +
           "WHERE m.webUserId = :webUserId " +
           "AND m.isLeader = :isLeader")
    List<MakerTeamMember> findByWebUserIdAndIsLeader(@Param("webUserId") UUID webUserId, @Param("isLeader") boolean isLeader);

    @Query("SELECT m FROM MakerTeamMember m WHERE m.webUserId = :webUserId AND m.team.id = :teamId")
    Optional<MakerTeamMember> findByWebUserIdAndTeamId(@Param("webUserId") UUID webUserId, @Param("teamId") UUID teamId);

    @Query("SELECT m FROM MakerTeamMember m WHERE m.webUserId = :webUserId")
    List<MakerTeamMember> findByWebUserId(@Param("webUserId") UUID webUserId);

    /**
     * 특정 사용자의 팀 멤버십을 팀 정보와 함께 조회 (Fetch Join)
     */
    @Query("SELECT DISTINCT m FROM MakerTeamMember m " +
           "JOIN FETCH m.team t " +
           "LEFT JOIN FETCH t.members " +
           "WHERE m.webUserId = :webUserId")
    List<MakerTeamMember> findByWebUserIdWithTeam(@Param("webUserId") UUID webUserId);


}
