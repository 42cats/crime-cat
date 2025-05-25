package com.crimecat.backend.gametheme.controller;

import com.crimecat.backend.gametheme.dto.AddCrimesceneThemeRequest;
import com.crimecat.backend.gametheme.dto.AddEscapeRoomThemeRequest;
import com.crimecat.backend.gametheme.dto.AddGameThemeRequest;
import com.crimecat.backend.gametheme.dto.GetGameThemeResponse;
import com.crimecat.backend.gametheme.dto.GetGameThemesResponse;
import com.crimecat.backend.gametheme.dto.GetLikeStatusResponse;
import com.crimecat.backend.gametheme.dto.UpdateCrimesceneThemeRequest;
import com.crimecat.backend.gametheme.dto.UpdateEscapeRoomThemeRequest;
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
    // 방탈출 테마 전용 엔드포인트 (우선순위 높게 먼저 선언)
    // ================================

    @PostMapping(value = "/escape-room", consumes = "multipart/form-data")
    public void addEscapeRoomTheme(@RequestPart(name = "thumbnail", required = false) MultipartFile file,
                                   @Validated @RequestPart("data") AddEscapeRoomThemeRequest request) {
        gameThemeService.addGameTheme(file, request);
    }

    @PostMapping(value = "/escape-room/{themeId}", consumes = "multipart/form-data")
    public void updateEscapeRoomTheme(@PathVariable UUID themeId,
                                      @RequestPart(value = "thumbnail", required = false) MultipartFile file,
                                      @Validated @RequestPart("data") UpdateEscapeRoomThemeRequest request) {
        gameThemeService.updateEscapeRoomTheme(themeId, file, request);
    }

    // ================================
    // 크라임씬 테마 전용 엔드포인트
    // ================================

    @PostMapping(value = "/crimescene", consumes = "multipart/form-data")
    public void addCrimesceneTheme(@RequestPart(name = "thumbnail", required = false) MultipartFile file,
                                   @Validated @RequestPart("data") AddCrimesceneThemeRequest request) {
        gameThemeService.addGameTheme(file, request);
    }

    @PostMapping(value = "/crimescene/{themeId}", consumes = "multipart/form-data")
    public void updateCrimesceneTheme(@PathVariable UUID themeId,
                                      @RequestPart(value = "thumbnail", required = false) MultipartFile file,
                                      @Validated @RequestPart("data") UpdateCrimesceneThemeRequest request) {
        gameThemeService.updateCrimesceneTheme(themeId, file, request);
    }

    // ================================
    // 머더미스터리 테마 전용 엔드포인트 (기본 구조)
    // ================================

    @PostMapping(value = "/murder-mystery", consumes = "multipart/form-data")
    public void addMurderMysteryTheme(@RequestPart(name = "thumbnail", required = false) MultipartFile file,
                                      @Validated @RequestPart("data") AddGameThemeRequest request) {
        gameThemeService.addGameTheme(file, request);
    }

    @PostMapping(value = "/murder-mystery/{themeId}", consumes = "multipart/form-data")
    public void updateMurderMysteryTheme(@PathVariable UUID themeId,
                                         @RequestPart(value = "thumbnail", required = false) MultipartFile file,
                                         @Validated @RequestPart("data") UpdateGameThemeRequest request) {
        gameThemeService.updateMurderMysteryTheme(themeId, file, request);
    }

    // ================================
    // 리얼월드 테마 전용 엔드포인트 (기본 구조)
    // ================================

    @PostMapping(value = "/realworld", consumes = "multipart/form-data")
    public void addRealWorldTheme(@RequestPart(name = "thumbnail", required = false) MultipartFile file,
                                  @Validated @RequestPart("data") AddGameThemeRequest request) {
        gameThemeService.addGameTheme(file, request);
    }

    @PostMapping(value = "/realworld/{themeId}", consumes = "multipart/form-data")
    public void updateRealWorldTheme(@PathVariable UUID themeId,
                                     @RequestPart(value = "thumbnail", required = false) MultipartFile file,
                                     @Validated @RequestPart("data") UpdateGameThemeRequest request) {
        gameThemeService.updateRealWorldTheme(themeId, file, request);
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

}
