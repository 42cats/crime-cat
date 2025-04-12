package com.crimecat.backend.guild.controller;

import com.crimecat.backend.guild.dto.*;
import com.crimecat.backend.guild.service.PasswordNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/v1/bot/guilds/{guildId}/password-notes")
@RequiredArgsConstructor
public class PasswordNoteController {

    private final PasswordNoteService passwordNoteService;

    // 🔐 저장 (POST)
    @PostMapping
    public ResponseEntity<?> saveNote(
            @PathVariable String guildId,
            @RequestBody SavePasswordNoteRequestDto request) {

        PasswordNoteDto savedNote = passwordNoteService.save(guildId, request);
        return ResponseEntity.ok(
                new PasswordNoteResponseDto("컨텐츠 저장완료", savedNote)
        );
    }

    // 🔐 삭제 (DELETE)
    @DeleteMapping("/{passwordKey}")
    public ResponseEntity<?> deleteNote(
            @PathVariable String guildId,
            @PathVariable String passwordKey) {

        passwordNoteService.delete(guildId, passwordKey);
        return ResponseEntity.ok(
                new MessageOnlyResponseDto("삭제완료")
        );
    }

    // 🔐 전체 조회 (GET)
    @GetMapping
    public ResponseEntity<?> getAllNotes(@PathVariable String guildId) {
        List<PasswordNoteDto> notes = passwordNoteService.findAllByGuildId(guildId);

        if (notes.isEmpty()) {
            return ResponseEntity.ok(
                    PasswordNoteListResponseDto.builder()
                            .message("패스워드노트 기록 없음")
                            .passwordNotes(notes)
                            .build()
            );
        }

        return ResponseEntity.ok(
                PasswordNoteListResponseDto.builder()
                        .message("패스워드노트 반환성공")
                        .passwordNotes(notes)
                        .build()
        );
    }

    // 🔐 단일 조회 (GET)
    @GetMapping("/{passwordKey}")
    public ResponseEntity<?> getNote(
            @PathVariable String guildId,
            @PathVariable String passwordKey) {

        PasswordNoteDto foundNote = passwordNoteService.findOne(guildId, passwordKey);

        return ResponseEntity.ok(
                new PasswordNoteResponseDto("비밀번호를 맞췄습니다.", foundNote)
        );
    }

    // 🔐 수정 (PATCH)
    @PatchMapping
    public ResponseEntity<?> updateNote(
            @PathVariable String guildId,
            @RequestBody SavePasswordNoteRequestDto request) {

        PasswordNoteDto updated = passwordNoteService.update(guildId, request);

        return ResponseEntity.ok(
                new PasswordNoteResponseDto("수정 완료하였습니다.", updated)
        );
    }
}
