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

    @Query(value = """
        SELECT * FROM MAKER_TEAM_MEMBERS 
        WHERE WEB_USER_ID = :webUserId 
        AND IS_LEADER = :isLeader
        LIMIT 1
        """, nativeQuery = true)
    List<MakerTeamMember> findByWebUserIdAndIsLeader(@Param("webUserId") UUID webUserId, @Param("isLeader") boolean isLeader);

    @Query(value = """
    SELECT * FROM MAKER_TEAM_MEMBERS 
    WHERE WEB_USER_ID = :webUserId 
    AND TEAM_ID = :teamId
    LIMIT 1
    """, nativeQuery = true)
    Optional<MakerTeamMember> findByWebUserIdAndTeamId(
            @Param("webUserId") UUID webUserId,
            @Param("teamId") UUID teamId
    );

    @Query(value = """
    SELECT * FROM MAKER_TEAM_MEMBERS 
    WHERE WEB_USER_ID = :webUserId
    """, nativeQuery = true)
    List<MakerTeamMember> findByWebUserId(@Param("webUserId") UUID webUserId);


}
