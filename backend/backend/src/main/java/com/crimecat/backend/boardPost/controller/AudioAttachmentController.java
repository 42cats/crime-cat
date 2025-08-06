package com.crimecat.backend.boardPost.controller;

import com.crimecat.backend.boardPost.service.BoardPostService;
import com.crimecat.backend.boardPost.dto.AudioUploadDto;
import com.crimecat.backend.boardPost.entity.BoardPostAttachment;
import com.crimecat.backend.boardPost.service.AudioAttachmentService;
import com.crimecat.backend.exception.ErrorResponse;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.webUser.domain.WebUser;
import java.util.UUID;
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
        HttpServletResponse response
    ) {
        try {
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
            
            // 다운로드 방지를 위한 헤더 설정
            response.setHeader("Content-Disposition", "inline");
            response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Expires", "0");
            
            // 외부 접근 방지
            response.setHeader("X-Frame-Options", "SAMEORIGIN");
            response.setHeader("X-Content-Type-Options", "nosniff");

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
}