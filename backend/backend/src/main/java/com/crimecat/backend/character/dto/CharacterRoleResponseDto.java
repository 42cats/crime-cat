package com.crimecat.backend.character.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class CharacterRoleResponseDto {
	private String name;
	private List<String> roles;
}
