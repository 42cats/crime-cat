package com.crimecat.backend.web.stats.service;

import com.crimecat.backend.auth.util.RedisDbType;
import com.crimecat.backend.auth.util.RedisInfoDb;
import com.crimecat.backend.bot.guild.repository.GuildRepository;
import com.crimecat.backend.bot.user.domain.User;
import com.crimecat.backend.bot.user.repository.UserRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.web.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.web.stats.proxy.WebStatsInfoServiceProxy;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

import com.crimecat.backend.web.webUser.domain.WebUser;
import com.crimecat.backend.web.webUser.repository.WebUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WebStatsInfoService {

  private final GuildRepository guildRepository;
  private final UserRepository userRepository;
  private final GameHistoryRepository gameHistoryRepository;
  private final WebStatsInfoServiceProxy webStatsInfoServiceProxy;
  private final RedisInfoDb redisInfoDb;
  private final WebUserRepository webUserRepository;

  @Transactional(readOnly = true)
  public ResponseEntity<Map<String, String>> mainStatInfo() {
    Map<String, String> result = new HashMap<>();

    result.put(
        "totalServers",
        getOrCache(
            RedisDbType.MAKER_COUNT, () -> String.valueOf(guildRepository.countAllActiveGuilds())));

    result.put(
        "totalUsers",
        getOrCache(
            RedisDbType.ALL_USER_COUNT,
            () -> String.valueOf(userRepository.countUsersWithDiscordAccount())));

    result.put(
        "totalPlayers",
        getOrCache(
            RedisDbType.PLAYED_USER_COUNT, () -> String.valueOf(gameHistoryRepository.count())));

    result.put(
        "totalCreators",
        getOrCache(
            RedisDbType.MAKER_COUNT,
            () -> String.valueOf(guildRepository.countUniqueGuildOwners())));

    return ResponseEntity.ok().body(result);
  }

  public String getOrCache(RedisDbType type, Supplier<String> valueSupplier) {
    return redisInfoDb
        .load(type)
        .orElseGet(
            () -> {
              String value = valueSupplier.get();
              redisInfoDb.save(type, value);
              return value;
            });
  }

  public ResponseEntity<Map<String, String>> personalInfoOnDashBord(String id) {
    WebUser webUser = webUserRepository.findById(UUID.fromString(id)).orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

    Map<String, String> userPersonalGameInfo =
        webStatsInfoServiceProxy.getUserPersonalGameInfo(webUser.getUser());
    return ResponseEntity.ok().body(userPersonalGameInfo);
  }
  }

