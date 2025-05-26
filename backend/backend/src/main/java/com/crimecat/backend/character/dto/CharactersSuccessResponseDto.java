package com.crimecat.backend.character.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class CharactersSuccessResponseDto implements CharactersResponseDto {

	private String message;
	private String guildSnowflake;
	private List<CharacterRoleResponseDto> characters;
}
