package com.crimecat.backend.stats.service;

import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.gametheme.repository.CrimesceneThemeRepository;
import com.crimecat.backend.gametheme.repository.EscapeRoomThemeRepository;
import com.crimecat.backend.stats.proxy.WebStatsInfoServiceProxy;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
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
  private final WebUserRepository webUserRepository;
  private final CrimesceneThemeRepository crimesceneThemeRepository;
  private final EscapeRoomThemeRepository escapeRoomThemeRepository;

  @Transactional(readOnly = true)
  public ResponseEntity<Map<String, String>> mainStatInfo() {
    Map<String, String> result = new HashMap<>();

    result.put("totalServers", getTotalServers());
    result.put("totalUsers", getTotalUsers());
    result.put("totalPlayers", getTotalPlayers());
    result.put("totalCreators", getTotalCreators());
    result.put("crimeThemes", getCrimeThemes());
    result.put("escapeThemes", getEscapeThemes());

    return ResponseEntity.ok().body(result);
  }

  @Cacheable(cacheNames = "totalServers")
  public String getTotalServers() {
    return String.valueOf(guildRepository.countAllActiveGuilds());
  }

  @Cacheable(cacheNames = "totalUsers")
  public String getTotalUsers() {
    return String.valueOf(userRepository.countUsersWithDiscordAccount());
  }

  @Cacheable(cacheNames = "totalPlayers")
  public String getTotalPlayers() {
    return String.valueOf(gameHistoryRepository.count());
  }

  @Cacheable(cacheNames = "totalCreators")
  public String getTotalCreators() {
    return String.valueOf(guildRepository.countUniqueGuildOwners());
  }

  @Cacheable(cacheNames = "crimeThemes")
  public String getCrimeThemes() {
    return String.valueOf(crimesceneThemeRepository.countActiveThemes());
  }

  @Cacheable(cacheNames = "escapeThemes")
  public String getEscapeThemes() {
    return String.valueOf(escapeRoomThemeRepository.countActiveThemes());
  }


  public ResponseEntity<Map<String, String>> personalInfoOnDashBord(String id) {
    WebUser webUser = webUserRepository.findById(UUID.fromString(id)).orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

    Map<String, String> userPersonalGameInfo =
        webStatsInfoServiceProxy.getUserPersonalGameInfo(webUser.getUser());
    return ResponseEntity.ok().body(userPersonalGameInfo);
  }
  }

