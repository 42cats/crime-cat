package com.crimecat.backend.gametheme.repository;

import com.crimecat.backend.gametheme.domain.GameTheme;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GameThemeRepository extends JpaRepository<GameTheme, UUID>, JpaSpecificationExecutor<GameTheme> {

  Page<GameTheme> findAll(Specification<GameTheme> spec, Pageable page);
  
  /**
   * 특정 웹유저가 메이커 팀 멤버로 참여한 테마 수 조회
   * CrimesceneTheme에서 team -> members -> webUserId를 통해 조회
   */
  @Query("SELECT COUNT(DISTINCT gt) FROM GameTheme gt " +
         "JOIN CrimesceneTheme ct ON gt.id = ct.id " +
         "JOIN ct.team t " +
         "JOIN t.members m " +
         "WHERE m.webUserId = :webUserId " +
         "AND gt.isDeleted = false")
  Long countByMakerTeamMember_WebUserId(@Param("webUserId") UUID webUserId);

}
