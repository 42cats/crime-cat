package com.crimecat.backend.boardPost.controller;

import com.crimecat.backend.boardPost.service.BoardPostService;
import com.crimecat.backend.boardPost.dto.AudioUploadDto;
import com.crimecat.backend.boardPost.dto.TempCleanupRequest;
import com.crimecat.backend.boardPost.entity.BoardPostAttachment;
import com.crimecat.backend.boardPost.service.AudioAttachmentService;
import com.crimecat.backend.config.ServiceUrlConfig;
import com.crimecat.backend.exception.ErrorResponse;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.webUser.domain.WebUser;
import java.util.UUID;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 오디오 첨부파일 API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/board/audio")
@RequiredArgsConstructor
@Slf4j
public class AudioAttachmentController {

    private final AudioAttachmentService audioAttachmentService;
    private final BoardPostService boardPostService;
    private final ServiceUrlConfig serviceUrlConfig;

    /**
     * 임시 오디오 파일 업로드
     */
    @PostMapping("/temp-upload")
    public ResponseEntity<?> uploadTempAudio(
        @RequestPart("file") MultipartFile file,
        @RequestParam(required = false) String audioTitle,
        @RequestParam(required = false, defaultValue = "PUBLIC") String accessPolicy,
        @AuthenticationPrincipal WebUser user
    ) {
        try {
            AudioUploadDto.UploadRequest request = AudioUploadDto.UploadRequest.builder()
                .audioTitle(audioTitle)
                .accessPolicy(BoardPostAttachment.AccessPolicy.valueOf(accessPolicy.toUpperCase()))
                .build();

            AudioUploadDto.TempUploadResponse response = 
                audioAttachmentService.uploadTempAudio(file, request, user);

            return ResponseEntity.ok(response);
        } catch (com.crimecat.backend.exception.ServiceException e) {
            log.warn("Audio upload service error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatus())
                .body(ErrorResponse.of(e.getErrorStatus()));
        } catch (IOException e) {
            log.error("Audio upload failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(ErrorStatus.AUDIO_FILE_UPLOAD_FAILED));
        } catch (Exception e) {
            log.error("Unexpected error during audio upload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(ErrorStatus.INTERNAL_ERROR));
        }
    }

    /**
     * 게시글의 오디오 첨부파일 목록 조회
     */
    @GetMapping("/attachments/{postId}")
    public ResponseEntity<List<AudioUploadDto.AttachmentResponse>> getAudioAttachments(
        @PathVariable String postId,
        @AuthenticationPrincipal WebUser user
    ) {
        try {
            UUID postUuid = UUID.fromString(postId);
            List<AudioUploadDto.AttachmentResponse> attachments = 
                audioAttachmentService.getAudioAttachmentsByPostId(postUuid);

            return ResponseEntity.ok(attachments);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid UUID format for post ID: {}", postId);
            return ResponseEntity.badRequest()
                .body(java.util.List.of()); // 빈 목록 반환
        } catch (Exception e) {
            log.error("Failed to get audio attachments for post: {}", postId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 오디오 파일 스트리밍
     */
    @GetMapping("/stream/{filename}")
    public void streamAudio(
        @PathVariable String filename,
        @AuthenticationPrincipal WebUser user,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        log.info("🎵 Audio stream request - filename: {}, user: {}, requestURI: {}", 
                filename, user != null ? user.getId() : "anonymous", request.getRequestURI());
        try {
            // 1. 인증된 사용자만 허용 (직접 URL 접근 차단의 첫 번째 방어선)
            if (user == null) {
                log.warn("Unauthorized access attempt to audio stream. Filename: {}", filename);
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                return;
            }
            
            // 2. Referer 검증 - 애플리케이션 도메인에서의 요청만 허용 (두 번째 방어선)
            if (!isValidReferer(request)) {
                log.warn("Invalid referer for audio streaming request. Referer: {}, User: {}", 
                        request.getHeader("Referer"), user.getId());
                response.setStatus(HttpStatus.FORBIDDEN.value());
                return;
            }
            
            // 3. User-Agent 검증 - 직접 브라우저 접근 차단 (세 번째 방어선)
            if (!isValidUserAgent(request)) {
                log.warn("Direct browser access blocked. User-Agent: {}, User: {}", 
                        request.getHeader("User-Agent"), user.getId());
                response.setStatus(HttpStatus.FORBIDDEN.value());
                return;
            }
            
            // 스트리밍 정보 조회 및 권한 확인
            Optional<AudioUploadDto.StreamingInfo> streamingInfoOpt = 
                audioAttachmentService.getStreamingInfo(filename, user);

            if (streamingInfoOpt.isEmpty()) {
                response.setStatus(HttpStatus.NOT_FOUND.value());
                return;
            }

            AudioUploadDto.StreamingInfo streamingInfo = streamingInfoOpt.get();

            // 응답 헤더 설정
            response.setContentType(streamingInfo.getContentType());
            response.setContentLengthLong(streamingInfo.getFileSize());
            
            // 다운로드 방지를 위한 헤더 설정 강화
            response.setHeader("Content-Disposition", "inline; filename=\"stream.audio\"");
            response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, private");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Expires", "0");
            
            // 외부 접근 방지 및 추가 보안 헤더
            response.setHeader("X-Frame-Options", "SAMEORIGIN");
            response.setHeader("X-Content-Type-Options", "nosniff");
            response.setHeader("X-Download-Options", "noopen");
            response.setHeader("X-Robots-Tag", "noindex, nofollow, nosnippet, noarchive");
            
            // 스트리밍 전용 헤더 추가
            response.setHeader("Accept-Ranges", "bytes");
            response.setHeader("X-Content-Source", "stream-only");

            // Range 요청 처리 (JWT 인증된 사용자는 허용)
            String rangeHeader = request.getHeader("Range");
            if (rangeHeader != null) {
                if (user != null && isValidReferer(request)) {
                    // 인증된 사용자의 정상적인 스트리밍 요청은 허용
                    handleRangeRequest(request, response, streamingInfo, filename);
                    return;
                } else {
                    log.warn("Range request blocked for unauthorized access. User: {}, Filename: {}", 
                            user != null ? user.getId() : "anonymous", filename);
                    response.setStatus(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE.value());
                    return;
                }
            }

            // 파일 스트리밍
            try (InputStream inputStream = audioAttachmentService.getAudioStream(filename)) {
                StreamUtils.copy(inputStream, response.getOutputStream());
                response.flushBuffer();
            }

        } catch (IOException e) {
            log.error("Failed to stream audio file: {}", filename, e);
            response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
        } catch (Exception e) {
            log.error("Unexpected error during audio streaming: {}", filename, e);
            response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
        }
    }

    /**
     * 오디오 파일 메타정보 조회
     */
    @GetMapping("/info/{filename}")
    public ResponseEntity<?> getAudioInfo(
        @PathVariable String filename,
        @AuthenticationPrincipal WebUser user
    ) {
        try {
            Optional<AudioUploadDto.StreamingInfo> streamingInfoOpt = 
                audioAttachmentService.getStreamingInfo(filename, user);

            if (streamingInfoOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ErrorResponse.of(ErrorStatus.AUDIO_FILE_NOT_FOUND));
            }

            return ResponseEntity.ok(streamingInfoOpt.get());
        } catch (Exception e) {
            log.error("Failed to get audio info: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(ErrorStatus.INTERNAL_ERROR));
        }
    }

    /**
     * 임시 오디오 파일 정리
     */
    @PostMapping("/temp-cleanup")
    public ResponseEntity<?> cleanupTempFiles(
        @RequestBody TempCleanupRequest request,
        @AuthenticationPrincipal WebUser user
    ) {
        try {
            audioAttachmentService.cleanupUserTempFiles(request.getTempIds(), user.getId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to cleanup temp files for user: {}", user.getId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(ErrorStatus.INTERNAL_ERROR));
        }
    }
    
    /**
     * Referer 검증 메서드
     * JWT 인증 완료된 사용자의 직접 URL 접근 방지용
     */
    private boolean isValidReferer(HttpServletRequest request) {
        String referer = request.getHeader("Referer");
        
        // Referer가 없는 경우 개발 환경에서만 허용
        if (referer == null || referer.isEmpty()) {
            if (isDevelopmentEnvironment()) {
                log.debug("Allowing empty referer in development environment");
                return true;
            }
            log.warn("Empty referer blocked in production environment");
            return false;
        }
        
        try {
            java.net.URL refererUrl = new java.net.URL(referer);
            String refererHost = refererUrl.getHost();
            
            // 허용된 도메인 목록 검증
            return isAllowedHost(refererHost);
            
        } catch (java.net.MalformedURLException e) {
            log.warn("Invalid referer URL format: {}", referer);
            return false;
        }
    }
    
    /**
     * 개발 환경 여부 확인
     */
    private boolean isDevelopmentEnvironment() {
        String profiles = System.getProperty("spring.profiles.active");
        return profiles != null && (profiles.contains("dev") || profiles.contains("local"));
    }
    
    /**
     * 허용된 호스트인지 확인
     */
    private boolean isAllowedHost(String host) {
        if (host == null || host.isEmpty()) {
            return false;
        }
        
        // ServiceUrlConfig에서 설정된 도메인 확인 (프로덕션/개발 공통)
        String configuredDomain = serviceUrlConfig.getDomain();
        if (configuredDomain != null && !configuredDomain.isEmpty()) {
            // 정확한 도메인 매칭
            if (configuredDomain.equals(host)) {
                return true;
            }
            
            // 서브도메인 포함 매칭 (예: sub.domain.com이 domain.com 설정에 매칭)
            if (host.endsWith("." + configuredDomain)) {
                return true;
            }
            
            // www 프리픽스 처리
            if (("www." + configuredDomain).equals(host)) {
                return true;
            }
        }
        
        // 개발 환경에서만 허용되는 호스트들
        if (isDevelopmentEnvironment()) {
            // 로컬 개발 환경
            if ("localhost".equals(host) || "127.0.0.1".equals(host)) {
                return true;
            }
            
            // localhost with port
            if (host.startsWith("localhost:") || host.startsWith("127.0.0.1:")) {
                return true;
            }
            
            // 내부 네트워크 대역 (개발 환경에서만)
            if (host.startsWith("192.168.") || host.startsWith("10.0.")) {
                return true;
            }
            
            // Docker 환경 대역 (개발 환경에서만)
            if (host.startsWith("172.") && host.matches("172\\.(1[6-9]|2[0-9]|3[01])\\..*")) {
                return true;
            }
        }
        
        log.warn("Blocked request from unauthorized host: {} (configured domain: {}, dev mode: {})", 
                host, configuredDomain, isDevelopmentEnvironment());
        return false;
    }
    
    /**
     * User-Agent 검증 - 직접 브라우저 접근 차단
     * 정상적인 AJAX 요청과 직접 브라우저 접근을 구분
     */
    private boolean isValidUserAgent(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        
        if (userAgent == null || userAgent.isEmpty()) {
            log.warn("Empty User-Agent blocked");
            return false;
        }
        
        // 개발 환경에서는 엄격하지 않게 처리
        if (isDevelopmentEnvironment()) {
            return true;
        }
        
        // 일반적인 브라우저의 직접 접근 패턴 차단
        // 정상적인 AJAX 요청은 XMLHttpRequest 특성을 가짐
        String requestedWith = request.getHeader("X-Requested-With");
        String accept = request.getHeader("Accept");
        
        // XMLHttpRequest나 fetch API를 통한 요청인지 확인
        boolean isValidRequest = 
            // X-Requested-With 헤더 확인
            "XMLHttpRequest".equals(requestedWith) ||
            // Accept 헤더가 명시적으로 audio/* 또는 */* 요청인지 확인
            (accept != null && (accept.contains("application/json") || 
                               accept.contains("*/*") || 
                               accept.contains("audio/*"))) ||
            // 모바일 앱에서의 요청 허용
            (userAgent.contains("Mobile") && !userAgent.contains("Chrome/") && !userAgent.contains("Safari/"));
        
        if (!isValidRequest) {
            log.warn("Direct browser access detected - User-Agent: {}, Accept: {}, X-Requested-With: {}", 
                    userAgent, accept, requestedWith);
            return false;
        }
        
        return true;
    }
    
    /**
     * Range 요청 처리 - 부분 스트리밍 지원
     */
    private void handleRangeRequest(HttpServletRequest request, HttpServletResponse response, 
                                   AudioUploadDto.StreamingInfo streamingInfo, String filename) throws IOException {
        String rangeHeader = request.getHeader("Range");
        long fileSize = streamingInfo.getFileSize();
        
        // Range 헤더 파싱 (bytes=start-end)
        if (!rangeHeader.startsWith("bytes=")) {
            response.setStatus(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE.value());
            response.setHeader("Content-Range", "bytes */" + fileSize);
            return;
        }
        
        String rangeValue = rangeHeader.substring(6);
        String[] ranges = rangeValue.split("-");
        
        long start = 0;
        long end = fileSize - 1;
        
        try {
            if (ranges.length >= 1 && !ranges[0].isEmpty()) {
                start = Long.parseLong(ranges[0]);
            }
            if (ranges.length >= 2 && !ranges[1].isEmpty()) {
                end = Long.parseLong(ranges[1]);
            }
            
            // 범위 검증
            if (start < 0 || end >= fileSize || start > end) {
                response.setStatus(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE.value());
                response.setHeader("Content-Range", "bytes */" + fileSize);
                return;
            }
            
        } catch (NumberFormatException e) {
            response.setStatus(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE.value());
            response.setHeader("Content-Range", "bytes */" + fileSize);
            return;
        }
        
        // 응답 헤더 설정
        long contentLength = end - start + 1;
        response.setStatus(HttpStatus.PARTIAL_CONTENT.value());
        response.setContentType(streamingInfo.getContentType());
        response.setHeader("Accept-Ranges", "bytes");
        response.setHeader("Content-Range", String.format("bytes %d-%d/%d", start, end, fileSize));
        response.setHeader("Content-Length", String.valueOf(contentLength));
        
        // 다운로드 방지 헤더 유지
        response.setHeader("Content-Disposition", "inline");
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        
        // 부분 파일 스트리밍
        try (InputStream inputStream = audioAttachmentService.getAudioStream(filename)) {
            // 시작 위치까지 스킵
            long skipped = inputStream.skip(start);
            if (skipped != start) {
                log.warn("Failed to skip to start position {} for file {}", start, filename);
                response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
                return;
            }
            
            // 지정된 길이만큼 복사
            byte[] buffer = new byte[8192];
            long remaining = contentLength;
            
            while (remaining > 0) {
                int toRead = (int) Math.min(buffer.length, remaining);
                int bytesRead = inputStream.read(buffer, 0, toRead);
                
                if (bytesRead == -1) {
                    break;
                }
                
                response.getOutputStream().write(buffer, 0, bytesRead);
                remaining -= bytesRead;
            }
            
            response.flushBuffer();
            
        } catch (IOException e) {
            log.error("Failed to stream range for file: {} (range: {}-{})", filename, start, end, e);
            throw e;
        }
    }
}