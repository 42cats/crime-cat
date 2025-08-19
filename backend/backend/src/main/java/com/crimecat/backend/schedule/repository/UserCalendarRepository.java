package com.crimecat.backend.schedule.repository;

import com.crimecat.backend.schedule.domain.UserCalendar;
import com.crimecat.backend.webUser.domain.WebUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCalendarRepository extends JpaRepository<UserCalendar, UUID> {
    Optional<UserCalendar> findByUser(WebUser user);
}
