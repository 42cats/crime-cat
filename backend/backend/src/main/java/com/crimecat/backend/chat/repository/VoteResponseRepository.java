package com.crimecat.backend.chat.repository;

import com.crimecat.backend.chat.domain.VoteResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoteResponseRepository extends JpaRepository<VoteResponse, UUID> {

    /**
     * 특정 투표의 모든 응답 조회
     */
    List<VoteResponse> findByVoteIdOrderByCreatedAtAsc(UUID voteId);

    /**
     * 특정 사용자의 특정 투표 응답 조회
     */
    Optional<VoteResponse> findByVoteIdAndUserId(UUID voteId, UUID userId);

    /**
     * 사용자가 특정 투표에 응답했는지 확인
     */
    boolean existsByVoteIdAndUserId(UUID voteId, UUID userId);

    /**
     * 특정 투표의 응답 수 조회
     */
    @Query("SELECT COUNT(vr) FROM VoteResponse vr WHERE vr.vote.id = :voteId")
    Long countByVoteId(@Param("voteId") UUID voteId);

    /**
     * 특정 투표의 선택지별 응답 수 조회
     */
    @Query("SELECT vr.selectedOption, COUNT(vr) FROM VoteResponse vr WHERE vr.vote.id = :voteId GROUP BY vr.selectedOption")
    List<Object[]> countResponsesByChoice(@Param("voteId") UUID voteId);

    /**
     * 특정 사용자의 모든 투표 응답 조회
     */
    List<VoteResponse> findByUserIdOrderByCreatedAtDesc(UUID userId);
}