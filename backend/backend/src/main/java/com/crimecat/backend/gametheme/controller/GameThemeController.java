package com.crimecat.backend.gametheme.controller;

import com.crimecat.backend.gametheme.dto.AddCrimesceneThemeRequest;
import com.crimecat.backend.gametheme.dto.AddEscapeRoomThemeRequest;
import com.crimecat.backend.gametheme.dto.AddGameThemeRequest;
import com.crimecat.backend.gametheme.dto.GetGameThemeResponse;
import com.crimecat.backend.gametheme.dto.GetGameThemesResponse;
import com.crimecat.backend.gametheme.dto.GetLikeStatusResponse;
import com.crimecat.backend.gametheme.dto.UpdateCrimesceneThemeRequest;
import com.crimecat.backend.gametheme.dto.UpdateGameThemeRequest;
import com.crimecat.backend.gametheme.service.GameThemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/themes")
public class GameThemeController {
    private final GameThemeService gameThemeService;

    // ================================
    // 크라임씬 테마 전용 엔드포인트
    // ================================
    
    @PostMapping("/crimescene")
    public void addCrimesceneTheme(@RequestPart(name = "thumbnail", required = false) MultipartFile file,
                                   @Validated @RequestPart("data") AddCrimesceneThemeRequest request) {
        gameThemeService.addGameTheme(file, request);
    }

    @PostMapping("/crimescene/{themeId}")
    public void updateCrimesceneTheme(@PathVariable UUID themeId,
                                      @RequestPart(value = "thumbnail", required = false) MultipartFile file,
                                      @Validated @RequestPart("data") UpdateCrimesceneThemeRequest request) {
        gameThemeService.updateGameTheme(themeId, file, request);
    }

    // ================================
    // 방탈출 테마 전용 엔드포인트
    // ================================
    
    @PostMapping("/escape-room")
    public void addEscapeRoomTheme(@RequestPart(name = "thumbnail", required = false) MultipartFile file,
                                   @Validated @RequestPart("data") AddEscapeRoomThemeRequest request) {
        gameThemeService.addGameTheme(file, request);
    }

    @PostMapping("/escape-room/{themeId}")
    public void updateEscapeRoomTheme(@PathVariable UUID themeId,
                                      @RequestPart(value = "thumbnail", required = false) MultipartFile file,
                                      @Validated @RequestPart("data") AddEscapeRoomThemeRequest request) {
        gameThemeService.updateGameTheme(themeId, file, request);
    }

    // ================================
    // 머더미스터리 테마 전용 엔드포인트 (기본 구조)
    // ================================
    
    @PostMapping("/murder-mystery")
    public void addMurderMysteryTheme(@RequestPart(name = "thumbnail", required = false) MultipartFile file,
                                      @Validated @RequestPart("data") AddGameThemeRequest request) {
        gameThemeService.addGameTheme(file, request);
    }

    @PostMapping("/murder-mystery/{themeId}")
    public void updateMurderMysteryTheme(@PathVariable UUID themeId,
                                         @RequestPart(value = "thumbnail", required = false) MultipartFile file,
                                         @Validated @RequestPart("data") UpdateGameThemeRequest request) {
        gameThemeService.updateGameTheme(themeId, file, request);
    }

    // ================================
    // 리얼월드 테마 전용 엔드포인트 (기본 구조)
    // ================================
    
    @PostMapping("/realworld")
    public void addRealWorldTheme(@RequestPart(name = "thumbnail", required = false) MultipartFile file,
                                  @Validated @RequestPart("data") AddGameThemeRequest request) {
        gameThemeService.addGameTheme(file, request);
    }

    @PostMapping("/realworld/{themeId}")
    public void updateRealWorldTheme(@PathVariable UUID themeId,
                                     @RequestPart(value = "thumbnail", required = false) MultipartFile file,
                                     @Validated @RequestPart("data") UpdateGameThemeRequest request) {
        gameThemeService.updateGameTheme(themeId, file, request);
    }

    // ================================
    // 공통 엔드포인트들
    // ================================

    @DeleteMapping("/{themeId}")
    public void deleteGameTheme(@PathVariable UUID themeId) {
        gameThemeService.deleteGameTheme(themeId);
    }

    @GetMapping("/{themeId}/like/status")
    public GetLikeStatusResponse getLikeStatus(@PathVariable UUID themeId) {
        return new GetLikeStatusResponse(gameThemeService.getLikeStatus(themeId));
    }

    @DeleteMapping("/{themeId}/like")
    public void deleteLike(@PathVariable UUID themeId) {
        gameThemeService.cancleLike(themeId);
    }

    @PostMapping("/{themeId}/like")
    public void likeGameTheme(@PathVariable UUID themeId) {
        gameThemeService.like(themeId);
    }

    // ================================
    // 레거시 엔드포인트 (하위 호환성)
    // ================================
    
    @PostMapping
    @Deprecated
    public void addGameTheme(@RequestPart(name = "thumbnail", required = false) MultipartFile file,
                            @Validated @RequestPart("data") AddGameThemeRequest request) {
        // 기본적으로 크라임씬으로 처리 (하위 호환성)
        gameThemeService.addGameTheme(file, request);
    }

    @PostMapping("/{themeId}")
    @Deprecated
    public void updateGameTheme(@PathVariable UUID themeId,
                                @RequestPart(value = "thumbnail", required = false) MultipartFile file,
                                @Validated @RequestPart("data") UpdateGameThemeRequest request) {
        gameThemeService.updateGameTheme(themeId, file, request);
    }
}
