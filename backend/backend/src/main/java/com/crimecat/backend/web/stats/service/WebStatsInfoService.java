package com.crimecat.backend.web.stats.service;

import com.crimecat.backend.auth.util.RedisDbType;
import com.crimecat.backend.auth.util.RedisInfoDb;
import com.crimecat.backend.bot.guild.repository.GuildRepository;
import com.crimecat.backend.bot.user.domain.DiscordUser;
import com.crimecat.backend.bot.user.domain.User;
import com.crimecat.backend.bot.user.repository.UserRepository;
import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.web.gameHistory.domain.GameHistory;
import com.crimecat.backend.web.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.web.stats.proxy.WebStatsInfoServiceProxy;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
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

  @Transactional(readOnly = true)
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




  public ResponseEntity<Map<String,String>> personalInfoOnDashBord(String id){
    User user = userRepository.findById(UUID.fromString(id))
        .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

    Map<String, String> userPersonalGameInfo = webStatsInfoServiceProxy.getUserPersonalGameInfo(user);
    return ResponseEntity.ok().body(userPersonalGameInfo);
  }







  /// ///////////////////get Method////////////////

  @Transactional(readOnly = true)
  @Cacheable(value = CacheType.PERSONAL_DASHBOARD_INFO, key = "#user")
  public Map<String, String> getUserPersonalGameInfo(User user) {
    Map<String, String> tempMap = new HashMap<>();

    if (user.getDiscordUser() == null) return tempMap;

    String userSnowflake = user.getDiscordSnowflake();
    List<GameHistory> historyList = gameHistoryRepository
        .findGameHistoriesByUserSnowflakeOrderByCreatedAtDesc(userSnowflake);

    // 총 플레이 테마 수
    tempMap.put("themePlayCount", String.valueOf(historyList.size()));

    if (historyList.isEmpty()) return tempMap;

    // 가장 최근 플레이 기록
    GameHistory recent = historyList.get(0);

    tempMap.put("recentlyPlayCrimeSeenTheme", recent.getGuild().getName());
    tempMap.put("recentlyPlayCrimeSeenThemeTime",
        recent.getCreatedAt().toInstant(ZoneOffset.UTC).toString());

    // 가장 많이 플레이한 오너
    Optional<String> mostFrequentOwner = historyList.stream()
        .map(gh -> gh.getGuild().getOwnerSnowflake())
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
        .entrySet().stream()
        .max(Map.Entry.comparingByValue())
        .map(Map.Entry::getKey);

    mostFrequentOwner.flatMap(userRepository::findByDiscordSnowflake)
        .map(User::getDiscordUser)
        .map(DiscordUser::getName)
        .ifPresent(name -> tempMap.put("mostFavoriteCrimeSeenMaker", name));

    return tempMap;
  }

}
