package com.crimecat.backend.Character.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class SaveCharacterFailedResponseDto implements SaveCharacterResponseDto{
	private String message;

}
