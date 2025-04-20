package com.crimecat.backend.messagemacro.repository;


import com.crimecat.backend.messagemacro.domain.GroupItem;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupItemRepository extends JpaRepository<GroupItem, UUID> {
    List<GroupItem> findAllByGroupIdOrderByIndex(UUID groupId);

    @Query("select gi.id from GroupItem gi where gi.group.id = :groupId")
    List<UUID> findAllIdsByGroupId(UUID groupId);
    Optional<GroupItem> findGroupItemById(UUID id);

    //그룹 아이템에서 타입이 버튼이고 그룹의 id가 같은 버튼들 호출
    @Query("SELECT gi FROM GroupItem gi WHERE gi.group.id = :groupId AND gi.type = 'BUTTON'")
    List<GroupItem> findAllButtonsByGroupId(@Param("groupId") UUID groupId);


    // 그룹아이템의 부모 id(버튼의 id) 로 콘텐츠 호출
    @Query("SELECT gi FROM GroupItem gi WHERE gi.parentId = :buttonId AND gi.type = 'CONTENT'")
    List<GroupItem> findAllContentsByParentId(@Param("buttonId") UUID buttonId);

    void deleteAllInBatch(Iterable<GroupItem> entities);

}
