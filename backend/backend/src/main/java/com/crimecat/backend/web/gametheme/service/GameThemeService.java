package com.crimecat.backend.web.gametheme.service;

import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.auth.service.DiscordOAuth2UserService;
import com.crimecat.backend.bot.user.repository.UserRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.storage.StorageService;
import com.crimecat.backend.web.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.web.gametheme.domain.GameTheme;
import com.crimecat.backend.web.gametheme.dto.*;
import com.crimecat.backend.web.gametheme.repository.GameThemeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameThemeService {
    private final StorageService storageService;
    private final GameThemeRepository themeRepository;
    private final DiscordOAuth2UserService oAuth2UserService;
    private final MakerTeamService teamService;

    private static final String THUMBNAIL_LOCATION = "gametheme";

    @Transactional
    public void addGameTheme(MultipartFile file, AddGameThemeRequest request) {
        GameTheme gameTheme = GameTheme.from(request);
        gameTheme.setAuthorId(oAuth2UserService.getLoginUserId());
        gameTheme = themeRepository.save(gameTheme);
        if (file != null && !file.isEmpty()) {
            String path = storageService.storeAt(file, THUMBNAIL_LOCATION, gameTheme.getId().toString());
            gameTheme.setThumbnail(path);
            themeRepository.save(gameTheme);
        }
    }

    public void deleteGameTheme(UUID themeId) {
        GameTheme gameTheme = themeRepository.findById(themeId).orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        if (gameTheme.isDeleted()) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }
        if (!oAuth2UserService.getLoginUserId().equals(gameTheme.getAuthorId())) {
            throw ErrorStatus.FORBIDDEN.asServiceException();
        }
        gameTheme.setIsDelete(true);
        themeRepository.save(gameTheme);
    }

    public GetGameThemeResponse getGameTheme(UUID themeId) {
        GameTheme gameTheme = themeRepository.findById(themeId).orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        if (gameTheme.isDeleted() && !gameTheme.isPublicStatus()) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }
        gameTheme.viewed();
        gameTheme = themeRepository.save(gameTheme);
        return GetGameThemeResponse.builder()
                .theme(GameThemeDetailDto.of(gameTheme))
                .build();
    }

    @Transactional
    public void updateGameTheme(UUID themeId, MultipartFile file, UpdateGameThemeRequest request) {
        GameTheme gameTheme = themeRepository.findById(themeId).orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        if (gameTheme.isDeleted()) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }
        UUID userId = oAuth2UserService.getLoginUserId();
        if (!userId.equals(gameTheme.getAuthorId())) {
            throw ErrorStatus.FORBIDDEN.asServiceException();
        }
        request.update(gameTheme);
        if (file != null && !file.isEmpty()) {
            String path = storageService.storeAt(file, THUMBNAIL_LOCATION, gameTheme.getId().toString());
            gameTheme.setThumbnail(path);
            themeRepository.save(gameTheme);
        }
    }

    @Transactional
    public GetGameThemesResponse getGameThemes(Specification<GameTheme> spec, Pageable pageable) {
        UUID userId = oAuth2UserService.getLoginUserId();
        List<GameThemeDto> list = themeRepository.findAll(spec, pageable).stream()
                // TODO: specification으로 처리
                .filter(v -> !v.isDeleted() && (v.isPublicStatus() || (userId.equals(v.getAuthorId()))))
                .map(GameThemeDto::from)
                .toList();
        return GetGameThemesResponse.builder()
                .themes(list)
                .page(pageable.getPageNumber())
                .size(list.size())
                .build();
    }
}
