# DTO Classes Used with @Cacheable Annotation

## Summary of DTO/Response Classes that need @NoArgsConstructor

### 1. WebUserService
- **UserProfileInfoResponseDto** ✅ (Already has @NoArgsConstructor)
- **FindUserInfo** ❌ (Missing @NoArgsConstructor)
- **ProfileDetailDto** ❌ (Missing @NoArgsConstructor)

### 2. PermissionQueryService
- **Permission** (Entity class, has @NoArgsConstructor(access = AccessLevel.PROTECTED))

### 3. WebStatsInfoServiceProxy
- Returns Map<String, String> (No DTO class)

### 4. IntegratedGameHistoryService
- **IntegratedGameHistoryResponse** ✅ (Already has @NoArgsConstructor)
- **GameComparisonResponse** (Not shown in search, needs verification)

### 5. NotificationService
- **NotificationDto** ✅ (Already has @NoArgsConstructor)

### 6. LocationMappingService
- **LocationMappingDto** ✅ (Already has @NoArgsConstructor)

### 7. ViewCountService
- Not analyzed (needs checking)

### 8. UserProfileStatsService
- **UserProfileStatsResponse** ✅ (Already has @NoArgsConstructor)

### 9. EscapeRoomHistoryService
- Not analyzed (needs checking)

### 10. CommentService
- Returns Page<CommentResponse> (Spring Page wrapper)
- **CommentResponse** ✅ (Already has @NoArgsConstructor)

### 11. BoardPostService
- **BoardPostResponse** ✅ (Already has @NoArgsConstructor)
- **BoardPostDetailResponse** ✅ (Already has @NoArgsConstructor)

### 12. UserService
- Not analyzed (needs checking)

### 13. GameThemeService
- **GetGameThemeResponse** ❌ (Missing @NoArgsConstructor)
- **GetGameThemesResponse** ✅ (Already has @NoArgsConstructor)
- Returns boolean (primitive type for getLikeStatus method)

## DTOs that NEED @NoArgsConstructor added:
1. **FindUserInfo** (com.crimecat.backend.webUser.dto.FindUserInfo)
2. **ProfileDetailDto** (com.crimecat.backend.webUser.dto.ProfileDetailDto)
3. **GetGameThemeResponse** (com.crimecat.backend.gametheme.dto.GetGameThemeResponse)

## DTOs that already have @NoArgsConstructor:
1. UserProfileInfoResponseDto
2. IntegratedGameHistoryResponse
3. NotificationDto
4. LocationMappingDto
5. UserProfileStatsResponse
6. BoardPostResponse
7. BoardPostDetailResponse
8. CommentResponse
9. GetGameThemesResponse

## Notes:
- Redis caching with Spring Cache requires @NoArgsConstructor for deserialization
- Classes using @Builder pattern should also include @NoArgsConstructor and @AllArgsConstructor
- Entity classes with protected no-args constructors work fine for caching