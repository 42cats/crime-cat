package com.crimecat.backend.character.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class CharacterRolesByCharacterId {
	private String characterName;
	private List<String> roleSnowflakes;
}
