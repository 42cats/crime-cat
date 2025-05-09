package com.crimecat.backend.gametheme.controller;

import com.crimecat.backend.gametheme.dto.GetGameThemeResponse;
import com.crimecat.backend.gametheme.dto.GetGameThemesResponse;
import com.crimecat.backend.gametheme.dto.GetLikeStatusResponse;
import com.crimecat.backend.gametheme.service.GameThemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public/themes")
public class GameThemePublicController {
    private final GameThemeService gameThemeService;

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

    @GetMapping("/{themeId}/like/status")
    public GetLikeStatusResponse getLikeStatus(@PathVariable UUID themeId) {
        return new GetLikeStatusResponse(gameThemeService.getLikeStatus(themeId));
    }
}
