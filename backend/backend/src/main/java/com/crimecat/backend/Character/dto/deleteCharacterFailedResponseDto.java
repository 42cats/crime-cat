package com.crimecat.backend.Character.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class deleteCharacterFailedResponseDto implements deleteCharacterResponseDto {

	private String message;
}
