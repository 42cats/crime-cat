package com.crimecat.backend.gametheme.controller;

import com.crimecat.backend.gametheme.dto.CrimesceneThemeSummeryListDto;
import com.crimecat.backend.gametheme.dto.GetGameThemesResponse;
import com.crimecat.backend.gametheme.dto.filter.GetGameThemesFilter;
import com.crimecat.backend.gametheme.dto.GetGameThemeResponse;
import com.crimecat.backend.gametheme.service.GameThemeService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public/themes")
public class GameThemePublicController {
    private final GameThemeService gameThemeService;

    // ================================
    // 전체 테마 조회 (기존 유지)
    // ================================
    
    @GetMapping
    public GetGameThemesResponse getGameThemes(GetGameThemesFilter filter) {
        return gameThemeService.getGameThemes(filter);
    }

    // ================================
    // 크라임씬 테마 전용 조회
    // ================================
    
    @GetMapping("/crimescene")
    public GetGameThemesResponse getCrimesceneThemes(GetGameThemesFilter filter) {
        // 크라임씬으로 필터 강제 설정
        filter.setCategory("CRIMESCENE");
        return gameThemeService.getGameThemes(filter);
    }

    @GetMapping("/crimescene/{themeId}")
    public GetGameThemeResponse getCrimesceneTheme(@PathVariable UUID themeId) {
        return gameThemeService.getGameTheme(themeId);
    }

    // ================================
    // 방탈출 테마 전용 조회
    // ================================
    
    @GetMapping("/escape-room")
    public GetGameThemesResponse getEscapeRoomThemes(GetGameThemesFilter filter) {
        // 방탈출로 필터 강제 설정
        filter.setCategory("ESCAPE_ROOM");
        return gameThemeService.getGameThemes(filter);
    }

    @GetMapping("/escape-room/{themeId}")
    public GetGameThemeResponse getEscapeRoomTheme(@PathVariable UUID themeId) {
        return gameThemeService.getGameTheme(themeId);
    }

    // ================================
    // 머더미스터리 테마 전용 조회
    // ================================
    
    @GetMapping("/murder-mystery")
    public GetGameThemesResponse getMurderMysteryThemes(GetGameThemesFilter filter) {
        // 머더미스터리로 필터 강제 설정
        filter.setCategory("MURDER_MYSTERY");
        return gameThemeService.getGameThemes(filter);
    }

    @GetMapping("/murder-mystery/{themeId}")
    public GetGameThemeResponse getMurderMysteryTheme(@PathVariable UUID themeId) {
        return gameThemeService.getGameTheme(themeId);
    }

    // ================================
    // 리얼월드 테마 전용 조회
    // ================================
    
    @GetMapping("/realworld")
    public GetGameThemesResponse getRealWorldThemes(GetGameThemesFilter filter) {
        // 리얼월드로 필터 강제 설정
        filter.setCategory("REALWORLD");
        return gameThemeService.getGameThemes(filter);
    }

    @GetMapping("/realworld/{themeId}")
    public GetGameThemeResponse getRealWorldTheme(@PathVariable UUID themeId) {
        return gameThemeService.getGameTheme(themeId);
    }

    // ================================
    // 개별 테마 조회 (공통)
    // ================================
    
    @GetMapping("/{themeId}")
    public GetGameThemeResponse getGameTheme(@PathVariable UUID themeId) {
        return gameThemeService.getGameTheme(themeId);
    }

    // ================================
    // 사용자별 테마 조회
    // ================================
    
    @GetMapping("/creator/{user_id}")
    public ResponseEntity<CrimesceneThemeSummeryListDto> getSpecificUserTheme(@PathVariable("user_id") UUID userId){
        return ResponseEntity.ok(gameThemeService.getGameThemeSummery(userId));
    }

    @GetMapping("/crimescene/creator/{webUser_id}")
    public ResponseEntity<CrimesceneThemeSummeryListDto> getSpecificUserCrimesceneTheme(@PathVariable("webUser_id") UUID webUserId){
        return ResponseEntity.ok(gameThemeService.getGameThemeSummery(webUserId));
    }
}
