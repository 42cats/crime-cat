package com.crimecat.backend.guild.service;

import com.crimecat.backend.guild.domain.Guild;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/*
	gameHistory 저장 확인용 임시 클래스
 */
@Service
@RequiredArgsConstructor
public class GuildService {

	/*
		gameHistory 저장 확인용 임시 메서드
	 */
	private final GuildRepository guildRepository;
	public Guild findGuildByGuildName(String guildSnowflake) {
		return guildRepository.findGuildByGuildSnowflake(guildSnowflake).orElse(null);
	}

}



