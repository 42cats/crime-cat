package com.crimecat.backend.sitemap.controller;

import com.crimecat.backend.sitemap.service.SitemapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * SPA용 동적 사이트맵 컨트롤러
 */
@RestController
@RequestMapping("/api/sitemap")
@RequiredArgsConstructor
public class SitemapController {
    
    private final SitemapService sitemapService;
    
    /**
     * 사이트맵 인덱스 (모든 사이트맵의 목록)
     */
    @GetMapping(value = "/sitemap-index.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getSitemapIndex() {
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=3600") // 1시간 캐시
            .body(sitemapService.generateSitemapIndex());
    }
    
    /**
     * 테마 사이트맵 (크라임씬, 방탈출, 머더미스터리)
     */
    @GetMapping(value = "/themes.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getThemesSitemap() {
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=1800") // 30분 캐시
            .body(sitemapService.generateThemesSitemap());
    }
    
    /**
     * 커뮤니티 게시글 사이트맵
     */
    @GetMapping(value = "/posts.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getPostsSitemap() {
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=1800") // 30분 캐시
            .body(sitemapService.generatePostsSitemap());
    }
    
    /**
     * 프로필 사이트맵 (활성 사용자)
     */
    @GetMapping(value = "/profiles.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getProfilesSitemap() {
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=3600") // 1시간 캐시
            .body(sitemapService.generateProfilesSitemap());
    }
    
    /**
     * SNS 게시물 사이트맵
     */
    @GetMapping(value = "/sns.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getSnsSitemap() {
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=1800") // 30분 캐시
            .body(sitemapService.generateSnsSitemap());
    }
    
    /**
     * 공지사항 사이트맵
     */
    @GetMapping(value = "/notices.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getNoticesSitemap() {
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=3600") // 1시간 캐시
            .body(sitemapService.generateNoticesSitemap());
    }
    
    /**
     * 명령어 사이트맵
     */
    @GetMapping(value = "/commands.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getCommandsSitemap() {
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=7200") // 2시간 캐시
            .body(sitemapService.generateCommandsSitemap());
    }
    
    /**
     * 게임테마 API 사이트맵
     */
    @GetMapping(value = "/game-themes.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getGameThemesSitemap() {
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=1800") // 30분 캐시
            .body(sitemapService.generateGameThemesSitemap());
    }
}