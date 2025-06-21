package com.crimecat.backend.rockcat.service;

import com.crimecat.backend.rockcat.common.dto.music.LocalMusicFileDto;
import com.crimecat.backend.rockcat.common.dto.music.YouTubeMusicDto;
import com.crimecat.backend.guild.domain.Music;
import com.crimecat.backend.guild.repository.GuildMusicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MusicService {
    
    private final GuildMusicRepository guildMusicRepository;
    
    /**
     * 로컬 음악 파일 목록 조회
     */
    public List<LocalMusicFileDto> getLocalMusicFiles(String guildId, String userId) {
        try {
            // Docker 환경에서의 음악 파일 경로
            String musicDir = "/app/bot/MusicData/" + userId;
            Path musicPath = Paths.get(musicDir);
            
            if (!Files.exists(musicPath)) {
                log.info("로컬 음악 디렉토리가 존재하지 않음: {}", musicDir);
                return Collections.emptyList();
            }
            
            return Files.list(musicPath)
                .filter(path -> isAudioFile(path.getFileName().toString()))
                .map(this::convertToLocalMusicDto)
                .sorted(Comparator.comparing(LocalMusicFileDto::getTitle))
                .collect(Collectors.toList());
                
        } catch (IOException e) {
            log.error("로컬 음악 파일 조회 실패: guildId={}, userId={}", guildId, userId, e);
            return Collections.emptyList();
        }
    }
    
    /**
     * YouTube 음악 목록 조회
     */
    public List<YouTubeMusicDto> getYouTubeTracks(String guildId) {
        try {
            return guildMusicRepository.findByGuildSnowflake(guildId)
                .stream()
                .map(this::convertToYouTubeDto)
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("YouTube 음악 목록 조회 실패: guildId={}", guildId, e);
            return Collections.emptyList();
        }
    }
    
    /**
     * 오디오 파일 확장자 확인
     */
    private boolean isAudioFile(String filename) {
        String lower = filename.toLowerCase();
        return lower.endsWith(".mp3") || lower.endsWith(".wav") || 
               lower.endsWith(".ogg") || lower.endsWith(".flac") || 
               lower.endsWith(".m4a") || lower.endsWith(".aac");
    }
    
    /**
     * 로컬 파일을 DTO로 변환
     */
    private LocalMusicFileDto convertToLocalMusicDto(Path filePath) {
        String filename = filePath.getFileName().toString();
        String title = filename.substring(0, filename.lastIndexOf('.'));
        String extension = filename.substring(filename.lastIndexOf('.') + 1);
        
        return LocalMusicFileDto.builder()
            .id("local_" + Math.abs(filename.hashCode()))
            .title(title)
            .filename(filename)
            .filePath(filePath.toString())
            .size(getFileSize(filePath))
            .duration("00:00") // 추후 메타데이터 파싱으로 실제 시간 계산 가능
            .extension(extension)
            .build();
    }
    
    /**
     * GuildMusic을 YouTube DTO로 변환
     */
    private YouTubeMusicDto convertToYouTubeDto(Music guildMusic) {
        return YouTubeMusicDto.builder()
            .id("yt_" + guildMusic.getId())
            .title(guildMusic.getTitle())
            .youtubeUrl(guildMusic.getYoutubeUrl())
            .thumbnail(guildMusic.getThumbnail())
            .duration(guildMusic.getDuration())
            .createdAt(guildMusic.getCreatedAt())
            .build();
    }
    
    /**
     * 파일 크기 조회
     */
    private long getFileSize(Path filePath) {
        try {
            return Files.size(filePath);
        } catch (IOException e) {
            log.warn("파일 크기 조회 실패: {}", filePath, e);
            return 0L;
        }
    }
}