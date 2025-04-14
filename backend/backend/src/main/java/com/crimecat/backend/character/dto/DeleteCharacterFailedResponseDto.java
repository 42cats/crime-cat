package com.crimecat.backend.Character.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class DeleteCharacterFailedResponseDto implements DeleteCharacterResponseDto {

	private String message;
}
