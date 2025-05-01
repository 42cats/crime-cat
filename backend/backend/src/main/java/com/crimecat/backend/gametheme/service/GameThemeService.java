package com.crimecat.backend.gametheme.service;

import com.crimecat.backend.auth.service.DiscordOAuth2UserService;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.domain.GameThemeRecommendation;
import com.crimecat.backend.gametheme.domain.MakerTeamMember;
import com.crimecat.backend.gametheme.dto.AddGameThemeRequest;
import com.crimecat.backend.gametheme.dto.GameThemeDetailDto;
import com.crimecat.backend.gametheme.dto.GameThemeDto;
import com.crimecat.backend.gametheme.dto.GetGameThemeResponse;
import com.crimecat.backend.gametheme.dto.GetGameThemesResponse;
import com.crimecat.backend.gametheme.dto.UpdateGameThemeRequest;
import com.crimecat.backend.gametheme.enums.ThemeType;
import com.crimecat.backend.gametheme.repository.GameThemeRecommendationRepository;
import com.crimecat.backend.gametheme.repository.GameThemeRepository;
import com.crimecat.backend.gametheme.specification.GameThemeSpecification;
import com.crimecat.backend.storage.StorageService;
import com.crimecat.backend.user.domain.User;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class GameThemeService {
    private final StorageService storageService;
    private final GameThemeRepository themeRepository;
    private final DiscordOAuth2UserService oAuth2UserService;
    private final MakerTeamService teamService;
    private final GameThemeRecommendationRepository themeRecommendationRepository;

    private static final String THUMBNAIL_LOCATION = "gametheme";

    @Transactional
    public void addGameTheme(MultipartFile file, AddGameThemeRequest request) {
        GameTheme gameTheme = GameTheme.from(request);
        User user = oAuth2UserService.getLoginUser();
        gameTheme.setAuthorId(user.getId());
        if (gameTheme instanceof CrimesceneTheme) {
            checkTeam((CrimesceneTheme) gameTheme, user);
        }
        gameTheme = themeRepository.save(gameTheme);
        if (file != null && !file.isEmpty()) {
            String path = storageService.storeAt(file, THUMBNAIL_LOCATION, gameTheme.getId().toString());
            gameTheme.setThumbnail(path);
            themeRepository.save(gameTheme);
        }
    }

    private void checkTeam(CrimesceneTheme gameTheme, User user) {
        if (gameTheme.getTeamId() == null) {
            List<MakerTeamMember> teams = teamService.getIndividualTeams(user.getId());
            if (teams.size() == 0) {
                UUID teamId = teamService.create(user.getName(), user.getId(), true);
                gameTheme.setTeamId(teamId);
            } else {
                gameTheme.setTeamId(teams.get(0).getTeam().getId());
            }
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
    public GetGameThemesResponse getGameThemes(String category, int pageSize, int pageNumber) {
        UUID userId = oAuth2UserService.getLoginUserId();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Order.desc("createdAt")));
        // TODO: QueryDSL
        Specification<GameTheme> spec = Specification.where(GameThemeSpecification.defaultSpec(userId));
        if (ThemeType.contains(category)) {
            spec.and(GameThemeSpecification.equalCategory(category));
        }
        Page<GameThemeDto> page = themeRepository.findAll(spec, pageable).map(GameThemeDto::from);
        return GetGameThemesResponse.from(page);
    }

    @Transactional
    public void like(UUID themeId) {
        GameTheme theme = themeRepository.findById(themeId)
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        UUID userId = oAuth2UserService.getLoginUserId();
        themeRecommendationRepository.save(GameThemeRecommendation.builder().themeId(themeId).userId(userId).build());
        theme.liked();
        themeRepository.save(theme);
    }

    @Transactional
    public void cancleLike(UUID themeId) {
        GameTheme theme = themeRepository.findById(themeId)
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        UUID userId = oAuth2UserService.getLoginUserId();
        GameThemeRecommendation recommendation = themeRecommendationRepository.findByUserIdAndThemeId(userId, themeId)
                .orElseThrow(ErrorStatus.FORBIDDEN::asServiceException);
        themeRecommendationRepository.delete(recommendation);
        theme.cancleLike();
        themeRepository.save(theme);
    }

    public boolean getLikeStatus(UUID themeId) {
        themeRepository.findById(themeId)
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        UUID userId = oAuth2UserService.getLoginUserId();
        return themeRecommendationRepository.findByUserIdAndThemeId(userId, themeId).isPresent();
    }
}
