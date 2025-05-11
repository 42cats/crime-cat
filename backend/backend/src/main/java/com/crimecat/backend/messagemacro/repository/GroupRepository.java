package com.crimecat.backend.messagemacro.repository;


import com.crimecat.backend.messagemacro.domain.Group;
import io.lettuce.core.dynamic.annotation.Param;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupRepository extends JpaRepository<Group, UUID> {
    List<Group> findAllByGuildSnowflakeOrderByIndex(String guildSnowflake);

    boolean existsByGuildSnowflakeAndName(String guildSnowflake, @NotBlank String name);

    @Query("SELECT g FROM Group g WHERE g.guildSnowflake = :guildSnowflake AND g.name = :targetGroupName")
    Optional<Group> findGroupByGuildSnowflakeAndName(
            @Param("guildSnowflake") String guildSnowflake,
            @Param("targetGroupName") String targetGroupName
    );

    List<Group> findAllByGuildSnowflake(String guildSnowflake);
    
    // JpaRepository에서 제공하는 메서드지만 명시적으로 선언
    void deleteAllInBatch(Iterable<Group> entities);
}
