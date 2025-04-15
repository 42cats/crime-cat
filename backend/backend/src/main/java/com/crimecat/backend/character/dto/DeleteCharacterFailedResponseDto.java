package com.crimecat.backend.character.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class DeleteCharacterFailedResponseDto implements DeleteCharacterResponseDto {

	private String message;
}
