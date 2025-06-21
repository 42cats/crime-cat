package com.crimecat.backend.messagemacro.repository;

import com.crimecat.backend.messagemacro.domain.ButtonAutomationGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ButtonAutomationGroupRepository extends JpaRepository<ButtonAutomationGroup, UUID> {

    @Query("SELECT g FROM ButtonAutomationGroup g WHERE g.guildId = :guildId AND g.isActive = true ORDER BY g.displayOrder ASC")
    List<ButtonAutomationGroup> findActiveGroupsByGuildIdOrderByDisplayOrder(@Param("guildId") String guildId);

    @Query("SELECT g FROM ButtonAutomationGroup g WHERE g.guildId = :guildId ORDER BY g.displayOrder ASC")
    List<ButtonAutomationGroup> findAllByGuildIdOrderByDisplayOrder(@Param("guildId") String guildId);

    @Query("SELECT g FROM ButtonAutomationGroup g WHERE g.guildId = :guildId AND g.name = :name")
    Optional<ButtonAutomationGroup> findByGuildIdAndName(@Param("guildId") String guildId, @Param("name") String name);

    @Query("SELECT COALESCE(MAX(g.displayOrder), 0) FROM ButtonAutomationGroup g WHERE g.guildId = :guildId")
    Integer findMaxDisplayOrderByGuildId(@Param("guildId") String guildId);

    boolean existsByGuildIdAndName(String guildId, String name);

    void deleteAllByGuildId(String guildId);

    @Query("SELECT COUNT(g) FROM ButtonAutomationGroup g WHERE g.guildId = :guildId AND g.isActive = true")
    long countActiveGroupsByGuildId(@Param("guildId") String guildId);
}