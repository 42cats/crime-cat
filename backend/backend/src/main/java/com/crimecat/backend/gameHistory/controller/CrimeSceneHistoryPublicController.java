package com.crimecat.backend.gameHistory.controller;

import com.crimecat.backend.gameHistory.dto.UserGameHistoryToUserDto;
import com.crimecat.backend.gameHistory.service.WebGameHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public/crime-scene-histories")
public class CrimeSceneHistoryPublicController {
    
    private final WebGameHistoryService webGameHistoryService;
    
    
    /**
     * 특정 사용자의 크라임씬 플레이 기록 목록 조회 (공개)
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<UserGameHistoryToUserDto>> getUserCrimeSceneHistories(
            @PathVariable String userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("사용자 크라임씬 기록 목록 조회 요청 - userId: {}, page: {}, size: {}", 
                userId, pageable.getPageNumber(), pageable.getPageSize());
        Page<UserGameHistoryToUserDto> response = webGameHistoryService.getPublicUserCrimeSceneGameHistory(userId, pageable);
        return ResponseEntity.ok(response);
    }
}