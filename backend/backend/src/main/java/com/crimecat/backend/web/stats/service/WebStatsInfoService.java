package com.crimecat.backend.web.stats.service;

import com.crimecat.backend.auth.util.RedisDbType;
import com.crimecat.backend.auth.util.RedisInfoDb;
import com.crimecat.backend.bot.guild.repository.GuildRepository;
import com.crimecat.backend.bot.user.repository.UserRepository;
import com.crimecat.backend.web.gameHistory.repository.GameHistoryRepository;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebStatsInfoService {

  private final GuildRepository guildRepository;
  private final UserRepository userRepository;
  private final GameHistoryRepository gameHistoryRepository;
  private final RedisInfoDb redisInfoDb;

  public ResponseEntity<Map<String,String>> mainStatInfo(){
    Map<String,String> result = new HashMap<>();

    result.put("totalServers", getOrCache(
        RedisDbType.MAKER_COUNT,
        () -> String.valueOf(guildRepository.countAllActiveGuilds())
    ));

    result.put("totalUsers", getOrCache(
        RedisDbType.ALL_USER_COUNT,
        ()-> String.valueOf(userRepository.countUsersWithDiscordAccount())
    ));

    result.put("totalPlayers", getOrCache(
        RedisDbType.PLAYED_USER_COUNT,
        ()->String.valueOf(gameHistoryRepository.count())
    ));

    result.put("totalCreators", getOrCache(
        RedisDbType.MAKER_COUNT,
        ()->String.valueOf(guildRepository.countUniqueGuildOwners())
    ));

    return ResponseEntity.ok().body(result);
  }

  public String getOrCache(RedisDbType type, Supplier<String> valueSupplier) {
    return redisInfoDb.load(type)
        .orElseGet(() -> {
          String value = valueSupplier.get();
          redisInfoDb.save(type, value);
          return value;
        });
  }

}
