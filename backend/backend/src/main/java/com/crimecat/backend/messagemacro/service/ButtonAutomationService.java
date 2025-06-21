package com.crimecat.backend.messagemacro.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.messagemacro.domain.ButtonAutomation;
import com.crimecat.backend.messagemacro.domain.ButtonAutomationGroup;
import com.crimecat.backend.messagemacro.dto.*;
import com.crimecat.backend.messagemacro.repository.ButtonAutomationGroupRepository;
import com.crimecat.backend.messagemacro.repository.ButtonAutomationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ButtonAutomationService {
    
    private final ButtonAutomationGroupRepository groupRepository;
    private final ButtonAutomationRepository buttonRepository;

    // ===== 그룹 관리 =====
    
    @Transactional(readOnly = true)
    public List<ButtonAutomationGroupDto> getGroups(String guildId) {
        List<ButtonAutomationGroup> groups = groupRepository.findActiveGroupsByGuildIdOrderByDisplayOrder(guildId);
        return groups.stream()
                .map(this::toGroupDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ButtonAutomationGroupDto> getAllGroups(String guildId) {
        List<ButtonAutomationGroup> groups = groupRepository.findAllByGuildIdOrderByDisplayOrder(guildId);
        return groups.stream()
                .map(this::toGroupDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ButtonAutomationGroupDto> getGroupById(UUID groupId) {
        return groupRepository.findById(groupId)
                .map(this::toGroupDto);
    }

    @Transactional
    public ButtonAutomationGroupDto createGroup(String guildId, ButtonAutomationGroupRequestDto request) {
        // 중복 이름 검사
        if (groupRepository.existsByGuildIdAndName(guildId, request.getName())) {
            throw ErrorStatus.GROUP_ALREADY_EXISTS.asDomainException();
        }

        // 다음 표시 순서 계산
        Integer maxOrder = groupRepository.findMaxDisplayOrderByGuildId(guildId);
        int nextOrder = request.getDisplayOrder() != null ? request.getDisplayOrder() : (maxOrder + 1);

        ButtonAutomationGroup group = ButtonAutomationGroup.builder()
                .guildId(guildId)
                .name(request.getName())
                .displayOrder(nextOrder)
                .settings(request.getSettings())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        try {
            ButtonAutomationGroup saved = groupRepository.save(group);
            log.info("Created button automation group: {} for guild: {}", saved.getId(), guildId);
            return toGroupDto(saved);
        } catch (DataIntegrityViolationException e) {
            throw ErrorStatus.GROUP_ALREADY_EXISTS.asDomainException();
        }
    }

    @Transactional
    public ButtonAutomationGroupDto updateGroup(UUID groupId, ButtonAutomationGroupRequestDto request) {
        ButtonAutomationGroup group = groupRepository.findById(groupId)
                .orElseThrow(ErrorStatus.GROUP_NOT_FOUND::asDomainException);

        // 이름 중복 검사 (자기 자신 제외)
        if (!group.getName().equals(request.getName()) && 
            groupRepository.existsByGuildIdAndName(group.getGuildId(), request.getName())) {
            throw ErrorStatus.GROUP_ALREADY_EXISTS.asDomainException();
        }

        group.setName(request.getName());
        if (request.getDisplayOrder() != null) {
            group.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getSettings() != null) {
            group.setSettings(request.getSettings());
        }
        if (request.getIsActive() != null) {
            group.setIsActive(request.getIsActive());
        }

        ButtonAutomationGroup updated = groupRepository.save(group);
        log.info("Updated button automation group: {}", groupId);
        return toGroupDto(updated);
    }

    @Transactional
    public void deleteGroup(UUID groupId) {
        ButtonAutomationGroup group = groupRepository.findById(groupId)
                .orElseThrow(ErrorStatus.GROUP_NOT_FOUND::asDomainException);

        // 관련된 버튼들도 함께 삭제 (CASCADE)
        buttonRepository.deleteAllByGroupId(groupId);
        groupRepository.delete(group);
        
        log.info("Deleted button automation group: {} and its buttons", groupId);
    }

    // ===== 버튼 관리 =====

    @Transactional(readOnly = true)
    public List<ButtonAutomationDto> getButtons(String guildId) {
        List<ButtonAutomation> buttons = buttonRepository.findActiveButtonsByGuildIdOrderByDisplayOrder(guildId);
        return buttons.stream()
                .map(this::toButtonDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ButtonAutomationDto> getButtonsByGroup(UUID groupId) {
        List<ButtonAutomation> buttons = buttonRepository.findActiveButtonsByGroupIdOrderByDisplayOrder(groupId);
        return buttons.stream()
                .map(this::toButtonDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ButtonAutomationDto> getButtonById(UUID buttonId) {
        return buttonRepository.findById(buttonId)
                .map(this::toButtonDto);
    }

    @Transactional
    public ButtonAutomationDto createButton(String guildId, ButtonAutomationRequestDto request) {
        // 그룹 존재 여부 확인 (그룹 ID가 있는 경우)
        if (request.getGroupId() != null && !groupRepository.existsById(request.getGroupId())) {
            throw ErrorStatus.GROUP_NOT_FOUND.asDomainException();
        }

        // 그룹당 버튼 수 제한 검증 (Discord 제한: 25개)
        if (request.getGroupId() != null) {
            long currentButtonCount = buttonRepository.countActiveButtonsByGroupId(request.getGroupId());
            if (currentButtonCount >= 25) {
                throw ErrorStatus.GROUP_ALREADY_EXISTS.asDomainException();
            }
        }

        // 중복 라벨 검사
        if (buttonRepository.existsByGuildIdAndButtonLabel(guildId, request.getButtonLabel())) {
            throw ErrorStatus.GROUP_ALREADY_EXISTS.asDomainException();
        }

        // 다음 표시 순서 계산
        Integer maxOrder = request.getGroupId() != null ? 
            buttonRepository.findMaxDisplayOrderByGroupId(request.getGroupId()) : 0;
        int nextOrder = request.getDisplayOrder() != null ? request.getDisplayOrder() : (maxOrder + 1);

        ButtonAutomation button = ButtonAutomation.builder()
                .guildId(guildId)
                .groupId(request.getGroupId())
                .buttonLabel(request.getButtonLabel())
                .displayOrder(nextOrder)
                .config(request.getConfig())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        try {
            ButtonAutomation saved = buttonRepository.save(button);
            log.info("Created button automation: {} for guild: {}", saved.getId(), guildId);
            return toButtonDto(saved);
        } catch (DataIntegrityViolationException e) {
            throw ErrorStatus.GROUP_ALREADY_EXISTS.asDomainException();
        }
    }

    @Transactional
    public ButtonAutomationDto updateButton(UUID buttonId, ButtonAutomationRequestDto request) {
        ButtonAutomation button = buttonRepository.findById(buttonId)
                .orElseThrow(ErrorStatus.BUTTON_ID_NOT_FOUND::asDomainException);

        // 라벨 중복 검사 (자기 자신 제외)
        if (!button.getButtonLabel().equals(request.getButtonLabel()) && 
            buttonRepository.existsByGuildIdAndButtonLabel(button.getGuildId(), request.getButtonLabel())) {
            throw ErrorStatus.GROUP_ALREADY_EXISTS.asDomainException();
        }

        // 그룹 변경 시 그룹 존재 여부 확인
        if (request.getGroupId() != null && !request.getGroupId().equals(button.getGroupId()) && 
            !groupRepository.existsById(request.getGroupId())) {
            throw ErrorStatus.GROUP_NOT_FOUND.asDomainException();
        }

        button.setGroupId(request.getGroupId());
        button.setButtonLabel(request.getButtonLabel());
        if (request.getDisplayOrder() != null) {
            button.setDisplayOrder(request.getDisplayOrder());
        }
        button.setConfig(request.getConfig());
        if (request.getIsActive() != null) {
            button.setIsActive(request.getIsActive());
        }

        ButtonAutomation updated = buttonRepository.save(button);
        log.info("Updated button automation: {}", buttonId);
        return toButtonDto(updated);
    }

    @Transactional
    public void deleteButton(UUID buttonId) {
        ButtonAutomation button = buttonRepository.findById(buttonId)
                .orElseThrow(ErrorStatus.BUTTON_ID_NOT_FOUND::asDomainException);

        buttonRepository.delete(button);
        log.info("Deleted button automation: {}", buttonId);
    }

    // ===== 봇 전용 메서드 =====

    @Transactional(readOnly = true)
    public List<BotButtonAutomationResponseDto.Group> getBotData(String guildId) {
        List<ButtonAutomationGroup> groups = groupRepository.findActiveGroupsByGuildIdOrderByDisplayOrder(guildId);
        
        return groups.stream()
                .map(group -> {
                    List<ButtonAutomation> buttons = buttonRepository.findActiveButtonsByGroupIdOrderByDisplayOrder(group.getId());
                    List<BotButtonAutomationResponseDto> buttonDtos = buttons.stream()
                            .map(this::toBotButtonDto)
                            .collect(Collectors.toList());
                    
                    return BotButtonAutomationResponseDto.Group.builder()
                            .id(group.getId())
                            .name(group.getName())
                            .settings(group.getSettings())
                            .buttons(buttonDtos)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<BotButtonAutomationResponseDto> getBotButtonData(UUID buttonId) {
        return buttonRepository.findById(buttonId)
                .filter(ButtonAutomation::getIsActive)
                .map(this::toBotButtonDto);
    }

    // ===== 통계 메서드 =====

    @Transactional(readOnly = true)
    public long countActiveGroups(String guildId) {
        return groupRepository.countActiveGroupsByGuildId(guildId);
    }

    @Transactional(readOnly = true)
    public long countActiveButtons(String guildId) {
        return buttonRepository.countActiveButtonsByGuildId(guildId);
    }

    // ===== DTO 변환 메서드 =====

    private ButtonAutomationGroupDto toGroupDto(ButtonAutomationGroup group) {
        List<ButtonAutomation> buttons = buttonRepository.findActiveButtonsByGroupIdOrderByDisplayOrder(group.getId());
        List<ButtonAutomationDto> buttonDtos = buttons.stream()
                .map(this::toButtonDto)
                .collect(Collectors.toList());

        return ButtonAutomationGroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .guildId(group.getGuildId())
                .displayOrder(group.getDisplayOrder())
                .settings(group.getSettings())
                .isActive(group.getIsActive())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .buttons(buttonDtos)
                .build();
    }

    private ButtonAutomationDto toButtonDto(ButtonAutomation button) {
        return ButtonAutomationDto.builder()
                .id(button.getId())
                .guildId(button.getGuildId())
                .groupId(button.getGroupId())
                .buttonLabel(button.getButtonLabel())
                .displayOrder(button.getDisplayOrder())
                .config(button.getConfig())
                .isActive(button.getIsActive())
                .createdAt(button.getCreatedAt())
                .updatedAt(button.getUpdatedAt())
                .build();
    }

    private BotButtonAutomationResponseDto toBotButtonDto(ButtonAutomation button) {
        return BotButtonAutomationResponseDto.builder()
                .id(button.getId())
                .buttonLabel(button.getButtonLabel())
                .config(button.getConfig())
                .isActive(button.getIsActive())
                .build();
    }
}