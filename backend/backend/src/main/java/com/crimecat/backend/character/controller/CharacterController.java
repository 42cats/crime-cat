package com.crimecat.backend.Character.controller;

import com.crimecat.backend.Character.dto.CharactersResponseDto;
import com.crimecat.backend.Character.dto.SaveCharacterRequestDto;
import com.crimecat.backend.Character.dto.SaveCharacterResponseDto;
import com.crimecat.backend.Character.dto.DeleteCharacterResponseDto;
import com.crimecat.backend.Character.service.CharacterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("v1/bot/guilds")
@RequiredArgsConstructor
public class CharacterController {

	private final CharacterService characterService;

	/**
	 * 캐릭터와 역할 정보 반환
	 * @param guildSnowflake
	 * @return
	 */
	@GetMapping("/{guild_snowflake}/characters")
	public CharactersResponseDto getCharactersByGuildSnowflake(@PathVariable("guild_snowflake") String guildSnowflake) {
		return characterService.getCharactersByGuildSnowflake(guildSnowflake);
	}

	/**
	 * 캐릭터와 역할 정보 저장
	 * @param saveCharacterRequestDto
	 * @return
	 */
	@PostMapping("/characters")
	public SaveCharacterResponseDto saveCharacter(
			@RequestBody SaveCharacterRequestDto saveCharacterRequestDto) {
		return characterService.saveCharacter(
				saveCharacterRequestDto.getGuildSnowflake(),
				saveCharacterRequestDto.getCharacterName(),
				saveCharacterRequestDto.getRoles());

	}

	/**
	 * 캐릭터 및 해당 캐릭터 롤 삭제
	 * @param guildSnowflake
	 * @param characterName
	 * @return
	 */
	@DeleteMapping("{guild_snowflake}/characters/{character_name}")
	public DeleteCharacterResponseDto deleteCharacter(
			@PathVariable("guild_snowflake") String guildSnowflake,
			@PathVariable("character_name") String characterName) {
		return characterService.deleteCharacter(guildSnowflake, characterName);
	}
}
