package com.crimecat.backend.gameHistory.service;

import com.crimecat.backend.gametheme.domain.GameTheme;
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
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GameHistoryQueryService {

	private final GameHistoryRepository gameHistoryRepository;

	@Transactional
	public void saveCrimeSceneUserGameHistory(boolean isWin,
									LocalDateTime createdAt, String characterName, User user, Guild guild, GameTheme gameTheme) {
		gameHistoryRepository.save(new GameHistory(isWin, createdAt, characterName, user, guild, gameTheme));
	}

	@Transactional(readOnly = true)
	public List<GameHistory> getGameHistoryByUserSnowflake(String discordSnowflake) {
		return gameHistoryRepository.getGameHistoryByUserSnowflake(discordSnowflake);
	}

	@Transactional(readOnly = true)
	public List<GameHistory> getGameHistoryWithPlayCountGreaterThan(Integer playCount) {
		return gameHistoryRepository.getGameHistoryWithPlayCountGreaterThan(playCount);
	}

	@Transactional(readOnly = true)
	public List<IGameHistoryRankingDto> getGameHistorySortingByPlayTimeWithPagination(Pageable pageable) {
		  return gameHistoryRepository.getGameHistorySortingByPlayTimeWithPagination(pageable);
	}

	@Transactional(readOnly = true)
	public GameHistory findGameHistoryByUserSnowFlakeAndGuildSnowflake(String discordSnowflake, String guildSnowflake) {
		return gameHistoryRepository.findGameHistoryByUserSnowFlakeAndGuildSnowflake(discordSnowflake,
				guildSnowflake);
	}
	@Transactional(readOnly = true)
	public List<GameHistory> getAllGameHistory(){
		return gameHistoryRepository.findAll();
	}

	@Transactional(readOnly = true)
	public List<GameHistory> findUsersByGuildSnowflakeAndDiscordAlarm(String guildSnowflake, Boolean discordAlarm) {
		return gameHistoryRepository.findUsersByGuildSnowflakeAndDiscordAlarm(guildSnowflake, discordAlarm);
	}

	@Transactional
	public void save(GameHistory gameHistory) {
		gameHistoryRepository.save(gameHistory);
	}
}
