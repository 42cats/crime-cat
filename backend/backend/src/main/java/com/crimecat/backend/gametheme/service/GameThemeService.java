package com.crimecat.backend.gametheme.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.domain.GameThemeRecommendation;
import com.crimecat.backend.gametheme.domain.MakerTeamMember;
import com.crimecat.backend.gametheme.dto.*;
import com.crimecat.backend.gametheme.dto.filter.GetGameThemesFilter;
import com.crimecat.backend.gametheme.dto.filter.RangeFilter;
import com.crimecat.backend.gametheme.enums.ThemeType;
import com.crimecat.backend.gametheme.repository.CrimesceneThemeRepository;
import com.crimecat.backend.gametheme.repository.GameThemeRecommendationRepository;
import com.crimecat.backend.gametheme.repository.GameThemeRepository;
import com.crimecat.backend.gametheme.sort.GameThemeSortType;
import com.crimecat.backend.gametheme.specification.GameThemeSpecification;
import com.crimecat.backend.storage.StorageFileType;
import com.crimecat.backend.storage.StorageService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.location.service.LocationMappingService;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.point.service.PointHistoryService;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.config.CacheType;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class GameThemeService {
    private final StorageService storageService;
    private final GameThemeRepository themeRepository;
    private final MakerTeamService teamService;
    private final GameThemeRecommendationRepository themeRecommendationRepository;
    private final ViewCountService viewCountService;
    private final GameHistoryRepository gameHistoryRepository;
    private final CrimesceneThemeRepository crimesceneThemeRepository;
    private final LocationMappingService locationMappingService;
    private final UserRepository userRepository;
    private final PointHistoryService pointHistoryService;
    private final NotificationService notificationService;
    private final com.crimecat.backend.webUser.repository.WebUserRepository webUserRepository;
    private final ThemeCacheService themeCacheService;

    @Transactional
    public void addGameTheme(MultipartFile file, AddGameThemeRequest request) {
        GameTheme gameTheme = GameTheme.from(request);
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        gameTheme.setAuthorId(webUser.getId());

        if (gameTheme instanceof CrimesceneTheme) {
            checkTeam((CrimesceneTheme) gameTheme, webUser);
        }

        // 초기 저장하여 ID 생성
        gameTheme = themeRepository.save(gameTheme);

        // 파일 처리
        if (file != null && !file.isEmpty()) {
            String path = storageService.storeAt(StorageFileType.GAME_THEME, file, gameTheme.getId().toString());
            gameTheme.setThumbnail(path);
        }

        // CrimesceneTheme 경우 GameHistory 연결 처리
        if (gameTheme instanceof CrimesceneTheme) {
            updateGameHistoriesForCrimesceneTheme((CrimesceneTheme) gameTheme);
        }

        // 최종 저장 (한 번만 저장)
        themeRepository.save(gameTheme);

        // 포인트 지급 및 알림 발송
        rewardPointsForThemeCreation(gameTheme, webUser);
        
        // 캐시 무효화 - CrimesceneTheme인 경우 팀 멤버들의 캐시 무효화
        if (gameTheme instanceof CrimesceneTheme) {
            CrimesceneTheme crimesceneTheme = (CrimesceneTheme) gameTheme;
            if (crimesceneTheme.getTeam() != null) {
                themeCacheService.evictTeamMembersThemeSummaryCache(crimesceneTheme.getTeam().getId());
            }
        }
    }

    /**
     * CrimesceneTheme과 관련된 GameHistory 업데이트
     * @param crimesceneTheme 업데이트할 테마
     */
    private void updateGameHistoriesForCrimesceneTheme(CrimesceneTheme crimesceneTheme) {
        String guildSnowflake = crimesceneTheme.getGuildSnowflake();
        if (guildSnowflake == null || guildSnowflake.isEmpty()) {
            return; // snowflake가 없으면 처리하지 않음
        }

        // N+1 문제 방지를 위해 배치 처리
        List<GameHistory> histories = gameHistoryRepository.findAllByGuild_Snowflake(guildSnowflake);
        if (!histories.isEmpty()) {
            for (GameHistory history : histories) {
                history.setGameTheme(crimesceneTheme);
            }
            gameHistoryRepository.saveAll(histories);
        }
    }

    private void checkTeam(CrimesceneTheme gameTheme, WebUser webUser) {
        if (gameTheme.getTeamId() == null || gameTheme.getTeamId().toString().isEmpty()) {
            // 팀 ID가 null이거나 빈 문자열인 경우 개인 팀 처리
            List<MakerTeamMember> teams = teamService.getIndividualTeams(webUser.getId());
            if (teams.isEmpty()) {
                // 개인 팀이 없는 경우 생성
                UUID teamId = teamService.create(webUser.getNickname(), webUser, true);
                gameTheme.setTeamId(teamId);
            } else {
                // 기존 개인 팀 사용
                gameTheme.setTeamId(teams.getFirst().getTeam().getId());
            }
        }
    }

    @CacheEvict(value = {CacheType.GAME_THEME, CacheType.GAME_THEME_LIST}, key = "#themeId.toString()")
    @Transactional
    public void deleteGameTheme(UUID themeId) {
        GameTheme gameTheme = themeRepository.findById(themeId).orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        if (gameTheme.isDeleted()) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }
        AuthenticationUtil.validateCurrentUserMatches(gameTheme.getAuthorId());
        gameTheme.setIsDelete(true);
        themeRepository.save(gameTheme);
        
        // 캐시 무효화 - CrimesceneTheme인 경우 팀 멤버들의 캐시 무효화
        if (gameTheme instanceof CrimesceneTheme) {
            CrimesceneTheme crimesceneTheme = (CrimesceneTheme) gameTheme;
            if (crimesceneTheme.getTeam() != null) {
                themeCacheService.evictTeamMembersThemeSummaryCache(crimesceneTheme.getTeam().getId());
            }
        }
    }


    //@Cacheable(value = "game:theme", key = "#themeId.toString()")
    @Transactional(readOnly = true)
    public GetGameThemeResponse getGameTheme(UUID themeId) {
        GameTheme gameTheme = themeRepository.findById(themeId).orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        UUID webUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElse(null);
        if (gameTheme.isDeleted() || (!gameTheme.isPublicStatus() && !gameTheme.isAuthor(webUserId))) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }
        String clientIp = (String) ((ServletRequestAttributes) Objects.requireNonNull(
                RequestContextHolder
                        .getRequestAttributes()))
                .getRequest()
                .getAttribute("clientIp");
        viewCountService.themeIncrement(gameTheme, clientIp);
        return GetGameThemeResponse.builder()
                .theme(GameThemeDetailDto.of(gameTheme))
                .build();
    }

    // ================================
    // 크라임씬 테마 전용 업데이트
    // ================================

    @Transactional
    @CacheEvict(value = {CacheType.GAME_THEME, CacheType.GAME_THEME_LIST}, key = "#themeId.toString()")
    public void updateCrimesceneTheme(UUID themeId, MultipartFile file, UpdateCrimesceneThemeRequest request) {
        GameTheme gameTheme = getThemeForUpdate(themeId);

        // 요청에서 데이터 업데이트
        request.update(gameTheme);

        // CrimesceneTheme 전용 로직
        if (gameTheme instanceof CrimesceneTheme crimesceneTheme) {
            WebUser webUser = AuthenticationUtil.getCurrentWebUser();

            // 팀 ID가 null이거나 빈 값이면 개인 팀 처리 (개인 모드로 변경된 경우)
            if (crimesceneTheme.getTeamId() == null || crimesceneTheme.getTeamId().toString().isEmpty()) {
                checkTeam(crimesceneTheme, webUser);
            }

            updateGameHistoriesForCrimesceneTheme(crimesceneTheme);
        }

        updateThumbnailIfProvided(gameTheme, file);
        themeRepository.save(gameTheme);
        
        // 캐시 무효화 - CrimesceneTheme인 경우 팀 멤버들의 캐시 무효화
        if (gameTheme instanceof CrimesceneTheme crimesceneTheme) {
            if (crimesceneTheme.getTeam() != null) {
                themeCacheService.evictTeamMembersThemeSummaryCache(crimesceneTheme.getTeam().getId());
            }
        }
    }

    // ================================
    // 방탈출 테마 전용 업데이트
    // ================================

    @Transactional
    @CacheEvict(value = {CacheType.GAME_THEME, CacheType.GAME_THEME_LIST}, key = "#themeId.toString()")
    public void updateEscapeRoomTheme(UUID themeId, MultipartFile file, UpdateEscapeRoomThemeRequest request) {
        GameTheme gameTheme = getThemeForUpdate(themeId);

        // 요청에서 데이터 업데이트
        request.update(gameTheme);

        updateThumbnailIfProvided(gameTheme, file);
        themeRepository.save(gameTheme);
    }

    // ================================
    // 머더미스터리 테마 전용 업데이트
    // ================================

    @Transactional
    @CacheEvict(value = {CacheType.GAME_THEME, CacheType.GAME_THEME_LIST}, key = "#themeId.toString()")
    public void updateMurderMysteryTheme(UUID themeId, MultipartFile file, UpdateGameThemeRequest request) {
        GameTheme gameTheme = getThemeForUpdate(themeId);

        // 요청에서 데이터 업데이트
        request.update(gameTheme);

        updateThumbnailIfProvided(gameTheme, file);
        themeRepository.save(gameTheme);
    }

    // ================================
    // 리얼월드 테마 전용 업데이트
    // ================================

    @Transactional
    @CacheEvict(value = {CacheType.GAME_THEME, CacheType.GAME_THEME_LIST}, key = "#themeId.toString()")
    public void updateRealWorldTheme(UUID themeId, MultipartFile file, UpdateGameThemeRequest request) {
        GameTheme gameTheme = getThemeForUpdate(themeId);

        // 요청에서 데이터 업데이트
        request.update(gameTheme);

        updateThumbnailIfProvided(gameTheme, file);
        themeRepository.save(gameTheme);
    }

    // ================================
    // 공통 헬퍼 메서드들
    // ================================

    private GameTheme getThemeForUpdate(UUID themeId) {
        GameTheme gameTheme = themeRepository.findById(themeId)
            .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);

        if (gameTheme.isDeleted()) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }

        AuthenticationUtil.validateCurrentUserMatches(gameTheme.getAuthorId());
        return gameTheme;
    }

    private void updateThumbnailIfProvided(GameTheme gameTheme, MultipartFile file) {
        if (file != null && !file.isEmpty()) {
            String path = storageService.storeAt(StorageFileType.GAME_THEME, file, gameTheme.getId().toString());
            gameTheme.setThumbnail(path);
        }
    }

    // ================================
    // 레거시 메서드 (하위 호환성) - 추후 제거 예정
    // ================================

    @Transactional
    @Deprecated
    public void updateGameTheme(UUID themeId, MultipartFile file, UpdateGameThemeRequest request) {
        // 타입에 따라 적절한 메서드로 분기
        GameTheme gameTheme = getThemeForUpdate(themeId);

        if (request instanceof UpdateCrimesceneThemeRequest crimesceneRequest) {
            updateCrimesceneTheme(themeId, file, crimesceneRequest);
        } else if (request instanceof UpdateEscapeRoomThemeRequest escapeRoomRequest) {
            updateEscapeRoomTheme(themeId, file, escapeRoomRequest);
        } else {
            // 기본 업데이트 로직
            request.update(gameTheme);
            updateThumbnailIfProvided(gameTheme, file);
            themeRepository.save(gameTheme);
        }
    }

    @Transactional
    // Redis 캐시 직렬화 문제로 인해 캐시 비활성화
    public GetGameThemesResponse getGameThemes(GetGameThemesFilter filter) {
        UUID webUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElse(null);
        Sort sort = GameThemeSortType.valueOf(filter.getSort()).getSort();
        Pageable pageable = PageRequest.of(filter.getPage(), filter.getLimit(), sort);
        // TODO: QueryDSL
        Specification<GameTheme> spec = Specification.where(GameThemeSpecification.defaultSpec(webUserId));
        if (ThemeType.contains(filter.getCategory())) {
            spec = spec.and(GameThemeSpecification.equalCategory(filter.getCategory()));
        }
        if (filter.getKeyword() != null) {
            spec = spec.and(GameThemeSpecification.findKeyword(filter.getKeyword(), filter.getCategory(), locationMappingService));
        }
        for (RangeFilter range : filter.getRanges()) {
            spec = spec.and(GameThemeSpecification.findIntRange(range));
        }
        // 플레이 여부 필터 적용 (방탈출 테마일 경우만)
        if (filter.getHasPlayed() != null && ThemeType.Values.ESCAPE_ROOM.equals(filter.getCategory())) {
            spec = spec.and(GameThemeSpecification.hasBeenPlayedByUser(webUserId, filter.getHasPlayed()));
        }
        Page<GameThemeDto> page = themeRepository.findAll(spec, pageable).map(GameThemeDto::from);
        return GetGameThemesResponse.from(page);
    }

    @Transactional
    //@CacheEvict(value = "game:theme:like", key = "#themeId.toString() + ':' + T(com.crimecat.backend.utils.AuthenticationUtil).getCurrentWebUserId()")
    public void like(UUID themeId) {
        GameTheme theme = themeRepository.findById(themeId)
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        UUID webUserId = AuthenticationUtil.getCurrentWebUserId();
        themeRecommendationRepository.save(GameThemeRecommendation.builder().themeId(themeId).webUserId(webUserId).build());
        theme.liked();
        themeRepository.save(theme);
    }

    @Transactional
    //@CacheEvict(value = "game:theme:like", key = "#themeId.toString() + ':' + T(com.crimecat.backend.utils.AuthenticationUtil).getCurrentWebUserId()")
    public void cancleLike(UUID themeId) {
        GameTheme theme = themeRepository.findById(themeId)
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        UUID webUserId = AuthenticationUtil.getCurrentWebUserId();
        GameThemeRecommendation recommendation = themeRecommendationRepository.findByWebUserIdAndThemeId(webUserId, themeId)
                .orElseThrow(ErrorStatus.FORBIDDEN::asServiceException);
        themeRecommendationRepository.delete(recommendation);
        theme.cancleLike();
        themeRepository.save(theme);
    }

    //@Cacheable(value = "game:theme:like", key = "#themeId.toString() + ':' + T(com.crimecat.backend.utils.AuthenticationUtil).getCurrentWebUserId()")
    public boolean getLikeStatus(UUID themeId) {
        themeRepository.findById(themeId)
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        UUID webUserId = AuthenticationUtil.getCurrentWebUserId();
        return themeRecommendationRepository.findByWebUserIdAndThemeId(webUserId, themeId).isPresent();
    }

    @Cacheable(value = CacheType.USER_THEME_SUMMARY, key = "#webUserId")
    @Transactional(readOnly = true)
    public CrimesceneThemeSummeryListDto getGameThemeSummery(UUID webUserId) {
        // 사용자가 속한 팀 ID 목록 가져오기
        List<UUID> teamIds = teamService.getTargetTeams(webUserId);

        // 팀이 없는 경우 빈 리스트 반환
        if (teamIds.isEmpty()) {
            return CrimesceneThemeSummeryListDto.from(List.of());
        }

        // 최적화된 쿼리로 모든 팀의 테마를 한 번에 조회
        List<CrimesceneTheme> themes = crimesceneThemeRepository.findByTeamIdsAndNotDeleted(teamIds);

        // 각 테마를 DTO로 변환하여 리스트로 만들기
        List<CrimesceneThemeSummeryDto> themeDtos = themes.stream()
            .map(CrimesceneThemeSummeryDto::from)
            .toList();

        // 리스트 DTO로 변환하여 반환
        return CrimesceneThemeSummeryListDto.from(themeDtos);
    }


    /**
     * 테마 작성에 대한 포인트 지급 및 알림 발송
     * @param gameTheme 작성된 테마
     * @param webUser 작성자
     */
    private void rewardPointsForThemeCreation(GameTheme gameTheme, WebUser webUser) {
        // User 엔티티 조회
        User user = userRepository.findByWebUserId(webUser.getId())
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

        // 테마 타입에 따른 포인트 결정
        int rewardPoints;
        String themeTypeName;

        if (gameTheme.getDiscriminator().equals(ThemeType.Values.ESCAPE_ROOM)) {
            rewardPoints = 100;
            themeTypeName = "방탈출";
        } else if (gameTheme.getDiscriminator().equals(ThemeType.Values.CRIMESCENE)) {
            rewardPoints = 500;
            themeTypeName = "크라임신";
        } else {
            // 기타 테마 타입은 포인트 지급 없음
            return;
        }

        // 포인트 지급
        pointHistoryService.rewardThemeWriting(
            user,
            rewardPoints,
            gameTheme.getId(),
            gameTheme.getTitle()
        );

        // 알림 발송
        Map<String, Object> notificationData = new HashMap<>();
        notificationData.put("themeId", gameTheme.getId().toString());
        notificationData.put("themeName", gameTheme.getTitle());
        notificationData.put("themeType", themeTypeName);
        notificationData.put("points", rewardPoints);

        notificationService.createAndSendNotification(
            NotificationType.THEME_POINT_REWARD,
            user.getId(),
            null, // 시스템 알림이므로 발신자 없음
            themeTypeName + " 테마 작성 포인트 지급",
            String.format("%s 테마 '%s' 작성으로 %d포인트가 지급되었습니다!",
                themeTypeName, gameTheme.getTitle(), rewardPoints),
            notificationData
        );
    }
}
