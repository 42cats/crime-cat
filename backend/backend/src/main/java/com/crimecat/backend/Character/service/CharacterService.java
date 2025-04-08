package com.crimecat.backend.Character.service;

import com.crimecat.backend.Character.domain.Character;
import com.crimecat.backend.Character.domain.CharacterRole;
import com.crimecat.backend.Character.dto.*;
import com.crimecat.backend.Character.dto.DeleteCharacterSuccessfulResponseDto;
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

		Character character = characterQueryService.getCharacterByCharacterName(guildSnowflake, characterName);

		List<String> allRoleSnowflakes;

		if (character != null) {
			List<CharacterRole> existingCharacterRoles = character.getCharacterRoles();
			Set<String> existingRoleSnowflakes = existingCharacterRoles.stream()
					.map(CharacterRole::getRoleSnowflake)
					.collect(Collectors.toSet());

			List<CharacterRole> newRoles = new ArrayList<>();
			for (String requestedRole : requestedRoles) {
				if (existingRoleSnowflakes.add(requestedRole)) {
					CharacterRole newRole = new CharacterRole(character, requestedRole);
					newRoles.add(newRole);
					existingCharacterRoles.add(newRole);
				}
			}

			if (!newRoles.isEmpty()) {
				characterRoleQueryService.saveAll(newRoles);
			}

			allRoleSnowflakes = new ArrayList<>(existingRoleSnowflakes);
		} else {
			character = characterQueryService.saveCharacter(characterName, guild);
			characterRoleQueryService.saveCharacterRolesByCharacterId(character, requestedRoles);

			allRoleSnowflakes = requestedRoles.stream().distinct().toList();
		}

		return new SaveCharacterSuccessfulResponseDto(
				"Character added successfully",
				new SaveCharacterDto(character.getId(), guildSnowflake, characterName, allRoleSnowflakes, character.getCreatedAt())
		);
	}



	@Transactional
	public DeleteCharacterResponseDto deleteCharacter(String guildSnowflake, String characterName) {
		if (StringUtils.isBlank(guildSnowflake) || StringUtils.isBlank(characterName)) {
			return new DeleteCharacterFailedResponseDto("Invalid request format");
		}

		Guild guild = guildService.findGuildByGuildSnowflake(guildSnowflake);
		if (guild == null) {
			return new DeleteCharacterFailedResponseDto("guild not found");
		}

		Character character = characterQueryService.getCharacterByCharacterName(guildSnowflake, characterName);
		if (character == null) {
			return new DeleteCharacterFailedResponseDto("character not found");
		}

		characterQueryService.deleteCharacter(character);
		return new DeleteCharacterSuccessfulResponseDto(
				"Character deleted successfully", guildSnowflake, characterName);
	}
}
