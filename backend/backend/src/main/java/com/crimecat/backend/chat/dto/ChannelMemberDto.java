package com.crimecat.backend.chat.dto;

import com.crimecat.backend.chat.domain.ChannelMember;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelMemberDto {

    private Long id;
    private Long channelId;
    private String channelName;
    private UUID userId;
    private String username;
    private ChannelMember.ChannelRole role;
    private Boolean isActive;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime joinedAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastActivityAt;

    // 채널 멤버 역할 변경 요청 DTO
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleUpdateRequest {
        @NotNull(message = "역할은 필수입니다")
        private ChannelMember.ChannelRole role;
    }

    // 채널 멤버 목록 응답 DTO
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListResponse {
        private List<ChannelMemberDto> members;
        private long totalCount;
        private long moderatorCount;
        private long memberCount;
    }

    // 채널 멤버 활동 상태 DTO
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityStatus {
        private UUID userId;
        private String username;
        private Boolean isOnline;
        private Boolean isInVoiceChannel;
        
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime lastActivity;
    }

    // 채널 멤버 통계 DTO
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Statistics {
        private Long channelId;
        private String channelName;
        private long totalMembers;
        private long activeMembersToday;
        private long moderators;
        private long averageSessionTime; // 분 단위
        
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime lastUpdated;
    }

    // ChannelMember 엔티티를 ChannelMemberDto로 변환
    public static ChannelMemberDto from(ChannelMember channelMember) {
        return ChannelMemberDto.builder()
                .id(channelMember.getId())
                .channelId(channelMember.getChannel().getId())
                .channelName(channelMember.getChannel().getName())
                .userId(channelMember.getUserId())
                .username("Unknown") // TODO: User 서비스에서 사용자명 조회
                .role(channelMember.getRole())
                .isActive(channelMember.getIsActive())
                .joinedAt(channelMember.getJoinedAt())
                .lastActivityAt(channelMember.getLastActivityAt())
                .build();
    }

    // 역할별 멤버 필터링 유틸리티 메서드
    public static List<ChannelMemberDto> filterByRole(List<ChannelMemberDto> members, ChannelMember.ChannelRole role) {
        return members.stream()
                .filter(member -> member.getRole() == role)
                .toList();
    }

    // 활성 멤버만 필터링
    public static List<ChannelMemberDto> filterActive(List<ChannelMemberDto> members) {
        return members.stream()
                .filter(member -> Boolean.TRUE.equals(member.getIsActive()))
                .toList();
    }

    // 모더레이터만 필터링
    public static List<ChannelMemberDto> getModerators(List<ChannelMemberDto> members) {
        return filterByRole(members, ChannelMember.ChannelRole.MODERATOR);
    }

    // 일반 멤버만 필터링
    public static List<ChannelMemberDto> getRegularMembers(List<ChannelMemberDto> members) {
        return filterByRole(members, ChannelMember.ChannelRole.MEMBER);
    }
}