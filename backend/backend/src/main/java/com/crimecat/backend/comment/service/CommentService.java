package com.crimecat.backend.comment.service;

import com.crimecat.backend.comment.domain.Comment;
import com.crimecat.backend.comment.domain.CommentLike;
import com.crimecat.backend.comment.dto.CommentRequest;
import com.crimecat.backend.comment.dto.CommentResponse;
import com.crimecat.backend.comment.repository.CommentLikeRepository;
import com.crimecat.backend.comment.repository.CommentRepository;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.repository.GameThemeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final GameThemeRepository gameThemeRepository;
    private final GameHistoryRepository gameHistoryRepository;
    
    // 댓글 작성
    @Transactional
    public CommentResponse createComment(UUID gameThemeId, UUID userId, CommentRequest request) {
        GameTheme gameTheme = gameThemeRepository.findById(gameThemeId)
                .orElseThrow(() -> new EntityNotFoundException("게임 테마를 찾을 수 없습니다"));
        
        Comment comment = Comment.builder()
                .content(request.getContent())
                .gameThemeId(gameThemeId)
                .authorId(userId)
                .parentId(request.getParentId())
                .isSpoiler(request.isSpoiler())
                .updatedAt(LocalDateTime.now())
                .build();
        
        Comment savedComment = commentRepository.save(comment);
        
        // 대댓글이 아닌 경우만 빈 replies 목록 생성
        List<CommentResponse> replies = new ArrayList<>();
        
        boolean canViewSpoiler = hasPlayedGameTheme(userId, gameThemeId);
        
        return CommentResponse.from(savedComment, false, true, canViewSpoiler, replies);
    }
    
    // 댓글 수정
    @Transactional
    public CommentResponse updateComment(UUID commentId, UUID userId, CommentRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다"));
        
        // 댓글 작성자 본인만 수정 가능
        if (!comment.getAuthorId().equals(userId)) {
            throw new AccessDeniedException("댓글을 수정할 권한이 없습니다");
        }
        
        comment.update(request.getContent(), request.isSpoiler());
        Comment updatedComment = commentRepository.save(comment);
        
        // 대댓글 목록 가져오기
        List<CommentResponse> replies = new ArrayList<>();
        if (comment.getParentId() == null) {
            replies = getCommentReplies(commentId, userId);
        }
        
        boolean isLiked = commentLikeRepository.existsByUserIdAndCommentId(userId, commentId);
        boolean canViewSpoiler = hasPlayedGameTheme(userId, comment.getGameThemeId());
        
        return CommentResponse.from(updatedComment, isLiked, true, canViewSpoiler, replies);
    }
    
    // 댓글 삭제
    @Transactional
    public void deleteComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다"));
        
        // 댓글 작성자 본인만 삭제 가능
        if (!comment.getAuthorId().equals(userId)) {
            throw new AccessDeniedException("댓글을 삭제할 권한이 없습니다");
        }
        
        comment.delete();
        commentRepository.save(comment);
        
        // 대댓글도 함께 삭제 처리
        if (comment.getParentId() == null) {
            List<Comment> replies = commentRepository.findByParentIdAndIsDeletedFalseOrderByCreatedAtAsc(commentId);
            for (Comment reply : replies) {
                reply.delete();
                commentRepository.save(reply);
            }
        }
    }
    
    // 댓글 목록 조회 (최신순)
    @Transactional(readOnly = true)
    public Page<CommentResponse> getComments(UUID gameThemeId, UUID userId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Comment> comments = commentRepository.findByGameThemeIdAndParentIdIsNullAndIsDeletedFalseOrderByCreatedAtDesc(
                gameThemeId, pageRequest);
        
        boolean canViewSpoiler = hasPlayedGameTheme(userId, gameThemeId);
        
        return comments.map(comment -> {
            boolean isLiked = commentLikeRepository.existsByUserIdAndCommentId(userId, comment.getId());
            boolean isOwnComment = comment.getAuthorId().equals(userId);
            List<CommentResponse> replies = getCommentReplies(comment.getId(), userId);
            
            return CommentResponse.from(comment, isLiked, isOwnComment, canViewSpoiler, replies);
        });
    }
    
    // 댓글 목록 조회 (인기순)
    @Transactional(readOnly = true)
    public Page<CommentResponse> getPopularComments(UUID gameThemeId, UUID userId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Comment> comments = commentRepository.findByGameThemeIdAndParentIdIsNullAndIsDeletedFalseOrderByLikesDescCreatedAtDesc(
                gameThemeId, pageRequest);
        
        boolean canViewSpoiler = hasPlayedGameTheme(userId, gameThemeId);
        
        return comments.map(comment -> {
            boolean isLiked = commentLikeRepository.existsByUserIdAndCommentId(userId, comment.getId());
            boolean isOwnComment = comment.getAuthorId().equals(userId);
            List<CommentResponse> replies = getCommentReplies(comment.getId(), userId);
            
            return CommentResponse.from(comment, isLiked, isOwnComment, canViewSpoiler, replies);
        });
    }
    
    // 대댓글 조회
    private List<CommentResponse> getCommentReplies(UUID commentId, UUID userId) {
        List<Comment> replies = commentRepository.findByParentIdAndIsDeletedFalseOrderByCreatedAtAsc(commentId);
        List<CommentResponse> replyResponses = new ArrayList<>();
        
        for (Comment reply : replies) {
            boolean isLiked = commentLikeRepository.existsByUserIdAndCommentId(userId, reply.getId());
            boolean isOwnReply = reply.getAuthorId().equals(userId);
            boolean canViewSpoiler = hasPlayedGameTheme(userId, reply.getGameThemeId());
            
            replyResponses.add(CommentResponse.from(reply, isLiked, isOwnReply, canViewSpoiler, new ArrayList<>()));
        }
        
        return replyResponses;
    }
    
    // 댓글 좋아요
    @Transactional
    public void likeComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다"));
        
        boolean exists = commentLikeRepository.existsByUserIdAndCommentId(userId, commentId);
        
        if (!exists) {
            CommentLike commentLike = CommentLike.builder()
                    .userId(userId)
                    .commentId(commentId)
                    .build();
            
            commentLikeRepository.save(commentLike);
            comment.incrementLikes();
            commentRepository.save(comment);
        }
    }
    
    // 댓글 좋아요 취소
    @Transactional
    public void unlikeComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다"));
        
        Optional<CommentLike> commentLike = commentLikeRepository.findByUserIdAndCommentId(userId, commentId);
        
        if (commentLike.isPresent()) {
            commentLikeRepository.delete(commentLike.get());
            comment.decrementLikes();
            commentRepository.save(comment);
        }
    }
    
    // 해당 게임 테마를 플레이했는지 확인 (스포일러 표시 여부 결정)
    private boolean hasPlayedGameTheme(UUID userId, UUID gameThemeId) {
        // GameHistory를 통해 확인
        return gameHistoryRepository.existsByDiscordUserIdAndGameThemeId(userId, gameThemeId);
    }
}
