// MessageMacroServiceTest.java
package com.crimecat.backend.messagemecro;

import com.crimecat.backend.exception.DomainException;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.web.messagemacro.domain.Group;
import com.crimecat.backend.web.messagemacro.domain.GroupItem;
import com.crimecat.backend.web.messagemacro.dto.GroupDto;
import com.crimecat.backend.web.messagemacro.dto.ButtonDto;
import com.crimecat.backend.web.messagemacro.dto.ContentDto;
import com.crimecat.backend.web.messagemacro.repository.GroupItemRepository;
import com.crimecat.backend.web.messagemacro.repository.GroupRepository;
import com.crimecat.backend.web.messagemacro.service.MessageMacroService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageMacroServiceTest {

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupItemRepository groupItemRepository;

    @InjectMocks
    private MessageMacroService service;

    private static final String GUILD_ID = "guild123";
    private UUID groupId;
    private UUID buttonId;
    private UUID contentId;

    @BeforeEach
    void setUp() {
        groupId = UUID.randomUUID();
        buttonId = UUID.randomUUID();
        contentId = UUID.randomUUID();
    }

    @Test
    @DisplayName("findByGuild가 DTO 매핑을 올바르게 반환한다")
    void testGetGroups() {
        Group group = new Group();
        group.setId(groupId);
        group.setName("GroupName");
        group.setIndex(1);

        GroupItem button = GroupItem.builder()
                .id(buttonId)
                .group(group)
                .type(GroupItem.Type.BUTTON)
                .name("Btn1")
                .index(0)
                .build();
        GroupItem content = GroupItem.builder()
                .id(contentId)
                .group(group)
                .type(GroupItem.Type.CONTENT)
                .parentId(buttonId)
                .text("Hello")
                .channelId("channel1")
                .index(0)
                .build();

        when(groupRepository.findAllByGuildSnowflakeOrderByIndex(GUILD_ID))
                .thenReturn(List.of(group));
        when(groupItemRepository.findAllByGroupIdOrderByIndex(groupId))
                .thenReturn(List.of(button, content));

        List<GroupDto> dtos = service.getGroups(GUILD_ID);

        assertEquals(1, dtos.size());
        GroupDto dto = dtos.get(0);
        assertEquals(groupId, dto.getId());
        assertEquals("GroupName", dto.getName());
        assertEquals(1, dto.getIndex());
        assertFalse(dto.getButtons().isEmpty());

        ButtonDto btnDto = dto.getButtons().get(0);
        assertEquals(buttonId, btnDto.getId());
        assertEquals("Btn1", btnDto.getName());
        assertEquals(0, btnDto.getIndex());

        ContentDto ctDto = btnDto.getContents().get(0);
        assertEquals(contentId, ctDto.getId());
        assertEquals("Hello", ctDto.getText());
        assertEquals("channel1", ctDto.getChannelId());
    }

    @Test
    @DisplayName("findByGuild는 그룹이 없으면 빈 리스트를 반환한다")
    void testGetGroupsEmpty() {
        when(groupRepository.findAllByGuildSnowflakeOrderByIndex(GUILD_ID))
                .thenReturn(Collections.emptyList());

        List<GroupDto> dtos = service.getGroups(GUILD_ID);
        assertTrue(dtos.isEmpty());
        verify(groupItemRepository, never()).findAllByGroupIdOrderByIndex(any());
    }

    @Test
    @DisplayName("syncMacroData는 아이템을 정상적으로 삽입 및 삭제한다")
    void testSyncMacroDataInsertsAndDeletesItems() {
        GroupDto dto = GroupDto.builder()
                .id(groupId)
                .name("NewGroup")
                .index(2)
                .buttons(List.of(
                        ButtonDto.builder()
                                .id(buttonId)
                                .name("BtnX")
                                .index(0)
                                .contents(List.of(
                                        ContentDto.builder()
                                                .id(contentId)
                                                .text("Txt")
                                                .channelId("ch")
                                                .index(0)
                                                .build()
                                ))
                                .build()
                ))
                .build();

        when(groupRepository.existsById(groupId)).thenReturn(false);
        when(groupRepository.existsByGuildSnowflakeAndName(GUILD_ID, "NewGroup")).thenReturn(false);
        when(groupRepository.findById(groupId)).thenReturn(Optional.empty());
        when(groupItemRepository.findAllIdsByGroupId(groupId))
                .thenReturn(List.of(UUID.randomUUID()));

        service.syncMacroData(GUILD_ID, List.of(dto));

        verify(groupRepository, times(1)).saveAll(anyList());
        verify(groupItemRepository, times(1)).saveAll(anyList());
        verify(groupItemRepository, times(1)).deleteAllInBatch(anyList());
    }

    @Test
    @DisplayName("syncMacroData는 기존 아이템이 없으면 삭제하지 않는다")
    void testSyncMacroDataNoDeleteWhenNoOldItems() {
        GroupDto dto = GroupDto.builder()
                .id(groupId)
                .name("NewGroup")
                .index(2)
                .buttons(List.of(
                        ButtonDto.builder()
                                .id(buttonId)
                                .name("BtnX")
                                .index(0)
                                .contents(List.of(
                                        ContentDto.builder()
                                                .id(contentId)
                                                .text("Txt")
                                                .channelId("ch")
                                                .index(0)
                                                .build()
                                ))
                                .build()
                ))
                .build();

        when(groupRepository.existsById(groupId)).thenReturn(false);
        when(groupRepository.existsByGuildSnowflakeAndName(GUILD_ID, "NewGroup")).thenReturn(false);
        when(groupRepository.findById(groupId)).thenReturn(Optional.empty());
        when(groupItemRepository.findAllIdsByGroupId(groupId))
                .thenReturn(Collections.emptyList());

        service.syncMacroData(GUILD_ID, List.of(dto));

        verify(groupItemRepository, never()).deleteAllInBatch(anyList());
    }

    @Test
    @DisplayName("syncMacroData는 중복된 그룹 이름일 경우 DomainException을 던진다")
    void testSyncMacroDataThrowsOnDuplicateGroupName() {
        GroupDto dto = GroupDto.builder()
                .id(groupId)
                .name("DupName")
                .index(0)
                .buttons(Collections.emptyList())
                .build();

        when(groupRepository.existsById(groupId)).thenReturn(false);
        when(groupRepository.existsByGuildSnowflakeAndName(GUILD_ID, "DupName")).thenReturn(true);

        DomainException ex = assertThrows(DomainException.class,
                () -> service.syncMacroData(GUILD_ID, List.of(dto)));
        assertEquals(ErrorStatus.GROUP_NAME_EXISTS.getMessage(), ex.getMessage());
    }

    @Test
    @DisplayName("syncMacroData는 그룹 저장 중 예외 발생 시 DomainException으로 래핑한다")
    void testSyncMacroDataWrapsDataIntegrityOnGroupSave() {
        GroupDto dto = GroupDto.builder()
                .id(groupId)
                .name("Grp")
                .index(0)
                .buttons(Collections.emptyList())
                .build();

        when(groupRepository.existsById(groupId)).thenReturn(true);
        when(groupRepository.findById(groupId)).thenReturn(Optional.of(new Group()));
        doThrow(new DataIntegrityViolationException("constraint"))
                .when(groupRepository).saveAll(anyList());

        assertThrows(DomainException.class,
                () -> service.syncMacroData(GUILD_ID, List.of(dto)));
    }

    @Test
    @DisplayName("syncMacroData는 아이템 저장 중 예외 발생 시 DomainException으로 래핑한다")
    void testSyncMacroDataWrapsDataIntegrityOnItemSave() {
        GroupDto dto = GroupDto.builder()
                .id(groupId)
                .name("Grp")
                .index(0)
                .buttons(List.of(
                        ButtonDto.builder()
                                .id(buttonId)
                                .name("BtnX")
                                .index(0)
                                .contents(List.of(
                                        ContentDto.builder()
                                                .id(contentId)
                                                .text("Txt")
                                                .channelId("ch")
                                                .index(0)
                                                .build()
                                ))
                                .build()
                ))
                .build();

        when(groupRepository.existsById(groupId)).thenReturn(true);
        when(groupRepository.findById(groupId)).thenReturn(Optional.of(new Group()));
        when(groupRepository.saveAll(anyList())).thenReturn(List.of());
        doThrow(new DataIntegrityViolationException("item constraint"))
                .when(groupItemRepository).saveAll(anyList());

        assertThrows(DomainException.class,
                () -> service.syncMacroData(GUILD_ID, List.of(dto)));
    }

    @Test
    @DisplayName("syncMacroData는 입력 리스트가 비어있을 경우 아무 작업도 하지 않는다")
    void testSyncMacroDataNoOpOnEmptyList() {
        service.syncMacroData(GUILD_ID, Collections.emptyList());

        verify(groupRepository).saveAll(Collections.emptyList());
        verify(groupItemRepository, never()).saveAll(anyList());
        verify(groupItemRepository, never()).deleteAllInBatch(anyList());
    }
}
