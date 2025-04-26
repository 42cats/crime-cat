package com.crimecat.backend.Command;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.crimecat.backend.web.command.controller.CommandController;
import com.crimecat.backend.web.command.dto.CommandRequestDto;
import com.crimecat.backend.web.command.service.CommandService;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class CommandServiceControllerTest {

  private MockMvc mockMvc;
  private ObjectMapper om;

  @Mock
  private CommandService service;

  @InjectMocks
  private CommandController controller;

  @BeforeEach
  void setUp() {
    // 컨트롤러만 단독으로 띄우는 Standalone MockMvc
    mockMvc = MockMvcBuilders
        .standaloneSetup(controller)
        .build();

    om = new ObjectMapper();
  }

  @Test
  void createCommand_Returns201() throws Exception {
    // service.createCommand 에러 없이 동작하도록 설정
    doNothing().when(service).createCommand(any(CommandRequestDto.class));

    CommandRequestDto dto = CommandRequestDto.builder()
        .name("test")
        .description("desc")
        .usageExample("u")
        .category("cat")
        .requiredPermissions(List.of("p1","p2"))
        .content("content")
        .build();

    mockMvc.perform(post("/api/v1/commands")
            .contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(dto))
        )
        .andExpect(status().isCreated());

    verify(service).createCommand(any(CommandRequestDto.class));
  }

  @Test
  void deleteCommand_Returns204() throws Exception {
    // service.deleteCommand 에러 없이 동작하도록 설정
    doNothing().when(service).deleteCommand("some-uuid");

    mockMvc.perform(delete("/api/v1/commands/{id}", "some-uuid"))
        .andExpect(status().isNoContent());

    verify(service).deleteCommand("some-uuid");
  }
}
