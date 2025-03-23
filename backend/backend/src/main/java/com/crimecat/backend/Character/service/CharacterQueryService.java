package com.crimecat.backend.Character.service;

import com.crimecat.backend.Character.domain.Character;
import com.crimecat.backend.Character.repository.CharacterRepository;
import com.crimecat.backend.guild.domain.Guild;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CharacterQueryService {

	private final CharacterRepository characterRepository;

	public List<Character> getCharactersByGuildSnowflake(String guildSnowflake) {
		return characterRepository.getCharactersByGuildSnowflake(guildSnowflake);
	}

	public Character getCharacterByCharacterName(String characterName) {
		return characterRepository.getCharacterByCharacterName(characterName);
	}

	public Character saveCharacter(String characterName, Guild guild) {
		return characterRepository.save(new Character(characterName, guild));
	}
}
