package com.crimecat.backend.character.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class SaveCharacterSuccessfulResponseDto implements SaveCharacterResponseDto {
	private String message;
	private SaveCharacterDto character;
}
