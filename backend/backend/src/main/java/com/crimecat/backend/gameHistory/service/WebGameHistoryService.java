package com.crimecat.backend.gameHistory.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.dto.CheckPlayResponseDto;
import com.crimecat.backend.gameHistory.dto.GameHistoryUpdateRequestDto;
import com.crimecat.backend.gameHistory.dto.RequestHistoryAdd;
import com.crimecat.backend.gameHistory.dto.SaveUserGameHistoryRequestDto;
import com.crimecat.backend.gameHistory.dto.SaveUserHistoryResponseDto;
import com.crimecat.backend.gameHistory.dto.UserGameHistoryToOwnerDto;
import com.crimecat.backend.gameHistory.dto.UserGameHistoryToUserDto;
import com.crimecat.backend.gameHistory.dto.WebHistoryAddRequestDto;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.repository.CrimesceneThemeRepository;
import com.crimecat.backend.gametheme.repository.GameThemeRepository;
import com.crimecat.backend.gametheme.service.GameThemeService;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.guild.service.bot.GuildQueryService;
import com.crimecat.backend.guild.service.bot.GuildService;
import com.crimecat.backend.notification.domain.Notification;
import com.crimecat.backend.notification.enums.NotificationStatus;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.event.NotificationEventPublisher;
import com.crimecat.backend.notification.repository.NotificationRepository;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.service.UserService;
import com.crimecat.backend.webUser.domain.WebUser;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebGameHistoryService {

	private final GameHistoryQueryService gameHistoryQueryService;

	private final UserService userService;
	private final GuildService guildService;
	private final GuildQueryService guildQueryService;
	private final GameThemeService gameThemeService;
	private final GameThemeRepository gameThemeRepository;
	private final GuildRepository guildRepository;
	private final GameHistoryRepository gameHistoryRepository;
	private final CrimesceneThemeRepository crimesceneThemeRepository;
	private final NotificationRepository notificationRepository;
	private final NotificationEventPublisher notificationEventPublisher;

	@Transactional
	public SaveUserHistoryResponseDto saveCrimeSceneUserGameHistory(
			SaveUserGameHistoryRequestDto saveUserGameHistoryRequestDto) {

		User user = userService.findUserByDiscordSnowflake(saveUserGameHistoryRequestDto.getUserSnowflake());
		if (user == null) {
			return new SaveUserHistoryResponseDto("History recorded failed");
		}

		Guild guild = guildService.findGuildByGuildSnowflake(saveUserGameHistoryRequestDto.getGuildSnowflake());
		if (guild == null) {
			return new SaveUserHistoryResponseDto("History recorded failed");
		}

		GameHistory gameHistoryByUserSnowFlakeAndGuildSnowflake = gameHistoryQueryService.findGameHistoryByUserSnowFlakeAndGuildSnowflake(
				user.getDiscordSnowflake(),
				guild.getSnowflake());
		if (gameHistoryByUserSnowFlakeAndGuildSnowflake != null) {
			return new SaveUserHistoryResponseDto("History already recorded");
		}

		CrimesceneTheme byGuildSnowflake = crimesceneThemeRepository.findByGuildSnowflake(
				guild.getSnowflake())
				.orElse(null);

		gameHistoryQueryService.saveCrimeSceneUserGameHistory(
				saveUserGameHistoryRequestDto.isWin(),
				saveUserGameHistoryRequestDto.getCreatedAt(),
				saveUserGameHistoryRequestDto.getCharacterName(),
				user,
				guild,
				byGuildSnowflake);

		return new SaveUserHistoryResponseDto("History recorded successfully");
	}

	@Transactional(readOnly = true)
	public Page<UserGameHistoryToUserDto> getUserCrimeSceneGameHistoryByDiscordUserSnowflake(String discordSnowflake, Pageable pageable, String keyword) {

		User user = userService.findUserByDiscordSnowflake(discordSnowflake);
		if (user == null) {
			throw  ErrorStatus.USER_NOT_FOUND.asServiceException();
		}
		return gameHistoryRepository.findByUserSnowflakeAndKeyword(discordSnowflake,keyword, pageable).map(UserGameHistoryToUserDto::from);
	}

		@Transactional(readOnly = true)
	public Page<UserGameHistoryToOwnerDto> WebGetGuildOwnerHistory(User owner,String guildSnowflake, Pageable pageable) {

		Guild guild = guildRepository.findBySnowflake(guildSnowflake).orElseThrow(ErrorStatus.GUILD_NOT_FOUND::asServiceException);
		if(!guild.getOwnerSnowflake().equals(owner.getDiscordSnowflake())){
			throw ErrorStatus.NOT_GUILD_OWNER.asServiceException();
		}
			Page<GameHistory> page = gameHistoryRepository.searchByGuild_Snowflake(guildSnowflake, pageable);

		return page.map(UserGameHistoryToOwnerDto::from);
	}

	@Transactional
	public void WebUpdateGameHistory(WebUser webUser,String discordSnowflake, String guildSnowflake,
			GameHistoryUpdateRequestDto gameHistoryUpdateRequestDto) {
		if (userService.findUserByDiscordSnowflake(discordSnowflake) == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "user not exists");
		}
		if (!guildQueryService.existsBySnowflake(guildSnowflake)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guild not exists");
		}
		GameHistory gameHistory = gameHistoryQueryService.findGameHistoryByUserSnowFlakeAndGuildSnowflake(
				discordSnowflake, guildSnowflake);
		if (gameHistory == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "game history not exists");
		}
		if (
				!gameHistory.getUser().getDiscordSnowflake().equals(webUser.getDiscordUserSnowflake()) &&
						!gameHistory.getGuild().getOwnerSnowflake().equals(webUser.getDiscordUserSnowflake())
		) {
			throw ErrorStatus.INVALID_ACCESS.asServiceException();  //플레이한 유저도 아니고 오너도 아닐경우
		}

// 공통: 승패, 캐릭터명 수정
		gameHistory.setIsWin(gameHistoryUpdateRequestDto.getWin());
		gameHistory.setCharacterName(gameHistoryUpdateRequestDto.getCharacterName());
		gameHistory.setCreatedAt(gameHistoryUpdateRequestDto.getCreatedAt());
// 분기: 메모 수정
		if (gameHistory.getGuild().getOwnerSnowflake().equals(webUser.getDiscordUserSnowflake())) {
			// 오너라면
			gameHistory.setOwnerMemo(gameHistoryUpdateRequestDto.getMemo());
		} else {
			// 플레이어라면
			gameHistory.setMemo(gameHistoryUpdateRequestDto.getMemo());
		}

		gameHistoryQueryService.save(gameHistory);
	}

	public CheckPlayResponseDto checkHasPlayed(UUID gameThemeId,WebUser currentWebUser) {
		boolean hasPlayed = gameHistoryRepository.existsByDiscordUserIdAndGameThemeId(
				gameThemeId, currentWebUser.getUser()
						.getId());
		return CheckPlayResponseDto.from(hasPlayed);
	}

  public RequestHistoryAdd requestGameHistoryAdd(User user, UUID gameThemeId, WebHistoryAddRequestDto dto) {
		List<Notification> byUserAndTypeOrderByCreatedAtDesc = notificationRepository.findByUserAndTypeOrderByCreatedAtDesc(
				user, NotificationType.GAME_RECORD_REQUEST).stream().filter(v-> v.getDataField("gmaeThemeId").equals(gameThemeId.toString()));
		//데이터 필드에 게임테마 아이디가 있고
		//status 가 NotificationStatus.PROCESSED 이면 이미 처리되었습니다.
		//존재하기만 하면 처리중입니다.
//		RequestHistoryAdd.from("메시지");
//		에 메시지 적어서 반환
//		없으면
		GameTheme gameTheme = gameThemeRepository.findById(gameThemeId)
				.orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
		notificationEventPublisher.publishGameRecordRequest(
				this,
				gameThemeId,
				gameTheme.getTitle(),
				user.getId(),
				gameTheme.getAuthorId(),
				dto.getMessage()
		);

		notificationEventPublisher.publishSystemNotification(
				this,
				user.getId(),
				gameTheme.getTitle() + "기록 요청 성공",
				"기록 요청이 해당 테마의 오너에게 발송되었습니다. 승인을 기다려 주세요."
		)
//		RequestHistoryAdd.from("요청이 발송되었습니다.");
	}
}
