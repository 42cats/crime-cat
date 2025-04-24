package com.crimecat.backend.web.gametheme.controller;

import com.crimecat.backend.web.gametheme.domain.GameTheme;
import com.crimecat.backend.web.gametheme.domain.ThemeType;
import com.crimecat.backend.web.gametheme.dto.*;
import com.crimecat.backend.web.gametheme.service.GameThemeService;
import com.crimecat.backend.web.gametheme.specification.GameThemeSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
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
        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Order.desc("createdAt")));
        if (!ThemeType.contains(category)) {
            return gameThemeService.getGameThemes(null, pageable);
        }
        Specification<GameTheme> spec = Specification.where(GameThemeSpecification.equalCategory(category));
        return gameThemeService.getGameThemes(spec, pageable);
    }

    @GetMapping("/{themeId}")
    public GetGameThemeResponse getGameTheme(@PathVariable UUID themeId) {
        return gameThemeService.getGameTheme(themeId);
    }

    @PostMapping("/{themeId}")
    public void updateGameTheme(@PathVariable UUID themeId,
                                @RequestPart(value = "thumbnail", required = false) MultipartFile file,
                                @RequestPart("data") UpdateGameThemeRequest request) {
        // TODO: 작성자(+팀원?)만 수정할 수 있도록
        gameThemeService.updateGameTheme(themeId, file, request);
    }

    @DeleteMapping("/{themeId}")
    public void deleteGameTheme(@PathVariable UUID themeId) {
        // TODO: 작성자(+팀원?)만 삭제할 수 있도록
        gameThemeService.deleteGameTheme(themeId);
    }
}
