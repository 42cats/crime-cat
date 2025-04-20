package com.crimecat.backend.messagemacro.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.messagemacro.domain.Group;
import com.crimecat.backend.messagemacro.domain.GroupItem;
import com.crimecat.backend.messagemacro.dto.BotGroupResponseDto;
import com.crimecat.backend.messagemacro.dto.GroupDto;
import com.crimecat.backend.messagemacro.dto.ButtonDto;
import com.crimecat.backend.messagemacro.dto.ContentDto;
import com.crimecat.backend.messagemacro.repository.GroupItemRepository;
import com.crimecat.backend.messagemacro.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageMacroService {
    private final GroupRepository groupRepository;
    private final GroupItemRepository groupItemRepository;

    @Transactional(readOnly = true)
    public List<GroupDto> getGroups(String guildId) {
        List<Group> groups = groupRepository.findAllByGuildSnowflakeOrderByIndex(guildId);
        return groups.stream()
                .map(this::toGroupDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void syncMacroData(String guildId, List<GroupDto> groupDtos) {
        try {
            // 1) Batch upsert Groups
            List<Group> groupsToSave = groupDtos.stream()
                    .map(dto -> upsertGroup(guildId, dto))
                    .collect(Collectors.toList());
            groupRepository.saveAll(groupsToSave);

            // 2) For each group, upsert items and delete removed
            for (GroupDto dto : groupDtos) {
                List<GroupItem> itemsToSave = collectItems(dto.getId(), dto);
                groupItemRepository.saveAll(itemsToSave);
                deleteRemovedItems(dto.getId(), itemsToSave);
            }
        } catch (DataIntegrityViolationException ex) {
            // 모든 DB 제약 위반은 DomainException으로
            throw ErrorStatus.GROUP_NAME_EXISTS.asDomainException();
        }
    }

    // ---------------------- helper methods ----------------------

    private Group upsertGroup(String guildId, GroupDto dto) {
        // 중복 이름 검증
        if (!groupRepository.existsById(dto.getId())
                && groupRepository.existsByGuildSnowflakeAndName(guildId, dto.getName())) {
            throw ErrorStatus.GROUP_NAME_EXISTS.asDomainException();
        }
        Group group = groupRepository.findById(dto.getId())
                .orElseGet(() -> Group.builder().id(dto.getId()).build());
        group.setGuildSnowflake(guildId);
        group.setName(dto.getName());
        group.setIndex(dto.getIndex());
        return group;
    }

    private List<GroupItem> collectItems(UUID groupId, GroupDto dto) {
        Group group = groupRepository.getReferenceById(groupId);
        List<GroupItem> items = new ArrayList<>();
        for (ButtonDto btn : dto.getButtons()) {
            items.add(GroupItem.builder()
                    .id(btn.getId())
                    .group(group)
                    .type(GroupItem.Type.BUTTON)
                    .parentId(null)
                    .name(btn.getName())
                    .index(btn.getIndex())
                    .build());
            for (ContentDto ct : btn.getContents()) {
                items.add(GroupItem.builder()
                        .id(ct.getId())
                        .group(group)
                        .type(GroupItem.Type.CONTENT)
                        .parentId(btn.getId())
                        .text(ct.getText())
                        .channelId(ct.getChannelId())
                        .index(ct.getIndex())
                        .build());
            }
        }
        return items;
    }

    private void deleteRemovedItems(UUID groupId, List<GroupItem> itemsToKeep) {
        // 기존 ID 목록
        List<UUID> existingIds = groupItemRepository.findAllIdsByGroupId(groupId);
        Set<UUID> keepIds = itemsToKeep.stream()
                .map(GroupItem::getId)
                .collect(Collectors.toSet());
        // 삭제할 ID
        List<UUID> toDeleteIds = existingIds.stream()
                .filter(id -> !keepIds.contains(id))
                .collect(Collectors.toList());
        if (!toDeleteIds.isEmpty()) {
            // 실제 엔티티 없이 ID만으로 배치 삭제 시도
            List<GroupItem> toDeleteEntities = toDeleteIds.stream()
                    .map(id -> GroupItem.builder().id(id).build())
                    .collect(Collectors.toList());
            groupItemRepository.deleteAllInBatch(toDeleteEntities);
        }
    }

    private GroupDto toGroupDto(Group group) {
        List<GroupItem> items = groupItemRepository.findAllByGroupIdOrderByIndex(group.getId());
        List<ButtonDto> buttons = items.stream()
                .filter(i -> i.getType() == GroupItem.Type.BUTTON)
                .map(i -> ButtonDto.builder()
                        .id(i.getId())
                        .name(i.getName())
                        .index(i.getIndex())
                        .contents(items.stream()
                                .filter(c -> c.getType() == GroupItem.Type.CONTENT
                                        && Objects.equals(c.getParentId(), i.getId()))
                                .map(c -> ContentDto.builder()
                                        .id(c.getId())
                                        .text(c.getText())
                                        .channelId(c.getChannelId())
                                        .index(c.getIndex())
                                        .build())
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
        return GroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .index(group.getIndex())
                .buttons(buttons)
                .build();
    }

    public GroupDto getButtons(Group group) {
        UUID groupId = group.getId();
        List<GroupItem> allIdsByGroupId = groupItemRepository.findAllButtonsByGroupId(groupId);

        // GroupItem → ButtonDto 변환
        List<ButtonDto> buttonDtos = allIdsByGroupId.stream()
                .map(item -> ButtonDto.builder()
                        .id(item.getId())
                        .name(item.getName())
                        .index(item.getIndex())
                        // 필요 시 더 많은 필드 매핑
                        .build())
                .toList();

        return GroupDto.builder()
                .name(group.getName())
                .buttons(buttonDtos)
                .build();
    }

    public ButtonDto getContents(GroupItem button) {
        UUID buttonId = button.getId();
        List<GroupItem> allContentByParentId = groupItemRepository.findAllContentsByParentId(buttonId);

        List<ContentDto> contentDtos = allContentByParentId.stream()
                .map(content -> ContentDto.builder()
                        .channelId(content.getChannelId())
                        .text(content.getText())
                        .build())
                .toList();

        return ButtonDto.builder()
                .name(button.getName())
                .contents(contentDtos)
                .build();

    }
}
