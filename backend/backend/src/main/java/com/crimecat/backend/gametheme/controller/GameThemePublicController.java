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

    @GetMapping
    public GetGameThemesResponse getGameThemes(GetGameThemesFilter filter) {
        return gameThemeService.getGameThemes(filter);
    }

    @GetMapping("/{themeId}")
    public GetGameThemeResponse getGameTheme(@PathVariable UUID themeId) {
        return gameThemeService.getGameTheme(themeId);
    }

    @GetMapping("/creator/{user_id}")
    public ResponseEntity<CrimesceneThemeSummeryListDto> getSpecificUserTheme(@PathVariable("user_id") UUID userId){
        return ResponseEntity.ok(gameThemeService.getGameThemeSummery(userId));
    }
}
