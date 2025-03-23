package com.crimecat.backend.Character.service;

import com.crimecat.backend.Character.domain.Character;
import com.crimecat.backend.Character.domain.CharacterRole;
import com.crimecat.backend.Character.repository.CharacterRoleRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CharacterRoleQueryService {

	private final CharacterRoleRepository characterRoleRepository;

	public List<CharacterRole> findCharacterRoleByCharacterIds(List<UUID> characterIds) {
		return characterRoleRepository.findCharacterRoleByCharacterIds(characterIds);
	}

	public List<CharacterRole> findCharacterRoleByCharacterId(UUID characterId) {
		return characterRoleRepository.findCharacterRoleByCharacterId(characterId);
	}

	public void saveAll(List<CharacterRole> characterRoles) {
		characterRoleRepository.saveAll(characterRoles);
	}

	public List<CharacterRole> saveCharacterRolesByCharacterId(Character character, List<String> roles) {
		List<CharacterRole> characterRoles = new ArrayList<>();
		for (String role : roles) {
			characterRoles.add(new CharacterRole(character, role));
		}
		return characterRoleRepository.saveAll(characterRoles);
	}
}
