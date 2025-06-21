package com.crimecat.backend.rockcat.controller.web;

import com.crimecat.backend.rockcat.common.dto.music.LocalMusicFileDto;
import com.crimecat.backend.rockcat.common.dto.music.YouTubeMusicDto;
import com.crimecat.backend.rockcat.service.MusicService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/web/v1/music")
@RequiredArgsConstructor
public class MusicController {
    
    private final MusicService musicService;
    
    /**
     * 로컬 음악 파일 목록 조회
     */
    @GetMapping("/{guildId}/local-files")
    public ResponseEntity<List<LocalMusicFileDto>> getLocalMusicFiles(
            @PathVariable String guildId,
            @RequestParam String userId) {
        
        log.info("로컬 음악 파일 목록 요청: guildId={}, userId={}", guildId, userId);
        
        try {
            List<LocalMusicFileDto> files = musicService.getLocalMusicFiles(guildId, userId);
            log.info("로컬 음악 파일 {}개 조회 완료", files.size());
            
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            log.error("로컬 음악 파일 목록 조회 실패", e);
            return ResponseEntity.ok(List.of()); // 빈 리스트 반환
        }
    }
    
    /**
     * YouTube 음악 목록 조회
     */
    @GetMapping("/{guildId}/youtube-tracks")
    public ResponseEntity<List<YouTubeMusicDto>> getYouTubeTracks(
            @PathVariable String guildId) {
        
        log.info("YouTube 음악 목록 요청: guildId={}", guildId);
        
        try {
            List<YouTubeMusicDto> tracks = musicService.getYouTubeTracks(guildId);
            log.info("YouTube 음악 {}개 조회 완료", tracks.size());
            
            return ResponseEntity.ok(tracks);
        } catch (Exception e) {
            log.error("YouTube 음악 목록 조회 실패", e);
            return ResponseEntity.ok(List.of()); // 빈 리스트 반환
        }
    }
}