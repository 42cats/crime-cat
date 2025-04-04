package com.crimecat.backend.user.service;

import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.dto.IGameHistoryRankingDto;
import com.crimecat.backend.gameHistory.service.GameHistoryQueryService;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.service.GuildService;
import com.crimecat.backend.guild.service.GuildQueryService;
import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.permission.service.PermissionService;
import com.crimecat.backend.point.service.PointHistoryService;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.domain.UserPermission;
import com.crimecat.backend.user.dto.*;
import io.micrometer.common.util.StringUtils;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService {

	private final static String SORT_BY_POINT = "point";
	private final static String SORT_BY_PLAY_TIME = "playtime";
	private final static String SORT_BY_MAKERS = "makers";
	private final static String SORT_BY_BEST_THEME = "theme";

	private final UserQueryService userQueryService;
	private final PointHistoryService pointHistoryService;
	private final PermissionService permissionService;
	private final UserPermissionService userPermissionService;
	private final GameHistoryQueryService gameHistoryQueryService;
	private final GuildService guildService;
	private final GuildQueryService guildQueryService;


	@Transactional(readOnly = true)
	public User findUserBySnowflake(String userSnowflake) {
		return userQueryService.findByUserSnowflake(userSnowflake);
	}

	@Transactional
	public UserInfoResponseDto saveUserInfo(String userSnowflake, String userName, String userAvatar) {
		if (StringUtils.isBlank(userSnowflake) || StringUtils.isBlank(userName)
				|| StringUtils.isBlank(userAvatar)) {
			return new UserInfoResponseDto("Invalid request format", null);
		}
		String message = "Already User registered";
		User user = findUserBySnowflake(userSnowflake);
		if (user == null) {
			user = userQueryService.saveUser(User.of(userSnowflake, userName, userAvatar));
			message = "User registered";
		}

		UserResponseDto userResponseDto
				= new UserResponseDto(userSnowflake, userName, userAvatar, user.getCreatedAt());
		return new UserInfoResponseDto(message, userResponseDto);
	}

	/**
	 * 특정 유저가 특정 권한 구매
	 * @param userSnowflake
	 * @param permissionName
	 * @return
	 */
		/*
			유저 확인
			포인트 확인
			권한 확인
			구매 -> 포인트 차감 및 포인트 히스토리 생성
			권한 있는 지 확인 후 연장 및 추가
			저장
		 */
	@Transactional
	public UserPermissionPurchaseResponseDto purchaseUserPermission(String userSnowflake,
			String permissionName) {
		if (StringUtils.isBlank(userSnowflake) || StringUtils.isBlank(permissionName)) {
			return new UserPermissionPurchaseFailedResponseDto("Invalid request format", 0, 0);
		}
		User user = findUserBySnowflake(userSnowflake);
		if (user == null) {
			return new UserPermissionPurchaseFailedResponseDto("user not found", 0, 0);
		}

		Permission permission = permissionService.findPermissionByPermissionName(permissionName);
		if (permission == null) {
			return new UserPermissionPurchaseFailedResponseDto("permission not found", 0, 0);
		}

		Integer userPoint = user.getPoint();
		Integer permissionPrice = permission.getPrice();
		if (userPoint < permissionPrice) {
			return new UserPermissionPurchaseFailedResponseDto("point not enough", permissionPrice, userPoint);
		}

		user.usePoints(permissionPrice);
		pointHistoryService.usePoint(user, permission, permissionPrice);

		UserPermission userPermission = userPermissionService.getUserPermissionByPermissionId(user, permission.getId());
		if (userPermission != null && LocalDateTime.now().isBefore(userPermission.getExpiredAt())) {
			userPermission.extendPermissionPeriod(permission.getDuration());
		}
		else {
			userPermissionService.purchasePermission(user, permission);
		}

		List<UserPermissionPurchaseDto> userPermissionPurchaseDtos
				= userPermissionService.getActiveUserPermissions(user)
				.stream()
				.map(up -> new UserPermissionPurchaseDto(up.getPermission().getName(), up.getExpiredAt()))
				.toList();

		return new UserPermissionPurchaseSuccessResponseDto("Permission granted successfully",
				userPermissionPurchaseDtos);
	}

	@Transactional(readOnly = true)
	public UserHasPermissionResponseDto checkUserHasPermissionByPermissionName(String userSnowflake,
			String permissionName) {
		if (StringUtils.isBlank(userSnowflake) || StringUtils.isBlank(permissionName)) {
			return new UserHasPermissionResponseDto("Invalid request format");
		}

		User user = findUserBySnowflake(userSnowflake);
		if (user == null) {
			return new UserHasPermissionResponseDto("user not found");
		}

		Permission permission = permissionService.findPermissionByPermissionName(permissionName);
		if (permission == null) {
			return new UserHasPermissionResponseDto("permission not found");
		}

		UserPermission userPermissionByPermissionId = userPermissionService.getUserPermissionByPermissionId(
				user, permission.getId());

		if (userPermissionByPermissionId != null && LocalDateTime.now().isBefore(userPermissionByPermissionId.getExpiredAt())) {
			return new UserHasPermissionResponseDto("Permission has");
		}
		return new UserHasPermissionResponseDto("not has Permission");
	}

	/**
	 * 유저가 가진 모든 권한 조회
	 * 유저 조회, 유저의 권한 목록 조회
	 * @param userSnowflake
	 * @return
	 */
	@Transactional(readOnly = true)
	public UserGrantedPermissionResponseDto getAllUserPermissions(String userSnowflake) {
		if (StringUtils.isBlank(userSnowflake)) {
			return new UserGrantedPermissionResponseDto("Invalid request format", null);
		}
		User user = findUserBySnowflake(userSnowflake);
		if (user == null) {
			return new UserGrantedPermissionResponseDto("user not found", null);
		}

		List<UserGrantedPermissionDto> userGrantedPermissions
				= userPermissionService.getActiveUserPermissions(user)
				.stream()
				.map(aup -> new UserGrantedPermissionDto(
						aup.getPermission().getId(),
						aup.getPermission().getName(),
						aup.getExpiredAt()))
				.toList();

		return new UserGrantedPermissionResponseDto(userSnowflake, userGrantedPermissions);
	}

	/**
	 * 유저의 현재 랭킹 반환
	 * 플레이 횟수 순, 보유 포인트 순
	 * @param userSnowflake
	 * @return
	 */
	@Transactional(readOnly = true)
	public UserRankingResponseDto getUserRanking(String userSnowflake) {
		if (StringUtils.isBlank(userSnowflake)) {
			return new UserRankingFailedResponseDto("Invalid request format");
		}

		User user = userQueryService.findByUserSnowflake(userSnowflake);
		if (user == null) {
			return new UserRankingFailedResponseDto("user not found");
		}

		// 플레이 횟수 순위
		Integer gameHistoryCountByUserSnowflake
				 = gameHistoryQueryService.getGameHistoryByUserSnowflake(userSnowflake).size();
		Integer userRankByGameHistoryCount
				= gameHistoryQueryService.getGameHistoryWithPlayCountGreaterThan(gameHistoryCountByUserSnowflake).size() + 1;

		// 보유 포인트 순위
		Integer userRankByPoint = userQueryService.getUsersWithPointGreaterThan(user.getPoint()).size() + 1;

		Integer totalUserCount = userQueryService.getUserCount();

		return new UserRankingSuccessResponseDto(
				"user info find successfully",
				userSnowflake,
				gameHistoryCountByUserSnowflake,
				userRankByGameHistoryCount,
				user.getPoint(),
				userRankByPoint,
				totalUserCount
				);
	}

	@Transactional(readOnly = true)
	public TotalUserRankingResponseDto getTotalUserRankingByParamCondition(Pageable pageable,
			String sortingCondition) {
		if (StringUtils.isBlank(sortingCondition)) {
			return new TotalUserRankingFailedResponseDto("Invalid request format");
		}

		Integer totalUserCount = userQueryService.getUserCount();

		List<TotalUserRankingDto> ranking = new ArrayList<>();

		// 보유 포인트 기준 랭킹
		if (sortingCondition.equals(SORT_BY_POINT)) {
			pageable = PageRequest.of(
					pageable.getPageNumber(),
					pageable.getPageSize(),
					Sort.by(Sort.Order.desc(sortingCondition)));
			Page<User> userWithPagination = userQueryService.getUserWithPagination(pageable);

			AtomicInteger rank = new AtomicInteger(1);
			ranking = userWithPagination.stream()
					.map(u -> new TotalUserRankingByPointDto(
							u.getSnowflake(),
							rank.getAndIncrement(),
							u.getPoint()))
					.collect(Collectors.toList());


			// 게임 횟수 별 랭킹
		} else if (sortingCondition.equals(SORT_BY_PLAY_TIME)) {
			List<IGameHistoryRankingDto> gameHistoryWithPagination
					= gameHistoryQueryService.getGameHistorySortingByPlayTimeWithPagination(pageable);

			AtomicInteger rank = new AtomicInteger(1);
			ranking = gameHistoryWithPagination.stream()
					.map(ghp -> new TotalUserRankingByPlayTimeDto(
							ghp.getUserSnowflake(),
							rank.getAndIncrement(),
							ghp.getPlayCount()))
					.collect(Collectors.toList());

		} else if (sortingCondition.equals(SORT_BY_MAKERS)) {
			List<Guild> allGuild = guildService.findAllGuild();

			// ownerSnowflake -> guild count 매핑
			Map<String, Long> guildCountMap = allGuild.stream()
					.collect(Collectors.groupingBy(Guild::getOwnerSnowflake, Collectors.counting()));

			AtomicInteger rank = new AtomicInteger(1);

			ranking = guildCountMap.entrySet().stream()
					.sorted(Map.Entry.<String, Long>comparingByValue().reversed())
					.map(entry -> new TotalUserRankingByMakerDto(
							entry.getKey(),
							rank.getAndIncrement(),
							entry.getValue().intValue()
					))
					.skip((long) pageable.getPageNumber() * pageable.getPageSize()) // 페이징 처리
					.limit(pageable.getPageSize())
					.collect(Collectors.toList());
		}
		else if(sortingCondition.equals(SORT_BY_BEST_THEME)){
			List<GameHistory> allGameHistory = gameHistoryQueryService.getAllGameHistory();

			// 길드별 플레이 수 집계
			Map<String, Long> guildPlayCountMap = allGameHistory.stream()
					.collect(Collectors.groupingBy(
							gh -> gh.getGuild().getSnowflake(),
							Collectors.counting()
					));
			AtomicInteger rank = new AtomicInteger(1);

			ranking = guildPlayCountMap.entrySet().stream()
					.sorted(Map.Entry.<String, Long>comparingByValue().reversed())
					.map(entry -> new TotalGuildRankingByPlayCountDto(
							entry.getKey(),
							rank.getAndIncrement(),
							entry.getValue().intValue()
					))
					.skip((long) pageable.getPageNumber() * pageable.getPageSize())
					.limit(pageable.getPageSize())
					.collect(Collectors.toList());
		}
		else {
			return new TotalUserRankingFailedResponseDto("params type error");
		}
		return new TotalUserRankingSuccessResponseDto(pageable.getPageNumber(), ranking.size(), totalUserCount, ranking);
	}

	public UserListResponseDto getUserList(String guildSnowflake, Boolean discordAlarm) {
		if (!guildQueryService.existsBySnowflake(guildSnowflake)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guild not exists");
		}
		return new UserListResponseDto(
				gameHistoryQueryService.findUsersByGuildSnowflakeAndDiscordAlarm(guildSnowflake, discordAlarm).stream()
						.map(GameHistory::getUser)
						.map(User::getSnowflake)
						.toList()
		);
	}

	public UserPatchResponseDto updateUserInfo(String userSnowflake, String avatar, Boolean discordAlarm) {
		User user = userQueryService.findByUserSnowflake(userSnowflake);
		if (user == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "user not exists");
		}
		user.setAvatar(avatar);
		user.setDiscordAlarm(discordAlarm);
		return new UserPatchResponseDto(new UserPatchDto(userQueryService.saveUser(user)));
	}
}
