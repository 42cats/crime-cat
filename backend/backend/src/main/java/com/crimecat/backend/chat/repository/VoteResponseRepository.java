package com.crimecat.backend.chat.repository;

import com.crimecat.backend.chat.domain.VoteResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoteResponseRepository extends JpaRepository<VoteResponse, Long> {

    /**
     * 특정 투표의 모든 응답 조회
     */
    List<VoteResponse> findByVoteIdOrderByCreatedAtAsc(Long voteId);

    /**
     * 특정 사용자의 특정 투표 응답 조회
     */
    Optional<VoteResponse> findByVoteIdAndUserId(Long voteId, String userId);

    /**
     * 사용자가 특정 투표에 응답했는지 확인
     */
    boolean existsByVoteIdAndUserId(Long voteId, String userId);

    /**
     * 특정 투표의 응답 수 조회
     */
    @Query("SELECT COUNT(vr) FROM VoteResponse vr WHERE vr.vote.id = :voteId")
    Long countByVoteId(@Param("voteId") Long voteId);

    /**
     * 특정 투표의 선택지별 응답 수 조회
     */
    @Query("SELECT vr.choiceIndex, COUNT(vr) FROM VoteResponse vr WHERE vr.vote.id = :voteId GROUP BY vr.choiceIndex")
    List<Object[]> countResponsesByChoice(@Param("voteId") Long voteId);

    /**
     * 특정 사용자의 모든 투표 응답 조회
     */
    List<VoteResponse> findByUserIdOrderByCreatedAtDesc(String userId);
}