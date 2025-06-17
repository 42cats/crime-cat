package com.crimecat.backend.chat.dto;

import com.crimecat.backend.chat.domain.Vote;
import com.crimecat.backend.chat.domain.VoteResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class VoteDto {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Getter
    @Builder
    public static class CreateRequest {
        private String question;
        private List<String> options;

        public Vote toEntity(String createdBy) {
            try {
                String optionsJson = objectMapper.writeValueAsString(options);
                return Vote.builder()
                        .question(question)
                        .options(optionsJson)
                        .createdBy(createdBy)
                        .build();
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to convert options to JSON", e);
            }
        }
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String question;
        private List<String> options;
        private String createdBy;
        private Boolean isActive;
        private LocalDateTime createdAt;
        private Integer totalResponses;
        private Map<Integer, Integer> responseCounts;

        public static Response from(Vote vote) {
            try {
                List<String> options = objectMapper.readValue(vote.getOptions(), new TypeReference<List<String>>() {});
                
                // 응답 통계 계산
                Map<Integer, Integer> responseCounts = new HashMap<>();
                int totalResponses = 0;
                
                for (VoteResponse response : vote.getResponses()) {
                    int choice = response.getChoiceIndex();
                    responseCounts.put(choice, responseCounts.getOrDefault(choice, 0) + 1);
                    totalResponses++;
                }

                return Response.builder()
                        .id(vote.getId())
                        .question(vote.getQuestion())
                        .options(options)
                        .createdBy(vote.getCreatedBy())
                        .isActive(vote.getIsActive())
                        .createdAt(vote.getCreatedAt())
                        .totalResponses(totalResponses)
                        .responseCounts(responseCounts)
                        .build();
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to parse options JSON", e);
            }
        }
    }

    @Getter
    @Builder
    public static class VoteRequest {
        private Integer choiceIndex;

        public VoteResponse toEntity(Vote vote, String userId, String username) {
            return VoteResponse.builder()
                    .vote(vote)
                    .userId(userId)
                    .username(username)
                    .choiceIndex(choiceIndex)
                    .build();
        }
    }

    @Getter
    @Builder
    public static class VoteResponseDto {
        private Long id;
        private String userId;
        private String username;
        private Integer choiceIndex;
        private String choiceText;
        private LocalDateTime createdAt;

        public static VoteResponseDto from(VoteResponse voteResponse, List<String> options) {
            String choiceText = null;
            if (voteResponse.getChoiceIndex() < options.size()) {
                choiceText = options.get(voteResponse.getChoiceIndex());
            }

            return VoteResponseDto.builder()
                    .id(voteResponse.getId())
                    .userId(voteResponse.getUserId())
                    .username(voteResponse.getUsername())
                    .choiceIndex(voteResponse.getChoiceIndex())
                    .choiceText(choiceText)
                    .createdAt(voteResponse.getCreatedAt())
                    .build();
        }
    }
}