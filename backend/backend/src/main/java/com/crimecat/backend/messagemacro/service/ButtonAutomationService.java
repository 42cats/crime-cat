package com.crimecat.backend.messagemacro.service;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.messagemacro.controller.BotButtonAutomationController;
import com.crimecat.backend.messagemacro.controller.ButtonAutomationController;
import com.crimecat.backend.messagemacro.domain.ButtonAutomation;
import com.crimecat.backend.messagemacro.domain.ButtonAutomationGroup;
import com.crimecat.backend.messagemacro.dto.*;
import com.crimecat.backend.messagemacro.repository.ButtonAutomationGroupRepository;
import com.crimecat.backend.messagemacro.repository.ButtonAutomationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
    private final BotCommandsRedisService botCommandsRedisService;

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
        log.info("🔍 [getBotButtonData] 버튼 조회 시작: buttonId={}", buttonId);
        
        Optional<ButtonAutomation> buttonOpt = buttonRepository.findById(buttonId);
        if (buttonOpt.isEmpty()) {
            log.warn("❌ [getBotButtonData] 버튼을 찾을 수 없음: buttonId={}", buttonId);
            return Optional.empty();
        }
        
        ButtonAutomation button = buttonOpt.get();
        log.info("✅ [getBotButtonData] 버튼 조회 성공: buttonId={}, label={}, active={}", 
                buttonId, button.getButtonLabel(), button.getIsActive());
        log.info("📄 [getBotButtonData] 실제 config 내용: {}", button.getConfig());
        
        if (!button.getIsActive()) {
            log.warn("⚠️ [getBotButtonData] 비활성화된 버튼: buttonId={}", buttonId);
            return Optional.empty();
        }
        
        BotButtonAutomationResponseDto dto = toBotButtonDto(button);
        log.info("📤 [getBotButtonData] 반환할 DTO: {}", dto);
        
        return Optional.of(dto);
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

    // ===== 복사 기능 =====

    /**
     * 그룹 복사 (모든 버튼 포함)
     * @param sourceGroupId 원본 그룹 ID
     * @param targetGuildId 대상 길드 ID
     * @param customName 사용자 지정 그룹명 (null이면 자동 생성)
     * @return 복사된 그룹 정보
     */
    @Transactional
    public ButtonAutomationGroupDto copyGroup(UUID sourceGroupId, String targetGuildId, String customName) {
        // 1. 원본 그룹 조회
        ButtonAutomationGroup sourceGroup = groupRepository.findById(sourceGroupId)
                .orElseThrow(ErrorStatus.GROUP_NOT_FOUND::asDomainException);
        
        // 2. 새 그룹명 생성
        String newGroupName = customName != null ? customName : 
            generateUniqueName(sourceGroup.getName(), targetGuildId, "group");
        
        // 3. 그룹 복사
        ButtonAutomationGroup newGroup = ButtonAutomationGroup.builder()
                .guildId(targetGuildId)
                .name(newGroupName)
                .displayOrder(getNextDisplayOrder(targetGuildId, "group"))
                .settings(sourceGroup.getSettings())  // JSON 설정 복사
                .isActive(sourceGroup.getIsActive())
                .build();
        
        ButtonAutomationGroup savedGroup = groupRepository.save(newGroup);
        log.info("Copied group: {} -> {} with name: {}", sourceGroupId, savedGroup.getId(), newGroupName);
        
        // 4. 그룹 내 모든 버튼 복사 (V1.4.5: 그룹 복사 시 원본명 보존 시도)
        List<ButtonAutomation> sourceButtons = buttonRepository.findAllByGroupIdOrderByDisplayOrder(sourceGroupId);
        for (ButtonAutomation sourceButton : sourceButtons) {
            copyButtonInternal(sourceButton, savedGroup.getId(), null, true); // preserveOriginalName = true
        }
        
        log.info("Copied {} buttons for group: {}", sourceButtons.size(), savedGroup.getId());
        
        // 5. DTO 변환 후 반환
        return toGroupDto(savedGroup);
    }

    /**
     * 버튼 복사
     * @param sourceButtonId 원본 버튼 ID
     * @param targetGroupId 대상 그룹 ID (null이면 원본과 동일 그룹)
     * @param customLabel 사용자 지정 버튼 라벨 (null이면 자동 생성)
     * @return 복사된 버튼 정보
     */
    @Transactional
    public ButtonAutomationDto copyButton(UUID sourceButtonId, UUID targetGroupId, String customLabel) {
        // 1. 원본 버튼 조회
        ButtonAutomation sourceButton = buttonRepository.findById(sourceButtonId)
                .orElseThrow(ErrorStatus.BUTTON_ID_NOT_FOUND::asDomainException);
        
        // 2. 대상 그룹 결정
        UUID finalGroupId = targetGroupId != null ? targetGroupId : sourceButton.getGroupId();
        
        // 3. 버튼 복사
        return copyButtonInternal(sourceButton, finalGroupId, customLabel);
    }

    /**
     * 버튼 복사 내부 로직 (하위 호환성)
     */
    private ButtonAutomationDto copyButtonInternal(ButtonAutomation source, UUID groupId, String customLabel) {
        return copyButtonInternal(source, groupId, customLabel, false);
    }

    /**
     * 버튼 복사 내부 로직 (V1.4.5 이후 - 그룹 범위 검증)
     */
    private ButtonAutomationDto copyButtonInternal(ButtonAutomation source, UUID groupId, String customLabel, boolean preserveOriginalName) {
        String newLabel;
        
        if (customLabel != null) {
            newLabel = customLabel;
        } else {
            // V1.4.5 이후: 그룹 범위에서 중복 검증
            newLabel = generateUniqueButtonNameInGroup(source.getButtonLabel(), groupId, preserveOriginalName);
        }
        
        ButtonAutomation newButton = ButtonAutomation.builder()
                .guildId(source.getGuildId())
                .groupId(groupId)
                .buttonLabel(newLabel)
                .displayOrder(getNextDisplayOrder(source.getGuildId(), "button", groupId))
                .config(source.getConfig())  // JSON 설정 복사
                .isActive(source.getIsActive())
                .build();
        
        ButtonAutomation savedButton = buttonRepository.save(newButton);
        log.info("Copied button: {} -> {} with label: {} (preserveOriginal: {})", 
                source.getId(), savedButton.getId(), newLabel, preserveOriginalName);
        
        return toButtonDto(savedButton);
    }

    /**
     * 고유한 이름 생성 (길드 범위 중복 방지 - 하위 호환성)
     */
    private String generateUniqueName(String originalName, String guildId, String type) {
        String baseName = originalName + " 복사본";
        int counter = 1;
        
        while (isNameExists(baseName, guildId, type)) {
            counter++;
            baseName = originalName + " 복사본" + counter;
        }
        
        return baseName;
    }

    /**
     * 고유한 버튼명 생성 (그룹 범위 중복 방지 - V1.4.5 이후)
     */
    private String generateUniqueButtonNameInGroup(String originalName, UUID groupId, boolean preserveOriginalName) {
        // 그룹 복사 시 원본명 보존 시도
        if (preserveOriginalName && !isNameExistsInGroup(originalName, groupId)) {
            return originalName;
        }
        
        // 중복되거나 개별 복사인 경우 복사본 생성
        String baseName = originalName + " 복사본";
        int counter = 1;
        
        while (isNameExistsInGroup(baseName, groupId)) {
            counter++;
            baseName = originalName + " 복사본" + counter;
        }
        
        return baseName;
    }

    /**
     * 이름 중복 확인 (길드 범위 - 하위 호환성)
     */
    private boolean isNameExists(String name, String guildId, String type) {
        if ("group".equals(type)) {
            return groupRepository.existsByGuildIdAndName(guildId, name);
        } else {
            return buttonRepository.existsByGuildIdAndButtonLabel(guildId, name);
        }
    }

    /**
     * 이름 중복 확인 (그룹 범위 - V1.4.5 이후)
     */
    private boolean isNameExistsInGroup(String name, UUID groupId) {
        if (groupId == null) {
            return false; // 그룹이 없으면 중복 검사하지 않음
        }
        return buttonRepository.existsByGroupIdAndButtonLabel(groupId, name);
    }

    /**
     * 다음 표시 순서 계산
     */
    private Integer getNextDisplayOrder(String guildId, String type, UUID... groupId) {
        if ("group".equals(type)) {
            Integer maxOrder = groupRepository.findMaxDisplayOrderByGuildId(guildId);
            return (maxOrder != null ? maxOrder : 0) + 1;
        } else {
            UUID targetGroupId = groupId.length > 0 ? groupId[0] : null;
            if (targetGroupId != null) {
                Integer maxOrder = buttonRepository.findMaxDisplayOrderByGroupId(targetGroupId);
                return (maxOrder != null ? maxOrder : 0) + 1;
            }
            return 1;
        }
    }

    /**
     * 봇용 - 버튼 자동화 실행
     * @param buttonId 버튼 ID
     * @param request 실행 요청 정보
     * @return 실행 성공 여부
     */
    @Transactional
    public boolean executeButtonAutomation(UUID buttonId, BotButtonAutomationController.ButtonExecuteRequest request) {
        try {
            // 1. 버튼 존재 및 활성화 상태 확인
            ButtonAutomation button = buttonRepository.findById(buttonId)
                    .orElseThrow(ErrorStatus.BUTTON_ID_NOT_FOUND::asDomainException);
            
            if (!button.getIsActive()) {
                log.warn("Attempted to execute inactive button: {}", buttonId);
                return false;
            }

            // 2. 그룹 활성화 상태 확인
            ButtonAutomationGroup group = groupRepository.findById(button.getGroupId())
                    .orElseThrow(ErrorStatus.GROUP_NOT_FOUND::asDomainException);
            
            if (!group.getIsActive()) {
                log.warn("Attempted to execute button from inactive group: {}", group.getId());
                return false;
            }

            // 3. 버튼 설정 파싱 및 실행
            String config = button.getConfig();
            log.info("Executing button automation: {} with config: {}", buttonId, config);
            
            // 실제 자동화 로직 실행
            // ButtonAutomationEngine을 통해 실행하거나
            // 여기서 Discord 봇 API를 직접 호출하여 실행
            // 현재는 기본 검증만 수행하고 실제 액션은 봇에서 처리
            
            log.info("Button automation executed successfully: {} by user: {} in guild: {}", 
                    buttonId, request.getUserId(), request.getGuildId());
            
            return true;
            
        } catch (Exception e) {
            log.error("Failed to execute button automation: {} - {}", buttonId, e.getMessage(), e);
            return false;
        }
    }

    /**
     * 봇 커맨드 목록 조회 (Redis 캐시 기반 + Spring Cache 적용)
     * Bot CommandsCacheManager에서 저장한 커맨드 메타데이터를 조회하여 
     * 변환된 DTO를 Spring Cache에 캐싱
     * @return 봇 커맨드 목록
     */
    @Cacheable(value = CacheType.BOT_COMMANDS, key = "'all'")
    @Transactional(readOnly = true)
    public List<ButtonAutomationController.BotCommandDto> getBotCommands() {
        log.info("🔍 Redis에서 봇 커맨드 목록 조회 시작 (캐시 미스)");
        
        // Redis에서 실제 봇 커맨드 조회
        List<ButtonAutomationController.BotCommandDto> commands = botCommandsRedisService.getBotCommandsFromCache();
        
        if (commands.isEmpty()) {
            log.warn("⚠️ Redis 캐시에서 봇 커맨드를 찾을 수 없음. 봇이 아직 시작되지 않았거나 캐시 생성 실패");
        } else {
            log.info("✅ Redis에서 {} 개의 봇 커맨드 조회 성공 (Spring Cache에 저장됨)", commands.size());
        }
        
        return commands;
    }

    /**
     * 봇 커맨드 캐시 무효화 (봇 재시작 시 호출)
     * Redis에서 새로운 커맨드 캐시가 생성되었을 때 Spring Cache를 갱신
     */
    @CacheEvict(value = CacheType.BOT_COMMANDS, allEntries = true)
    public void evictBotCommandsCache() {
        log.info("🗑️ 봇 커맨드 Spring Cache 무효화 완료");
    }

}