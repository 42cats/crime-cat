package com.crimecat.backend.gameHistory.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.dto.IGameHistoryRankingDto;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.user.domain.User;

import lombok.RequiredArgsConstructor;

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

	public List<IGameHistoryRankingDto> getGameHistorySortingByPlayTimeWithPagination(Pageable pageable) {
		  return gameHistoryRepository.getGameHistorySortingByPlayTimeWithPagination(pageable);
	}

	public GameHistory findGameHistoryByUserSnowFlakeAndGuildSnowflake(String userSnowflake, String guildSnowflake) {
		return gameHistoryRepository.findGameHistoryByUserSnowFlakeAndGuildSnowflake(userSnowflake,
				guildSnowflake);
	}
	public List<GameHistory> getAllGameHistory(){
		return gameHistoryRepository.findAll();
	}

	public List<GameHistory> findUsersByGuildSnowflakeAndDiscordAlarm(String guildSnowflake, Boolean discordAlarm) {
		return gameHistoryRepository.findUsersByGuildSnowflakeAndDiscordAlarm(guildSnowflake, discordAlarm);
	}

	public void save(GameHistory gameHistory) {
		gameHistoryRepository.save(gameHistory);
	}
}
