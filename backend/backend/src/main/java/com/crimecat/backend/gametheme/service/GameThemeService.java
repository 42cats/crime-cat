package com.crimecat.backend.gametheme.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.gametheme.domain.*;
import com.crimecat.backend.gametheme.dto.*;
import com.crimecat.backend.gametheme.dto.filter.GetGameThemesFilter;
import com.crimecat.backend.gametheme.dto.filter.RangeFilter;
import com.crimecat.backend.gametheme.enums.ThemeType;
import com.crimecat.backend.gametheme.repository.CrimesceneThemeRepository;
import com.crimecat.backend.gametheme.repository.GameThemeRecommendationRepository;
import com.crimecat.backend.gametheme.repository.GameThemeRepository;
import com.crimecat.backend.gametheme.repository.MakerTeamRepository;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.*;

import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
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
    private final MakerTeamRepository makerTeamRepository;

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
        
        // 캐시 무효화
        invalidateThemeCountCacheByDiscriminator(gameTheme);

        // 포인트 지급 및 알림 발송
        rewardPointsForThemeCreation(gameTheme, webUser);
        
        // 캐시 무효화 - 작성자의 USER_THEME_SUMMARY 캐시 삭제
        if (webUser != null) {
            themeCacheService.evictUserThemeSummaryCache(webUser.getId());
        }
        
        // CrimesceneTheme인 경우 팀 멤버들의 캐시도 무효화
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
            Optional<MakerTeam> teams = makerTeamRepository
                    .findByNameAndIndividual(webUser.getNickname(), true)
                    // 팀 멤버 중에 webUser가 있는지 확인
                    .filter(team -> team.getMembers().stream()
                            .anyMatch(member ->
                                    member.getWebUser().getId().equals(webUser.getId())
                            )
                    );
            if (teams.isEmpty()) {
                // 개인 팀이 없는 경우 생성
                UUID teamId = teamService.create(webUser.getNickname(), webUser, true);
                gameTheme.setTeamId(teamId);
            } else {
                // 기존 개인 팀 사용
                gameTheme.setTeamId(teams.get().getId());
            }
        }
    }

    @CacheEvict(value = {CacheType.GAME_THEME, CacheType.GAME_THEME_ENTITY, CacheType.GAME_THEME_RESPONSE, CacheType.GAME_THEME_LIST}, key = "#themeId.toString()")
    @Transactional
    public void deleteGameTheme(UUID themeId) {
        GameTheme gameTheme = themeRepository.findById(themeId).orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        if (gameTheme.isDeleted()) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }
        AuthenticationUtil.validateCurrentUserMatches(gameTheme.getAuthorId());
        gameTheme.setIsDelete(true);
        themeRepository.save(gameTheme);
        
        // 캐시 무효화
        invalidateThemeCountCacheByDiscriminator(gameTheme);
        
        // 캐시 무효화 - CrimesceneTheme인 경우 팀 멤버들의 캐시 무효화
        if (gameTheme instanceof CrimesceneTheme) {
            CrimesceneTheme crimesceneTheme = (CrimesceneTheme) gameTheme;
            if (crimesceneTheme.getTeam() != null) {
                themeCacheService.evictTeamMembersThemeSummaryCache(crimesceneTheme.getTeam().getId());
            }
        }
    }


//    @Cacheable(value = CacheType.GAME_THEME_RESPONSE, key = "#themeId.toString()")
    @Transactional()
    public GetGameThemeResponse getGameTheme(UUID themeId) {
        log.debug("📖 테마 조회 시작 - ID: {}", themeId);
        
        // 1. 엔티티 조회 (캐시됨)
        GameTheme gameTheme = getGameThemeEntity(themeId);
        log.debug("✅ 테마 엔티티 조회 완료 - 제목: {}", gameTheme.getTitle());
        
        // 2. IP 추출 (캐시와 무관)
        String clientIp = extractClientIp();
        log.debug("🌐 클라이언트 IP 추출: {}", clientIp);
        
        // 3. 조회수 증가 - 별도 트랜잭션으로 처리 (IP별 캐시로 중복 방지)
        incrementViewCount(gameTheme, clientIp);
        
        // 4. 응답 생성 (이 부분만 캐시됨)
        GetGameThemeResponse response = GetGameThemeResponse.builder()
                .theme(GameThemeDetailDto.of(gameTheme))
                .build();
        
        log.debug("✅ 테마 조회 완료 - ID: {}", themeId);
        return response;
    }
    
    /**
     * 게임 테마 엔티티 조회 (캐시됨)
     * @param themeId 테마 ID
     * @return 게임 테마 엔티티
     */
    @Cacheable(value = CacheType.GAME_THEME_ENTITY, key = "#themeId.toString()")
    public GameTheme getGameThemeEntity(UUID themeId) {
        log.debug("🔍 테마 엔티티 조회 (캐시 체크) - ID: {}", themeId);
        
        GameTheme gameTheme = themeRepository.findById(themeId)
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        
        // 권한 검증 로직
        UUID webUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElse(null);
        if (gameTheme.isDeleted() || (!gameTheme.isPublicStatus() && !gameTheme.isAuthor(webUserId))) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }
        
        log.debug("✅ 테마 엔티티 조회 성공 - 제목: {}, 조회수: {}", 
            gameTheme.getTitle(), gameTheme.getViews());
        return gameTheme;
    }
    
    /**
     * 클라이언트 IP 추출
     * @return 클라이언트 IP 주소
     */
    private String extractClientIp() {
        ServletRequestAttributes attributes = 
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return "unknown";
        }
        Object clientIp = attributes.getRequest().getAttribute("clientIp");
        return clientIp != null ? clientIp.toString() : "unknown";
    }
    
    /**
     * 조회수 증가 처리 (별도 트랜잭션)
     * @param gameTheme 게임 테마
     * @param clientIp 클라이언트 IP
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected void incrementViewCount(GameTheme gameTheme, String clientIp) {
        try {
            viewCountService.themeIncrement(gameTheme, clientIp);
        } catch (Exception e) {
            // 조회수 증가 실패는 메인 로직에 영향을 주지 않도록 로그만 남김
            log.warn("Failed to increment view count for theme: {} from IP: {}", gameTheme.getId(), clientIp, e);
        }
    }

    // ================================
    // 크라임씬 테마 전용 업데이트
    // ================================

    @Transactional
    @CacheEvict(value = {CacheType.GAME_THEME, CacheType.GAME_THEME_ENTITY, CacheType.GAME_THEME_RESPONSE, CacheType.GAME_THEME_LIST}, key = "#themeId.toString()")
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
        
        // 테마 개수 캐시 무효화
        invalidateThemeCountCacheByDiscriminator(gameTheme);
    }

    // ================================
    // 방탈출 테마 전용 업데이트
    // ================================

    @Transactional
    @CacheEvict(value = {CacheType.GAME_THEME, CacheType.GAME_THEME_ENTITY, CacheType.GAME_THEME_RESPONSE, CacheType.GAME_THEME_LIST}, key = "#themeId.toString()")
    public void updateEscapeRoomTheme(UUID themeId, MultipartFile file, UpdateEscapeRoomThemeRequest request) {
        GameTheme gameTheme = getThemeForUpdate(themeId);

        // 요청에서 데이터 업데이트
        request.update(gameTheme);

        updateThumbnailIfProvided(gameTheme, file);
        themeRepository.save(gameTheme);
        
        // 테마 개수 캐시 무효화
        invalidateThemeCountCacheByDiscriminator(gameTheme);
    }

    // ================================
    // 머더미스터리 테마 전용 업데이트
    // ================================

    @Transactional
    @CacheEvict(value = {CacheType.GAME_THEME, CacheType.GAME_THEME_ENTITY, CacheType.GAME_THEME_RESPONSE, CacheType.GAME_THEME_LIST}, key = "#themeId.toString()")
    public void updateMurderMysteryTheme(UUID themeId, MultipartFile file, UpdateGameThemeRequest request) {
        GameTheme gameTheme = getThemeForUpdate(themeId);

        // 요청에서 데이터 업데이트
        request.update(gameTheme);

        updateThumbnailIfProvided(gameTheme, file);
        themeRepository.save(gameTheme);
        
        // 작성자의 USER_THEME_SUMMARY 캐시 삭제
        invalidateThemeCountCacheByDiscriminator(gameTheme);
        if (gameTheme.getAuthor() != null) {
            themeCacheService.evictUserThemeSummaryCache(gameTheme.getAuthor().getId());
        }
    }

    // ================================
    // 리얼월드 테마 전용 업데이트
    // ================================

    @Transactional
    @CacheEvict(value = {CacheType.GAME_THEME, CacheType.GAME_THEME_ENTITY, CacheType.GAME_THEME_RESPONSE, CacheType.GAME_THEME_LIST}, key = "#themeId.toString()")
    public void updateRealWorldTheme(UUID themeId, MultipartFile file, UpdateGameThemeRequest request) {
        GameTheme gameTheme = getThemeForUpdate(themeId);

        // 요청에서 데이터 업데이트
        request.update(gameTheme);

        updateThumbnailIfProvided(gameTheme, file);
        themeRepository.save(gameTheme);
        
        // 작성자의 USER_THEME_SUMMARY 캐시 삭제
        invalidateThemeCountCacheByDiscriminator(gameTheme);
        if (gameTheme.getAuthor() != null) {
            themeCacheService.evictUserThemeSummaryCache(gameTheme.getAuthor().getId());
        }
    }

    // ================================
    // 공통 헬퍼 메서드들
    // ================================

    private GameTheme getThemeForUpdate(UUID themeId) {
        // 캐시된 엔티티 조회 메서드 사용
        GameTheme gameTheme = getGameThemeEntityForUpdate(themeId);
        
        // 작성자 권한 검증
        AuthenticationUtil.validateCurrentUserMatches(gameTheme.getAuthorId());
        return gameTheme;
    }
    
    /**
     * 업데이트용 게임 테마 엔티티 조회 (삭제된 테마 포함 체크)
     * @param themeId 테마 ID
     * @return 게임 테마 엔티티
     */
    private GameTheme getGameThemeEntityForUpdate(UUID themeId) {
        GameTheme gameTheme = themeRepository.findById(themeId)
            .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);

        if (gameTheme.isDeleted()) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }

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
    
    /**
     * 테마 개수 캐시 무효화
     * @param themeType 테마 타입
     */
    @Caching(evict = {
        @CacheEvict(cacheNames = "crimeThemes", condition = "#themeType == T(com.crimecat.backend.gametheme.domain.ThemeType).CRIMESCENE"),
        @CacheEvict(cacheNames = "escapeThemes", condition = "#themeType == T(com.crimecat.backend.gametheme.domain.ThemeType).ESCAPE_ROOM")
    })
    public void invalidateThemeCountCache(ThemeType themeType) {
        // Spring Cache가 처리
    }
    
    /**
     * GameTheme의 discriminator로부터 ThemeType 추출
     * @param gameTheme 게임 테마
     */
    @Caching(evict = {
        @CacheEvict(cacheNames = "crimeThemes", condition = "#gameTheme.discriminator == T(com.crimecat.backend.gametheme.domain.ThemeType$Values).CRIMESCENE"),
        @CacheEvict(cacheNames = "escapeThemes", condition = "#gameTheme.discriminator == T(com.crimecat.backend.gametheme.domain.ThemeType$Values).ESCAPE_ROOM")
    })
    public void invalidateThemeCountCacheByDiscriminator(GameTheme gameTheme) {
        // Spring Cache가 처리
    }

    // ================================
    // SSR용 메서드들 (크롤러 전용)
    // ================================

    /**
     * SSR용 테마 목록 조회 (타입별)
     * @param discriminator 테마 구분자 (CRIMESCENE, ESCAPE_ROOM)
     * @param limit 조회할 개수
     * @return 테마 목록
     */
    @Cacheable(value = CacheType.GAME_THEME_LIST_BY_TYPE, key = "#discriminator + '_' + #limit")
    public List<GameTheme> getThemesByType(String discriminator, int limit) {
        log.debug("Fetching themes with discriminator: {}", discriminator);
        Pageable pageable = PageRequest.of(0, limit);
        
        // Repository 메서드 사용 (discriminator 값 그대로 사용)
        Page<GameTheme> page = themeRepository.findByTypeAndPublicStatusAndIsDeleted(
            discriminator, true, false, pageable
        );
        
        return page.getContent();
    }

    /**
     * SSR용 테마 단일 조회 (String ID 기반)
     * @param id 테마 ID (String 타입을 UUID로 변환)
     * @return 테마 또는 null
     */
    public GameTheme getThemeByStringId(String id) {
        try {
            UUID uuid = UUID.fromString(id);
            return themeRepository.findById(uuid)
                .filter(theme -> theme.isPublicStatus() && !theme.isDeleted())
                .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * SSR용 테마 단일 조회 (UUID 기반)
     * @param uuid 테마 UUID
     * @return 테마 또는 null
     */
    public GameTheme getThemeById(UUID uuid) {
        return themeRepository.findById(uuid)
            .filter(theme -> theme.isPublicStatus() && !theme.isDeleted())
            .orElse(null);
    }

}
