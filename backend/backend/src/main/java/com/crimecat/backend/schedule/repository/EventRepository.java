package com.crimecat.backend.schedule.repository;

import com.crimecat.backend.schedule.domain.Event;
import com.crimecat.backend.schedule.domain.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByCategory(String category);
    List<Event> findByStatus(EventStatus status);
    List<Event> findByCategoryAndStatus(String category, EventStatus status);
}
