package com.crimecat.backend.schedule.repository;

import com.crimecat.backend.schedule.domain.Event;
import com.crimecat.backend.schedule.domain.EventParticipant;
import com.crimecat.backend.webUser.domain.WebUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface EventParticipantRepository extends JpaRepository<EventParticipant, UUID> {
    int countByEvent(Event event);
    boolean existsByEventAndUser(Event event, WebUser user);
    List<EventParticipant> findByEvent(Event event);
}
