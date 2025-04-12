package com.crimecat.backend.passwordnote;

import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.dto.GuildDto;
import com.crimecat.backend.guild.dto.PatchPasswordNoteRequestDto;
import com.crimecat.backend.guild.dto.SavePasswordNoteRequestDto;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.guild.repository.PasswordNoteRepository;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
public class PasswordNoteApiTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired GuildRepository guildRepository;
    @Autowired UserRepository userRepository;
    @Autowired PasswordNoteRepository passwordNoteRepository;

    private Guild prepareGuild() {
        String ownerSnowflake = String.valueOf(ThreadLocalRandom.current().nextLong(1000000000L));

        // ✅ 먼저 User 저장
        userRepository.save(User.of(ownerSnowflake, "테스트유저", "https://example.com/avatar.png"));
        String snowflake = String.valueOf(ThreadLocalRandom.current().nextLong(1000000000L));
        GuildDto dto = new GuildDto(snowflake,"test",ownerSnowflake,LocalDateTime.now());
        return guildRepository.save(Guild.of(dto));
    }

    @AfterEach
    void clean() {
        passwordNoteRepository.deleteAll();
        guildRepository.deleteAll();
    }

    @Test
    void 패스워드노트_생성_성공() throws Exception {
        Guild guild = prepareGuild();
        SavePasswordNoteRequestDto request = new SavePasswordNoteRequestDto("1234", "감자", "감자에서 싹이났다");

        mockMvc.perform(post("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("컨텐츠 저장완료"))
                .andExpect(jsonPath("$.passwordNote.passwordKey").value("감자"));
    }

    @Test
    void 패스워드노트_생성_실패_2000자초과() throws Exception {
        Guild guild = prepareGuild();
        String longContent = "a".repeat(2001);
        SavePasswordNoteRequestDto request = new SavePasswordNoteRequestDto("1234", "감자", longContent);

        MvcResult mvcResult = mockMvc.perform(post("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn();
        String errorMessage = mvcResult.getResponse().getErrorMessage();
        assertThat(errorMessage).isEqualTo("컨텐츠 2000자 제한오류");
    }

    @Test
    void 패스워드노트_생성_실패_중복키() throws Exception {
        Guild guild = prepareGuild();
        SavePasswordNoteRequestDto request = new SavePasswordNoteRequestDto("1234", "감자", "감자입니다");

        // first save
        mockMvc.perform(post("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // second with same key
        MvcResult mvcResult = mockMvc.perform(post("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn();
        String errorMessage = mvcResult.getResponse().getErrorMessage();
        Assertions.assertThat(errorMessage).isEqualTo("동일한 비밀번호로 저장된 컨텐츠가 있음");
    }

    @Test
    void 패스워드노트_단건조회_성공() throws Exception {
        Guild guild = prepareGuild();
        SavePasswordNoteRequestDto request = new SavePasswordNoteRequestDto("1234", "감자", "내용");

        mockMvc.perform(post("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/v1/bot/guilds/{guildId}/password-notes/{key}", guild.getSnowflake(), "감자"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("비밀번호를 맞췄습니다."))
                .andExpect(jsonPath("$.passwordNote.content").value("내용"));
    }

    @Test
    void 패스워드노트_단건조회_실패() throws Exception {
        Guild guild = prepareGuild();

        MvcResult mvcResult = mockMvc.perform(get("/v1/bot/guilds/{guildId}/password-notes/{key}", guild.getSnowflake(), "없는키"))
                .andExpect(status().isBadRequest())
                .andReturn();
        String errorMessage = mvcResult.getResponse().getErrorMessage();
        Assertions.assertThat(errorMessage).isEqualTo("비밀번호가 틀렸습니다");
    }

    @Test
    void 패스워드노트_전체조회_성공() throws Exception {
        Guild guild = prepareGuild();

        SavePasswordNoteRequestDto request1 = new SavePasswordNoteRequestDto("1234", "감자", "감자에서 싹이났다");
        SavePasswordNoteRequestDto request2 = new SavePasswordNoteRequestDto("1234", "고구마", "고구마는 맛있다");

        mockMvc.perform(post("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request1)));
        mockMvc.perform(post("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request2)));

        mockMvc.perform(get("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("패스워드노트 반환성공"))
                .andExpect(jsonPath("$.passwordNotes.length()").value(2));
    }

    @Test
    void 패스워드노트_전체조회_없음() throws Exception {
        Guild guild = prepareGuild();

        mockMvc.perform(get("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("패스워드노트 기록 없음"))
                .andExpect(jsonPath("$.passwordNotes").isEmpty());
    }

    @Test
    void 패스워드노트_삭제_성공() throws Exception {
        Guild guild = prepareGuild();
        SavePasswordNoteRequestDto request = new SavePasswordNoteRequestDto("1234", "감자", "감자에서 싹이났다");

        mockMvc.perform(post("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/v1/bot/guilds/{guildId}/password-notes/{key}", guild.getSnowflake(), "감자"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("삭제완료"));
    }

    @Test
    void 패스워드노트_삭제_실패() throws Exception {
        Guild guild = prepareGuild();

        MvcResult mvcResult = mockMvc.perform(delete("/v1/bot/guilds/{guildId}/password-notes/{key}", guild.getSnowflake(), "없는키"))
                .andExpect(status().isBadRequest())
                .andReturn();
        String errorMessage = mvcResult.getResponse().getErrorMessage();
        Assertions.assertThat(errorMessage).isEqualTo("해당 패스워드 키로 등록된 컨텐츠가 없습니다.");
    }

    @Test
    void 패스워드노트_수정_성공_UUID기반() throws Exception {
        Guild guild = prepareGuild();
        SavePasswordNoteRequestDto request = new SavePasswordNoteRequestDto("1234", "감자", "초기내용");

        // 1. 노트 생성 및 ID 추출
        MvcResult result = mockMvc.perform(post("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String json = result.getResponse().getContentAsString();
        UUID id = UUID.fromString(objectMapper.readTree(json).get("passwordNote").get("uuid").asText());

        // 2. 수정 요청 (UUID 기반)
        PatchPasswordNoteRequestDto update = new PatchPasswordNoteRequestDto(id, "1234", "감자", "업데이트된 내용");
        mockMvc.perform(patch("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("수정 완료하였습니다."))
                .andExpect(jsonPath("$.passwordNote.content").value("업데이트된 내용"));
    }


    @Test
    void 패스워드노트_수정_실패_존재X() throws Exception {
        Guild guild = prepareGuild();
        SavePasswordNoteRequestDto update = new SavePasswordNoteRequestDto("1234", "없는키", "내용");

        MvcResult mvcResult = mockMvc.perform(patch("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest())
                .andReturn();
        String errorMessage = mvcResult.getResponse().getErrorMessage();
        Assertions.assertThat(errorMessage).isEqualTo("수정할 컨텐츠가 존재하지 않습니다.");
    }

    @Test
    void 패스워드노트_수정_실패_2000자초과() throws Exception {
        Guild guild = prepareGuild();
        SavePasswordNoteRequestDto request = new SavePasswordNoteRequestDto("1234", "감자", "내용");

        // 1. 노트 생성 및 ID 추출
        MvcResult createResult = mockMvc.perform(post("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        UUID noteId = UUID.fromString(objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("passwordNote").get("uuid").asText());

        // 2. 2000자 초과 내용으로 PATCH 요청
        String longContent = "a".repeat(2001);
        PatchPasswordNoteRequestDto update = new PatchPasswordNoteRequestDto(noteId, "1234", "감자", longContent);

        MvcResult errorResult = mockMvc.perform(patch("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest())
                .andReturn();

        String errorMessage = errorResult.getResponse().getErrorMessage();
        Assertions.assertThat(errorMessage).isEqualTo("컨텐츠 2000자 제한오류");
    }

    @Test
    void 패스워드노트_수정_실패_중복키_UUID기반() throws Exception {
        Guild guild = prepareGuild();

        // A - 감자
        SavePasswordNoteRequestDto noteA = new SavePasswordNoteRequestDto("1234", "감자", "내용A");
        mockMvc.perform(post("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noteA)))
                .andExpect(status().isOk());

        // B - 고구마
        SavePasswordNoteRequestDto noteB = new SavePasswordNoteRequestDto("1234", "고구마", "내용B");
        MvcResult result = mockMvc.perform(post("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noteB)))
                .andExpect(status().isOk())
                .andReturn();

        UUID idB = UUID.fromString(objectMapper.readTree(result.getResponse().getContentAsString())
                .get("passwordNote").get("uuid").asText());

        // B를 '감자'로 수정 시도
        PatchPasswordNoteRequestDto update = new PatchPasswordNoteRequestDto(idB, "1234", "감자", "중복시도");

        MvcResult errorResult = mockMvc.perform(patch("/v1/bot/guilds/{guildId}/password-notes", guild.getSnowflake())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest())
                .andReturn();

        String errorMessage = errorResult.getResponse().getErrorMessage();
        assertThat(errorMessage).isEqualTo("이미 존재하는 비밀번호입니다.");
    }


}
