package com.crimecat.backend.bot.character.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class SaveCharacterSuccessfulResponseDto implements SaveCharacterResponseDto {
	private String message;
	private SaveCharacterDto character;
}
