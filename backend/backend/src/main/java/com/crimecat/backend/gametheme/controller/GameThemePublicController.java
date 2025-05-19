package com.crimecat.backend.gametheme.controller;

import com.crimecat.backend.gametheme.dto.CrimesceneThemeSummeryListDto;
import com.crimecat.backend.gametheme.dto.GetGameThemeResponse;
import com.crimecat.backend.gametheme.dto.GetGameThemesResponse;
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
    public GetGameThemesResponse getGameThemes(@RequestParam(value = "category", required = false) String category,
                                               @RequestParam(value = "limit", defaultValue = "10") int limit,
                                               @RequestParam(value = "page", defaultValue = "0") int page,
                                               @RequestParam(value = "sort", defaultValue = "DEFAULT") String sort,
                                               @RequestParam(value = "keyword", required = false) String keyword) {
        return gameThemeService.getGameThemes(category, limit, page, sort, keyword);
    }

    @GetMapping("/{themeId}")
    public GetGameThemeResponse getGameTheme(@PathVariable UUID themeId) {
        return gameThemeService.getGameTheme(themeId);
    }

    @GetMapping("/creater/{user_id}")
    public ResponseEntity<CrimesceneThemeSummeryListDto> getSpecificUserTheme(@PathVariable("user_id") UUID userId){
        return ResponseEntity.ok(gameThemeService.getGameThemeSummery(userId));
    }
}
