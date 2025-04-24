package com.crimecat.backend.bot.user.repository;

import com.crimecat.backend.bot.user.domain.DiscordUser;
import com.crimecat.backend.bot.user.domain.User;
import com.crimecat.backend.web.webUser.domain.WebUser;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {

  @Query("SELECT u.discordUser FROM User u WHERE u.point > :point")
  List<DiscordUser> findDiscordUsersByPointGreaterThan(@Param("point") Integer point);

  Optional<User> findByDiscordUser(DiscordUser discordUser);

  Optional<User> findByWebUser(WebUser webUser);

  Optional<User> findByDiscordSnowflake(String discordSnowflake);

  @Query("SELECT COUNT(u) FROM User u WHERE u.discordUser IS NOT NULL")
  long countUsersWithDiscordAccount();
}
