package com.crimecat.backend.bot.character.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class CharactersSuccessResponseDto implements CharactersResponseDto {

	private String message;
	private String guildSnowflake;
	private List<CharacterRoleResponseDto> characters;
}
