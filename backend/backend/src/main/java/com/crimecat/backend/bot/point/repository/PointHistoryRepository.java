package com.crimecat.backend.bot.point.repository;

import com.crimecat.backend.bot.point.domain.PointHistory;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PointHistoryRepository extends JpaRepository<PointHistory, UUID> {
}
