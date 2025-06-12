package com.crimecat.backend.notice.repository;


import com.crimecat.backend.notice.domain.Notice;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface NoticeRepository extends JpaRepository<Notice, UUID> {

  @Query("SELECT n FROM Notice n WHERE n.isPinned = true ORDER BY n.orderIdx ASC , n.createdAt DESC")
  List<Notice> findPinnedNoticesOrdered(Pageable pageable); // 고정공지만 Orderidx 순 최신순

  @Query("SELECT n FROM Notice n ORDER BY n.isPinned DESC, n.orderIdx ASC, n.createdAt DESC")
  Page<Notice> findAllNoticesOrdered(Pageable pageable);

  @Query("SELECT n FROM Notice n ORDER BY n.createdAt DESC")
  List<Notice> findTop100ByOrderByCreatedAtDesc();


}
