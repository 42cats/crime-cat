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
        try {
            // Referer 검증 - 애플리케이션 도메인에서의 요청만 허용
            if (!isValidReferer(request)) {
                log.warn("Invalid referer for audio streaming request. Referer: {}, User: {}", 
                        request.getHeader("Referer"), user != null ? user.getId() : "anonymous");
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
            response.setHeader("Content-Disposition", "inline");
            response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Expires", "0");
            
            // 외부 접근 방지 및 추가 보안 헤더
            response.setHeader("X-Frame-Options", "SAMEORIGIN");
            response.setHeader("X-Content-Type-Options", "nosniff");
            response.setHeader("X-Download-Options", "noopen");
            response.setHeader("X-Robots-Tag", "noindex, nofollow, nosnippet, noarchive");

            // Range 요청 차단 (부분 다운로드 방지)
            if (request.getHeader("Range") != null) {
                log.warn("Range request blocked for audio streaming. User: {}, Filename: {}", 
                        user != null ? user.getId() : "anonymous", filename);
                response.setStatus(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE.value());
                return;
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
     * 애플리케이션 도메인에서의 요청만 허용
     */
    private boolean isValidReferer(HttpServletRequest request) {
        String referer = request.getHeader("Referer");
        
        // Referer가 없는 경우 거부 (직접 URL 접근 차단)
        if (referer == null || referer.isEmpty()) {
            return false;
        }
        
        try {
            java.net.URL refererUrl = new java.net.URL(referer);
            String refererHost = refererUrl.getHost();
            
            // 허용된 도메인 목록
            return isAllowedHost(refererHost);
            
        } catch (java.net.MalformedURLException e) {
            log.warn("Invalid referer URL format: {}", referer);
            return false;
        }
    }
    
    /**
     * 허용된 호스트인지 확인
     */
    private boolean isAllowedHost(String host) {
        if (host == null || host.isEmpty()) {
            return false;
        }
        
        // 로컬 개발 환경
        if ("localhost".equals(host) || "127.0.0.1".equals(host)) {
            return true;
        }
        
        // localhost with port
        if (host.startsWith("localhost:") || host.startsWith("127.0.0.1:")) {
            return true;
        }
        
        // ServiceUrlConfig에서 설정된 도메인 확인
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
        
        // 개발 환경에서 사용할 수 있는 내부 네트워크 대역
        if (host.startsWith("192.168.") || host.startsWith("10.0.") || host.startsWith("172.")) {
            return true;
        }
        
        log.warn("Blocked request from unauthorized host: {} (configured domain: {})", host, configuredDomain);
        return false;
    }
}