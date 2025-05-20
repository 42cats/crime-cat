package com.crimecat.backend.boardPost.controller;

import com.crimecat.backend.boardPost.dto.BoardPostDetailResponse;
import com.crimecat.backend.boardPost.dto.BoardPostResponse;
import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.boardPost.enums.PostType;
import com.crimecat.backend.boardPost.service.BoardPostService;
import com.crimecat.backend.boardPost.sort.BoardPostSortType;
import com.crimecat.backend.comment.dto.CommentResponse;
import com.crimecat.backend.gameHistory.sort.GameHistorySortType;
import com.crimecat.backend.utils.sort.SortUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/posts")
public class BoardPostController {

    private final BoardPostService boardPostService;

    @GetMapping
    public ResponseEntity<Page<BoardPostResponse>> getBoardPosts(
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "10") Integer size,
            @RequestParam(value = "kw", defaultValue = "") String kw,
            @RequestParam(value = "boardType", defaultValue = "NONE") BoardType boardType,
            @RequestParam(value = "postType", defaultValue = "NONE") PostType postType,
            @RequestParam(defaultValue = "LATEST") List<String> sort
    ) {
        List<BoardPostSortType> sortTypes = (sort != null && !sort.isEmpty()) ?
                sort.stream()
                        .map(String::toUpperCase)
                        .map(BoardPostSortType::valueOf)
                        .toList()
                : List.of(BoardPostSortType.LATEST);
        Sort resolvedSort = SortUtil.combineSorts(sortTypes);
        Page<BoardPostResponse> boardPosts = boardPostService.getBoardPage(page, size, kw, resolvedSort, boardType, postType);
        return ResponseEntity.ok().body(boardPosts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoardPostDetailResponse> getPostDetail(
            @PathVariable("id") UUID postId,
            @AuthenticationPrincipal WebUser currentUser
    ) {
        BoardPostDetailResponse boardPostDetailResponse = boardPostService.getBoardPostDetail(postId, currentUser.getId());
        return ResponseEntity.ok().body(boardPostDetailResponse);
    }
}
