package com.crimecat.backend.gametheme.repository;

import com.crimecat.backend.gametheme.domain.MakerTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MakerTeamRepository extends JpaRepository<MakerTeam, UUID> {
    List<MakerTeam> findByName(String name);

    /**
     * JPQL로 NAME, IS_INDIVIDUAL 컬럼을 기준으로 팀 조회
     */
    @Query("SELECT t FROM MakerTeam t WHERE t.name = :name AND t.isIndividual = :individual")
    Optional<MakerTeam> findByNameAndIndividual(
            @Param("name") String name,
            @Param("individual") boolean individual
    );
    
    /**
     * 팀과 멤버를 함께 로드
     */
    @Query("SELECT t FROM MakerTeam t LEFT JOIN FETCH t.members WHERE t.id = :teamId")
    Optional<MakerTeam> findByIdWithMembers(@Param("teamId") UUID teamId);
    
    /**
     * 모든 팀과 멤버를 함께 로드
     */
    @Query("SELECT DISTINCT t FROM MakerTeam t LEFT JOIN FETCH t.members")
    List<MakerTeam> findAllWithMembers();
}
