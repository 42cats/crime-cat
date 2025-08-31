package com.crimecat.backend.schedule.repository;

import com.crimecat.backend.schedule.domain.Event;
import com.crimecat.backend.schedule.domain.EventParticipant;
import com.crimecat.backend.webUser.domain.WebUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventParticipantRepository extends JpaRepository<EventParticipant, UUID> {
    
    /**
     * 특정 이벤트의 전체 참여자 수 (나간 사람 포함)
     */
    int countByEvent(Event event);
    
    /**
     * 특정 이벤트의 활성 참여자 수 (나가지 않은 사람만)
     */
    @Query("SELECT COUNT(ep) FROM EventParticipant ep WHERE ep.event = :event AND ep.leftAt IS NULL")
    int countActiveByEvent(@Param("event") Event event);
    
    /**
     * 특정 사용자가 특정 이벤트에 참여 중인지 확인 (나가지 않은 상태)
     */
    @Query("SELECT CASE WHEN COUNT(ep) > 0 THEN true ELSE false END FROM EventParticipant ep " +
           "WHERE ep.event = :event AND ep.user = :user AND ep.leftAt IS NULL")
    boolean existsActiveByEventAndUser(@Param("event") Event event, @Param("user") WebUser user);
    
    /**
     * 기존 메서드 (하위 호환성)
     */
    boolean existsByEventAndUser(Event event, WebUser user);
    
    /**
     * 특정 이벤트의 모든 참여자 목록
     */
    List<EventParticipant> findByEvent(Event event);
    
    /**
     * 특정 이벤트의 활성 참여자 목록 (나가지 않은 사람만)
     */
    @Query("SELECT ep FROM EventParticipant ep WHERE ep.event = :event AND ep.leftAt IS NULL")
    List<EventParticipant> findActiveByEvent(@Param("event") Event event);
    
    /**
     * 특정 사용자와 이벤트의 참여 정보 조회
     */
    Optional<EventParticipant> findByEventAndUser(Event event, WebUser user);
    
    /**
     * 특정 사용자의 활성 참여 이벤트 목록
     */
    @Query("SELECT ep FROM EventParticipant ep WHERE ep.user = :user AND ep.leftAt IS NULL")
    List<EventParticipant> findActiveByUser(@Param("user") WebUser user);
}
