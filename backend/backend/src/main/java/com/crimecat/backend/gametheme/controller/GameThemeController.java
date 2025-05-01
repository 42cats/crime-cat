package com.crimecat.backend.gametheme.controller;

import com.crimecat.backend.gametheme.dto.AddGameThemeRequest;
import com.crimecat.backend.gametheme.dto.GetGameThemeResponse;
import com.crimecat.backend.gametheme.dto.GetGameThemesResponse;
import com.crimecat.backend.gametheme.dto.GetLikeStatusResponse;
import com.crimecat.backend.gametheme.dto.UpdateGameThemeRequest;
import com.crimecat.backend.web.gametheme.dto.*;
import com.crimecat.backend.gametheme.service.GameThemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/themes")
public class GameThemeController {
    private final GameThemeService gameThemeService;

    @PostMapping
    public void addGameTheme(@RequestPart(name = "thumbnail", required = false) MultipartFile file,
                                       @RequestPart("data") AddGameThemeRequest request) {
        // TODO: 작성 제한
        gameThemeService.addGameTheme(file, request);
    }

    @GetMapping
    public GetGameThemesResponse getGameThemes(@RequestParam(value = "category", required = false) String category,
                                               @RequestParam(value = "limit", defaultValue = "10") int limit,
                                               @RequestParam(value = "page", defaultValue = "0") int page) {
        return gameThemeService.getGameThemes(category, limit, page);
    }

    @GetMapping("/{themeId}")
    public GetGameThemeResponse getGameTheme(@PathVariable UUID themeId) {
        return gameThemeService.getGameTheme(themeId);
    }

    @PostMapping("/{themeId}")
    public void updateGameTheme(@PathVariable UUID themeId,
                                @RequestPart(value = "thumbnail", required = false) MultipartFile file,
                                @RequestPart("data") UpdateGameThemeRequest request) {
        gameThemeService.updateGameTheme(themeId, file, request);
    }

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
