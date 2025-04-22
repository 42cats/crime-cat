package com.crimecat.backend.web.guild.dto;

import com.fasterxml.jackson.annotation.JsonGetter;
import lombok.Data;

@Data
public class GuildBotInfoDto {
    private String id;
    private String name;
    private String icon; // URL
    private boolean owner;
    private Integer approximate_member_count;
    private Integer approximate_presence_count;
    private long permissions;

    @JsonGetter("icon")
    public String getIcon() {
        if (icon == null || icon.isEmpty()) return null;
        // 움직이는 아이콘일 경우 .gif 사용
        String format = icon.startsWith("a_") ? "gif" : "png";
        return String.format("https://cdn.discordapp.com/icons/%s/%s.%s", id, icon, format);
    }
}
