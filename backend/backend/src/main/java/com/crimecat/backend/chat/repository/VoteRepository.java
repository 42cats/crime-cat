package com.crimecat.backend.chat.repository;

import com.crimecat.backend.chat.domain.Vote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {

    /**
     * 활성 상태의 투표만 조회
     */
    List<Vote> findByIsActiveTrueOrderByCreatedAtDesc();

    /**
     * 특정 사용자가 생성한 투표 조회
     */
    Page<Vote> findByCreatedByOrderByCreatedAtDesc(String createdBy, Pageable pageable);

    /**
     * 활성 상태인 최신 투표 1개 조회
     */
    @Query("SELECT v FROM Vote v WHERE v.isActive = true ORDER BY v.createdAt DESC LIMIT 1")
    Optional<Vote> findLatestActiveVote();

    /**
     * 투표 ID와 활성 상태로 조회
     */
    Optional<Vote> findByIdAndIsActiveTrue(Long id);

    /**
     * 투표 응답 수와 함께 조회
     */
    @Query("SELECT v FROM Vote v LEFT JOIN FETCH v.responses WHERE v.id = :voteId")
    Optional<Vote> findByIdWithResponses(@Param("voteId") Long voteId);

    /**
     * 모든 투표를 응답과 함께 조회 (관리자용)
     */
    @Query("SELECT v FROM Vote v LEFT JOIN FETCH v.responses ORDER BY v.createdAt DESC")
    List<Vote> findAllWithResponses();
}