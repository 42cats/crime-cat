package com.crimecat.backend.character.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class CharactersFailedResponseDto implements CharactersResponseDto {

	public String message;
}
