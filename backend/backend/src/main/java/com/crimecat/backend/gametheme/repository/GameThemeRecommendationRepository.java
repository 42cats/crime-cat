package com.crimecat.backend.gametheme.repository;

import com.crimecat.backend.gametheme.domain.GameThemeRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GameThemeRecommendationRepository extends JpaRepository<GameThemeRecommendation, UUID> {
    Optional<GameThemeRecommendation> findByWebUserIdAndThemeId(UUID webUserId, UUID themeId);
}
