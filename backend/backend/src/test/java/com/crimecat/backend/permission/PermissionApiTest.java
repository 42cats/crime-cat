package com.crimecat.backend.permission;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.crimecat.backend.bot.permission.domain.Permission;
import com.crimecat.backend.bot.permission.dto.ModifyPermissionRequestDto;
import com.crimecat.backend.bot.permission.dto.SavePermissionRequestDto;
import com.crimecat.backend.bot.permission.repository.PermissionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
public class PermissionApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private PermissionRepository permissionRepository;

    @BeforeEach
    void setUp() {
        permissionRepository.deleteAll();
    }

    @Test
    void 권한_생성() throws Exception {
        SavePermissionRequestDto dto = new SavePermissionRequestDto("VIP", 1000, 30);

        mockMvc.perform(post("/bot/v1/permissions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("permission saved")); // 메시지는 실제 반환값 기준 수정

        assertThat(permissionRepository.findByPermissionName("VIP")).isPresent();
    }

    @Test
    void 권한_목록_조회() throws Exception {

        mockMvc.perform(get("/bot/v1/permissions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("permissions retrieved"))
                .andExpect(jsonPath("$.permissionList.length()").value(0));

        permissionRepository.save(new Permission("Admin", 3000, 90));
        permissionRepository.save(new Permission("User", 1000, 30));

        mockMvc.perform(get("/bot/v1/permissions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("permissions retrieved"))
                .andExpect(jsonPath("$.permissionList.length()").value(2));
    }

    @Test
    void 권한_수정() throws Exception {
        permissionRepository.save(new Permission("Basic", 500, 7));

        ModifyPermissionRequestDto dto = new ModifyPermissionRequestDto("Pro", 1500, 30);

        mockMvc.perform(patch("/bot/v1/permissions/Basic")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("permission modified"));

        assertThat(permissionRepository.findByPermissionName("Pro")).isPresent();
    }

    @Test
    void 권한_삭제() throws Exception {
        permissionRepository.save(new Permission("DeleteMe", 100, 1));

        mockMvc.perform(delete("/bot/v1/permissions/DeleteMe"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("permission deleted"));

        assertThat(permissionRepository.findByPermissionName("DeleteMe")).isNotPresent();
    }
}
