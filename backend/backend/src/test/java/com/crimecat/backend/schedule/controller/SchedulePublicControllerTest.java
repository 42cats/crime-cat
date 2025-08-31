package com.crimecat.backend.schedule.controller;

import com.crimecat.backend.schedule.domain.EventStatus;
import com.crimecat.backend.schedule.dto.PublicEventResponse;
import com.crimecat.backend.schedule.service.ScheduleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SchedulePublicController.class)
@DisplayName("일정 관리 퍼블릭 API 컨트롤러 테스트")
class SchedulePublicControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ScheduleService scheduleService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("퍼블릭 일정 목록 조회 성공")
    void getPublicEvents_Success() throws Exception {
        // Given
        UUID eventId = UUID.randomUUID();
        List<PublicEventResponse> mockEvents = Arrays.asList(
                PublicEventResponse.builder()
                        .id(eventId)
                        .title("테스트 일정")
                        .description("테스트 설명")
                        .category("MEETING")
                        .status(EventStatus.RECRUITING)
                        .maxParticipants(10)
                        .creatorNickname("테스트유저")
                        .build()
        );

        when(scheduleService.getPublicEvents(any(), any())).thenReturn(mockEvents);

        // When & Then
        mockMvc.perform(get("/api/v1/public/schedule/events")
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(eventId.toString()))
                .andExpect(jsonPath("$[0].title").value("테스트 일정"))
                .andExpect(jsonPath("$[0].creatorNickname").value("테스트유저"));
    }

    @Test
    @DisplayName("카테고리별 일정 조회 성공")
    void getEventsByCategory_Success() throws Exception {
        // Given
        String category = "MEETING";
        UUID eventId = UUID.randomUUID();
        List<PublicEventResponse> mockEvents = Arrays.asList(
                PublicEventResponse.builder()
                        .id(eventId)
                        .title("회의 일정")
                        .category(category)
                        .status(EventStatus.RECRUITING)
                        .creatorNickname("관리자")
                        .build()
        );

        when(scheduleService.getPublicEvents(eq(category), eq(EventStatus.RECRUITING)))
                .thenReturn(mockEvents);

        // When & Then
        mockMvc.perform(get("/api/v1/public/schedule/events/category/{category}", category)
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").value(category))
                .andExpect(jsonPath("$[0].status").value("RECRUITING"));
    }

    @Test
    @DisplayName("특정 일정 상세 조회 성공")
    void getPublicEvent_Success() throws Exception {
        // Given
        UUID eventId = UUID.randomUUID();
        PublicEventResponse mockEvent = PublicEventResponse.builder()
                .id(eventId)
                .title("상세 조회 테스트")
                .description("상세 설명")
                .category("WORKSHOP")
                .status(EventStatus.RECRUITING)
                .maxParticipants(20)
                .createdAt(LocalDateTime.now())
                .creatorNickname("워크샵리더")
                .build();

        when(scheduleService.getPublicEvent(eventId)).thenReturn(mockEvent);

        // When & Then
        mockMvc.perform(get("/api/v1/public/schedule/events/{eventId}", eventId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(eventId.toString()))
                .andExpect(jsonPath("$.title").value("상세 조회 테스트"))
                .andExpect(jsonPath("$.creatorNickname").value("워크샵리더"));
    }

    @Test
    @DisplayName("참여자 수 조회 성공")
    void getParticipantCount_Success() throws Exception {
        // Given
        UUID eventId = UUID.randomUUID();
        int participantCount = 5;

        when(scheduleService.getPublicParticipantCount(eventId)).thenReturn(participantCount);

        // When & Then
        mockMvc.perform(get("/api/v1/public/schedule/events/{eventId}/participant-count", eventId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().string(String.valueOf(participantCount)));
    }

    @Test
    @DisplayName("모집 중인 일정 조회 성공")
    void getRecruitingEvents_Success() throws Exception {
        // Given
        List<PublicEventResponse> mockEvents = Arrays.asList(
                PublicEventResponse.builder()
                        .id(UUID.randomUUID())
                        .title("모집 중인 일정1")
                        .status(EventStatus.RECRUITING)
                        .creatorNickname("유저1")
                        .build(),
                PublicEventResponse.builder()
                        .id(UUID.randomUUID())
                        .title("모집 중인 일정2")
                        .status(EventStatus.RECRUITING)
                        .creatorNickname("유저2")
                        .build()
        );

        when(scheduleService.getPublicEvents(null, EventStatus.RECRUITING))
                .thenReturn(mockEvents);

        // When & Then
        mockMvc.perform(get("/api/v1/public/schedule/events/recruiting")
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].status").value("RECRUITING"))
                .andExpect(jsonPath("$[1].status").value("RECRUITING"));
    }
}