package com.crimecat.backend.bot.character.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class DeleteCharacterSuccessfulResponseDto implements DeleteCharacterResponseDto {

	private String message;
	private String guildSnowflake;
	private String characterName;
}
