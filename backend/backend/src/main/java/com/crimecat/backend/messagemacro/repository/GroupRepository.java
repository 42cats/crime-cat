package com.crimecat.backend.messagemacro.repository;


import com.crimecat.backend.messagemacro.domain.Group;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupRepository extends JpaRepository<Group, UUID> {
    List<Group> findAllByGuildSnowflakeOrderByIndex(String guildSnowflake);

    boolean existsByGuildSnowflakeAndName(String guildSnowflake, @NotBlank String name);
    Optional<Group> findGroupByGuildSnowflakeAndName(String guildSnowflake, String name);
}
