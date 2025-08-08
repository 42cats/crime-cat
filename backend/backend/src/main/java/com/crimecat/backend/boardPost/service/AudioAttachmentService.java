package com.crimecat.backend.boardPost.service;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.dto.AudioUploadDto;
import com.crimecat.backend.boardPost.entity.BoardPostAttachment;
import com.crimecat.backend.boardPost.entity.TempAttachment;
import com.crimecat.backend.boardPost.repository.BoardPostAttachmentRepository;
import com.crimecat.backend.boardPost.repository.TempAttachmentRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.storage.StorageFileType;
import com.crimecat.backend.storage.StorageService;
import com.crimecat.backend.utils.FileUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 오디오 첨부파일 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AudioAttachmentService {

    private final BoardPostAttachmentRepository attachmentRepository;
    private final TempAttachmentRepository tempAttachmentRepository;
    private final StorageService storageService;

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
        "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/aac"
    );

    /**
     * 임시 오디오 파일 업로드
     */
    @Transactional
    public AudioUploadDto.TempUploadResponse uploadTempAudio(
        MultipartFile file,
        AudioUploadDto.UploadRequest request,
        WebUser user
    ) throws IOException {
        log.info("🚀 uploadTempAudio() 시작 - filename: {}, user: {}", file.getOriginalFilename(), user.getId());
        
        // 파일 검증
        validateAudioFile(file);
        log.info("✅ 파일 검증 완료");

        // 접근 정책 검증 (역할별 제한)
        validateAccessPolicy(request.getAccessPolicy(), user);
        log.info("✅ 접근 정책 검증 완료 - policy: {}", request.getAccessPolicy());

        // 저장 파일명 생성 (확장자 제외)
        String originalFilename = file.getOriginalFilename();
        String storedFilenameBase = generateStoredFilenameBase(originalFilename);
        String tempPathAndFilename = "temp/" + storedFilenameBase;
        log.info("📁 파일명 생성 - storedFilenameBase: {}, tempPath: {}", storedFilenameBase, tempPathAndFilename);

        // 파일 저장 (StorageService가 확장자를 붙일 것임)
        storageService.storeAt(StorageFileType.BOARD_POST_AUDIO, file, tempPathAndFilename);
        log.info("💾 파일 저장 완료 - path: {}", tempPathAndFilename);

        // 오디오 메타데이터 추출
        AudioUploadDto.AudioMetadata metadata = extractAudioMetadata(file, request.getAudioTitle());
        log.info("🎵 메타데이터 추출 완료 - title: {}", metadata.getAudioTitle());

        // 임시 첨부파일 생성
        String tempId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusHours(24); // 24시간 후 만료
        log.info("🕒 시간 정보 - 현재: {}, 만료: {}", now, expiresAt);

        TempAttachment tempAttachment = TempAttachment.createTempAttachment(
            tempId,
            originalFilename,
            storedFilenameBase, // DB에는 확장자 없는 순수 UUID만 저장
            file.getContentType(),
            file.getSize(),
            user,
            metadata.getAudioTitle(),
            metadata.getDurationSeconds(),
            request.getAccessPolicy(),
            expiresAt
        );
        log.info("📋 TempAttachment 객체 생성 완료 - tempId: {}, storedFilename: {}", tempId, storedFilenameBase);

        TempAttachment savedAttachment = tempAttachmentRepository.save(tempAttachment);
        log.info("💿 DB 저장 완료 - id: {}, tempId: {}", savedAttachment.getId(), savedAttachment.getTempId());

        // 저장 직후 즉시 조회 테스트
        Optional<TempAttachment> verifyOpt = tempAttachmentRepository.findByTempId(tempId);
        log.info("🔍 저장 직후 조회 테스트 - 결과: {}", verifyOpt.isPresent() ? "FOUND" : "NOT_FOUND");
        if (verifyOpt.isPresent()) {
            TempAttachment verify = verifyOpt.get();
            log.info("✅ 조회된 데이터 - tempId: {}, storedFilename: {}, expired: {}", 
                    verify.getTempId(), verify.getStoredFilename(), verify.isExpired());
        }

        log.info("Temp audio uploaded: tempId={}, user={}, filename={}", 
                tempId, user.getId(), originalFilename);

        return AudioUploadDto.TempUploadResponse.builder()
            .tempId(tempId)
            .originalFilename(originalFilename)
            .audioTitle(metadata.getAudioTitle())
            .fileSize(file.getSize())
            .durationSeconds(metadata.getDurationSeconds())
            .accessPolicy(request.getAccessPolicy())
            .uploadedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .expiresAt(expiresAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .build();
    }

    /**
     * 임시 첨부파일을 정식 첨부파일로 변환
     */
    @Transactional
    public List<BoardPostAttachment> convertTempAttachments(
        List<String> tempIds,
        BoardPost boardPost
    ) {
        List<TempAttachment> tempAttachments = tempIds.stream()
            .map(tempAttachmentRepository::findByTempId)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .filter(temp -> !temp.isExpired())
            .collect(Collectors.toList());

        List<BoardPostAttachment> attachments = tempAttachments.stream()
            .map(temp -> {
                int sortOrder = tempAttachments.indexOf(temp);
                return temp.toAttachment(boardPost, sortOrder);
            })
            .collect(Collectors.toList());

        // 정식 첨부파일 저장
        attachmentRepository.saveAll(attachments);

        // 임시 첨부파일 삭제
        tempAttachmentRepository.deleteAll(tempAttachments);

        log.info("Converted {} temp attachments to permanent for post: {}", 
                attachments.size(), boardPost.getId());

        return attachments;
    }

    /**
     * 게시글의 오디오 첨부파일 조회 (UUID로)
     */
    public List<AudioUploadDto.AttachmentResponse> getAudioAttachmentsByPostId(UUID postId) {
        List<BoardPostAttachment> attachments = attachmentRepository.findByBoardPost_IdAndAttachmentType(postId, BoardPostAttachment.AttachmentType.AUDIO);

        return attachments.stream()
            .map(this::toAttachmentResponse)
            .collect(Collectors.toList());
    }

    /**
     * 게시글의 오디오 첨부파일 조회 (기존)
     */
    public List<AudioUploadDto.AttachmentResponse> getAudioAttachments(BoardPost boardPost) {
        List<BoardPostAttachment> attachments = attachmentRepository.findAudioAttachmentsByBoardPost(boardPost);

        return attachments.stream()
            .map(this::toAttachmentResponse)
            .collect(Collectors.toList());
    }

    /**
     * 첨부파일 스트리밍 정보 조회
     * identifier는 tempId 또는 storedFilename (확장자 포함/제외 모두 허용)일 수 있습니다.
     */
    public Optional<AudioUploadDto.StreamingInfo> getStreamingInfo(String identifier, WebUser user) {
        log.info("🔍 getStreamingInfo() - identifier: {}, user: {}", identifier, user != null ? user.getId() : "null");
        
        // 1. 임시 파일로 조회 (tempId 기준)
        Optional<TempAttachment> tempAttachmentOpt = tempAttachmentRepository.findByTempId(identifier);
        log.info("📋 TempAttachment 조회 결과: {}", tempAttachmentOpt.isPresent() ? "FOUND" : "NOT_FOUND");
        
        if (tempAttachmentOpt.isPresent()) {
            TempAttachment temp = tempAttachmentOpt.get();
            log.info("📄 TempAttachment 정보 - tempId: {}, storedFilename: {}, userId: {}, expired: {}", 
                    temp.getTempId(), temp.getStoredFilename(), temp.getUser().getId(), temp.isExpired());
            
            // 임시 파일은 업로드한 사용자만 접근 가능
            if (user != null && temp.getUser().getId().equals(user.getId())) {
                log.info("✅ 임시 파일 접근 권한 확인됨 - 스트리밍 정보 반환");
                return Optional.of(AudioUploadDto.StreamingInfo.builder()
                        .streamingUrl("/board/audio/stream/" + temp.getTempId())
                        .contentType(temp.getContentType())
                        .fileSize(temp.getFileSize())
                        .durationSeconds(temp.getDurationSeconds())
                        .requiresAuth(temp.getAccessPolicy() == BoardPostAttachment.AccessPolicy.PRIVATE)
                        .build());
            } else {
                log.warn("❌ 임시 파일 접근 권한 없음 - user: {}, fileUserId: {}", 
                        user != null ? user.getId() : "null", temp.getUser().getId());
            }
        }

        // 2. 정식 첨부파일로 조회 (storedFilename 기준)
        // 프론트에서 확장자가 포함되어 올 수 있으므로 항상 확장자를 제거하고 조회
        String storedFilenameWithoutExtension = FileUtil.getNameWithoutExtension(identifier);
        log.info("🔍 정식 첨부파일 조회 - storedFilename: {}", storedFilenameWithoutExtension);
        
        BoardPostAttachment attachment = attachmentRepository.findByStoredFilename(storedFilenameWithoutExtension);
        log.info("📋 BoardPostAttachment 조회 결과: {}", attachment != null ? "FOUND" : "NOT_FOUND");
        
        if (attachment != null) {
            boolean isAccessible = attachment.isAccessible(user);
            log.info("🔐 정식 첨부파일 접근 권한: {}", isAccessible ? "GRANTED" : "DENIED");
            
            if (isAccessible) {
                log.info("✅ 정식 첨부파일 접근 권한 확인됨 - 스트리밍 정보 반환");
                return Optional.of(AudioUploadDto.StreamingInfo.builder()
                        .streamingUrl("/board/audio/stream/" + attachment.getStoredFilename() + FileUtil.getExtension(attachment.getOriginalFilename()))
                        .contentType(attachment.getContentType())
                        .fileSize(attachment.getFileSize())
                        .durationSeconds(attachment.getDurationSeconds())
                        .requiresAuth(attachment.getAccessPolicy() == BoardPostAttachment.AccessPolicy.PRIVATE)
                        .build());
            }
        }

        log.warn("❌ 스트리밍 정보를 찾을 수 없음 - identifier: {}", identifier);
        return Optional.empty();
    }

    /**
     * 오디오 파일 스트림 제공
     * identifier는 tempId 또는 storedFilename (확장자 포함/제외 모두 허용)일 수 있습니다.
     */
    public InputStream getAudioStream(String identifier) throws IOException {
        String filenameToLoad;

        // 1. 임시 파일로 조회 (tempId 기준)
        Optional<TempAttachment> tempAttachmentOpt = tempAttachmentRepository.findByTempId(identifier);
        if (tempAttachmentOpt.isPresent()) {
            TempAttachment temp = tempAttachmentOpt.get();
            String extension = FileUtil.getExtension(temp.getOriginalFilename());
            filenameToLoad = StorageFileType.BOARD_POST_AUDIO.getUploadDir() + "/temp/" + temp.getStoredFilename() + extension;
            return storageService.loadAsResource(filenameToLoad).getInputStream();
        }

        // 2. 정식 첨부파일로 조회
        // 프론트에서 확장자가 포함되어 올 수 있으므로 항상 확장자를 제거하고 조회
        String storedFilenameWithoutExtension = FileUtil.getNameWithoutExtension(identifier);
        BoardPostAttachment attachment = attachmentRepository.findByStoredFilename(storedFilenameWithoutExtension);
        if (attachment != null) {
            String extension = FileUtil.getExtension(attachment.getOriginalFilename());
            filenameToLoad = StorageFileType.BOARD_POST_AUDIO.getUploadDir() + "/" + attachment.getStoredFilename() + extension;
            return storageService.loadAsResource(filenameToLoad).getInputStream();
        }

        throw new IOException("File not found for identifier: " + identifier);
    }

    /**
     * 사용자가 요청한 특정 임시 파일들 정리
     */
    @Transactional
    public void cleanupUserTempFiles(List<String> tempIds, UUID userId) {
        if (tempIds == null || tempIds.isEmpty()) {
            return;
        }

        List<TempAttachment> userTempAttachments = tempIds.stream()
            .map(tempAttachmentRepository::findByTempId)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .filter(temp -> temp.getUser().getId().equals(userId)) // 사용자 검증
            .collect(Collectors.toList());

        for (TempAttachment temp : userTempAttachments) {
            try {
                // 파일 삭제
                String extension = FileUtil.getExtension(temp.getOriginalFilename());
                String tempPath = "temp/" + temp.getStoredFilename() + extension;
                storageService.delete(StorageFileType.BOARD_POST_AUDIO, tempPath);
                log.debug("Deleted user temp file: {}", temp.getStoredFilename());
            } catch (Exception e) {
                log.warn("Failed to delete user temp file: {}", temp.getStoredFilename(), e);
            }
        }

        // DB에서 삭제
        tempAttachmentRepository.deleteAll(userTempAttachments);
        if (!userTempAttachments.isEmpty()) {
            log.info("Cleaned up {} user temp attachments for user {}", userTempAttachments.size(), userId);
        }
    }

    /**
     * 만료된 임시 첨부파일 정리 (스케줄링)
     */
//    @Scheduled(fixedRate = 3600000) // 1시간마다 실행
    @Transactional
    public void cleanupExpiredTempAttachments() {
        List<TempAttachment> expiredAttachments = tempAttachmentRepository.findExpiredAttachments(LocalDateTime.now());
        
        for (TempAttachment temp : expiredAttachments) {
            try {
                // 파일 삭제
                storageService.delete(StorageFileType.BOARD_POST_AUDIO, temp.getStoredFilename());
                log.debug("Deleted expired temp file: {}", temp.getStoredFilename());
            } catch (Exception e) {
                log.warn("Failed to delete expired temp file: {}", temp.getStoredFilename(), e);
            }
        }

        // DB에서 삭제
        int deletedCount = tempAttachmentRepository.deleteExpiredAttachments(LocalDateTime.now());
        if (deletedCount > 0) {
            log.info("Cleaned up {} expired temp attachments", deletedCount);
        }
    }

    /**
     * 파일 검증
     */
    private void validateAudioFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw ErrorStatus.INVALID_INPUT.asServiceException();
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw ErrorStatus.AUDIO_FILE_SIZE_EXCEEDED.asServiceException();
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw ErrorStatus.AUDIO_FILE_INVALID_FORMAT.asServiceException();
        }
    }

    /**
     * 접근 정책 검증 (역할별)
     */
    private void validateAccessPolicy(BoardPostAttachment.AccessPolicy accessPolicy, WebUser user) {
        // USER 역할은 PUBLIC만 설정 가능
        if (user.getRole() == com.crimecat.backend.webUser.enums.UserRole.USER 
            && accessPolicy == BoardPostAttachment.AccessPolicy.PRIVATE) {
            throw ErrorStatus.AUDIO_ACCESS_POLICY_INVALID.asServiceException();
        }
    }

    /**
     * 저장 파일명 생성 (확장자 제외)
     */
    private String generateStoredFilenameBase(String originalFilename) {
        return UUID.randomUUID().toString();
    }

    /**
     * 오디오 메타데이터 추출 (간단한 구현)
     */
    private AudioUploadDto.AudioMetadata extractAudioMetadata(MultipartFile file, String audioTitle) {
        // 실제 구현에서는 오디오 라이브러리를 사용하여 메타데이터 추출
        String finalTitle = audioTitle != null && !audioTitle.trim().isEmpty() 
            ? audioTitle : file.getOriginalFilename();

        return AudioUploadDto.AudioMetadata.builder()
            .audioTitle(finalTitle)
            .durationSeconds(null) // TODO: 실제 구현 시 메타데이터에서 추출
            .contentType(file.getContentType())
            .fileSize(file.getSize())
            .build();
    }

    /**
     * AttachmentResponse 변환
     */
    private AudioUploadDto.AttachmentResponse toAttachmentResponse(BoardPostAttachment attachment) {
        return AudioUploadDto.AttachmentResponse.builder()
            .id(attachment.getId().toString())
            .originalFilename(attachment.getOriginalFilename())
            .audioTitle(attachment.getAudioTitle())
            .fileSize(attachment.getFileSize())
            .durationSeconds(attachment.getDurationSeconds())
            .accessPolicy(attachment.getAccessPolicy())
            .sortOrder(attachment.getSortOrder())
            .streamingUrl("/board/audio/stream/" + attachment.getStoredFilename())
            .createdAt(attachment.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .build();
    }
}