package com.crimecat.backend.notice.repository;


import com.crimecat.backend.notice.domain.Notice;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoticeRepository extends JpaRepository<Notice, UUID> {

  /**
   * 캐시용 고정 공지사항 조회 - author 정보 페치
   */
  @Query("SELECT n FROM Notice n " +
         "JOIN FETCH n.author " +
         "WHERE n.isPinned = true " +
         "ORDER BY n.orderIdx ASC, n.createdAt DESC")
  List<Notice> findPinnedNoticesOrdered(Pageable pageable);

  /**
   * 캐시용 전체 공지사항 조회 - author 정보 페치
   */
  @Query(value = "SELECT n FROM Notice n " +
         "JOIN FETCH n.author " +
         "ORDER BY n.isPinned DESC, n.orderIdx ASC, n.createdAt DESC",
         countQuery = "SELECT COUNT(n) FROM Notice n")
  Page<Notice> findAllNoticesOrdered(Pageable pageable);

  /**
   * 캐시용 공지사항 상세 조회 - author 정보 페치
   */
  @Query("SELECT n FROM Notice n " +
         "JOIN FETCH n.author " +
         "WHERE n.id = :id")
  Optional<Notice> findByIdWithAuthor(@Param("id") UUID id);

}
