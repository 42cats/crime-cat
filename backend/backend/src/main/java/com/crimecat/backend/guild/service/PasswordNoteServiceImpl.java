package com.crimecat.backend.guild.service;

import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.domain.PasswordNote;
import com.crimecat.backend.guild.dto.PasswordNoteDto;
import com.crimecat.backend.guild.dto.PatchPasswordNoteRequestDto;
import com.crimecat.backend.guild.dto.SavePasswordNoteRequestDto;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.guild.repository.PasswordNoteRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PasswordNoteServiceImpl implements PasswordNoteService {

    private final PasswordNoteRepository passwordNoteRepository;
    private final GuildRepository guildRepository;

    @Override
    public PasswordNoteDto save(String guildId, SavePasswordNoteRequestDto request) {
        // 길드 확인
        Guild guild = guildRepository.findBySnowflake(guildId)
                .orElseThrow(() -> new EntityNotFoundException("존재하지 않는 길드입니다."));

        // 중복 확인
        if (passwordNoteRepository.existsByGuildSnowflakeAndPasswordKey(guildId, request.getPasswordKey())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "동일한 비밀번호로 저장된 컨텐츠가 있음");
        }

        if (request.getContent().length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "컨텐츠 2000자 제한오류");
        }

        PasswordNote note = new PasswordNote(guildId, request.getChannelSnowflake(), guild, request.getPasswordKey(),request.getContent());

        PasswordNote saved = passwordNoteRepository.save(note);
        return toDto(saved);
    }

    @Override
    public void delete(String guildId, String passwordKey) {
        PasswordNote note = passwordNoteRepository.findByGuildSnowflakeAndPasswordKey(guildId, passwordKey)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 패스워드 키로 등록된 컨텐츠가 없습니다."));

        passwordNoteRepository.delete(note);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PasswordNoteDto> findAllByGuildId(String guildId) {
        return passwordNoteRepository.findAllByGuildSnowflake(guildId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PasswordNoteDto findOne(String guildId, String passwordKey) {
        PasswordNote note = passwordNoteRepository.findByGuildSnowflakeAndPasswordKey(guildId, passwordKey)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호가 틀렸습니다"));
        return toDto(note);
    }

    @Override
    public PasswordNoteDto update(String guildId, PatchPasswordNoteRequestDto request) {
        Optional<PasswordNote> existingNote = passwordNoteRepository.findByGuildSnowflakeAndPasswordKey(guildId, request.getPasswordKey());
        if (existingNote.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "수정할 컨텐츠가 존재하지 않습니다.");
        }
        PasswordNote note = existingNote.get();
        if (!note.getId().equals(request.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 존재하는 비밀번호입니다.");
        }
        if (request.getContent().length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "컨텐츠 2000자 제한오류");
        }

        note.setContent(request.getContent());
        note.setChannelSnowflake(request.getChannelSnowflake());
        note.setPasswordKey(request.getPasswordKey());

        return toDto(note);
    }

    private PasswordNoteDto toDto(PasswordNote note) {
        return PasswordNoteDto.builder()
                .uuid(note.getId())
                .channelSnowflake(note.getChannelSnowflake())
                .passwordKey(note.getPasswordKey())
                .content(note.getContent())
                .build();
    }
}
