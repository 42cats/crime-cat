package com.crimecat.backend.web.gametheme.repository;

import com.crimecat.backend.web.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.web.gametheme.domain.GameTheme;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface GameThemeRepository extends JpaRepository<GameTheme, UUID>, JpaSpecificationExecutor<GameTheme> {

  Optional<CrimesceneTheme> findByGuildSnowflake(String guildSnowflake);

}
