package com.crimecat.backend.gametheme.repository;

import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.GameTheme;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface GameThemeRepository extends JpaRepository<GameTheme, UUID>, JpaSpecificationExecutor<GameTheme> {

  Optional<CrimesceneTheme> findByGuildSnowflake(String guildSnowflake);

  Page<GameTheme> findAll(Specification<GameTheme> spec, Pageable page);
}
