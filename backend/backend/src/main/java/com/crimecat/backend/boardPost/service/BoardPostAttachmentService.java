package com.crimecat.backend.boardPost.service;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.entity.BoardPostAttachment;
import com.crimecat.backend.boardPost.entity.TempAttachment;
import com.crimecat.backend.boardPost.repository.BoardPostAttachmentRepository;
import com.crimecat.backend.boardPost.repository.TempAttachmentRepository;
import com.crimecat.backend.storage.StorageFileType;
import com.crimecat.backend.storage.StorageService;
import com.crimecat.backend.utils.FileUtil;
import java.io.IOException;
import java.util.Map;
import java.util.HashMap;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 게시글 첨부파일 통합 서비스
 * AudioAttachmentService와 분리하여 게시글 작성/수정 시 사용
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BoardPostAttachmentService {

    private final BoardPostAttachmentRepository attachmentRepository;
    private final TempAttachmentRepository tempAttachmentRepository;
    private final StorageService storageService; // StorageService 주입

    /**
     * 임시 첨부파일을 정식 첨부파일로 변환 (게시글 작성 시)
     */
    @Transactional
    public Map<String, String> convertTempAttachmentsToPost(
        List<String> tempIds,
        BoardPost boardPost
    ) {
        if (tempIds == null || tempIds.isEmpty()) {
            return Map.of();
        }

        Map<String, String> tempIdToStoredFilenameMap = new HashMap<>();

        List<TempAttachment> tempAttachments = tempIds.stream()
            .map(tempAttachmentRepository::findByTempId)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .filter(temp -> !temp.isExpired())
            .collect(Collectors.toList());

        List<BoardPostAttachment> attachments = tempAttachments.stream()
            .map(temp -> {
                try {
                    String sourcePath = "temp/" + temp.getStoredFilename() + FileUtil.getExtension(temp.getOriginalFilename());
                    String destStoredFilename = temp.getStoredFilename() + FileUtil.getExtension(temp.getOriginalFilename());
                    storageService.move(StorageFileType.BOARD_POST_AUDIO, sourcePath, destStoredFilename);
                    int sortOrder = tempAttachments.indexOf(temp);
                    tempIdToStoredFilenameMap.put(temp.getTempId(), destStoredFilename);
                    return temp.toAttachment(boardPost, sortOrder);
                } catch (IOException e) {
                    log.error("Failed to move temp file to permanent storage: {}", temp.getStoredFilename(), e);
                    return null; // 이동 실패 시 null 반환
                }
            })
            .filter(Objects::nonNull) // 이동 실패한 항목 제외
            .collect(Collectors.toList());

        // 정식 첨부파일 저장
        attachmentRepository.saveAll(attachments);

        // 임시 첨부파일 DB 레코드 및 (실패 시 남은) 파일 삭제
        tempAttachmentRepository.deleteAll(tempAttachments);

        log.info("Converted {} temp attachments to permanent for post: {}", 
                attachments.size(), boardPost.getId());

        return tempIdToStoredFilenameMap;
    }

    /**
     * 게시글의 모든 첨부파일 조회
     */
    public List<BoardPostAttachment> getAttachmentsByBoardPost(BoardPost boardPost) {
        return attachmentRepository.findByBoardPostOrderBySortOrder(boardPost);
    }

    /**
     * 게시글 삭제 시 첨부파일도 함께 삭제
     */
    @Transactional
    public void deleteAttachmentsByBoardPost(BoardPost boardPost) {
        List<BoardPostAttachment> attachments = attachmentRepository.findByBoardPostOrderBySortOrder(boardPost);
        
        for (BoardPostAttachment attachment : attachments) {
            try {
                storageService.delete(StorageFileType.BOARD_POST_AUDIO, attachment.getStoredFilename());
            } catch (Exception e) {
                log.warn("Failed to delete attachment file from storage: {}", attachment.getStoredFilename(), e);
            }
        }
        attachmentRepository.deleteAll(attachments);
        
        log.info("Deleted {} attachments for post: {}", attachments.size(), boardPost.getId());
    }

    /**
     * 게시글 본문과 실제 첨부파일을 비교하여 고아 파일 정리
     */
    @Transactional
    public void cleanupOrphanedAttachments(BoardPost boardPost, String currentContent) {
        List<BoardPostAttachment> existingAttachments = getAttachmentsByBoardPost(boardPost);
        if (existingAttachments.isEmpty()) {
            return;
        }

        // 본문에서 현재 사용중인 파일 ID(storedFilename) 목록 추출
        Set<String> usedFilenames = extractAudioFilenamesFromContent(currentContent);

        // 고아 파일(본문에는 없는데 DB에는 있는 파일) 식별
        List<BoardPostAttachment> orphanedAttachments = existingAttachments.stream()
                .filter(att -> !usedFilenames.contains(att.getStoredFilename()))
                .collect(Collectors.toList());

        if (!orphanedAttachments.isEmpty()) {
            log.info("Found {} orphaned attachments for post {}. Cleaning up...", orphanedAttachments.size(), boardPost.getId());
            for (BoardPostAttachment orphan : orphanedAttachments) {
                // 1. 스토리지에서 실제 파일 삭제
                try {
                    storageService.delete(StorageFileType.BOARD_POST_AUDIO, orphan.getStoredFilename());
                } catch (Exception e) {
                    log.warn("Failed to delete orphaned file from storage: {}", orphan.getStoredFilename(), e);
                }
                // 2. 데이터베이스에서 레코드 삭제
                attachmentRepository.delete(orphan);
            }
        }
    }

    /**
     * HTML/Markdown 본문에서 오디오 파일명을 추출하고 확장자를 제거하여 storedFilename과 매칭 가능하도록 변환
     */
    private Set<String> extractAudioFilenamesFromContent(String content) {
        if (content == null || content.isEmpty()) {
            return Set.of();
        }
        
        Set<String> filenames = new java.util.HashSet<>();
        
        // 1. HTML audio 태그에서 추출: src="/api/v1/board/audio/stream/FILENAME" 또는 src="/board/audio/stream/FILENAME"
        Pattern htmlPattern = Pattern.compile("src=\"(?:/api/v1)?/board/audio/stream/([a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9]+)?)\"");
        Matcher htmlMatcher = htmlPattern.matcher(content);
        while (htmlMatcher.find()) {
            String fullFilename = htmlMatcher.group(1); // "uuid.mp3"
            String storedFilename = FileUtil.getNameWithoutExtension(fullFilename); // "uuid"
            filenames.add(storedFilename);
        }
        
        // 2. 마크다운 오디오 문법에서 추출: [audio:title](/api/v1/board/audio/stream/FILENAME) 또는 [audio:title](/board/audio/stream/FILENAME)
        Pattern markdownPattern = Pattern.compile("\\[audio:[^\\]]*\\]\\((?:/api/v1)?/board/audio/stream/([a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9]+)?)\\)");
        Matcher markdownMatcher = markdownPattern.matcher(content);
        while (markdownMatcher.find()) {
            String fullFilename = markdownMatcher.group(1); // "uuid.mp3"
            String storedFilename = FileUtil.getNameWithoutExtension(fullFilename); // "uuid"
            filenames.add(storedFilename);
        }
        
        log.debug("Extracted {} audio filenames from content (HTML: {}, Markdown: {})", 
                filenames.size(), 
                htmlPattern.matcher(content).results().count(),
                markdownPattern.matcher(content).results().count());
        
        return filenames;
    }
}