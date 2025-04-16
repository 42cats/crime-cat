package com.crimecat.backend.webUser.repository;

import com.crimecat.backend.webUser.domain.WebUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WebUserRepository extends JpaRepository<WebUser, UUID> {
    @Override
    Optional<WebUser> findById(UUID uuid);

    Optional<WebUser> findWebUserByDiscordUserId(String discordUserId);
<<<<<<< Updated upstream

    Optional<WebUser> findWebUserByEmail(String email);
=======
>>>>>>> Stashed changes
}
