package com.crimecat.backend.guild.repository;

import com.crimecat.backend.guild.domain.PasswordNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PasswordNoteRepository extends JpaRepository<PasswordNote, UUID> {
    boolean existsByGuildSnowflakeAndPasswordKey(String guildSnowflake, String passwordKey);
    Optional<PasswordNote> findByGuildSnowflakeAndPasswordKey(String guildSnowflake, String passwordKey);
    List<PasswordNote> findAllByGuildSnowflake(String guildSnowflake);
    Optional<PasswordNote> findById(UUID id);
}
