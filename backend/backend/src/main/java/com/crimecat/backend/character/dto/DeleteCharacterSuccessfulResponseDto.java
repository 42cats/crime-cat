package com.crimecat.backend.character.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class DeleteCharacterSuccessfulResponseDto implements DeleteCharacterResponseDto {

	private String message;
	private String guildSnowflake;
	private String characterName;
}
