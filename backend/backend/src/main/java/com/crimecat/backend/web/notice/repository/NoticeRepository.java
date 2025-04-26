package com.crimecat.backend.web.notice.repository;


import com.crimecat.backend.web.notice.domain.Notices;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface NoticeRepository extends JpaRepository<Notices, UUID> {

  @Query("SELECT n FROM Notices n WHERE n.isPinned = true ORDER BY n.orderIdx ASC , n.createdAt DESC")
  List<Notices> findPinnedNoticesOrdered(Pageable pageable); // 고정공지만 Orderidx 순 최신순

  @Query("SELECT n FROM Notices n ORDER BY n.isPinned DESC, n.orderIdx ASC, n.createdAt DESC")
  Page<Notices> findAllNoticesOrdered(Pageable pageable);


}
