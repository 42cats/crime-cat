package com.crimecat.backend.Character.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class deleteCharacterSuccessfulResponseDto implements deleteCharacterResponseDto {

	private String message;
	private String guildSnowflake;
	private String characterName;
}
