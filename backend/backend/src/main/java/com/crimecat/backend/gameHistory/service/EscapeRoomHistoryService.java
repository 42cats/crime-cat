package com.crimecat.backend.gameHistory.service;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import com.crimecat.backend.gameHistory.dto.EscapeRoomHistoryRequest;
import com.crimecat.backend.gameHistory.dto.EscapeRoomHistoryResponse;
import com.crimecat.backend.gameHistory.dto.EscapeRoomHistoryStatsResponse;
import com.crimecat.backend.gameHistory.repository.EscapeRoomHistoryRepository;
import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import com.crimecat.backend.gametheme.repository.EscapeRoomThemeRepository;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EscapeRoomHistoryService {
    
    private final EscapeRoomHistoryRepository escapeRoomHistoryRepository;
    private final EscapeRoomThemeRepository escapeRoomThemeRepository;

    /**
     * 방탈출 기록 생성
     */
    @Transactional
    public EscapeRoomHistoryResponse createHistory(EscapeRoomHistoryRequest request) {
        WebUser webUser = AuthenticationUtil.getCurrentWebUserOptional().orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        EscapeRoomTheme theme = escapeRoomThemeRepository.findById(request.getEscapeRoomThemeId())
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);

        List<EscapeRoomHistory> byWebUserIdAndEscapeRoomThemeIdAndDeletedAtIsNull = escapeRoomHistoryRepository.findByWebUserIdAndEscapeRoomThemeIdAndDeletedAtIsNull(webUser.getId(), theme.getId());

        EscapeRoomHistory history = EscapeRoomHistory.builder()
                .escapeRoomTheme(theme)
                .escapeRoomLocationId(request.getEscapeRoomLocationId())
                .webUser(webUser)
                .successStatus(request.getSuccessStatus())
                .clearTime(request.getClearTime())
                .difficultyRating(request.getDifficultyRating())
                .teamSize(request.getTeamSize())
                .hintCount(request.getHintCount() != null ? request.getHintCount() : 0)
                .funRating(request.getFunRating())
                .storyRating(request.getStoryRating())
                .memo(request.getMemo())
                .playDate(request.getPlayDate())
                .isSpoiler(request.getIsSpoiler() != null ? request.getIsSpoiler() : false)
                .build();
        
        EscapeRoomHistory savedHistory = escapeRoomHistoryRepository.save(history);
        log.info("방탈출 기록 생성 완료 - userId: {}, themeId: {}, historyId: {}", 
                webUser.getId(), theme.getId(), savedHistory.getId());
        
        return EscapeRoomHistoryResponse.from(savedHistory, webUser.getId());
    }
    
    /**
     * 방탈출 기록 수정
     */
    @Transactional
    public EscapeRoomHistoryResponse updateHistory(UUID historyId, EscapeRoomHistoryRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        EscapeRoomHistory history = escapeRoomHistoryRepository.findByIdAndDeletedAtIsNull(historyId)
                .orElseThrow(ErrorStatus.GAME_HISTORY_NOT_FOUND::asServiceException);
        
        // 작성자 확인
        if (!history.isAuthor(currentUserId)) {
            throw ErrorStatus.FORBIDDEN.asServiceException();
        }
        
        // 수정 가능한 필드만 업데이트
        history.setSuccessStatus(request.getSuccessStatus());
        history.setClearTime(request.getClearTime());
        history.setDifficultyRating(request.getDifficultyRating());
        history.setTeamSize(request.getTeamSize());
        history.setHintCount(request.getHintCount() != null ? request.getHintCount() : 0);
        history.setFunRating(request.getFunRating());
        history.setStoryRating(request.getStoryRating());
        history.setMemo(request.getMemo());
        history.setPlayDate(request.getPlayDate());
        history.setIsSpoiler(request.getIsSpoiler() != null ? request.getIsSpoiler() : false);
        history.updateRecord();
        
        EscapeRoomHistory updatedHistory = escapeRoomHistoryRepository.save(history);
        log.info("방탈출 기록 수정 완료 - historyId: {}", historyId);
        
        return EscapeRoomHistoryResponse.from(updatedHistory, currentUserId);
    }
    
    /**
     * 방탈출 기록 삭제 (소프트 삭제)
     */
    @Transactional
    public void deleteHistory(UUID historyId) {
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        EscapeRoomHistory history = escapeRoomHistoryRepository.findByIdAndDeletedAtIsNull(historyId)
                .orElseThrow(ErrorStatus.GAME_HISTORY_NOT_FOUND::asServiceException);
        
        // 작성자 확인
        if (!history.isAuthor(currentUserId)) {
            throw ErrorStatus.FORBIDDEN.asServiceException();
        }
        
        // 소프트 삭제 처리
        history.softDelete();
        escapeRoomHistoryRepository.save(history);
        
        log.info("방탈출 기록 삭제 완료 - historyId: {}", historyId);
    }
    
    /**
     * 내 방탈출 기록 조회 (페이징)
     */
    public Page<EscapeRoomHistoryResponse> getMyHistories(Pageable pageable) {
        WebUser webUser = AuthenticationUtil.getCurrentWebUserOptional().orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        Page<EscapeRoomHistory> histories = escapeRoomHistoryRepository
                .findByWebUserIdAndDeletedAtIsNullOrderByPlayDateDesc(webUser.getId(), pageable);
        
        return histories.map(history -> EscapeRoomHistoryResponse.from(history, webUser.getId()));
    }
    
    /**
     * 특정 테마의 공개 기록 조회 (페이징) - 사용자 자신의 기록을 먼저 표시
     */
    public Page<EscapeRoomHistoryResponse> getThemeHistories(UUID themeId, Pageable pageable) {
        UUID currentWebUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElse(null);
        
        Page<EscapeRoomHistory> histories;
        if (currentWebUserId != null) {
            // 로그인한 사용자가 있으면 자신의 기록을 먼저 표시
            histories = escapeRoomHistoryRepository
                    .findByThemeIdWithUserFirst(themeId, currentWebUserId, pageable);
        } else {
            // 로그인하지 않은 경우 일반 조회
            histories = escapeRoomHistoryRepository
                    .findByEscapeRoomThemeIdAndDeletedAtIsNull(themeId, pageable);
        }
        
        // 현재 사용자가 해당 테마를 플레이했는지 확인
        boolean hasGameHistory = false;
        if (currentWebUserId != null) {
            hasGameHistory = escapeRoomHistoryRepository
                    .existsByWebUserIdAndEscapeRoomThemeIdAndDeletedAtIsNull(currentWebUserId, themeId);
        }
        
        final boolean hasHistory = hasGameHistory;
        final UUID userId = currentWebUserId;
        
        return histories.map(history -> 
                EscapeRoomHistoryResponse.fromWithSpoilerCheck(history, userId, hasHistory));
    }
    
    /**
     * 특정 사용자가 특정 테마를 플레이했는지 확인
     */
    public boolean hasPlayedTheme(UUID userId, UUID themeId) {
        return escapeRoomHistoryRepository.existsByWebUserIdAndEscapeRoomThemeIdAndDeletedAtIsNull(userId, themeId);
    }
    
    /**
     * 현재 사용자가 특정 테마를 플레이했는지 확인
     */
    public boolean hasCurrentUserPlayedTheme(UUID themeId) {
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElse(null);
        if (currentUserId == null) {
            return false;
        }
        return hasPlayedTheme(currentUserId, themeId);
    }
    
    /**
     * 특정 기록 상세 조회
     */
    public EscapeRoomHistoryResponse getHistory(UUID historyId) {
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElse(null);
        
        EscapeRoomHistory history = escapeRoomHistoryRepository.findByIdAndDeletedAtIsNull(historyId)
                .orElseThrow(ErrorStatus.GAME_HISTORY_NOT_FOUND::asServiceException);
        
        // 스포일러 처리를 위한 게임 기록 확인
        boolean hasGameHistory = false;
        if (currentUserId != null) {
            hasGameHistory = hasPlayedTheme(currentUserId, history.getEscapeRoomTheme().getId());
        }
        
        return EscapeRoomHistoryResponse.fromWithSpoilerCheck(history, currentUserId, hasGameHistory);
    }
    
    /**
     * 최근 방탈출 기록 조회 (홈 화면용)
     */
    public List<EscapeRoomHistoryResponse> getRecentHistories(int limit) {
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElse(null);
        
        List<EscapeRoomHistory> histories = escapeRoomHistoryRepository
                .findByDeletedAtIsNullOrderByCreatedAtDesc(Pageable.ofSize(limit));
        
        return histories.stream()
                .map(history -> EscapeRoomHistoryResponse.from(history, currentUserId))
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 테마의 통계 정보 조회
     */
    @Cacheable(value = CacheType.ESCAPE_ROOM_THEME_STATS, key = "#themeId")
    public EscapeRoomHistoryStatsResponse getThemeStatistics(UUID themeId) {
        // 테마 존재 여부 확인
        escapeRoomThemeRepository.findById(themeId)
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        
        // 통계 데이터 조회
        EscapeRoomHistoryRepository.ThemeStatistics stats = escapeRoomHistoryRepository.getThemeStatistics(themeId);
        
        // 공개 기록 수 조회 (스포일러가 아닌 기록만)
        long publicRecords = escapeRoomHistoryRepository.findByEscapeRoomThemeIdAndDeletedAtIsNull(themeId, Pageable.unpaged())
                .stream()
                .filter(history -> !history.getIsSpoiler())
                .count();
        
        // DTO로 변환하여 반환
        return EscapeRoomHistoryStatsResponse.of(
                stats.getTotalPlays() != null ? stats.getTotalPlays() : 0L,
                publicRecords,
                stats.getSuccessCount() != null ? stats.getSuccessCount() : 0L,
                stats.getAvgClearTime(),
                stats.getAvgDifficultyRating(),
                stats.getAvgFunRating() != null && stats.getAvgStoryRating() != null 
                    ? (stats.getAvgFunRating() + stats.getAvgStoryRating()) / 2.0 
                    : null,
                stats.getAvgTeamSize(),
                0.0, // 힌트 평균은 현재 통계에 포함되지 않음
                stats.getAvgFunRating(),
                stats.getAvgStoryRating(),
                stats.getMinClearTime(),
                stats.getMaxClearTime()
        );
    }
    
    /**
     * 특정 사용자의 방탈출 플레이 기록 개수 조회 (공개)
     */
    public Long getUserEscapeRoomHistoryCount(String userId) {
        try {
            UUID userUuid = UUID.fromString(userId);
            return escapeRoomHistoryRepository.countByWebUserIdAndDeletedAtIsNull(userUuid);
        } catch (IllegalArgumentException e) {
            log.warn("잘못된 사용자 ID 형식 - userId: {}", userId);
            return 0L;
        }
    }
    
    /**
     * 특정 사용자의 방탈출 플레이 기록 목록 조회 (공개)
     */
    public Page<EscapeRoomHistoryResponse> getUserEscapeRoomHistories(String userId, Pageable pageable) {
        try {
            UUID userUuid = UUID.fromString(userId);
            Page<EscapeRoomHistory> histories = escapeRoomHistoryRepository
                    .findByWebUserIdAndDeletedAtIsNullOrderByPlayDateDesc(userUuid, pageable);
            
            // 공개 정보만 포함하여 응답 생성 (스포일러 처리 없이)
            return histories.map(history -> EscapeRoomHistoryResponse.fromPublic(history));
        } catch (IllegalArgumentException e) {
            log.warn("잘못된 사용자 ID 형식 - userId: {}", userId);
            return Page.empty(pageable);
        }
    }
}