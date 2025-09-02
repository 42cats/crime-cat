package com.crimecat.backend.stats.proxy;

import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class WebStatsInfoServiceProxy {

  private final GameHistoryRepository gameHistoryRepository;
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  //@Cacheable(value = CacheType.PERSONAL_DASHBOARD_INFO, key = "#user.id.toString()")
  public Map<String, String> getUserPersonalGameInfo(User user) {
    Map<String, String> tempMap = new HashMap<>();

    if (user.getDiscordUser() == null) return tempMap;

    String userSnowflake = user.getDiscordSnowflake();
    List<GameHistory> historyList = gameHistoryRepository
        .findGameHistoriesByUserSnowflakeOrderByCreatedAtDesc(userSnowflake);

    // 총 플레이 테마 수
    tempMap.put("themePlayCount", String.valueOf(historyList.size()));

    if (historyList.isEmpty()) return tempMap;

    // Guild 정보가 있는 가장 최근 플레이 기록 찾기
    Optional<GameHistory> recentWithGuild = historyList.stream()
        .filter(gameHistory -> gameHistory.getGuild() != null && gameHistory.getGuild().getName() != null)
        .findFirst();

    // Guild 이름 추출
    String gameName = "길드 없음";
    String recentlyPlay = "알수없음";
    
    if (recentWithGuild.isPresent()) {
        GameHistory recent = recentWithGuild.get();
        gameName = recent.getGuild().getName();
        if (recent.getCreatedAt() != null) {
            recentlyPlay = recent.getCreatedAt().toInstant(ZoneOffset.UTC).toString();
        }
    }

    tempMap.put("recentlyPlayCrimeSeenTheme", gameName);
    tempMap.put("recentlyPlayCrimeSeenThemeTime", recentlyPlay);

    // 가장 많이 플레이한 오너
    Optional<String> mostFrequentOwner = historyList.stream()
        .filter(gameHistory -> gameHistory.getGuild() != null)
        .map(gameHistory -> gameHistory.getGuild().getOwnerSnowflake())
        .filter(Objects::nonNull)
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
        .entrySet().stream()
        .max(Map.Entry.comparingByValue())
        .map(Map.Entry::getKey);

    if (mostFrequentOwner.isPresent()) {
        userRepository.findByDiscordSnowflake(mostFrequentOwner.get())
            .ifPresent(foundUser -> {
                if (foundUser.getDiscordUser() != null) {
                    tempMap.put("mostFavoriteCrimeSeenMaker", foundUser.getDiscordUser().getName());
                }
            });
    }

    return tempMap;
  }

}
