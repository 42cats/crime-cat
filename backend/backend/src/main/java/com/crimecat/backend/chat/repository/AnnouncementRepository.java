package com.crimecat.backend.chat.repository;

import com.crimecat.backend.chat.domain.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    /**
     * 활성 상태의 공지사항만 조회
     */
    List<Announcement> findByIsActiveTrueOrderByCreatedAtDesc();

    /**
     * 모든 공지사항을 최신순으로 조회 (관리자용)
     */
    Page<Announcement> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * 특정 사용자가 생성한 공지사항 조회
     */
    Page<Announcement> findByCreatedByOrderByCreatedAtDesc(String createdBy, Pageable pageable);

    /**
     * 최신 활성 공지사항 N개 조회
     */
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true ORDER BY a.createdAt DESC LIMIT :limit")
    List<Announcement> findRecentActiveAnnouncements(int limit);

    /**
     * 활성 공지사항 수 조회
     */
    long countByIsActiveTrue();
}