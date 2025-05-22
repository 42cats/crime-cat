package com.crimecat.backend.userPost.controller.collection;

import com.crimecat.backend.common.dto.MessageResponseDto;
import com.crimecat.backend.userPost.dto.collection.CollectionDto;
import com.crimecat.backend.userPost.dto.collection.CreateCollectionDto;
import com.crimecat.backend.userPost.dto.collection.UpdateCollectionDto;
import com.crimecat.backend.userPost.service.collection.CollectionService;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    /**
     * 컬렉션 생성
     */
    @PostMapping
    public ResponseEntity<CollectionDto> createCollection(
            @RequestBody CreateCollectionDto createDto,
            @AuthenticationPrincipal WebUser currentUser) {
        
        CollectionDto createdCollection = collectionService.createCollection(currentUser, createDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCollection);
    }

    /**
     * 내 컬렉션 목록 조회 (게시물 수와 썸네일 포함)
     */
    @GetMapping
    public ResponseEntity<List<CollectionDto>> getMyCollections(
            @AuthenticationPrincipal WebUser currentUser) {
        
        List<CollectionDto> collections = collectionService.getUserCollections(currentUser.getId());
        return ResponseEntity.ok(collections);
    }

    /**
     * 특정 컬렉션 상세 조회
     */
    @GetMapping("/{collectionId}")
    public ResponseEntity<CollectionDto> getCollection(
            @PathVariable UUID collectionId,
            @AuthenticationPrincipal WebUser currentUser) {
        
        CollectionDto collection = collectionService.getCollection(collectionId, currentUser.getId());
        return ResponseEntity.ok(collection);
    }

    /**
     * 컬렉션 정보 수정
     */
    @PutMapping("/{collectionId}")
    public ResponseEntity<CollectionDto> updateCollection(
            @PathVariable UUID collectionId,
            @RequestBody UpdateCollectionDto updateDto,
            @AuthenticationPrincipal WebUser currentUser) {
        
        CollectionDto updatedCollection = collectionService.updateCollection(collectionId, currentUser.getId(), updateDto);
        return ResponseEntity.ok(updatedCollection);
    }

    /**
     * 컬렉션 삭제
     */
    @DeleteMapping("/{collectionId}")
    public ResponseEntity<MessageResponseDto> deleteCollection(
            @PathVariable UUID collectionId,
            @AuthenticationPrincipal WebUser currentUser) {
        
        collectionService.deleteCollection(collectionId, currentUser.getId());
        return ResponseEntity.ok(new MessageResponseDto("컬렉션이 삭제되었습니다."));
    }
}