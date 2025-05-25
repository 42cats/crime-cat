package com.crimecat.backend.comment.service;

import com.crimecat.backend.comment.domain.EscapeRoomComment;
import com.crimecat.backend.comment.domain.EscapeRoomCommentLike;
import com.crimecat.backend.comment.dto.EscapeRoomCommentCreateDto;
import com.crimecat.backend.comment.dto.EscapeRoomCommentResponseDto;
import com.crimecat.backend.comment.dto.EscapeRoomCommentUpdateDto;
import com.crimecat.backend.comment.repository.EscapeRoomCommentRepository;
import com.crimecat.backend.comment.repository.EscapeRoomCommentLikeRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import com.crimecat.backend.gameHistory.repository.EscapeRoomHistoryRepository;
import com.crimecat.backend.gameHistory.service.EscapeRoomHistoryService;
import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import com.crimecat.backend.gametheme.repository.EscapeRoomThemeRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import com.crimecat.backend.utils.AuthenticationUtil;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Set;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EscapeRoomCommentService {
    
    private final EscapeRoomCommentRepository escapeRoomCommentRepository;
    private final EscapeRoomCommentLikeRepository escapeRoomCommentLikeRepository;
    private final EscapeRoomThemeRepository escapeRoomThemeRepository;
    private final EscapeRoomHistoryRepository escapeRoomHistoryRepository;
    private final WebUserRepository webUserRepository;
    private final EscapeRoomHistoryService escapeRoomHistoryService;
    
    /**
     * 댓글 생성
     */
    @Transactional
    public EscapeRoomCommentResponseDto createComment(EscapeRoomCommentCreateDto dto) {
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserIdOptional()
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        // 사용자 조회
        WebUser webUser = webUserRepository.findById(currentUserId)
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        // 테마 조회
        EscapeRoomTheme theme = escapeRoomThemeRepository.findById(dto.getEscapeRoomThemeId())
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        
        // 게임 기록 조회 (있는 경우)
        EscapeRoomHistory history = null;
        if (dto.getEscapeRoomHistoryId() != null) {
            history = escapeRoomHistoryRepository.findByIdAndDeletedAtIsNull(dto.getEscapeRoomHistoryId())
                    .orElseThrow(ErrorStatus.GAME_HISTORY_NOT_FOUND::asServiceException);
            
            // 게임 기록 작성자 확인
            if (!history.isAuthor(currentUserId)) {
                throw ErrorStatus.FORBIDDEN.asServiceException();
            }
            
            // 게임 기록과 테마 일치 확인
            if (!history.getEscapeRoomTheme().getId().equals(dto.getEscapeRoomThemeId())) {
                throw ErrorStatus.INVALID_INPUT.asServiceException();
            }
        }
        
        // 부모 댓글 조회 (대댓글인 경우)
        EscapeRoomComment parentComment = null;
        if (dto.getParentCommentId() != null) {
            parentComment = escapeRoomCommentRepository.findByIdWithDetails(dto.getParentCommentId())
                    .filter(c -> c.getDeletedAt() == null)
                    .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);
            
            // 부모 댓글과 테마 일치 확인
            if (!parentComment.getEscapeRoomTheme().getId().equals(dto.getEscapeRoomThemeId())) {
                throw ErrorStatus.INVALID_INPUT.asServiceException();
            }
        }
        
        // 스포일러 댓글 작성 권한 확인
        if (dto.getHasSpoiler() != null && dto.getHasSpoiler()) {
            // 스포일러 댓글은 해당 테마를 플레이한 사용자만 작성 가능
            boolean hasPlayed = escapeRoomHistoryService.hasPlayedTheme(currentUserId, theme.getId());
            if (!hasPlayed) {
                throw ErrorStatus.FORBIDDEN.asServiceException();
            }
        }
        
        // 댓글 생성
        EscapeRoomComment comment = EscapeRoomComment.builder()
                .escapeRoomTheme(theme)
                .webUser(webUser)
                .escapeRoomHistory(history)
                .parentComment(parentComment)
                .content(dto.getContent().trim())
                .isSpoiler(dto.getHasSpoiler() != null ? dto.getHasSpoiler() : false)
                .build();

        EscapeRoomComment savedComment = escapeRoomCommentRepository.save(comment);
        log.info("방탈출 댓글 생성 완료 - commentId: {}, userId: {}, themeId: {}",
                savedComment.getId(), currentUserId, theme.getId());

        // 작성자는 항상 자신의 댓글 내용을 볼 수 있음
        return EscapeRoomCommentResponseDto.forAuthor(savedComment);
    }

    /**
     * 특정 테마의 댓글 목록 조회 (계층 구조로 변환)
     */
    public Page<EscapeRoomCommentResponseDto> getCommentsByTheme(UUID themeId, Pageable pageable) {
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElse(null);
        // 테마 존재 확인
        if (!escapeRoomThemeRepository.existsById(themeId)) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }

        // 현재 사용자가 해당 테마를 플레이했는지 확인
        boolean hasGameHistory = false;
        if (currentUserId != null) {
            hasGameHistory = escapeRoomHistoryService.hasPlayedTheme(currentUserId, themeId);
        }

        // 테마의 모든 댓글 조회
        List<EscapeRoomComment> allComments = escapeRoomCommentRepository
                .findAllByEscapeRoomThemeId(themeId);

        // 현재 사용자가 좋아요한 댓글 ID 목록 조회
        Set<UUID> likedCommentIds = Set.of();
        if (currentUserId != null && !allComments.isEmpty()) {
            Set<UUID> commentIds = allComments.stream()
                    .map(EscapeRoomComment::getId)
                    .collect(Collectors.toSet());
            likedCommentIds = escapeRoomCommentLikeRepository
                    .findLikedCommentIdsByUserIdAndCommentIds(currentUserId, commentIds);
        }

        // 댓글을 계층 구조로 구성
        List<EscapeRoomCommentResponseDto> hierarchicalComments = 
                EscapeRoomCommentResponseDto.organizeHierarchy(allComments, currentUserId, hasGameHistory);

        // 좋아요 정보 설정
        hierarchicalComments = setLikedStatus(hierarchicalComments, likedCommentIds);

        // 페이징 처리
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), hierarchicalComments.size());
        
        List<EscapeRoomCommentResponseDto> pagedComments = 
                start < end ? hierarchicalComments.subList(start, end) : new ArrayList<>();
        
        return new PageImpl<>(pagedComments, pageable, hierarchicalComments.size());
    }

    /**
     * 좋아요 상태 설정 (계층 구조 댓글)
     */
    private List<EscapeRoomCommentResponseDto> setLikedStatus(
            List<EscapeRoomCommentResponseDto> comments, 
            Set<UUID> likedCommentIds) {
        
        for (EscapeRoomCommentResponseDto comment : comments) {
            // 댓글 좋아요 상태 설정
            comment.setIsLikedByCurrentUser(likedCommentIds.contains(comment.getId()));
            
            // 대댓글이 있는 경우, 재귀적으로 처리
            if (comment.getReplies() != null && !comment.getReplies().isEmpty()) {
                setLikedStatus(comment.getReplies(), likedCommentIds);
            }
        }
        
        return comments;
    }

    /**
     * 댓글 수정
     */
    @Transactional
    public EscapeRoomCommentResponseDto updateComment(UUID commentId, EscapeRoomCommentUpdateDto dto) {
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserIdOptional()
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

        // 댓글 조회
        EscapeRoomComment comment = escapeRoomCommentRepository.findByIdWithDetails(commentId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);

        // 작성자 확인
        if (!comment.isAuthor(currentUserId)) {
            throw ErrorStatus.FORBIDDEN.asServiceException();
        }

        // 스포일러 댓글로 변경하는 경우 권한 확인
        if (dto.getHasSpoiler() != null && dto.getHasSpoiler() && !comment.getIsSpoiler()) {
            boolean hasPlayed = escapeRoomHistoryService.hasPlayedTheme(currentUserId,
                    comment.getEscapeRoomTheme().getId());
            if (!hasPlayed) {
                throw ErrorStatus.FORBIDDEN.asServiceException();
            }
        }

        // 댓글 수정
        comment.updateContent(dto.getContent(), dto.getHasSpoiler());

        EscapeRoomComment updatedComment = escapeRoomCommentRepository.save(comment);
        log.info("방탈출 댓글 수정 완료 - commentId: {}", commentId);

        // 작성자는 항상 자신의 댓글 내용을 볼 수 있음
        return EscapeRoomCommentResponseDto.forAuthor(updatedComment);
    }

    /**
     * 댓글 삭제 (소프트 삭제)
     */
    @Transactional
    public void deleteComment(UUID commentId) {
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserIdOptional()
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

        // 댓글 조회
        EscapeRoomComment comment = escapeRoomCommentRepository.findByIdWithDetails(commentId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);

        // 작성자 확인
        if (!comment.isAuthor(currentUserId)) {
            throw ErrorStatus.FORBIDDEN.asServiceException();
        }

        // 게임 기록 댓글인 경우 완전 삭제
        if (comment.isGameHistoryComment()) {
            comment.delete();
            escapeRoomCommentRepository.save(comment);
            log.info("게임 기록 댓글 삭제 완료 - commentId: {}", commentId);
            return;
        }

        // 일반 댓글인 경우
        // 자식 댓글이 있는지 확인
        long childCount = escapeRoomCommentRepository.countByParentCommentId(commentId);
        
        if (childCount > 0) {
            // 자식 댓글이 있으면 내용만 변경하고 유지
            comment.setContent("삭제된 댓글입니다.");
            comment.setIsDeleted(true);
            escapeRoomCommentRepository.save(comment);
            log.info("부모 댓글 내용 변경 완료 (자식 댓글 존재) - commentId: {}", commentId);
        } else {
            // 자식 댓글이 없으면 소프트 삭제
            comment.delete();
            escapeRoomCommentRepository.save(comment);
            log.info("댓글 소프트 삭제 완료 - commentId: {}", commentId);
        }
    }

    /**
     * 특정 댓글 조회
     */
    public EscapeRoomCommentResponseDto getComment(UUID commentId) {
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElse(null);

        // 댓글 조회
        EscapeRoomComment comment = escapeRoomCommentRepository.findByIdWithDetails(commentId)
                .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);

        // 현재 사용자가 해당 테마를 플레이했는지 확인
        boolean hasGameHistory;
        if (currentUserId != null) {
            hasGameHistory = escapeRoomHistoryService.hasPlayedTheme(currentUserId,
                    comment.getEscapeRoomTheme().getId());
        } else {
            hasGameHistory = false;
        }

        EscapeRoomCommentResponseDto commentDto = EscapeRoomCommentResponseDto.from(comment, currentUserId, hasGameHistory);
        
        // 대댓글 조회 및 추가
        if (!comment.isReplyComment()) {
            List<EscapeRoomComment> replies = escapeRoomCommentRepository
                    .findAllByParentCommentId(comment.getId())
                    .stream()
                    .filter(r -> r.getDeletedAt() == null)
                    .collect(Collectors.toList());
            
            if (!replies.isEmpty()) {
                List<EscapeRoomCommentResponseDto> replyDtos = replies.stream()
                        .map(reply -> EscapeRoomCommentResponseDto.from(reply, currentUserId, hasGameHistory))
                        .collect(Collectors.toList());
                
                // 좋아요 정보 설정
                if (currentUserId != null) {
                    Set<UUID> replyIds = replies.stream()
                            .map(EscapeRoomComment::getId)
                            .collect(Collectors.toSet());
                    Set<UUID> likedReplyIds = escapeRoomCommentLikeRepository
                            .findLikedCommentIdsByUserIdAndCommentIds(currentUserId, replyIds);
                    
                    replyDtos.forEach(replyDto -> 
                            replyDto.setIsLikedByCurrentUser(likedReplyIds.contains(replyDto.getId())));
                }
                
                commentDto.setReplies(replyDtos);
            }
        }
        
        // 좋아요 정보 설정
        if (currentUserId != null) {
            boolean isLiked = escapeRoomCommentLikeRepository
                    .existsByCommentIdAndWebUserId(commentId, currentUserId);
            commentDto.setIsLikedByCurrentUser(isLiked);
        }

        return commentDto;
    }

    /**
     * 사용자의 댓글 목록 조회
     */
    public Page<EscapeRoomCommentResponseDto> getCommentsByUser(UUID userId, Pageable pageable) {
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserIdOptional().orElse(null);

        // 사용자 존재 확인
        if (!webUserRepository.existsById(userId)) {
            throw ErrorStatus.USER_NOT_FOUND.asServiceException();
        }

        // 댓글 조회
        Page<EscapeRoomComment> comments = escapeRoomCommentRepository
                .findByWebUserId(userId, pageable);

        // 각 댓글에 대해 게임 기록 확인 및 DTO 변환
        return comments.map(comment -> {
            boolean hasGameHistory = false;
            if (currentUserId != null) {
                hasGameHistory = escapeRoomHistoryService.hasPlayedTheme(currentUserId,
                        comment.getEscapeRoomTheme().getId());
            }
            
            EscapeRoomCommentResponseDto dto = EscapeRoomCommentResponseDto.from(comment, currentUserId, hasGameHistory);
            
            // 좋아요 정보 설정
            if (currentUserId != null) {
                boolean isLiked = escapeRoomCommentLikeRepository
                        .existsByCommentIdAndWebUserId(comment.getId(), currentUserId);
                dto.setIsLikedByCurrentUser(isLiked);
            }
            
            return dto;
        });
    }

    /**
     * 테마의 댓글 통계 조회
     */
    public EscapeRoomCommentStatsDto getCommentStats(UUID themeId) {
        long totalComments = escapeRoomCommentRepository
                .countByEscapeRoomThemeId(themeId);
        long nonSpoilerComments = escapeRoomCommentRepository
                .countNonSpoilerCommentsByThemeId(themeId);
        long spoilerComments = totalComments - nonSpoilerComments;

        return EscapeRoomCommentStatsDto.builder()
                .themeId(themeId)
                .totalComments(totalComments)
                .nonSpoilerComments(nonSpoilerComments)
                .spoilerComments(spoilerComments)
                .build();
    }

    /**
     * 댓글 좋아요
     */
    @Transactional
    public void likeComment(UUID commentId) {
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserIdOptional()
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

        // 댓글 조회
        EscapeRoomComment comment = escapeRoomCommentRepository.findByIdWithDetails(commentId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);

        // 사용자 조회
        WebUser webUser = webUserRepository.findById(currentUserId)
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

        // 이미 좋아요한 경우 중복 방지
        if (escapeRoomCommentLikeRepository.existsByCommentIdAndWebUserId(commentId, currentUserId)) {
            throw ErrorStatus.USER_POST_LIKE_DUPLICATED.asServiceException();
        }

        // 좋아요 엔티티 생성 및 저장
        EscapeRoomCommentLike like = EscapeRoomCommentLike.builder()
                .comment(comment)
                .webUser(webUser)
                .build();
        escapeRoomCommentLikeRepository.save(like);

        // 좋아요 수 증가 (캐시된 카운터)
        comment.increaseLikesCount();
        escapeRoomCommentRepository.save(comment);

        log.info("댓글 좋아요 완료 - commentId: {}, userId: {}", commentId, currentUserId);
    }

    /**
     * 댓글 좋아요 취소
     */
    @Transactional
    public void unlikeComment(UUID commentId) {
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserIdOptional()
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

        // 댓글 조회
        EscapeRoomComment comment = escapeRoomCommentRepository.findByIdWithDetails(commentId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);

        // 좋아요 엔티티 조회 및 삭제
        EscapeRoomCommentLike like = escapeRoomCommentLikeRepository
                .findByCommentIdAndWebUserId(commentId, currentUserId)
                .orElseThrow(ErrorStatus.USER_POST_LIKE_NOT_FOUND::asServiceException);

        escapeRoomCommentLikeRepository.delete(like);

        // 좋아요 수 감소 (캐시된 카운터)
        comment.decreaseLikesCount();
        escapeRoomCommentRepository.save(comment);

        log.info("댓글 좋아요 취소 완료 - commentId: {}, userId: {}", commentId, currentUserId);
    }

    @Getter
    @Builder
    public static class EscapeRoomCommentStatsDto {
        private UUID themeId;
        private long totalComments;
        private long nonSpoilerComments;
        private long spoilerComments;
    }
}