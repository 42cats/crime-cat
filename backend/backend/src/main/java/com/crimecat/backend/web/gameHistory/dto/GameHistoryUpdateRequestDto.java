package com.crimecat.backend.web.gameHistory.dto;

import com.crimecat.backend.web.gameHistory.domain.GameHistory;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GameHistoryUpdateRequestDto {
    private String characterName;
    private Boolean isWin;
    private String memo;

    /** 유저용 생성자 */
    public static GameHistoryUpdateRequestDto fromUser(GameHistory gameHistory) {
    return new GameHistoryUpdateRequestDto(
        gameHistory.getCharacterName(),
        gameHistory.isWin(),
        gameHistory.getMemo()
        );
    }

    /** 오너용 생성자 */
    public static GameHistoryUpdateRequestDto fromOwner(GameHistory gameHistory) {
        return new GameHistoryUpdateRequestDto(
            gameHistory.getCharacterName(),
            gameHistory.isWin(),
            gameHistory.getOwnerMemo()
        );
    }
}
