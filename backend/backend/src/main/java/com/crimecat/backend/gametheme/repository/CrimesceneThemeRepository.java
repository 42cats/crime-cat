package com.crimecat.backend.gametheme.repository;

import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface CrimesceneThemeRepository extends JpaRepository<CrimesceneTheme, UUID>, JpaSpecificationExecutor<CrimesceneTheme> {

  @Query("SELECT c FROM CrimesceneTheme c WHERE c.guildSnowflake = :guildSnowflake")
  Optional<CrimesceneTheme> findByGuildSnowflake(String guildSnowflake);
}
