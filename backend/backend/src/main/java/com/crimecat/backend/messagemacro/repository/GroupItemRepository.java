package com.crimecat.backend.messagemacro.repository;


import com.crimecat.backend.messagemacro.domain.GroupItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface GroupItemRepository extends JpaRepository<GroupItem, UUID> {
    List<GroupItem> findAllByGroupIdOrderByIndex(UUID groupId);

    @Query("select gi.id from GroupItem gi where gi.group.id = :groupId")
    List<UUID> findAllIdsByGroupId(UUID groupId);

    void deleteAllInBatch(Iterable<GroupItem> entities);

}
