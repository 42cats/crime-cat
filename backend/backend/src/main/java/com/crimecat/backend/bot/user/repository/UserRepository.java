package com.crimecat.backend.bot.user.repository;

import com.crimecat.backend.bot.user.domain.DiscordUser;
import com.crimecat.backend.bot.user.domain.User;
import com.crimecat.backend.web.webUser.domain.WebUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByDiscordUser(DiscordUser discordUser);

    Optional<User> findByWebUser(WebUser webUser);
}
