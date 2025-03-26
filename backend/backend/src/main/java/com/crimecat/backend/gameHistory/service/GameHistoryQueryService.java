package com.crimecat.backend.gameHistory.service;

import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.dto.IGameHistoryRankingDto;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.user.domain.User;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GameHistoryQueryService {

	private final GameHistoryRepository gameHistoryRepository;

	public void saveUserGameHistory(boolean isWin,
			LocalDateTime createdAt, String characterName, User user, Guild guild) {
		gameHistoryRepository.save(new GameHistory(isWin, createdAt, characterName, user, guild));
	}

	public List<GameHistory> getGameHistoryByUserSnowflake(String userSnowflake) {
		return gameHistoryRepository.getGameHistoryByUserSnowflake(userSnowflake);
	}

	public List<GameHistory> getGameHistoryWithPlayCountGreaterThan(Integer playCount) {
		return gameHistoryRepository.getGameHistoryWithPlayCountGreaterThan(playCount);
	}

	public List<IGameHistoryRankingDto> getGameHistoryWithPagination(Pageable pageable) {
		  return gameHistoryRepository.getGameHistoryWithPagination(pageable);
	}

	public GameHistory findGameHistoryByUserSnowFlakeAndGuildSnowflake(String userSnowflake, String guildSnowflake) {
		return gameHistoryRepository.findGameHistoryByUserSnowFlakeAndGuildSnowflake(userSnowflake,
				guildSnowflake);
	}
}
