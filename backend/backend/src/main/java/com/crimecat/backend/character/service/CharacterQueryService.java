package com.crimecat.backend.character.service;

import com.crimecat.backend.character.domain.Character;
import com.crimecat.backend.character.repository.CharacterRepository;
import com.crimecat.backend.guild.domain.Guild;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CharacterQueryService {

	private final CharacterRepository characterRepository;

	@Transactional(readOnly = true)
	public List<Character> getCharactersByGuildSnowflake(String guildSnowflake) {
		return characterRepository.getCharactersByGuildSnowflake(guildSnowflake);
	}

	@Transactional(readOnly = true)
	public Character getCharacterByCharacterName(String guildSnowflake ,String characterName) {
		return characterRepository.getCharacterByCharacterName(guildSnowflake, characterName);
	}

	@Transactional
	public Character saveCharacter(String characterName, Guild guild) {
		return characterRepository.save(new Character(characterName, guild));
	}

	@Transactional
	public void deleteCharacter(Character character) {
		characterRepository.delete(character);
	}
}
