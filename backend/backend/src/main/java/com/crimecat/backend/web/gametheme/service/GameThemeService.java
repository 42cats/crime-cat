package com.crimecat.backend.web.gametheme.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.storage.StorageService;
import com.crimecat.backend.web.gametheme.domain.GameTheme;
import com.crimecat.backend.web.gametheme.dto.*;
import com.crimecat.backend.web.gametheme.repository.GameThemeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameThemeService {
    private final StorageService storageService;
    private final GameThemeRepository themeRepository;

    @Transactional
    public void addGameTheme(MultipartFile file, AddGameThemeRequest request) {
        GameTheme gameTheme = GameTheme.from(request);
        // TODO: 작성자 추가
//        UUID userId = null;
//        gameTheme.setAuthorId(userId);
        gameTheme = themeRepository.save(gameTheme);
        if (file != null && !file.isEmpty()) {
            String uri = storageService.storeAt(file, "gametheme", gameTheme.getId().toString());
            gameTheme.setThumbnail(uri);
            themeRepository.save(gameTheme);
        }
    }

    public void deleteGameTheme(UUID themeId) {
        GameTheme gameTheme = themeRepository.findById(themeId).orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        if (gameTheme.isDeleted()) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }
        // TODO: 작성자 확인
        gameTheme.setIsDelete(true);
        themeRepository.save(gameTheme);
    }

    public GetGameThemeResponse getGameTheme(UUID themeId) {
        GameTheme gameTheme = themeRepository.findById(themeId).orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        if (gameTheme.isDeleted()) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }
        // TODO: publicStatus에 따라 작성자만 볼 수 있도록
//        UUID userId = null;
//        if (!gameTheme.isPublicStatus() && userId.equals(gameTheme.getAuthorId())) {
//            throw ErrorStatus.FORBIDDEN.asServiceException();
//        }
        return GetGameThemeResponse.builder()
                .theme(GameThemeDetailDto.of(gameTheme))
                .build();
    }

    @Transactional
    public void updateGameTheme(UUID themeId, MultipartFile file, UpdateGameThemeRequest request) {
        GameTheme gameTheme = themeRepository.findById(themeId).orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        // TODO: soft delete 복구 처리?
        if (gameTheme.isDeleted()) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }
        request.update(gameTheme);
        if (file != null && !file.isEmpty()) {
            storageService.storeAt(file, "gametheme", gameTheme.getId().toString());
            gameTheme.setThumbnail("/gametheme/" + gameTheme.getId());
            themeRepository.save(gameTheme);
        }
    }

    public GetGameThemesResponse getGameThemes(Specification<GameTheme> spec, Pageable pageable) {
        UUID userId = null;
        List<GameThemeDto> list = themeRepository.findAll(spec, pageable).stream()
                // TODO: specification으로 처리
                .filter(v -> v.isPublicStatus() || (userId != null && userId.equals(v.getAuthorId())))
                .map(GameThemeDto::from)
                .toList();
        return GetGameThemesResponse.builder()
                .themes(list)
                .page(pageable.getPageNumber())
                .size(list.size())
                .build();
    }
}




