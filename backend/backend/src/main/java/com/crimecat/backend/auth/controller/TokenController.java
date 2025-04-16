package com.crimecat.backend.auth.controller;

import com.crimecat.backend.auth.service.TokenService;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class TokenController {

    private final WebUserRepository webUserRepository;
    private final TokenService tokenService;

    @PostMapping("/login-success")
    public TokenService.TokenResponse issueToken(@RequestParam UUID webUserId) {
        WebUser user = webUserRepository.findById(webUserId)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저 없음"));

        return tokenService.generateTokens(user);
    }
}
