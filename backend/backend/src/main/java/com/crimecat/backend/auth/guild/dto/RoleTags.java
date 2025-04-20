package com.crimecat.backend.auth.guild.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class RoleTags {
    @JsonProperty("bot_id")
    private String botId; // 디스코드 봇 ID
}
