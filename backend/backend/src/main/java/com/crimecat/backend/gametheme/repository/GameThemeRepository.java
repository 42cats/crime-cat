package com.crimecat.backend.gametheme.repository;

import com.crimecat.backend.gametheme.domain.GameTheme;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GameThemeRepository extends JpaRepository<GameTheme, UUID>, JpaSpecificationExecutor<GameTheme> {

  @Query("SELECT gt FROM GameTheme gt " +
         "JOIN FETCH gt.author " +
         "WHERE gt.id = :id")
  Optional<GameTheme> findByIdWithAuthor(@Param("id") UUID id);
  
  @EntityGraph(attributePaths = {"author"})
  Optional<GameTheme> findWithAuthorById(UUID id);

  @Query("SELECT gt FROM GameTheme gt " +
         "JOIN FETCH gt.author " +
         "WHERE gt.id = :id")
  Optional<GameTheme> findByIdWithAuthorAndWebUser(@Param("id") UUID id);

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

  /**
   * SSR용 테마 타입별 조회 메서드 (Native Query 사용)
   * @param type 테마 타입 (CRIMESCENE, ESCAPE_ROOM 등)
   * @param isPublic 공개 여부
   * @param isDeleted 삭제 여부
   * @param pageable 페이지 정보
   * @return 테마 목록
   */
  @Query(value = "SELECT * FROM game_themes t WHERE t.is_public = :isPublic AND t.is_deleted = :isDeleted AND t.type = :type ORDER BY t.created_at DESC", 
         nativeQuery = true)
  Page<GameTheme> findByTypeAndPublicStatusAndIsDeleted(@Param("type") String type, @Param("isPublic") boolean isPublic, @Param("isDeleted") boolean isDeleted, Pageable pageable);

}
