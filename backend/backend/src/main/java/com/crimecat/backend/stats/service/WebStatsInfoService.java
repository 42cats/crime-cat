package com.crimecat.backend.stats.service;

import com.crimecat.backend.utils.RedisDbType;
import com.crimecat.backend.utils.RedisInfoDb;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.stats.proxy.WebStatsInfoServiceProxy;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;
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
            () -> String.valueOf(guildRepository.countUniqueGuildOwnersNative())));

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

