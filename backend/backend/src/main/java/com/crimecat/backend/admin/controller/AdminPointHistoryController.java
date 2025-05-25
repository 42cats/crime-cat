package com.crimecat.backend.admin.controller;

import com.crimecat.backend.admin.dto.PointHistoryFilterRequest;
import com.crimecat.backend.admin.dto.PointHistoryStatisticsResponse;
import com.crimecat.backend.admin.dto.SuspiciousActivityResponse;
import com.crimecat.backend.admin.dto.UserPointSummaryResponse;
import com.crimecat.backend.admin.service.AdminPointHistoryService;
import com.crimecat.backend.point.domain.TransactionType;
import com.crimecat.backend.point.dto.PointHistoryResponseDto;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.enums.UserRole;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/point-history")
@RequiredArgsConstructor
public class AdminPointHistoryController {

    private final AdminPointHistoryService adminPointHistoryService;

    /**
     * 전체 사용자의 포인트 내역을 조회합니다. 관리자 또는 매니저만 가능합니다.
     */
    @GetMapping
    public ResponseEntity<Page<PointHistoryResponseDto>> getAllPointHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Integer minAmount,
            @RequestParam(required = false) Integer maxAmount,
            @RequestParam(defaultValue = "usedAt,desc") String[] sort
    ) {
        // 관리자 또는 매니저 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);

        PointHistoryFilterRequest filter = PointHistoryFilterRequest.builder()
                .type(type)
                .userId(userId)
                .startDate(startDate)
                .endDate(endDate)
                .minAmount(minAmount)
                .maxAmount(maxAmount)
                .build();

        Sort sortOrder = Sort.by(
                sort[0].equals("usedAt") ? Sort.Direction.fromString(sort[1]) : Sort.Direction.DESC,
                sort[0]
        );
        Pageable pageable = PageRequest.of(page, size, sortOrder);

        Page<PointHistoryResponseDto> pointHistories = adminPointHistoryService.getAllPointHistory(filter, pageable);
        return ResponseEntity.ok(pointHistories);
    }

    /**
     * 의심스러운 포인트 활동을 조회합니다. 관리자 또는 매니저만 가능합니다.
     */
    @GetMapping("/suspicious")
    public ResponseEntity<List<SuspiciousActivityResponse>> getSuspiciousActivities(
            @RequestParam(defaultValue = "24") int hours
    ) {
        // 관리자 또는 매니저 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);

        List<SuspiciousActivityResponse> suspiciousActivities = 
                adminPointHistoryService.getSuspiciousActivities(hours);
        return ResponseEntity.ok(suspiciousActivities);
    }

    /**
     * 특정 사용자의 포인트 내역을 조회합니다. 관리자 또는 매니저만 가능합니다.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<PointHistoryResponseDto>> getUserPointHistory(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        // 관리자 또는 매니저 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "usedAt"));
        Page<PointHistoryResponseDto> pointHistories = 
                adminPointHistoryService.getUserPointHistory(userId, type, startDate, endDate, pageable);
        return ResponseEntity.ok(pointHistories);
    }

    /**
     * 특정 사용자의 포인트 요약 정보를 조회합니다. 관리자 또는 매니저만 가능합니다.
     */
    @GetMapping("/user/{userId}/summary")
    public ResponseEntity<UserPointSummaryResponse> getUserPointSummary(@PathVariable UUID userId) {
        // 관리자 또는 매니저 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);

        UserPointSummaryResponse summary = adminPointHistoryService.getUserPointSummary(userId);
        return ResponseEntity.ok(summary);
    }

    /**
     * 포인트 통계를 조회합니다. 관리자 또는 매니저만 가능합니다.
     */
    @GetMapping("/statistics")
    public ResponseEntity<PointHistoryStatisticsResponse> getPointStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        // 관리자 또는 매니저 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);

        PointHistoryStatisticsResponse statistics = 
                adminPointHistoryService.getPointStatistics(startDate, endDate);
        return ResponseEntity.ok(statistics);
    }

    /**
     * 포인트 많이 보유한 상위 사용자를 조회합니다. 관리자 또는 매니저만 가능합니다.
     */
    @GetMapping("/top-holders")
    public ResponseEntity<List<UserPointSummaryResponse>> getTopPointHolders(
            @RequestParam(defaultValue = "10") int limit
    ) {
        // 관리자 또는 매니저 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);

        List<UserPointSummaryResponse> topHolders = adminPointHistoryService.getTopPointHolders(limit);
        return ResponseEntity.ok(topHolders);
    }
}
