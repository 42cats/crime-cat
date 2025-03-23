package com.crimecat.backend.Character.service;

import com.crimecat.backend.Character.domain.CharacterRole;
import com.crimecat.backend.Character.repository.CharacterRoleRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CharacterRoleQueryService {

	private final CharacterRoleRepository characterRoleRepository;

	public List<CharacterRole> findCharacterRoleByCharacterId(List<UUID> characterIds) {
		return characterRoleRepository.findCharacterRoleByCharacterId(characterIds);
	}
}
