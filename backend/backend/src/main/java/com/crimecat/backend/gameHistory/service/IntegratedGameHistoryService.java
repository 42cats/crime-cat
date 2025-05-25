package com.crimecat.backend.gameHistory.service;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import com.crimecat.backend.gameHistory.dto.UserGameHistoryDto;
import com.crimecat.backend.gameHistory.dto.integrated.*;
import com.crimecat.backend.gameHistory.repository.EscapeRoomHistoryRepository;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import com.crimecat.backend.gametheme.repository.CrimesceneThemeRepository;
import com.crimecat.backend.gametheme.repository.EscapeRoomThemeRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 통합 게임 기록 서비스 (최적화 버전)
 * 모든 게임 타입의 기록을 통합하여 관리
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IntegratedGameHistoryService {
    
    private final GameHistoryRepository crimeSceneHistoryRepository;
    private final EscapeRoomHistoryRepository escapeRoomHistoryRepository;
    private final EscapeRoomHistoryService escapeRoomHistoryService;
    private final CrimesceneThemeRepository crimeSceneThemeRepository;
    private final EscapeRoomThemeRepository escapeRoomThemeRepository;
    private final WebUserRepository webUserRepository;
    
    /**
     * 사용자의 통합 게임 기록 조회 (최적화 버전)
     */
    @Cacheable(value = CacheType.INTEGRATED_HISTORIES, key = "#userId + '_' + #filter.gameType + '_' + #filter.page")
    public IntegratedGameHistoryResponse getUserGameHistories(
            String userId, 
            IntegratedGameHistoryFilterRequest filter) {
        
        log.info("통합 게임 기록 조회 - userId: {}, gameType: {}", userId, filter.getGameType());
        
        UUID userUuid = UUID.fromString(userId);
        
        // 페이징 정보 생성
        Pageable pageable = createPageable(filter);
        
        // 게임 타입별 기록 조회
        List<UserGameHistoryDto> crimeSceneHistories = new ArrayList<>();
        List<EscapeRoomHistoryDetailResponse> escapeRoomHistories = new ArrayList<>();
        
        if (filter.getGameType() == null || filter.getGameType() == IntegratedGameHistoryFilterRequest.GameType.CRIMESCENE) {
            crimeSceneHistories = getCrimeSceneHistories(userUuid, filter, pageable);
        }
        
        if (filter.getGameType() == null || filter.getGameType() == IntegratedGameHistoryFilterRequest.GameType.ESCAPE_ROOM) {
            escapeRoomHistories = getEscapeRoomHistories(userUuid, filter, pageable);
        }
        
        // 통계 정보 생성
        IntegratedGameHistoryResponse.GameStatistics statistics = createStatistics(userUuid);
        
        // 페이지 정보 생성
        IntegratedGameHistoryResponse.PageInfo pageInfo = IntegratedGameHistoryResponse.PageInfo.builder()
                .currentPage(filter.getPage())
                .pageSize(filter.getSize())
                .sortBy(filter.getSortBy() != null ? filter.getSortBy().name() : "PLAY_DATE")
                .sortDirection(filter.getSortDirection() != null ? filter.getSortDirection().name() : "DESC")
                .totalElements(crimeSceneHistories.size() + escapeRoomHistories.size())
                .hasNext(false) // TODO: 실제 페이징 로직 구현
                .hasPrevious(filter.getPage() > 0)
                .build();
        
        return IntegratedGameHistoryResponse.builder()
                .crimeSceneHistories(crimeSceneHistories)
                .escapeRoomHistories(escapeRoomHistories)
                .statistics(statistics)
                .pageInfo(pageInfo)
                .build();
    }
    
    /**
     * 게임 비교 - 여러 사용자가 공통으로 플레이하지 않은 테마 찾기
     */
    public GameComparisonResponse compareGameHistories(GameComparisonRequest request) {
        log.info("게임 기록 비교 - userIds: {}, gameType: {}", request.getUserIds(), request.getGameType());
        
        // 사용자별 플레이한 테마 ID 수집
        Map<String, Set<UUID>> userPlayedThemes = new HashMap<>();
        Map<String, GameComparisonResponse.UserPlayStats> userStats = new HashMap<>();
        
        for (String userId : request.getUserIds()) {
            UUID userUuid = UUID.fromString(userId);
            Set<UUID> playedThemeIds = new HashSet<>();
            
            if (request.getGameType() == GameComparisonRequest.GameType.CRIMESCENE) {
                playedThemeIds = crimeSceneHistoryRepository.findDistinctThemeIdsByUserId(userUuid);
            } else if (request.getGameType() == GameComparisonRequest.GameType.ESCAPE_ROOM) {
                playedThemeIds = escapeRoomHistoryRepository.findDistinctThemeIdsByUserId(userUuid);
            }
            
            userPlayedThemes.put(userId, playedThemeIds);
            
            // 사용자 통계 생성
            WebUser user = webUserRepository.findById(userUuid).orElse(null);
            if (user != null) {
                userStats.put(userId, createUserPlayStats(user, playedThemeIds.size(), request.getGameType()));
            }
        }
        
        // 모든 사용자가 플레이한 테마 ID 찾기 (교집합)
        Set<UUID> commonPlayedThemes = userPlayedThemes.values().stream()
                .reduce((set1, set2) -> {
                    Set<UUID> intersection = new HashSet<>(set1);
                    intersection.retainAll(set2);
                    return intersection;
                })
                .orElse(new HashSet<>());
        
        // 전체 테마에서 공통 플레이 테마 제외
        List<GameComparisonResponse.UnplayedTheme> unplayedThemes = new ArrayList<>();
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize());
        
        if (request.getGameType() == GameComparisonRequest.GameType.CRIMESCENE) {
            Page<CrimesceneTheme> themes = crimeSceneThemeRepository.findUnplayedThemes(
                    commonPlayedThemes, 
                    request.getMinPrice(), 
                    request.getMaxPrice(),
                    request.getMinPlayers(),
                    request.getMaxPlayers(),
                    request.getMinDifficulty(),
                    request.getMaxDifficulty(),
                    pageable
            );
            
            unplayedThemes = themes.getContent().stream()
                    .map(GameComparisonResponse.UnplayedTheme::fromCrimesceneTheme)
                    .collect(Collectors.toList());
        } else if (request.getGameType() == GameComparisonRequest.GameType.ESCAPE_ROOM) {
            Page<EscapeRoomTheme> themes = escapeRoomThemeRepository.findUnplayedThemes(
                    commonPlayedThemes,
                    request.isOperatingOnly(),
                    request.getRegion(),
                    request.getMinPrice(),
                    request.getMaxPrice(),
                    request.getMinPlayers(),
                    request.getMaxPlayers(),
                    request.getMinDifficulty(),
                    request.getMaxDifficulty(),
                    pageable
            );
            
            unplayedThemes = themes.getContent().stream()
                    .map(GameComparisonResponse.UnplayedTheme::fromEscapeRoomTheme)
                    .collect(Collectors.toList());
        }
        
        // 페이지 정보
        GameComparisonResponse.PageInfo pageInfo = GameComparisonResponse.PageInfo.builder()
                .currentPage(request.getPage())
                .pageSize(request.getSize())
                .totalElements(unplayedThemes.size())
                .hasNext(false) // TODO: 실제 페이징 로직 구현
                .hasPrevious(request.getPage() > 0)
                .build();
        
        return GameComparisonResponse.builder()
                .unplayedThemes(unplayedThemes)
                .userStatistics(userStats)
                .totalThemeCount(getTotalThemeCount(request.getGameType()))
                .commonUnplayedCount(unplayedThemes.size())
                .pageInfo(pageInfo)
                .build();
    }
    
    // === Private Helper Methods ===
    
    private List<UserGameHistoryDto> getCrimeSceneHistories(UUID userId, IntegratedGameHistoryFilterRequest filter, Pageable pageable) {
    // 크라임씬 기록 조회 (필터 적용)
    return crimeSceneHistoryRepository.findByUser_WebUser_IdOrderByCreatedAtDesc(userId, pageable)
       .getContent()
				.stream()
				.map(UserGameHistoryDto::from)
				.collect(Collectors.toList());
	}
    
    private List<EscapeRoomHistoryDetailResponse> getEscapeRoomHistories(UUID userId, IntegratedGameHistoryFilterRequest filter, Pageable pageable) {
        // 1. Fetch Join으로 기록과 테마 정보를 한 번에 조회
        Page<EscapeRoomHistory> histories = escapeRoomHistoryRepository.findByWebUserIdAndDeletedAtIsNull(userId, pageable);
        
        // 2. 테마 ID 목록 추출
        List<UUID> themeIds = histories.getContent().stream()
                .map(h -> h.getEscapeRoomTheme().getId())
                .distinct()
                .collect(Collectors.toList());
        
        // 3. 테마별 플레이 횟수를 한 번에 조회 (N+1 방지)
        Map<UUID, Long> playCountMap = new HashMap<>();
        if (!themeIds.isEmpty()) {
            playCountMap = escapeRoomHistoryRepository
                    .findPlayCountsByUserAndThemes(userId, themeIds)
                    .stream()
                    .collect(Collectors.toMap(
                            ThemePlayCountDto::getThemeId,
                            ThemePlayCountDto::getPlayCount
                    ));
        }
        
        final Map<UUID, Long> finalPlayCountMap = playCountMap;
        
        return histories.getContent().stream()
                .map(history -> {
                    // 테마 정보
                    EscapeRoomTheme theme = history.getEscapeRoomTheme();
                    EscapeRoomHistoryDetailResponse.ThemeDetail themeDetail = 
                            EscapeRoomHistoryDetailResponse.ThemeDetail.builder()
                                    .thumbnail(theme.getThumbnail())
                                    .summary(theme.getSummary())
                                    .price(theme.getPrice())
                                    .difficulty(theme.getDifficulty())
                                    .tags(theme.getTags().stream().toList())
                                    .build();
                    
                    // 매장 정보
                    EscapeRoomHistoryDetailResponse.LocationDetail locationDetail = 
                            EscapeRoomHistoryDetailResponse.LocationDetail.builder()
                                    .storeName("") // TODO: 실제 매장 정보 조회
                                    .address("")
                                    .region("")
                                    .phone("")
                                    .build();
                    
                    // 캐시된 플레이 횟수 사용
                    int playCount = finalPlayCountMap.getOrDefault(theme.getId(), 0L).intValue();
                    
                    // 기본 응답 생성
                    com.crimecat.backend.gameHistory.dto.EscapeRoomHistoryResponse baseResponse = 
                            com.crimecat.backend.gameHistory.dto.EscapeRoomHistoryResponse.from(history, userId);
                    
                    return EscapeRoomHistoryDetailResponse.from(
                            baseResponse,
                            themeDetail,
                            locationDetail,
                            playCount
                    );
                })
                .collect(Collectors.toList());
    }
    
    /**
     * 통계 정보 생성 (캐싱)
     */
    @Cacheable(value = CacheType.USER_STATISTICS, key = "#userId")
    public IntegratedGameHistoryResponse.GameStatistics createStatistics(UUID userId) {
        log.info("통계 정보 생성 (캐시 미스) - userId: {}", userId);
        // 크라임씬 통계 (중복 플레이 불가능)
        long crimeSceneTotal = crimeSceneHistoryRepository.countByUser_WebUser_Id(userId);
        long crimeSceneWins = crimeSceneHistoryRepository.countByUser_WebUser_Id(userId); // TODO: 승리 필터 추가 필요
        
        // 방탈출 통계 (중복 플레이 가능)
        long escapeRoomTotal = escapeRoomHistoryRepository.countByWebUserIdAndDeletedAtIsNull(userId);
        long escapeRoomUnique = escapeRoomHistoryRepository.countDistinctThemesByUserId(userId);
        long escapeRoomSuccess = escapeRoomHistoryRepository.countByWebUserIdAndSuccessStatus(userId, "SUCCESS");
        
        IntegratedGameHistoryResponse.GameTypeStats crimeSceneStats = 
                IntegratedGameHistoryResponse.GameTypeStats.builder()
                        .total((int) crimeSceneTotal)
                        .unique((int) crimeSceneTotal) // 크라임씬은 중복 플레이 불가
                        .winCount((int) crimeSceneWins)
                        .winRate(crimeSceneTotal > 0 ? (double) crimeSceneWins / crimeSceneTotal * 100 : 0)
                        .build();
        
        IntegratedGameHistoryResponse.GameTypeStats escapeRoomStats = 
                IntegratedGameHistoryResponse.GameTypeStats.builder()
                        .total((int) escapeRoomTotal)
                        .unique((int) escapeRoomUnique)
                        .winCount((int) escapeRoomSuccess)
                        .winRate(escapeRoomTotal > 0 ? (double) escapeRoomSuccess / escapeRoomTotal * 100 : 0)
                        .build();
        
        return IntegratedGameHistoryResponse.GameStatistics.builder()
                .crimeScene(crimeSceneStats)
                .escapeRoom(escapeRoomStats)
                .totalPlayCount((int) (crimeSceneTotal + escapeRoomTotal))
                .totalUniqueThemes((int) (crimeSceneTotal + escapeRoomUnique))
                .build();
    }
    
    private GameComparisonResponse.UserPlayStats createUserPlayStats(WebUser user, int uniqueThemeCount, GameComparisonRequest.GameType gameType) {
        int totalThemes = getTotalThemeCount(gameType);
        
        return GameComparisonResponse.UserPlayStats.builder()
                .userId(user.getId().toString())
                .nickname(user.getNickname())
                .uniqueThemeCount(uniqueThemeCount)
                .totalPlayCount(uniqueThemeCount) // TODO: 실제 총 플레이 횟수 계산
                .completionRate(totalThemes > 0 ? (double) uniqueThemeCount / totalThemes * 100 : 0)
                .build();
    }
    
    private int getTotalThemeCount(GameComparisonRequest.GameType gameType) {
        if (gameType == GameComparisonRequest.GameType.CRIMESCENE) {
            return (int) crimeSceneThemeRepository.count();
        } else if (gameType == GameComparisonRequest.GameType.ESCAPE_ROOM) {
            return (int) escapeRoomThemeRepository.countByIsOperating(true);
        }
        return 0;
    }
    
    private Pageable createPageable(IntegratedGameHistoryFilterRequest filter) {
        Sort sort = Sort.by(Sort.Direction.DESC, "playDate"); // 기본값
        
        if (filter.getSortBy() != null && filter.getSortDirection() != null) {
            Sort.Direction direction = filter.getSortDirection() == IntegratedGameHistoryFilterRequest.SortDirection.ASC 
                    ? Sort.Direction.ASC 
                    : Sort.Direction.DESC;
                    
            switch (filter.getSortBy()) {
                case PLAY_DATE:
                    sort = Sort.by(direction, "playDate");
                    break;
                case CREATED_AT:
                    sort = Sort.by(direction, "createdAt");
                    break;
                case THEME_NAME:
                    sort = Sort.by(direction, "themeName");
                    break;
                case CLEAR_TIME:
                    sort = Sort.by(direction, "clearTime");
                    break;
                case DIFFICULTY:
                    sort = Sort.by(direction, "difficultyRating");
                    break;
                case FUN_RATING:
                    sort = Sort.by(direction, "funRating");
                    break;
                case STORY_RATING:
                    sort = Sort.by(direction, "storyRating");
                    break;
                default:
                    break;
            }
        }
        
        return PageRequest.of(filter.getPage(), filter.getSize(), sort);
    }
    
    /**
     * 캐시 무효화 - 게임 기록 추가/수정/삭제 시 호출
     * 
     * 캐시 무효화란?
     * - 사용자가 새로운 게임을 플레이하거나 기록을 수정하면
     * - 기존에 저장된 캐시 데이터가 오래된 데이터가 되므로
     * - 해당 사용자의 캐시를 삭제하여 다음 조회 시 최신 데이터를 가져오도록 함
     */
    @CacheEvict(value = {CacheType.INTEGRATED_HISTORIES, CacheType.USER_STATISTICS, CacheType.THEME_PLAY_COUNTS}, 
                key = "#userId")
    public void invalidateUserCache(String userId) {
        log.info("사용자 캐시 무효화 - userId: {}", userId);
    }
}
