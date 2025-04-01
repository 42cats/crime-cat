package com.crimecat.backend.Character.service;

import com.crimecat.backend.Character.domain.Character;
import com.crimecat.backend.Character.domain.CharacterRole;
import com.crimecat.backend.Character.dto.CharacterRoleResponseDto;
import com.crimecat.backend.Character.dto.CharactersFailedResponseDto;
import com.crimecat.backend.Character.dto.CharactersResponseDto;
import com.crimecat.backend.Character.dto.CharactersSuccessResponseDto;
import com.crimecat.backend.Character.dto.SaveCharacterDto;
import com.crimecat.backend.Character.dto.SaveCharacterFailedResponseDto;
import com.crimecat.backend.Character.dto.SaveCharacterResponseDto;
import com.crimecat.backend.Character.dto.SaveCharacterSuccessfulResponseDto;
import com.crimecat.backend.Character.dto.deleteCharacterFailedResponseDto;
import com.crimecat.backend.Character.dto.deleteCharacterResponseDto;
import com.crimecat.backend.Character.dto.deleteCharacterSuccessfulResponseDto;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.service.GuildService;
import io.micrometer.common.util.StringUtils;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CharacterService {

	private final GuildService guildService;
	private final CharacterRoleQueryService characterRoleQueryService;
	private final CharacterQueryService characterQueryService;

	@Transactional(readOnly = true)
	public CharactersResponseDto getCharactersByGuildSnowflake(String guildSnowflake) {
		if (StringUtils.isBlank(guildSnowflake)) {
			return new CharactersFailedResponseDto("Invalid request format");
		}

		Guild guild = guildService.findGuildByGuildSnowflake(guildSnowflake);
		if (guild == null) {
			return new CharactersFailedResponseDto("guild not found");
		}

		List<Character> characters =
				characterQueryService.getCharactersByGuildSnowflake(guildSnowflake);
		if (characters.isEmpty()) {
			return new CharactersSuccessResponseDto("guild has no character", guildSnowflake,
					Collections.emptyList());
		}

		List<CharacterRoleResponseDto> characterRoleByCharacterName = characters.stream()
				.map(character -> new CharacterRoleResponseDto(character.getName(),
						character.getCharacterRoles().stream()
								.map(CharacterRole::getRoleSnowflake)
								.toList()
				))
				.toList();

		return new CharactersSuccessResponseDto("character list founded", guildSnowflake,
				characterRoleByCharacterName);
	}

	@Transactional
	public SaveCharacterResponseDto saveCharacter(String guildSnowflake, String characterName, List<String> requestedRoles) {
		if (StringUtils.isBlank(guildSnowflake) || StringUtils.isBlank(characterName)) {
			return new SaveCharacterFailedResponseDto("Invalid request format");
		}

		Guild guild = guildService.findGuildByGuildSnowflake(guildSnowflake);
		if (guild == null) {
			return new SaveCharacterFailedResponseDto("guild not found");
		}

		Character character = characterQueryService.getCharacterByCharacterName(characterName);
		if (character != null) {
			List<CharacterRole> existingCharacterRoles = character.getCharacterRoles();
			Set<String> existingRoleSnowflakes = existingCharacterRoles.stream()
					.map(CharacterRole::getRoleSnowflake)
					.collect(Collectors.toSet());

			List<CharacterRole> newRoles = new ArrayList<>();
			for (String requestedRole : requestedRoles) {
				if (!existingRoleSnowflakes.contains(requestedRole)) {
					newRoles.add(new CharacterRole(character, requestedRole));
				}
			}

			if (!newRoles.isEmpty()) {
				characterRoleQueryService.saveAll(newRoles);
			}
		}
		else {
			character = characterQueryService.saveCharacter(characterName, guild);
			characterRoleQueryService.saveCharacterRolesByCharacterId(character, requestedRoles);
		}

		return new SaveCharacterSuccessfulResponseDto(
				"Character added successfully",
				new SaveCharacterDto(character.getId(), guildSnowflake, characterName, requestedRoles, character.getCreatedAt()));
	}

	@Transactional
	public deleteCharacterResponseDto deleteCharacter(String guildSnowflake, String characterName) {
		if (StringUtils.isBlank(guildSnowflake) || StringUtils.isBlank(characterName)) {
			return new deleteCharacterFailedResponseDto("Invalid request format");
		}

		Guild guild = guildService.findGuildByGuildSnowflake(guildSnowflake);
		if (guild == null) {
			return new deleteCharacterFailedResponseDto("guild not found");
		}

		Character character = characterQueryService.getCharacterByCharacterName(characterName);
		if (character == null) {
			return new deleteCharacterFailedResponseDto("character not found");
		}

		characterQueryService.deleteCharacter(character);
		return new deleteCharacterSuccessfulResponseDto(
				"Character deleted successfully", guildSnowflake, characterName);
	}
}
