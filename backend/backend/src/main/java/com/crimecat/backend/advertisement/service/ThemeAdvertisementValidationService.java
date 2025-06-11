package com.crimecat.backend.advertisement.service;

import com.crimecat.backend.advertisement.domain.AdvertisementStatus;
import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.repository.ThemeAdvertisementRequestRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.exception.ServiceException;
import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.repository.CrimesceneThemeRepository;
import com.crimecat.backend.gametheme.repository.GameThemeRepository;
import com.crimecat.backend.gametheme.repository.MakerTeamMemberRepository;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.enums.UserRole;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 테마 광고 관련 검증 로직을 담당하는 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ThemeAdvertisementValidationService {
    
    private final GameThemeRepository gameThemeRepository;
    private final CrimesceneThemeRepository crimesceneThemeRepository;
    private final ThemeAdvertisementRequestRepository advertisementRequestRepository;
    private final UserRepository userRepository;
    private final MakerTeamMemberRepository makerTeamMemberRepository;
    private final WebUserRepository webUserRepository;
    
    /**
     * 테마 소유권을 검증합니다.
     * - 관리자: 모든 테마에 대해 광고 신청 가능
     * - CrimesceneTheme: 사용자가 속한 팀이 제작한 테마인지 확인
     * - 다른 테마: authorId로 직접 작성자인지 확인
     */
    public void validateThemeOwnership(UUID userId, UUID themeId) {
        // 관리자 권한 확인
        WebUser webUser = webUserRepository.findById(userId)
            .orElseThrow(() -> {
                log.warn("웹 사용자를 찾을 수 없음: userId={}", userId);
                return ErrorStatus.USER_NOT_FOUND.asServiceException();
            });
        
        if (webUser.getRole() == UserRole.ADMIN) {
            log.debug("관리자 권한으로 테마 소유권 검증 통과: userId={}, themeId={}, role={}", 
                userId, themeId, webUser.getRole());
            return;
        }
        
        GameTheme theme = gameThemeRepository.findById(themeId)
            .orElseThrow(() -> {
                log.warn("테마를 찾을 수 없음: themeId={}", themeId);
                return ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
            });
        
        // CrimesceneTheme인 경우 팀 멤버십 확인
        if (theme instanceof CrimesceneTheme) {
            CrimesceneTheme crimesceneTheme = (CrimesceneTheme) theme;
            
            // 1. 직접 작성자인지 확인
            if (crimesceneTheme.getAuthorId() != null && crimesceneTheme.getAuthorId().equals(userId)) {
                log.debug("크라임씬 테마 소유권 검증 성공 (직접 작성자): userId={}, themeId={}", userId, themeId);
                return;
            }
            
            // 2. 팀 멤버인지 확인
            if (crimesceneTheme.getTeamId() != null) {
                boolean isTeamMember = makerTeamMemberRepository.existsByTeamIdAndWebUserId(
                    crimesceneTheme.getTeamId(), userId);
                
                if (isTeamMember) {
                    log.debug("크라임씬 테마 소유권 검증 성공 (팀 멤버): userId={}, themeId={}, teamId={}", 
                        userId, themeId, crimesceneTheme.getTeamId());
                    return;
                }
            }
            
            log.warn("크라임씬 테마 소유권 검증 실패: userId={}, themeId={}, authorId={}, teamId={}", 
                userId, themeId, crimesceneTheme.getAuthorId(), crimesceneTheme.getTeamId());
            throw new ServiceException(ErrorStatus.FORBIDDEN);
        }
        
        // 다른 테마는 authorId로만 확인
        if (theme.getAuthorId() == null || !theme.getAuthorId().equals(userId)) {
            log.warn("테마 소유권 검증 실패: userId={}, themeId={}, authorId={}", 
                userId, themeId, theme.getAuthorId());
            throw new ServiceException(ErrorStatus.FORBIDDEN);
        }
        
        log.debug("테마 소유권 검증 성공 (직접 작성자): userId={}, themeId={}", userId, themeId);
    }
    
    /**
     * 중복 광고를 검증합니다.
     * 같은 테마에 대해 이미 활성화되었거나 대기 중인 광고가 있는지 확인합니다.
     */
    public void validateDuplicateAdvertisement(UUID userId, UUID themeId) {
        List<AdvertisementStatus> activeStatuses = List.of(
            AdvertisementStatus.ACTIVE,
            AdvertisementStatus.PENDING_QUEUE
        );
        
        List<ThemeAdvertisementRequest> existingRequests = 
            advertisementRequestRepository.findByUserIdAndStatusIn(userId, activeStatuses);
        
        boolean hasDuplicate = existingRequests.stream()
            .anyMatch(request -> request.getThemeId().equals(themeId));
        
        if (hasDuplicate) {
            log.warn("중복 광고 신청 시도: userId={}, themeId={}", userId, themeId);
            throw new ServiceException(ErrorStatus.ADVERTISEMENT_PERIOD_OVERLAP);
        }
        
        log.debug("중복 광고 검증 통과: userId={}, themeId={}", userId, themeId);
    }
    
    /**
     * 사용자의 포인트 잔액을 검증합니다.
     * 광고 비용을 지불할 수 있는 충분한 포인트가 있는지 확인합니다.
     */
    public void validatePointBalance(UUID userId, int requiredPoints) {
        User user = userRepository.findByWebUserId(userId)
            .orElseThrow(() -> {
                log.warn("사용자를 찾을 수 없음: userId={}", userId);
                return ErrorStatus.USER_NOT_FOUND.asServiceException();
            });
        
        int currentPoints = user.getPoint();
        
        if (currentPoints < requiredPoints) {
            log.warn("포인트 부족: userId={}, currentPoints={}, requiredPoints={}", 
                userId, currentPoints, requiredPoints);
            throw new ServiceException(ErrorStatus.INSUFFICIENT_POINT);
        }
        
        log.debug("포인트 잔액 검증 통과: userId={}, currentPoints={}, requiredPoints={}", 
            userId, currentPoints, requiredPoints);
    }
    
    /**
     * 광고 신청 전 모든 검증을 수행합니다.
     */
    public void validateAdvertisementRequest(UUID userId, UUID themeId, int requestedDays) {
        // 1. 테마 소유권 검증
        validateThemeOwnership(userId, themeId);
        
        // 2. 중복 광고 방지
        validateDuplicateAdvertisement(userId, themeId);
        
        // 3. 포인트 잔액 검증
        int totalCost = requestedDays * 100; // 하루당 100포인트
        validatePointBalance(userId, totalCost);
        
        log.info("광고 신청 검증 완료: userId={}, themeId={}, requestedDays={}, totalCost={}", 
            userId, themeId, requestedDays, totalCost);
    }
}