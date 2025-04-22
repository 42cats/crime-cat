package com.crimecat.backend.bot.character.repository;

import com.crimecat.backend.bot.character.domain.CharacterRole;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CharacterRoleRepository extends JpaRepository<CharacterRole, UUID> {

	@Query("SELECT cr FROM CharacterRole cr WHERE cr.character.id IN :characterIds")
	List<CharacterRole> findCharacterRoleByCharacterIds(@Param("characterIds") List<UUID> characterIds);

	@Query("SELECT cr FROM CharacterRole cr WHERE cr.character.id = :characterId")
	List<CharacterRole> findCharacterRoleByCharacterId(@Param("characterId") UUID characterId);

}
