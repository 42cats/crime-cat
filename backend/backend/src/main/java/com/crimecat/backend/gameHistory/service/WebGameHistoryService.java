package com.crimecat.backend.gameHistory.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.dto.CheckPlayResponseDto;
import com.crimecat.backend.gameHistory.dto.GameHistoryUpdateRequestDto;
import com.crimecat.backend.gameHistory.dto.SaveUserGameHistoryRequestDto;
import com.crimecat.backend.gameHistory.dto.SaveUserHistoryResponseDto;
import com.crimecat.backend.gameHistory.dto.UserGameHistoryToOwnerDto;
import com.crimecat.backend.gameHistory.dto.UserGameHistoryToUserDto;
import com.crimecat.backend.gameHistory.dto.WebHistoryRequestDto;
import com.crimecat.backend.gameHistory.dto.WebHistoryResponseDto;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
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

		// 캐시 무효화 - WebUser가 있는 경우에만
		if (user.getWebUser() != null) {
			invalidateCrimeSceneHistoryCaches(user.getWebUser().getId().toString());
		}

		return new SaveUserHistoryResponseDto("History recorded successfully");
	}

	@Transactional(readOnly = true)
	public Page<UserGameHistoryToUserDto> getUserCrimeSceneGameHistoryByDiscordUserSnowflake(String discordSnowflake, Pageable pageable, String keyword) {

		User user = userService.findUserByDiscordSnowflake(discordSnowflake);
		if (user == null) {
			throw  ErrorStatus.USER_NOT_FOUND.asServiceException();
		}
		return gameHistoryRepository.findByUserSnowflakeAndKeyword(discordSnowflake, keyword, pageable).map(UserGameHistoryToUserDto::from);
	}
	
	@Transactional(readOnly = true)
	public Page<UserGameHistoryToUserDto> getUserCrimeSceneGameHistoryWithFilters(
			String discordSnowflake, 
			Pageable pageable, 
			String keyword, 
			Boolean winFilter, 
			LocalDateTime startDate, 
			LocalDateTime endDate, 
			Boolean hasTheme) {
			
		User user = userService.findUserByDiscordSnowflake(discordSnowflake);
		if (user == null) {
			throw ErrorStatus.USER_NOT_FOUND.asServiceException();
		}
		
		return gameHistoryRepository.findByUserSnowflakeWithFilters(
				discordSnowflake, 
				keyword, 
				winFilter, 
				startDate, 
				endDate, 
				hasTheme, 
				pageable
		).map(UserGameHistoryToUserDto::from);
	}

		@Transactional(readOnly = true)
	public Page<UserGameHistoryToOwnerDto> WebGetGuildOwnerHistory(User owner, String guildSnowflake, Pageable pageable, String keyword) {

		Guild guild = guildRepository.findBySnowflake(guildSnowflake).orElseThrow(ErrorStatus.GUILD_NOT_FOUND::asServiceException);
		if(!guild.getOwnerSnowflake().equals(owner.getDiscordSnowflake())){
			throw ErrorStatus.NOT_GUILD_OWNER.asServiceException();
		}

		Page<GameHistory> page;
		if (keyword != null && !keyword.trim().isEmpty()) {
			page = gameHistoryRepository.findByGuildSnowflakeAndKeyword(guildSnowflake, keyword, pageable);
		} else {
			page = gameHistoryRepository.findByGuild_Snowflake(guildSnowflake, pageable);
		}

		return page.map(UserGameHistoryToOwnerDto::from);
	}
	
	@Transactional(readOnly = true)
	public Page<UserGameHistoryToOwnerDto> WebGetGuildOwnerHistoryWithFilters(
			User owner, 
			String guildSnowflake, 
			Pageable pageable, 
			String keyword,
			Boolean winFilter, 
			LocalDateTime startDate,
			LocalDateTime endDate, 
			Boolean hasTheme) {

		Guild guild = guildRepository.findBySnowflake(guildSnowflake).orElseThrow(ErrorStatus.GUILD_NOT_FOUND::asServiceException);
		if(!guild.getOwnerSnowflake().equals(owner.getDiscordSnowflake())){
			throw ErrorStatus.NOT_GUILD_OWNER.asServiceException();
		}

		Page<GameHistory> page = gameHistoryRepository.findByGuildSnowflakeWithFilters(
				guildSnowflake, 
				keyword, 
				winFilter, 
				startDate, 
				endDate, 
				hasTheme, 
				pageable);

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

	/**
	 * 게임 테마에 대해 사용자가 플레이했는지 혹은 제작팀 멤버인지 확인
	 *
	 * @param gameThemeId 확인할 게임 테마 ID
	 * @param currentWebUser 현재 사용자
	 * @return 플레이 여부 혹은 제작팀 멤버 여부
	 */
	@Transactional(readOnly = true)
	public CheckPlayResponseDto checkHasPlayed(UUID gameThemeId, WebUser currentWebUser) {
		// 1. 게임 테마 조회
		GameTheme gameTheme = gameThemeRepository.findById(gameThemeId)
				.orElseThrow(ErrorStatus.INVALID_ACCESS::asServiceException);
		
		// 2. 크라임씬 테마인 경우 제작팀 멤버 여부 확인
		if (gameTheme instanceof CrimesceneTheme) {
			// JOIN FETCH로 팀과 멤버를 함께 조회
			Optional<CrimesceneTheme> crimesceneThemeOpt = crimesceneThemeRepository.findByIdWithTeamAndMembers(gameThemeId);
			if (crimesceneThemeOpt.isPresent()) {
				CrimesceneTheme crimesceneTheme = crimesceneThemeOpt.get();
				if (crimesceneTheme.getTeam() != null && crimesceneTheme.getTeam().getMembers() != null) {
					boolean isMember = crimesceneTheme.getTeam().getMembers().stream()
							.anyMatch(member -> member.getWebUserId().equals(currentWebUser.getId()));
					
					if (isMember) {
						return CheckPlayResponseDto.from(true);
					}
				}
			}
		}
		
		// 3. 이미 플레이했는지 확인
		boolean hasPlayed = gameHistoryRepository.existsByUser_WebUser_IdAndGameTheme_Id(
				currentWebUser.getId(), gameThemeId);
				
		return CheckPlayResponseDto.from(hasPlayed);
	}

    @Transactional
    public WebHistoryResponseDto WebHistoryAddRequest(User user, UUID gameThemeId, WebHistoryRequestDto dto) {
        List<Notification> existingNotifications = notificationRepository
            .findBySenderAndTypeOrderByCreatedAtDesc(user, NotificationType.GAME_RECORD_REQUEST)
            .stream()
            .filter(n -> n.getDataField("gameThemeId").equals(gameThemeId.toString()))
            .toList();
        
        // 기존 요청이 있는 경우 체크: 이미 처리되었거나 처리 중인지 확인
        if (!existingNotifications.isEmpty()) {
            Notification latest = existingNotifications.getFirst();
            if (latest.getStatus() == NotificationStatus.PROCESSED) {
							if(gameHistoryRepository.existsByGameTheme_IdAndUser_Id(gameThemeId,user.getId())){
                	return WebHistoryResponseDto.from("이미 승인 처리 되었습니다.");
							}
            } else {
                return WebHistoryResponseDto.from("길드 오너가 처리중에 있습니다.");
            }
        }
        
        // 새로운 요청 처리 - JOIN FETCH로 Author와 WebUser를 함께 조회
        GameTheme gameTheme = gameThemeRepository.findByIdWithAuthorAndWebUser(gameThemeId)
            .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        
        // 사용자 WebUser 정보 추가 조회
        WebUser webUser = user.getWebUser();
        WebUser authorWebUser = gameTheme.getAuthor();
        
        // 게임 기록 요청 이벤트만 발행 (사용자 확인 알림은 Event Listener에서 처리)
        notificationEventPublisher.publishGameRecordRequest(
            this,
            gameThemeId,
            gameTheme.getTitle(),
            webUser != null ? webUser.getId() : user.getId(), // WebUser ID 우선 사용
            authorWebUser != null ? authorWebUser.getId() : gameTheme.getAuthor().getId(), // AuthorWebUser ID 우선 사용
            dto.getMessage(),
						user.getName()
        );
        
        return WebHistoryResponseDto.from("요청이 발송되었습니다.");
    }
    
    /**
     * 특정 사용자의 크라임씬 플레이 기록 개수 조회 (공개)
     */
    @Transactional(readOnly = true)
    public Long getUserCrimeSceneHistoryCount(String userId) {
        try {
            UUID userUuid = UUID.fromString(userId);
            return gameHistoryRepository.countByUser_WebUser_Id(userUuid);
        } catch (IllegalArgumentException e) {
            log.warn("잘못된 사용자 ID 형식 - userId: {}", userId);
            return 0L;
        }
    }
    
    /**
     * 특정 사용자의 크라임씬 플레이 기록 목록 조회 (공개)
     */
    @Transactional(readOnly = true)
    public Page<UserGameHistoryToUserDto> getPublicUserCrimeSceneGameHistory(String userId, Pageable pageable) {
        try {
            UUID userUuid = UUID.fromString(userId);
            Page<GameHistory> histories = gameHistoryRepository.findByUser_WebUser_IdOrderByCreatedAtDesc(userUuid, pageable);
            return histories.map(UserGameHistoryToUserDto::fromPublic);
        } catch (IllegalArgumentException e) {
            log.warn("잘못된 사용자 ID 형식 - userId: {}", userId);
            return Page.empty(pageable);
        }
    }

    @Transactional
    public void updateGameHistoryByThemeId(WebUser webUser, UUID themeId, GameHistoryUpdateRequestDto gameHistoryUpdateRequestDto) {
        User user = webUser.getUser();
        if (user == null) {
            throw ErrorStatus.USER_NOT_FOUND.asServiceException();
        }

        // 해당 테마의 게임 기록 찾기
        GameHistory gameHistory = gameHistoryRepository.findByUserAndGameTheme_Id(user, themeId)
				.orElseThrow(ErrorStatus.GAME_HISTORY_NOT_FOUND::asServiceException);

        // 권한 확인 - 본인 기록만 수정 가능
        if (!gameHistory.getUser().getId().equals(user.getId())) {
            throw ErrorStatus.INVALID_ACCESS.asServiceException();
        }

        // 기록 업데이트
        if (gameHistoryUpdateRequestDto.getCharacterName() != null) {
            gameHistory.setCharacterName(gameHistoryUpdateRequestDto.getCharacterName());
        }
        if (gameHistoryUpdateRequestDto.getWin() != null) {
            gameHistory.setIsWin(gameHistoryUpdateRequestDto.getWin());
        }
        if (gameHistoryUpdateRequestDto.getMemo() != null) {
            gameHistory.setMemo(gameHistoryUpdateRequestDto.getMemo());
        }
        if (gameHistoryUpdateRequestDto.getCreatedAt() != null) {
            gameHistory.setCreatedAt(gameHistoryUpdateRequestDto.getCreatedAt());
        }

        gameHistoryRepository.save(gameHistory);
        log.info("게임 기록이 업데이트되었습니다. themeId: {}, userId: {}", themeId, user.getId());
        
        // 캐시 무효화
        invalidateCrimeSceneHistoryCaches(webUser.getId().toString());
    }
    
    /**
     * 크라임씬 기록 캐시 무효화
     */
    @Caching(evict = {
        @CacheEvict(cacheNames = "integratedGameHistory", allEntries = true),
        @CacheEvict(cacheNames = "userGameStatistics", key = "#userId"),
        @CacheEvict(cacheNames = "userProfileStats", allEntries = true)
    })
    public void invalidateCrimeSceneHistoryCaches(String userId) {
        log.info("크라임씬 기록 캐시 무효화 - userId: {}", userId);
    }
}
