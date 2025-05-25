package com.crimecat.backend.advertisement.service;

import com.crimecat.backend.advertisement.domain.ThemeAdvertisement;
import com.crimecat.backend.advertisement.dto.CreateThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.dto.ThemeAdvertisementResponse;
import com.crimecat.backend.advertisement.dto.UpdateThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.repository.ThemeAdvertisementRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gametheme.service.GameThemeService;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
public class ThemeAdvertisementService {
    
    private final ThemeAdvertisementRepository advertisementRepository;
    private final GameThemeService gameThemeService;
    
    /**
     * 현재 로그인한 사용자 ID 가져오기
     */
    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw ErrorStatus.UNAUTHORIZED.asException();
        }
        
        Object principal = authentication.getPrincipal();
        if (principal instanceof WebUser) {
            return ((WebUser) principal).getId();
        }
        
        throw ErrorStatus.UNAUTHORIZED.asException();
    }
    
    /**
     * 현재 활성화된 광고 목록 조회 (공개 API)
     */
    public List<ThemeAdvertisementResponse> getActiveAdvertisements() {
        LocalDateTime now = LocalDateTime.now();
        List<ThemeAdvertisement> activeAds = advertisementRepository.findActiveAdvertisements(now);
        
        return activeAds.stream()
                .map(ad -> {
                    try {
                        var theme = gameThemeService.getGameTheme(ad.getThemeId());
                        return ThemeAdvertisementResponse.from(ad, theme);
                    } catch (Exception e) {
                        log.error("Failed to fetch theme for advertisement: {}", ad.getId(), e);
                        return ThemeAdvertisementResponse.from(ad);
                    }
                })
                .collect(Collectors.toList());
    }
    
    /**
     * 모든 광고 목록 조회 (어드민)
     */
    public List<ThemeAdvertisementResponse> getAllAdvertisements() {
        List<ThemeAdvertisement> allAds = advertisementRepository.findAllOrderByDisplayOrder();
        
        return allAds.stream()
                .map(ad -> {
                    try {
                        var theme = gameThemeService.getGameTheme(ad.getThemeId());
                        return ThemeAdvertisementResponse.from(ad, theme);
                    } catch (Exception e) {
                        log.error("Failed to fetch theme for advertisement: {}", ad.getId(), e);
                        return ThemeAdvertisementResponse.from(ad);
                    }
                })
                .collect(Collectors.toList());
    }
    
    /**
     * 광고 생성
     */
    @Transactional
    public ThemeAdvertisementResponse createAdvertisement(CreateThemeAdvertisementRequest request) {
        // 날짜 유효성 검증
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw ErrorStatus.ADVERTISEMENT_INVALID_PERIOD.asException();
        }
        
        // 중복 기간 검증
        boolean isDuplicate = advertisementRepository.existsByThemeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                request.getThemeId(), request.getEndDate(), request.getStartDate());
        
        if (isDuplicate) {
            throw ErrorStatus.ADVERTISEMENT_PERIOD_OVERLAP.asException();
        }
        
        // 테마 존재 여부 확인
        try {
            gameThemeService.getGameTheme(request.getThemeId());
        } catch (Exception e) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asException();
        }
        
        // displayOrder 설정
        Integer displayOrder = request.getDisplayOrder();
        if (displayOrder == null) {
            displayOrder = advertisementRepository.findMaxDisplayOrder() + 1;
        }
        
        ThemeAdvertisement advertisement = ThemeAdvertisement.builder()
                .themeId(request.getThemeId())
                .themeType(request.getThemeType())
                .displayOrder(displayOrder)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(true)
                .createdBy(getCurrentUserId())
                .build();
        
        advertisement = advertisementRepository.save(advertisement);
        
        var theme = gameThemeService.getGameTheme(advertisement.getThemeId());
        return ThemeAdvertisementResponse.from(advertisement, theme);
    }
    
    /**
     * 광고 수정
     */
    @Transactional
    public ThemeAdvertisementResponse updateAdvertisement(UUID id, UpdateThemeAdvertisementRequest request) {
        ThemeAdvertisement advertisement = advertisementRepository.findById(id)
                .orElseThrow(() -> ErrorStatus.ADVERTISEMENT_NOT_FOUND.asException());
        
        // 날짜 수정 시 유효성 검증
        LocalDateTime startDate = request.getStartDate() != null ? request.getStartDate() : advertisement.getStartDate();
        LocalDateTime endDate = request.getEndDate() != null ? request.getEndDate() : advertisement.getEndDate();
        
        if (startDate.isAfter(endDate)) {
            throw ErrorStatus.ADVERTISEMENT_INVALID_PERIOD.asException();
        }
        
        // 필드 업데이트
        if (request.getStartDate() != null) {
            advertisement.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            advertisement.setEndDate(request.getEndDate());
        }
        if (request.getDisplayOrder() != null) {
            advertisement.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsActive() != null) {
            advertisement.setIsActive(request.getIsActive());
        }
        
        advertisement.setUpdatedBy(getCurrentUserId());
        advertisement = advertisementRepository.save(advertisement);
        
        var theme = gameThemeService.getGameTheme(advertisement.getThemeId());
        return ThemeAdvertisementResponse.from(advertisement, theme);
    }
    
    /**
     * 광고 삭제
     */
    @Transactional
    public void deleteAdvertisement(UUID id) {
        if (!advertisementRepository.existsById(id)) {
            throw ErrorStatus.ADVERTISEMENT_NOT_FOUND.asException();
        }
        
        advertisementRepository.deleteById(id);
    }
    
    /**
     * 매일 자정에 광고 상태 업데이트 (스케줄러)
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void updateAdvertisementStatus() {
        LocalDateTime now = LocalDateTime.now();
        List<ThemeAdvertisement> allAds = advertisementRepository.findAll();
        
        for (ThemeAdvertisement ad : allAds) {
            boolean shouldBeActive = !ad.getStartDate().isAfter(now) && !ad.getEndDate().isBefore(now);
            
            if (ad.getIsActive() != shouldBeActive) {
                ad.setIsActive(shouldBeActive);
                advertisementRepository.save(ad);
                log.info("Updated advertisement {} status to {}", ad.getId(), shouldBeActive);
            }
        }
    }
}
