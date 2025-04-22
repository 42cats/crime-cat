package com.crimecat.backend.web.webUser.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.crimecat.backend.web.webUser.domain.WebUser;

public interface WebUserRepository extends JpaRepository<WebUser, UUID> {
    @Override
    Optional<WebUser> findById(UUID uuid);

    Optional<WebUser> findWebUserByDiscordUserSnowflake(String discordUserId);

    Optional<WebUser> findWebUserByEmail(String email);

}
