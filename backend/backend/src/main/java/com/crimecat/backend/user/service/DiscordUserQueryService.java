package com.crimecat.backend.user.service;

import com.crimecat.backend.user.domain.DiscordUser;
import com.crimecat.backend.user.repository.DiscordUserRepository;
import com.crimecat.backend.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DiscordUserQueryService {

	private final DiscordUserRepository discordUserRepository;
	private final UserRepository userRepository;

	@Transactional(readOnly = true)
	public DiscordUser findByUserSnowflake(String userSnowflake) {
		return discordUserRepository.findBySnowflake(userSnowflake).orElse(null);
	}
	@Transactional
	public DiscordUser saveUser(DiscordUser user) {
		return discordUserRepository.save(user);
	}

	@Transactional(readOnly = true)
	public List<DiscordUser> getUsersWithPointGreaterThan(Integer point) {
		return userRepository.findDiscordUsersByPointGreaterThan(point);
	}

	@Transactional(readOnly = true)
	public Integer getUserCount() {
		return (int) discordUserRepository.count();
	}

	@Transactional(readOnly = true)
	public Page<DiscordUser> getUserWithPagination(Pageable pageable) {
		return discordUserRepository.findAll(pageable);
	}
}
