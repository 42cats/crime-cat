package com.crimecat.backend.gametheme.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
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
import com.crimecat.backend.gametheme.sort.GameThemeSortType;
import com.crimecat.backend.gametheme.specification.GameThemeSpecification;
import com.crimecat.backend.storage.StorageFileType;
import com.crimecat.backend.storage.StorageService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.utils.sort.SortUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class GameThemeService {
    private final StorageService storageService;
    private final GameThemeRepository themeRepository;
    private final MakerTeamService teamService;
    private final GameThemeRecommendationRepository themeRecommendationRepository;
    private final ViewCountService viewCountService;
    private final GameHistoryRepository gameHistoryRepository;

    @Transactional
    public void addGameTheme(MultipartFile file, AddGameThemeRequest request) {
        GameTheme gameTheme = GameTheme.from(request);
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        gameTheme.setAuthorId(webUser.getId());
        
        if (gameTheme instanceof CrimesceneTheme) {
            checkTeam((CrimesceneTheme) gameTheme, webUser);
        }
        
        // 초기 저장하여 ID 생성
        gameTheme = themeRepository.save(gameTheme);
        
        // 파일 처리
        if (file != null && !file.isEmpty()) {
            String path = storageService.storeAt(StorageFileType.GAME_THEME, file, gameTheme.getId().toString());
            gameTheme.setThumbnail(path);
        }
        
        // CrimesceneTheme 경우 GameHistory 연결 처리
        if (gameTheme instanceof CrimesceneTheme) {
            updateGameHistoriesForCrimesceneTheme((CrimesceneTheme) gameTheme);
        }
        
        // 최종 저장 (한 번만 저장)
        themeRepository.save(gameTheme);
    }
    
    /**
     * CrimesceneTheme과 관련된 GameHistory 업데이트
     * @param crimesceneTheme 업데이트할 테마
     */
    private void updateGameHistoriesForCrimesceneTheme(CrimesceneTheme crimesceneTheme) {
        String guildSnowflake = crimesceneTheme.getGuildSnowflake();
        if (guildSnowflake == null || guildSnowflake.isEmpty()) {
            return; // snowflake가 없으면 처리하지 않음
        }
        
        // N+1 문제 방지를 위해 배치 처리
        List<GameHistory> histories = gameHistoryRepository.findAllByGuild_Snowflake(guildSnowflake);
        if (!histories.isEmpty()) {
            for (GameHistory history : histories) {
                history.setGameTheme(crimesceneTheme);
            }
            gameHistoryRepository.saveAll(histories);
        }
    }

    private void checkTeam(CrimesceneTheme gameTheme, WebUser webUser) {
        if (gameTheme.getTeamId() == null) {
            List<MakerTeamMember> teams = teamService.getIndividualTeams(webUser.getId());
            if (teams.isEmpty()) {
                UUID teamId = teamService.create(webUser.getNickname(), webUser, true);
                gameTheme.setTeamId(teamId);
            } else {
                gameTheme.setTeamId(teams.getFirst().getTeam().getId());
            }
        }
    }

    public void deleteGameTheme(UUID themeId) {
        GameTheme gameTheme = themeRepository.findById(themeId).orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        if (gameTheme.isDeleted()) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }
        AuthenticationUtil.validateCurrentUserMatches(gameTheme.getAuthorId());
        gameTheme.setIsDelete(true);
        themeRepository.save(gameTheme);
    }

    @Transactional
    public GetGameThemeResponse getGameTheme(UUID themeId) {
        GameTheme gameTheme = themeRepository.findById(themeId).orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        UUID webUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElse(null);
        if (gameTheme.isDeleted() || (!gameTheme.isPublicStatus() && !gameTheme.isAuthor(webUserId))) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }
        String clientIp = (String) ((ServletRequestAttributes) Objects.requireNonNull(
            RequestContextHolder
                .getRequestAttributes()))
            .getRequest()
            .getAttribute("clientIp");
        viewCountService.increment(gameTheme, clientIp);
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
        AuthenticationUtil.validateCurrentUserMatches(gameTheme.getAuthorId());
        request.update(gameTheme);
        if (file != null && !file.isEmpty()) {
            String path = storageService.storeAt(StorageFileType.GAME_THEME, file, gameTheme.getId().toString());
            gameTheme.setThumbnail(path);
            themeRepository.save(gameTheme);
        }
    }

    @Transactional
    public GetGameThemesResponse getGameThemes(String category, int pageSize, int pageNumber) {
        UUID webUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElse(null);
        Pageable pageable = PageRequest.of(pageNumber, pageSize,
                SortUtil.combineSorts(List.of(GameThemeSortType.RECOMMENDATION_ENABLED, GameThemeSortType.LATEST)));
        // TODO: QueryDSL
        Specification<GameTheme> spec = Specification.where(GameThemeSpecification.defaultSpec(webUserId));
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
        UUID webUserId = AuthenticationUtil.getCurrentWebUserId();
        themeRecommendationRepository.save(GameThemeRecommendation.builder().themeId(themeId).webUserId(webUserId).build());
        theme.liked();
        themeRepository.save(theme);
    }

    @Transactional
    public void cancleLike(UUID themeId) {
        GameTheme theme = themeRepository.findById(themeId)
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        UUID webUserId = AuthenticationUtil.getCurrentWebUserId();
        GameThemeRecommendation recommendation = themeRecommendationRepository.findByWebUserIdAndThemeId(webUserId, themeId)
                .orElseThrow(ErrorStatus.FORBIDDEN::asServiceException);
        themeRecommendationRepository.delete(recommendation);
        theme.cancleLike();
        themeRepository.save(theme);
    }

    public boolean getLikeStatus(UUID themeId) {
        themeRepository.findById(themeId)
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        UUID webUserId = AuthenticationUtil.getCurrentWebUserId();
        return themeRecommendationRepository.findByWebUserIdAndThemeId(webUserId, themeId).isPresent();
    }

}
