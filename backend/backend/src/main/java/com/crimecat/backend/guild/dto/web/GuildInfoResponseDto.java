package com.crimecat.backend.guild.dto.web;

import com.crimecat.backend.guild.domain.Guild;
import com.fasterxml.jackson.annotation.JsonGetter;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public class GuildInfoResponseDto {
  private String guildId;
  private String guildName;
  private String guildOwnerName;
  private String guildIcon;
  private Integer guildOnlineMemberCount;
  private Integer guildMemberCount;
  private Integer totalHistoryUserCount;
  private LocalDateTime guildCreatedAt;
  private LocalDateTime lastPlayTime;

  /**
   * 길드 아이콘의 URL을 생성합니다.
   * 
   * @return 아이콘 URL 또는 아이콘이 없는 경우 null
   */
  @JsonGetter("guildIcon")
  public String getIcon() {
    if (guildIcon == null || guildIcon.isEmpty()) return null;
    if (guildId == null || guildId.isEmpty()) return null;
    
    try {
      // 움직이는 아이콘일 경우 .gif 사용
      String format = guildIcon.startsWith("a_") ? "gif" : "png";
      return String.format("https://cdn.discordapp.com/icons/%s/%s.%s", guildId, guildIcon, format);
    } catch (Exception e) {
      // 형식 지정 오류 등이 발생하면 null 반환
      return null;
    }
  }

  /**
   * Guild 엔티티와 API 응답 데이터로부터 GuildInfoResponseDto를 생성합니다.
   * 
   * @param guild 길드 엔티티
   * @param apiGetGuildInfoDto Discord API로부터 얻은 길드 정보
   * @param totalCount 게임 히스토리 총 개수
   * @param lastPlayTime 마지막 플레이 시간
   * @return 생성된 GuildInfoResponseDto 객체
   * @throws NullPointerException guild나 apiGetGuildInfoDto가 null인 경우
   */
  public static GuildInfoResponseDto from(Guild guild, ApiGetGuildInfoDto apiGetGuildInfoDto, Long totalCount, LocalDateTime lastPlayTime){
    if (guild == null) {
      throw new NullPointerException("Guild entity cannot be null");
    }
    
    if (apiGetGuildInfoDto == null) {
      throw new NullPointerException("ApiGetGuildInfoDto cannot be null");
    }
    
    return GuildInfoResponseDto.builder()
        .guildName(apiGetGuildInfoDto.getName())
        .guildIcon(apiGetGuildInfoDto.getIcon())
        .guildId(guild.getId().toString())
        .guildCreatedAt(guild.getCreatedAt())
        .guildOwnerName(guild.getUser() != null ? guild.getUser().getName() : "Unknown")
        .guildMemberCount(apiGetGuildInfoDto.getApproximateMemberCount())
        .guildOnlineMemberCount(apiGetGuildInfoDto.getApproximatePresenceCount())
        .totalHistoryUserCount(totalCount != null ? totalCount.intValue() : 0)
        .lastPlayTime(lastPlayTime)
        .build();
  }
}
