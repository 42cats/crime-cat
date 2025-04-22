package com.crimecat.backend.bot.character.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class CharacterRolesByCharacterId {
	private String characterName;
	private List<String> roleSnowflakes;
}
