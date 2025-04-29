package com.crimecat.backend.web.gametheme.repository;

import com.crimecat.backend.web.gametheme.domain.GameThemeRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GameThemeRecommendationRepository extends JpaRepository<GameThemeRecommendation, UUID> {
    Optional<GameThemeRecommendation> findByUserIdAndThemeId(UUID userId, UUID themeId);
}
