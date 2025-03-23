package com.crimecat.backend.Character.controller;

import com.crimecat.backend.Character.dto.CharactersResponseDto;
import com.crimecat.backend.Character.service.CharacterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("v1/bot/guilds")
@RequiredArgsConstructor
public class CharacterController {

	private final CharacterService characterService;

	@GetMapping("/{guild_snowflake}/characters")
	public CharactersResponseDto getCharactersByGuildSnowflake(@PathVariable("guild_snowflake") String guildSnowflake) {
		return characterService.getCharactersByGuildSnowflake(guildSnowflake);
	}
}
