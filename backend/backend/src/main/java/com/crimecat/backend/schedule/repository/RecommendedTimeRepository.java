package com.crimecat.backend.schedule.repository;

import com.crimecat.backend.schedule.domain.Event;
import com.crimecat.backend.schedule.domain.RecommendedTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecommendedTimeRepository extends JpaRepository<RecommendedTime, UUID> {
    
    /**
     * 특정 이벤트의 추천 시간 목록 조회 (시작 시간 순 정렬)
     */
    List<RecommendedTime> findByEventOrderByStartTimeAsc(Event event);
    
    /**
     * 특정 이벤트의 추천 시간 목록 조회 (참여 가능 인원 많은 순 정렬)
     */
    List<RecommendedTime> findByEventOrderByParticipantCountDescStartTimeAsc(Event event);
    
    /**
     * 특정 이벤트의 선택된 추천 시간 조회
     */
    Optional<RecommendedTime> findByEventAndIsSelectedTrue(Event event);
    
    /**
     * 특정 이벤트의 모든 추천 시간 삭제
     */
    void deleteByEvent(Event event);
    
    /**
     * 특정 이벤트 ID의 모든 추천 시간 삭제 (성능 최적화)
     */
    @Modifying
    @Query("DELETE FROM RecommendedTime rt WHERE rt.event.id = :eventId")
    void deleteByEventId(@Param("eventId") UUID eventId);
    
    /**
     * 지정된 시간 이전의 추천 시간들 삭제 (정리용)
     */
    @Modifying
    @Query("DELETE FROM RecommendedTime rt WHERE rt.endTime < :cutoffTime")
    int deleteByEndTimeBefore(@Param("cutoffTime") LocalDateTime cutoffTime);
    
    /**
     * 특정 이벤트의 추천 시간 개수 조회
     */
    int countByEvent(Event event);
    
    /**
     * 특정 이벤트의 상위 N개 추천 시간 조회
     */
    @Query("SELECT rt FROM RecommendedTime rt WHERE rt.event = :event " +
           "ORDER BY rt.participantCount DESC, rt.startTime ASC")
    List<RecommendedTime> findTopNByEvent(@Param("event") Event event, 
                                         org.springframework.data.domain.Pageable pageable);
}