package com.crimecat.backend.web.stats.service;

import com.crimecat.backend.bot.guild.repository.GuildRepository;
import com.crimecat.backend.bot.user.repository.UserRepository;
import com.crimecat.backend.web.gameHistory.repository.GameHistoryRepository;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebStatsInfoService {

  private final GuildRepository guildRepository;
  private final UserRepository userRepository;
  private final GameHistoryRepository gameHistoryRepository;

  public ResponseEntity<Map<String,String>> mainStatInfo(){
    long guildCount = guildRepository.countAllActiveGuilds();
    long ownerCount = guildRepository.countUniqueGuildOwners();
    long discordUserCount = userRepository.countUsersWithDiscordAccount();
    long gameHistoryCount = gameHistoryRepository.count();

    Map<String,String> result = new HashMap<>();
    result.put("totalUsers", String.valueOf(discordUserCount));
    result.put("totalServers", String.valueOf(guildCount));
    result.put("totalPlayers", String.valueOf(gameHistoryCount));
    result.put("totalCreators", String.valueOf(ownerCount));
    return ResponseEntity.ok().body(result);
  }
}
