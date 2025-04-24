package com.crimecat.backend.web.gametheme.repository;

import com.crimecat.backend.web.gametheme.domain.GameTheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface GameThemeRepository extends JpaRepository<GameTheme, UUID>, JpaSpecificationExecutor<GameTheme> {
}
