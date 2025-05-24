package com.crimecat.backend.comment.service;

import com.crimecat.backend.comment.domain.EscapeRoomComment;
import com.crimecat.backend.comment.dto.EscapeRoomCommentCreateDto;
import com.crimecat.backend.comment.dto.EscapeRoomCommentResponseDto;
import com.crimecat.backend.comment.dto.EscapeRoomCommentUpdateDto;
import com.crimecat.backend.comment.repository.EscapeRoomCommentRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import com.crimecat.backend.gameHistory.repository.EscapeRoomHistoryRepository;
import com.crimecat.backend.gameHistory.service.EscapeRoomHistoryService;
import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import com.crimecat.backend.gametheme.repository.EscapeRoomThemeRepository;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.utils.AuthenticationUtil;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EscapeRoomCommentService {
    
    private final EscapeRoomCommentRepository escapeRoomCommentRepository;
    private final EscapeRoomThemeRepository escapeRoomThemeRepository;
    private final EscapeRoomHistoryRepository escapeRoomHistoryRepository;
    private final UserRepository userRepository;
    private final EscapeRoomHistoryService escapeRoomHistoryService;
    
    /**
     * 댓글 생성
     */
    @Transactional
    public EscapeRoomCommentResponseDto createComment(EscapeRoomCommentCreateDto dto) {
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        // 사용자 조회
        User user = userRepository.findById(currentUserId)
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        // 테마 조회
        EscapeRoomTheme theme = escapeRoomThemeRepository.findById(dto.getEscapeRoomThemeId())
                .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        
        // 게임 기록 조회 (있는 경우)
        EscapeRoomHistory history = null;
        if (dto.getEscapeRoomHistoryId() != null) {
            history = escapeRoomHistoryRepository.findById(dto.getEscapeRoomHistoryId())
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
                .user(user)
                .escapeRoomHistory(history)
                .content(dto.getContent().trim())
                .hasSpoiler(dto.getHasSpoiler() != null ? dto.getHasSpoiler() : false)
                .build();
        
        EscapeRoomComment savedComment = escapeRoomCommentRepository.save(comment);
        log.info("방탈출 댓글 생성 완료 - commentId: {}, userId: {}, themeId: {}", 
                savedComment.getId(), currentUserId, theme.getId());
        
        // 작성자는 항상 자신의 댓글 내용을 볼 수 있음
        return EscapeRoomCommentResponseDto.forAuthor(savedComment);
    }
    
    /**
     * 특정 테마의 댓글 목록 조회
     */
    public Page<EscapeRoomCommentResponseDto> getCommentsByTheme(UUID themeId, Pageable pageable) {
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElse(null);
        
        // 테마 존재 확인
        if (!escapeRoomThemeRepository.existsById(themeId)) {
            throw ErrorStatus.GAME_THEME_NOT_FOUND.asServiceException();
        }
        
        // 현재 사용자가 해당 테마를 플레이했는지 확인
        boolean hasGameHistory = false;
        if (currentUserId != null) {
            hasGameHistory = escapeRoomHistoryService.hasPlayedTheme(currentUserId, themeId);
        }
        
        // 댓글 조회
        Page<EscapeRoomComment> comments = escapeRoomCommentRepository
                .findByEscapeRoomThemeIdAndIsDeletedFalse(themeId, pageable);
        
        final boolean hasHistory = hasGameHistory;
        final UUID userId = currentUserId;
        
        // DTO 변환 (스포일러 필터링 포함)
        return comments.map(comment -> 
                EscapeRoomCommentResponseDto.from(comment, userId, hasHistory));
    }
    
    /**
     * 댓글 수정
     */
    @Transactional
    public EscapeRoomCommentResponseDto updateComment(UUID commentId, EscapeRoomCommentUpdateDto dto) {
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        // 댓글 조회
        EscapeRoomComment comment = escapeRoomCommentRepository.findByIdAndIsDeletedFalse(commentId)
                .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);
        
        // 작성자 확인
        if (!comment.isAuthor(currentUserId)) {
            throw ErrorStatus.FORBIDDEN.asServiceException();
        }
        
        // 스포일러 댓글로 변경하는 경우 권한 확인
        if (dto.getHasSpoiler() != null && dto.getHasSpoiler() && !comment.getHasSpoiler()) {
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
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        // 댓글 조회
        EscapeRoomComment comment = escapeRoomCommentRepository.findByIdAndIsDeletedFalse(commentId)
                .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);
        
        // 작성자 확인
        if (!comment.isAuthor(currentUserId)) {
            throw ErrorStatus.FORBIDDEN.asServiceException();
        }
        
        // 소프트 삭제
        comment.delete();
        escapeRoomCommentRepository.save(comment);
        
        log.info("방탈출 댓글 삭제 완료 - commentId: {}", commentId);
    }
    
    /**
     * 특정 댓글 조회
     */
    public EscapeRoomCommentResponseDto getComment(UUID commentId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElse(null);
        
        // 댓글 조회
        EscapeRoomComment comment = escapeRoomCommentRepository.findByIdAndIsDeletedFalse(commentId)
                .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);
        
        // 현재 사용자가 해당 테마를 플레이했는지 확인
        boolean hasGameHistory = false;
        if (currentUserId != null) {
            hasGameHistory = escapeRoomHistoryService.hasPlayedTheme(currentUserId, 
                    comment.getEscapeRoomTheme().getId());
        }
        
        return EscapeRoomCommentResponseDto.from(comment, currentUserId, hasGameHistory);
    }
    
    /**
     * 사용자의 댓글 목록 조회
     */
    public Page<EscapeRoomCommentResponseDto> getCommentsByUser(UUID userId, Pageable pageable) {
        UUID currentUserId = AuthenticationUtil.getCurrentUserIdOptional().orElse(null);
        
        // 사용자 존재 확인
        if (!userRepository.existsById(userId)) {
            throw ErrorStatus.USER_NOT_FOUND.asServiceException();
        }
        
        // 댓글 조회
        Page<EscapeRoomComment> comments = escapeRoomCommentRepository
                .findByUserIdAndIsDeletedFalse(userId, pageable);
        
        // 각 댓글에 대해 게임 기록 확인 및 DTO 변환
        return comments.map(comment -> {
            boolean hasGameHistory = false;
            if (currentUserId != null) {
                hasGameHistory = escapeRoomHistoryService.hasPlayedTheme(currentUserId, 
                        comment.getEscapeRoomTheme().getId());
            }
            return EscapeRoomCommentResponseDto.from(comment, currentUserId, hasGameHistory);
        });
    }
    
    /**
     * 테마의 댓글 통계 조회
     */
    public EscapeRoomCommentStatsDto getCommentStats(UUID themeId) {
        long totalComments = escapeRoomCommentRepository
                .countByEscapeRoomThemeIdAndIsDeletedFalse(themeId);
        long nonSpoilerComments = escapeRoomCommentRepository
                .countByEscapeRoomThemeIdAndHasSpoilerFalseAndIsDeletedFalse(themeId);
        long spoilerComments = totalComments - nonSpoilerComments;
        
        return EscapeRoomCommentStatsDto.builder()
                .themeId(themeId)
                .totalComments(totalComments)
                .nonSpoilerComments(nonSpoilerComments)
                .spoilerComments(spoilerComments)
                .build();
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