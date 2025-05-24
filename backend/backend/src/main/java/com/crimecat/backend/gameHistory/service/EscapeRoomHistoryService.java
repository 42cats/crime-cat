package com.crimecat.backend.gameHistory.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import com.crimecat.backend.gameHistory.dto.EscapeRoomHistoryRequest;
import com.crimecat.backend.gameHistory.dto.EscapeRoomHistoryResponse;
import com.crimecat.backend.gameHistory.repository.EscapeRoomHistoryRepository;
import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import com.crimecat.backend.gametheme.repository.EscapeRoomThemeRepository;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.utils.AuthenticationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final UserRepository userRepository;
    
    /**
     * 방탈출 기록 생성
     */
    @Transactional
    public EscapeRoomHistoryResponse createHistory(EscapeRoomHistoryRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        User user = userRepository.findById(currentUserId)
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
                
        EscapeRoomTheme theme = escapeRoomThemeRepository.findById(request.getEscapeRoomThemeId())
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        
        // 중복 기록 체크 (선택적)
        List<EscapeRoomHistory> existingHistories = escapeRoomHistoryRepository
                .findByUserIdAndEscapeRoomThemeIdOrderByPlayDateDesc(currentUserId, theme.getId());
        
        EscapeRoomHistory history = EscapeRoomHistory.builder()
                .escapeRoomTheme(theme)
                .user(user)
                .isSuccess(request.getIsSuccess())
                .escapeTimeMinutes(request.getEscapeTimeMinutes())
                .feltDifficulty(request.getFeltDifficulty())
                .participantsCount(request.getParticipantsCount())
                .hintUsedCount(request.getHintUsedCount() != null ? request.getHintUsedCount() : 0)
                .satisfaction(request.getSatisfaction())
                .memo(request.getMemo())
                .isPublic(request.getIsPublic())
                .playDate(request.getPlayDate())
                .hasSpoiler(request.getHasSpoiler() != null ? request.getHasSpoiler() : false)
                .storeLocation(request.getStoreLocation())
                .build();
        
        EscapeRoomHistory savedHistory = escapeRoomHistoryRepository.save(history);
        log.info("방탈출 기록 생성 완료 - userId: {}, themeId: {}, historyId: {}", 
                currentUserId, theme.getId(), savedHistory.getId());
        
        return EscapeRoomHistoryResponse.from(savedHistory, currentUserId);
    }
    
    /**
     * 방탈출 기록 수정
     */
    @Transactional
    public EscapeRoomHistoryResponse updateHistory(UUID historyId, EscapeRoomHistoryRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);;
        
        EscapeRoomHistory history = escapeRoomHistoryRepository.findById(historyId)
                .orElseThrow(() -> ErrorStatus.GAME_HISTORY_NOT_FOUND.asServiceException());
        
        // 작성자 확인
        if (!history.isAuthor(currentUserId)) {
            throw ErrorStatus.FORBIDDEN.asServiceException();
        }
        
        // 수정 가능한 필드만 업데이트
        history.setIsSuccess(request.getIsSuccess());
        history.setEscapeTimeMinutes(request.getEscapeTimeMinutes());
        history.setFeltDifficulty(request.getFeltDifficulty());
        history.setParticipantsCount(request.getParticipantsCount());
        history.setHintUsedCount(request.getHintUsedCount() != null ? request.getHintUsedCount() : 0);
        history.setSatisfaction(request.getSatisfaction());
        history.setMemo(request.getMemo());
        history.setIsPublic(request.getIsPublic());
        history.setPlayDate(request.getPlayDate());
        history.setHasSpoiler(request.getHasSpoiler() != null ? request.getHasSpoiler() : false);
        history.setStoreLocation(request.getStoreLocation());
        history.updateRecord();
        
        EscapeRoomHistory updatedHistory = escapeRoomHistoryRepository.save(history);
        log.info("방탈출 기록 수정 완료 - historyId: {}", historyId);
        
        return EscapeRoomHistoryResponse.from(updatedHistory, currentUserId);
    }
    
    /**
     * 방탈출 기록 삭제
     */
    @Transactional
    public void deleteHistory(UUID historyId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);;
        
        EscapeRoomHistory history = escapeRoomHistoryRepository.findById(historyId)
                .orElseThrow(() -> ErrorStatus.GAME_HISTORY_NOT_FOUND.asServiceException());
        
        // 작성자 확인
        if (!history.isAuthor(currentUserId)) {
            throw ErrorStatus.FORBIDDEN.asServiceException();
        }
        
        escapeRoomHistoryRepository.delete(history);
        log.info("방탈출 기록 삭제 완료 - historyId: {}", historyId);
    }
    
    /**
     * 내 방탈출 기록 조회 (페이징)
     */
    public Page<EscapeRoomHistoryResponse> getMyHistories(Pageable pageable) {
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);;
        
        Page<EscapeRoomHistory> histories = escapeRoomHistoryRepository
                .findByUserIdOrderByPlayDateDesc(currentUserId, pageable);
        
        return histories.map(history -> EscapeRoomHistoryResponse.from(history, currentUserId));
    }
    
    /**
     * 특정 테마의 공개 기록 조회 (페이징)
     */
    public Page<EscapeRoomHistoryResponse> getThemeHistories(UUID themeId, Pageable pageable) {
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElse(null);
        
        Page<EscapeRoomHistory> histories = escapeRoomHistoryRepository
                .findPublicHistoriesByThemeId(themeId, pageable);
        
        // 현재 사용자가 해당 테마를 플레이했는지 확인
        boolean hasGameHistory = false;
        if (currentUserId != null) {
            hasGameHistory = escapeRoomHistoryRepository
                    .existsByUserIdAndEscapeRoomThemeId(currentUserId, themeId);
        }
        
        final boolean hasHistory = hasGameHistory;
        final UUID userId = currentUserId;
        
        return histories.map(history -> 
                EscapeRoomHistoryResponse.fromWithSpoilerCheck(history, userId, hasHistory));
    }
    
    /**
     * 특정 사용자가 특정 테마를 플레이했는지 확인
     */
    public boolean hasPlayedTheme(UUID userId, UUID themeId) {
        return escapeRoomHistoryRepository.existsByUserIdAndEscapeRoomThemeId(userId, themeId);
    }
    
    /**
     * 현재 사용자가 특정 테마를 플레이했는지 확인
     */
    public boolean hasCurrentUserPlayedTheme(UUID themeId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElse(null);
        if (currentUserId == null) {
            return false;
        }
        return hasPlayedTheme(currentUserId, themeId);
    }
    
    /**
     * 특정 기록 상세 조회
     */
    public EscapeRoomHistoryResponse getHistory(UUID historyId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElse(null);
        
        EscapeRoomHistory history = escapeRoomHistoryRepository.findById(historyId)
                .orElseThrow(() -> ErrorStatus.GAME_HISTORY_NOT_FOUND.asServiceException());
        
        // 비공개 기록은 작성자만 조회 가능
        if (!history.getIsPublic() && (currentUserId == null || !history.isAuthor(currentUserId))) {
            throw ErrorStatus.FORBIDDEN.asServiceException();
        }
        
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
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElse(null);
        
        List<EscapeRoomHistory> histories = escapeRoomHistoryRepository
                .findRecentHistories(Pageable.ofSize(limit));
        
        return histories.stream()
                .map(history -> EscapeRoomHistoryResponse.from(history, currentUserId))
                .collect(Collectors.toList());
    }
}