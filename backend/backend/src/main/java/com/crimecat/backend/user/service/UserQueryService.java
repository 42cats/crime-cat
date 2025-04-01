package com.crimecat.backend.user.service;

import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserQueryService {

	private final UserRepository userRepository;

	public User findByUserSnowflake(String userSnowflake) {
		return userRepository.findBySnowflake(userSnowflake).orElse(null);
	}
	public User saveUser(User user) {
		return userRepository.save(user);
	}

	public List<User> getUsersWithPointGreaterThan(Integer point) {
		return userRepository.getUsersWithPointGreaterThan(point);
	}

	public Integer getUserCount() {
		return (int) userRepository.count();
	}

	public Page<User> getUserWithPagination(Pageable pageable) {
		return userRepository.findAll(pageable);
	}
}
