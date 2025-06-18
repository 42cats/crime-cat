package com.crimecat.backend.chat.controller;

import com.crimecat.backend.chat.dto.VoiceSessionDto;
import com.crimecat.backend.chat.service.VoiceSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/voice/sessions")
@RequiredArgsConstructor
@Slf4j
public class VoiceSessionController {

    private final VoiceSessionService voiceSessionService;

    /**
     * 음성 세션 시작
     */
    @PostMapping("/start")
    public ResponseEntity<VoiceSessionDto.Response> startSession(
            @Valid @RequestBody VoiceSessionDto.StartRequest request) {
        VoiceSessionDto.Response session = voiceSessionService.startSession(request);
        return ResponseEntity.ok(session);
    }

    /**
     * 음성 세션 종료
     */
    @PostMapping("/end")
    public ResponseEntity<Void> endSession(
            @Valid @RequestBody VoiceSessionDto.EndRequest request) {
        voiceSessionService.endSession(request);
        return ResponseEntity.noContent().build();
    }

    /**
     * 활성 음성 세션 조회
     */
    @GetMapping("/active")
    public ResponseEntity<VoiceSessionDto.ActiveSessionsResponse> getActiveSessions(
            @RequestParam UUID serverId,
            @RequestParam UUID channelId) {
        VoiceSessionDto.ActiveSessionsResponse activeSessions = 
            voiceSessionService.getActiveSessions(serverId, channelId);
        return ResponseEntity.ok(activeSessions);
    }
}