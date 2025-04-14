package com.crimecat.backend.Character.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class CharactersFailedResponseDto implements CharactersResponseDto {

	public String message;
}
