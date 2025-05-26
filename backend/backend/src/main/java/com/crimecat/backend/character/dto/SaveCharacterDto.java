package com.crimecat.backend.character.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class SaveCharacterDto {
	private UUID characterId;
	private String guildSnowflake;
	private String characterName;
	private List<String> roles;
	private LocalDateTime createdAt;
}
