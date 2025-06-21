package com.crimecat.backend.messagemacro.repository;

import com.crimecat.backend.messagemacro.domain.ButtonAutomation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ButtonAutomationRepository extends JpaRepository<ButtonAutomation, String> {

    @Query("SELECT b FROM ButtonAutomation b WHERE b.guildId = :guildId AND b.isActive = true ORDER BY b.displayOrder ASC")
    List<ButtonAutomation> findActiveButtonsByGuildIdOrderByDisplayOrder(@Param("guildId") String guildId);

    @Query("SELECT b FROM ButtonAutomation b WHERE b.groupId = :groupId AND b.isActive = true ORDER BY b.displayOrder ASC")
    List<ButtonAutomation> findActiveButtonsByGroupIdOrderByDisplayOrder(@Param("groupId") String groupId);

    @Query("SELECT b FROM ButtonAutomation b WHERE b.groupId = :groupId ORDER BY b.displayOrder ASC")
    List<ButtonAutomation> findAllByGroupIdOrderByDisplayOrder(@Param("groupId") String groupId);

    @Query("SELECT b FROM ButtonAutomation b WHERE b.guildId = :guildId AND b.buttonLabel = :buttonLabel")
    Optional<ButtonAutomation> findByGuildIdAndButtonLabel(@Param("guildId") String guildId, @Param("buttonLabel") String buttonLabel);

    @Query("SELECT b FROM ButtonAutomation b WHERE b.guildId = :guildId ORDER BY b.displayOrder ASC")
    List<ButtonAutomation> findAllByGuildIdOrderByDisplayOrder(@Param("guildId") String guildId);

    @Query("SELECT COALESCE(MAX(b.displayOrder), 0) FROM ButtonAutomation b WHERE b.groupId = :groupId")
    Integer findMaxDisplayOrderByGroupId(@Param("groupId") String groupId);

    boolean existsByGuildIdAndButtonLabel(String guildId, String buttonLabel);

    void deleteAllByGroupId(String groupId);

    void deleteAllByGuildId(String guildId);

    @Query("SELECT COUNT(b) FROM ButtonAutomation b WHERE b.guildId = :guildId AND b.isActive = true")
    long countActiveButtonsByGuildId(@Param("guildId") String guildId);

    @Query("SELECT COUNT(b) FROM ButtonAutomation b WHERE b.groupId = :groupId AND b.isActive = true")
    long countActiveButtonsByGroupId(@Param("groupId") String groupId);
}