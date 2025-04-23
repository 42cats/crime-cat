package com.crimecat.backend.bot.user.service;

import com.crimecat.backend.bot.user.domain.DiscordUser;
import com.crimecat.backend.bot.user.repository.DiscordUserRepository;
import com.crimecat.backend.bot.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DiscordUserQueryService {

	private final DiscordUserRepository discordUserRepository;
	private final UserRepository userRepository;

	public DiscordUser findByUserSnowflake(String userSnowflake) {
		return discordUserRepository.findBySnowflake(userSnowflake).orElse(null);
	}
	public DiscordUser saveUser(DiscordUser user) {
		return discordUserRepository.save(user);
	}

	public List<DiscordUser> getUsersWithPointGreaterThan(Integer point) {
		return userRepository.findDiscordUsersByPointGreaterThan(point);
	}

	public Integer getUserCount() {
		return (int) discordUserRepository.count();
	}

	public Page<DiscordUser> getUserWithPagination(Pageable pageable) {
		return discordUserRepository.findAll(pageable);
	}
}
