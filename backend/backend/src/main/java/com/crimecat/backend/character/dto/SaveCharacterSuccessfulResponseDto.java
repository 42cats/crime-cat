package com.crimecat.backend.character.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class SaveCharacterSuccessfulResponseDto implements SaveCharacterResponseDto {
	private String message;
	private SaveCharacterDto character;
}
