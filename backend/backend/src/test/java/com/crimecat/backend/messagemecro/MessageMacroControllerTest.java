package com.crimecat.backend.messagemecro;

import com.crimecat.backend.exception.ControllerException;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.messagemacro.controller.MessageMacroController;
import com.crimecat.backend.messagemacro.dto.GroupDto;
import com.crimecat.backend.messagemacro.service.MessageMacroService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.ResponseEntity;

import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MessageMacroControllerTest {

    @Mock
    private MessageMacroService service;

    @Mock
    private GuildRepository guildRepository;

    @InjectMocks
    private MessageMacroController controller;

    private static final String GUILD_ID = "guild123";
    private Principal principal;

    @BeforeEach
    void setUp() {
        principal = () -> "user123";
    }

    @Test
    @DisplayName("getMacros는 사용자가 서버 소유자일 경우 데이터를 반환한다")
    void testGetMacros_Success() {
        when(guildRepository.existsBySnowflakeAndOwnerSnowflake(GUILD_ID, "user123"))
                .thenReturn(true);
        List<GroupDto> dummy = List.of(GroupDto.builder()
                .id(UUID.randomUUID())
                .name("G")
                .index(0)
                .buttons(Collections.emptyList())
                .build());
        when(service.getGroups(GUILD_ID)).thenReturn(dummy);

        ResponseEntity<List<GroupDto>> response = controller.getMacros(GUILD_ID);
        assertEquals(dummy, response.getBody());
    }

    @Test
    @DisplayName("getMacros는 사용자가 서버 소유자가 아니면 예외를 던진다")
    void testGetMacros_Forbidden() {
        lenient().when(guildRepository.existsBySnowflakeAndOwnerSnowflake(GUILD_ID, "user123"))
                .thenReturn(false);

        ControllerException ex = assertThrows(ControllerException.class,
                () -> controller.getMacros(GUILD_ID));
        assertEquals(ErrorStatus.GUILD_ALREADY_EXISTS.getMessage(), ex.getMessage());
    }

    @Test
    @DisplayName("syncMacros는 사용자가 서버 소유자일 경우 204 No Content를 반환한다")
    void testSyncMacros_Success() {
        when(guildRepository.existsBySnowflakeAndOwnerSnowflake(GUILD_ID, "user123"))
                .thenReturn(true);

        ResponseEntity<Void> response = controller.syncMacros(GUILD_ID, Collections.emptyList());
        assertEquals(204, response.getStatusCodeValue());
        verify(service).syncMacroData(GUILD_ID, Collections.emptyList());
    }

    @Test
    @DisplayName("syncMacros는 사용자가 서버 소유자가 아니면 예외를 던진다")
    void testSyncMacros_Forbidden() {
        lenient().when(guildRepository.existsBySnowflakeAndOwnerSnowflake(GUILD_ID, "user123"))
                .thenReturn(false);

        ControllerException ex = assertThrows(ControllerException.class,
                () -> controller.syncMacros(GUILD_ID, Collections.emptyList()));
        assertEquals(ErrorStatus.GUILD_ALREADY_EXISTS.getMessage(), ex.getMessage());
    }
}
