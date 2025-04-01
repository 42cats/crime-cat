package com.crimecat.backend.point.repository;

import com.crimecat.backend.point.domain.PointHistory;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PointHistoryRepository extends JpaRepository<PointHistory, UUID> {
}
