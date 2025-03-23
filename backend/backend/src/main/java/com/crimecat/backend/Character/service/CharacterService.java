package com.crimecat.backend.Character.service;

import com.crimecat.backend.Character.domain.Character;
import com.crimecat.backend.Character.domain.CharacterRole;
import com.crimecat.backend.Character.dto.CharacterRoleResponseDto;
import com.crimecat.backend.Character.dto.CharactersFailedResponseDto;
import com.crimecat.backend.Character.dto.CharactersResponseDto;
import com.crimecat.backend.Character.dto.CharactersSuccessResponseDto;
import com.crimecat.backend.Character.repository.CharacterRepository;
import com.crimecat.backend.Character.repository.CharacterRoleRepository;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.service.GuildService;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CharacterService {

	private final CharacterRepository characterRepository;
	private final GuildService guildService;
	private final CharacterRoleRepository characterRoleRepository;

	@Transactional(readOnly = true)
	public CharactersResponseDto getCharactersByGuildSnowflake(String guildSnowflake) {
		Guild guild = guildService.findGuildByGuildSnowflake(guildSnowflake);
		if (guild == null) {
			return new CharactersFailedResponseDto("guild not found");
		}

		List<Character> characters = characterRepository.getCharactersByGuildSnowflake(guildSnowflake);
		if (characters.isEmpty()) {
			return new CharactersSuccessResponseDto("character list founded", guildSnowflake, null);
		}

		List<UUID> characterIds = characters.stream()
				.map(Character::getId)
				.toList();
		List<CharacterRole> characterRoles
				= characterRoleRepository.findCharacterRoleByCharacterId(characterIds);
		if (characterRoles.isEmpty()) {
			List<CharacterRoleResponseDto> characterRoleByCharacterName = characters.stream()
					.map(character -> new CharacterRoleResponseDto(character.getName(), null))
					.toList();
			return new CharactersSuccessResponseDto("character list founded", guildSnowflake,
					characterRoleByCharacterName);
		}
		
		List<CharacterRoleResponseDto> characterRoleByCharacterName = characterRoles.stream()
				.collect(Collectors.groupingBy(
						CharacterRole::getCharacter, // 캐릭터 이름 기준으로 그룹화
						Collectors.mapping(CharacterRole::getRoleSnowflake, Collectors.toList()) // Role 이름 리스트 생성
				))
				.entrySet().stream()
				.map(entry -> new CharacterRoleResponseDto(entry.getKey().getName(), entry.getValue())) // DTO로 변환
				.collect(Collectors.toList());

		return new CharactersSuccessResponseDto("character list founded", guildSnowflake,
				characterRoleByCharacterName);
	}
}
