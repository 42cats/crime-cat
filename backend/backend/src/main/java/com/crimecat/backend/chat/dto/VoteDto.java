package com.crimecat.backend.chat.dto;

import com.crimecat.backend.chat.domain.Vote;
import com.crimecat.backend.chat.domain.VoteResponse;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class VoteDto {


    @Getter
    @Builder
    public static class CreateRequest {
        private String question;
        private List<String> options;

        public Vote toEntity(UUID createdBy) {
            return Vote.builder()
                    .question(question)
                    .options(options)
                    .createdBy(createdBy)
                    .build();
        }
    }

    @Getter
    @Builder
    public static class Response {
        private UUID id;
        private String question;
        private List<String> options;
        private UUID createdBy;
        private Boolean isActive;
        private LocalDateTime createdAt;
        private Integer totalResponses;
        private Map<Integer, Integer> responseCounts;

        public static Response from(Vote vote) {
            // 응답 통계 계산
            Map<Integer, Integer> responseCounts = new HashMap<>();
            int totalResponses = 0;
            
            for (VoteResponse response : vote.getResponses()) {
                String selectedOption = response.getSelectedOption();
                int choice = vote.getOptions().indexOf(selectedOption);
                if (choice >= 0) {
                    responseCounts.put(choice, responseCounts.getOrDefault(choice, 0) + 1);
                    totalResponses++;
                }
            }

            return Response.builder()
                    .id(vote.getId())
                    .question(vote.getQuestion())
                    .options(vote.getOptions())
                    .createdBy(vote.getCreatedBy())
                    .isActive(vote.getIsActive())
                    .createdAt(vote.getCreatedAt())
                    .totalResponses(totalResponses)
                    .responseCounts(responseCounts)
                    .build();
        }
    }

    @Getter
    @Builder
    public static class VoteRequest {
        private String selectedOption;

        public VoteResponse toEntity(Vote vote, UUID userId, String username) {
            return VoteResponse.builder()
                    .vote(vote)
                    .userId(userId)
                    .username(username)
                    .selectedOption(selectedOption)
                    .build();
        }
    }

    @Getter
    @Builder
    public static class VoteResponseDto {
        private UUID id;
        private UUID userId;
        private String username;
        private String selectedOption;
        private Integer choiceIndex;
        private LocalDateTime createdAt;

        public static VoteResponseDto from(VoteResponse voteResponse, List<String> options) {
            int choiceIndex = options.indexOf(voteResponse.getSelectedOption());

            return VoteResponseDto.builder()
                    .id(voteResponse.getId())
                    .userId(voteResponse.getUserId())
                    .username(voteResponse.getUsername())
                    .selectedOption(voteResponse.getSelectedOption())
                    .choiceIndex(choiceIndex >= 0 ? choiceIndex : null)
                    .createdAt(voteResponse.getCreatedAt())
                    .build();
        }
    }
}