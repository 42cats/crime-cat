package com.crimecat.backend.point.controller;

import com.crimecat.backend.point.domain.PointHistory;
import com.crimecat.backend.point.domain.TransactionType;
import com.crimecat.backend.point.dto.PointHistoryResponseDto;
import com.crimecat.backend.point.dto.PointHistorySummaryDto;
import com.crimecat.backend.point.service.PointHistoryService;
import com.crimecat.backend.point.sort.PointHistorySortType;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.utils.sort.SortUtil;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/point-history")
@RequiredArgsConstructor
public class PointHistoryController {

    private final PointHistoryService pointHistoryService;

    @GetMapping
    public ResponseEntity<Page<PointHistoryResponseDto>> getMyPointHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) List<String> sort
    ) {
        String currentUserId = AuthenticationUtil.getCurrentWebUserId().toString();
        
        List<PointHistorySortType> sortTypes = (sort != null && !sort.isEmpty()) ?
                sort.stream()
                        .map(String::toUpperCase)
                        .map(PointHistorySortType::valueOf)
                        .toList()
                : List.of(PointHistorySortType.LATEST);

        Sort resolvedSort = SortUtil.combineSorts(sortTypes);
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        
        Page<PointHistory> pointHistories = pointHistoryService.getUserPointHistory(
            currentUserId, type, pageable
        );
        
        Page<PointHistoryResponseDto> responsePage = pointHistories.map(
            PointHistoryResponseDto::from
        );
        
        return ResponseEntity.ok(responsePage);
    }

    @GetMapping("/summary")
    public ResponseEntity<PointHistorySummaryDto> getPointHistorySummary() {
        String currentUserId = AuthenticationUtil.getCurrentWebUserId().toString();
        
        PointHistorySummaryDto summary = pointHistoryService.getPointHistorySummary(currentUserId);
        
        return ResponseEntity.ok(summary);
    }
}
