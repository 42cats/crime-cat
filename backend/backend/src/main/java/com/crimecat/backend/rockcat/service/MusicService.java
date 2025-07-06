package com.crimecat.backend.rockcat.service;

import com.crimecat.backend.rockcat.common.dto.music.LocalMusicFileDto;
import com.crimecat.backend.rockcat.common.dto.music.YouTubeMusicDto;
import com.crimecat.backend.guild.domain.Music;
import com.crimecat.backend.guild.repository.GuildMusicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MusicService {
    
    private final GuildMusicRepository guildMusicRepository;
    
    @Value("${music.local.base-path:/app/bot/MusicData}")
    private String musicBasePath;
    
    /**
     * 로컬 음악 파일 목록 조회
     */
    public List<LocalMusicFileDto> getLocalMusicFiles(String guildId, String userId) {
        try {
            // 환경 변수 기반 음악 파일 경로 설정
            String musicDir = musicBasePath + "/" + userId;
            Path musicPath = Paths.get(musicDir);
            
            log.info("로컬 음악 파일 조회 시도: guildId={}, userId={}, 기본경로={}, 전체경로={}", 
                guildId, userId, musicBasePath, musicDir);
            
            if (!Files.exists(musicPath)) {
                log.info("로컬 음악 디렉토리가 존재하지 않음: {}", musicDir);
                return Collections.emptyList();
            }
            
            List<LocalMusicFileDto> musicFiles = Files.list(musicPath)
                .filter(path -> isAudioFile(path.getFileName().toString()))
                .map(path -> convertToLocalMusicDto(path, userId))
                .sorted(Comparator.comparing(LocalMusicFileDto::getTitle))
                .collect(Collectors.toList());
                
            log.info("로컬 음악 파일 {}개 조회 완료: {}", musicFiles.size(), 
                musicFiles.stream().map(LocalMusicFileDto::getTitle).collect(Collectors.toList()));
            
            return musicFiles;
                
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
    private LocalMusicFileDto convertToLocalMusicDto(Path filePath, String userId) {
        String filename = filePath.getFileName().toString();
        String title = filename.substring(0, filename.lastIndexOf('.'));
        String extension = filename.substring(filename.lastIndexOf('.') + 1);
        String fileHash = generateFileHash(filename);
        
        return LocalMusicFileDto.builder()
            .id("local_" + userId + "_" + fileHash)
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
    
    /**
     * 파일명 기반 해시 생성
     */
    private String generateFileHash(String filename) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(filename.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString().substring(0, 8); // 처음 8자리만 사용
        } catch (NoSuchAlgorithmException e) {
            log.warn("MD5 알고리즘을 찾을 수 없음, 파일명 해시코드 사용: {}", filename);
            return String.valueOf(Math.abs(filename.hashCode()));
        }
    }
}