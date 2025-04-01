package com.crimecat.backend.Character.repository;

import com.crimecat.backend.Character.domain.Character;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CharacterRepository extends JpaRepository<Character, UUID> {

	@Query("SELECT ch FROM Character ch LEFT JOIN FETCH ch.characterRoles where ch.guild.snowflake = :guildSnowflake")
	List<Character> getCharactersByGuildSnowflake(@Param("guildSnowflake") String guildSnowflake);

	@Query("SELECT ch FROM Character ch where ch.name = :characterName")
	Character getCharacterByCharacterName(@Param("characterName")String characterName);
}
