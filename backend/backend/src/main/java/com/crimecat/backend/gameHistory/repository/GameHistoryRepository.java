package com.crimecat.backend.gameHistory.repository;

import com.crimecat.backend.gameHistory.domain.GameHistory;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameHistoryRepository extends JpaRepository<GameHistory, UUID> {

}
