package com.crimecat.backend.chat.service;

import com.crimecat.backend.chat.domain.ChatServer;
import com.crimecat.backend.chat.domain.ServerMember;
import com.crimecat.backend.chat.dto.ServerDto;
import com.crimecat.backend.chat.repository.ChatServerRepository;
import com.crimecat.backend.chat.repository.ServerMemberRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.utils.AuthenticationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ServerService {

    private final ChatServerRepository chatServerRepository;
    private final ServerMemberRepository serverMemberRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 서버 생성
     */
    public ServerDto.Response createServer(ServerDto.CreateRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 사용자 존재 확인
        userRepository.findById(currentUserId)
                .orElseThrow(() -> ErrorStatus.USER_NOT_FOUND.asServiceException());

        // 서버 생성
        ChatServer server = ChatServer.builder()
                .name(request.getName())
                .description(request.getDescription())
                .passwordHash(request.getPassword() != null ? passwordEncoder.encode(request.getPassword()) : null)
                .maxMembers(request.getMaxMembers() != null ? request.getMaxMembers() : 100)
                .createdBy(currentUserId)
                .build();

        ChatServer savedServer = chatServerRepository.save(server);

        // 서버 소유자를 관리자로 추가
        ServerMember ownerMember = ServerMember.builder()
                .server(savedServer)
                .userId(currentUserId)
                .role(ServerMember.ServerRole.ADMIN)
                .build();
        
        serverMemberRepository.save(ownerMember);

        log.info("Created server: {} by user: {}", savedServer.getName(), currentUserId);

        return ServerDto.from(savedServer);
    }

    /**
     * 서버 입장 (비밀번호 검증)
     */
    public ServerDto.Response joinServer(UUID serverId, ServerDto.JoinRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 서버 조회
        ChatServer server = chatServerRepository.findById(serverId)
                .filter(ChatServer::getIsActive)
                .orElseThrow(() -> ErrorStatus.SERVER_NOT_FOUND.asServiceException());

        // 이미 멤버인지 확인
        boolean isAlreadyMember = serverMemberRepository.existsByServerIdAndUserIdAndIsActiveTrue(serverId, currentUserId);
        if (isAlreadyMember) {
            // 이미 멤버인 경우, 서버 정보를 정상적으로 반환
            log.info("User {} is already a member of server: {}", currentUserId, serverId);
            return ServerDto.from(server);
        }

        // 비밀번호 검증 (새로 가입하는 경우에만)
        if (server.getPasswordHash() != null) {
            if (request.getPassword() == null || 
                !passwordEncoder.matches(request.getPassword(), server.getPasswordHash())) {
                throw ErrorStatus.SERVER_PASSWORD_INCORRECT.asServiceException();
            }
        }

        // 최대 멤버 수 확인
        long currentMemberCount = serverMemberRepository.countByServerIdAndIsActiveTrue(serverId);
        if (currentMemberCount >= server.getMaxMembers()) {
            throw ErrorStatus.SERVER_MEMBER_LIMIT_EXCEEDED.asServiceException();
        }

        // 멤버 추가
        ServerMember member = ServerMember.builder()
                .server(server)
                .userId(currentUserId)
                .role(ServerMember.ServerRole.MEMBER)
                .build();
        
        serverMemberRepository.save(member);

        log.info("User {} joined server: {}", currentUserId, serverId);

        return ServerDto.from(server);
    }

    /**
     * 서버 탈퇴
     */
    public void leaveServer(UUID serverId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 서버 조회
        ChatServer server = chatServerRepository.findById(serverId)
                .filter(ChatServer::getIsActive)
                .orElseThrow(() -> ErrorStatus.SERVER_NOT_FOUND.asServiceException());

        // 서버 소유자는 탈퇴 불가
        if (server.isOwner(currentUserId)) {
            throw ErrorStatus.CANNOT_KICK_SERVER_OWNER.asServiceException();
        }

        // 멤버 조회 및 탈퇴 처리
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, currentUserId)
                .orElseThrow(() -> ErrorStatus.SERVER_NOT_MEMBER.asServiceException());

        member.softDelete();
        serverMemberRepository.save(member);

        log.info("User {} left server: {}", currentUserId, serverId);
    }

    /**
     * 서버 정보 조회
     */
    @Transactional(readOnly = true)
    public ServerDto.Response getServer(UUID serverId) {
        ChatServer server = chatServerRepository.findById(serverId)
                .filter(ChatServer::getIsActive)
                .orElseThrow(() -> ErrorStatus.SERVER_NOT_FOUND.asServiceException());

        return ServerDto.from(server);
    }

    /**
     * 사용자가 참여한 서버 목록 조회
     */
    @Transactional(readOnly = true)
    public List<ServerDto.Response> getUserServers() {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        List<ServerMember> members = serverMemberRepository.findByUserIdAndIsActiveTrue(currentUserId);
        return members.stream()
                .map(member -> ServerDto.from(member.getServer()))
                .collect(Collectors.toList());
    }

    /**
     * 공개 서버 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<ServerDto.Response> getPublicServers(Pageable pageable) {
        Page<ChatServer> servers = chatServerRepository.findPublicServers(pageable);
        return servers.map(ServerDto::from);
    }

    /**
     * 서버 정보 수정 (소유자만 가능)
     */
    public ServerDto.Response updateServer(UUID serverId, ServerDto.UpdateRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 서버 조회
        ChatServer server = chatServerRepository.findById(serverId)
                .filter(ChatServer::getIsActive)
                .orElseThrow(() -> ErrorStatus.SERVER_NOT_FOUND.asServiceException());

        // 소유자 권한 확인
        if (!server.isOwner(currentUserId)) {
            throw ErrorStatus.SERVER_ACCESS_DENIED.asServiceException();
        }

        // 비밀번호 변경
        String newPasswordHash = null;
        if (request.getPassword() != null) {
            newPasswordHash = passwordEncoder.encode(request.getPassword());
        }

        // 서버 정보 업데이트
        server.updateInfo(
            request.getName(),
            request.getDescription(),
            newPasswordHash,
            request.getMaxMembers()
        );

        ChatServer updatedServer = chatServerRepository.save(server);

        log.info("Updated server: {} by user: {}", serverId, currentUserId);

        return ServerDto.from(updatedServer);
    }

    /**
     * 서버 삭제 (소유자만 가능)
     */
    public void deleteServer(UUID serverId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 서버 조회
        ChatServer server = chatServerRepository.findById(serverId)
                .filter(ChatServer::getIsActive)
                .orElseThrow(() -> ErrorStatus.SERVER_NOT_FOUND.asServiceException());

        // 소유자 권한 확인
        if (!server.isOwner(currentUserId)) {
            throw ErrorStatus.SERVER_ACCESS_DENIED.asServiceException();
        }

        // 소프트 삭제
        server.softDelete();
        chatServerRepository.save(server);

        // 모든 멤버 비활성화
        List<ServerMember> members = serverMemberRepository.findByServerIdAndIsActiveTrue(serverId);
        members.forEach(ServerMember::softDelete);
        serverMemberRepository.saveAll(members);

        log.info("Deleted server: {} by user: {}", serverId, currentUserId);
    }

    /**
     * 멤버 추방 (관리자만 가능)
     */
    public void kickMember(UUID serverId, UUID targetUserId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 서버 조회
        ChatServer server = chatServerRepository.findById(serverId)
                .filter(ChatServer::getIsActive)
                .orElseThrow(() -> ErrorStatus.SERVER_NOT_FOUND.asServiceException());

        // 자기 자신 추방 방지
        if (currentUserId.equals(targetUserId)) {
            throw ErrorStatus.CANNOT_KICK_SELF.asServiceException();
        }

        // 서버 소유자 추방 방지
        if (server.isOwner(targetUserId)) {
            throw ErrorStatus.CANNOT_KICK_SERVER_OWNER.asServiceException();
        }

        // 관리자 권한 확인
        if (!hasKickPermission(serverId, currentUserId)) {
            throw ErrorStatus.INSUFFICIENT_PERMISSION.asServiceException();
        }

        // 대상 멤버 조회
        ServerMember targetMember = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, targetUserId)
                .orElseThrow(() -> ErrorStatus.MEMBER_NOT_FOUND.asServiceException());

        // 멤버 제거
        targetMember.softDelete();
        serverMemberRepository.save(targetMember);

        log.info("User {} kicked member {} from server: {}", currentUserId, targetUserId, serverId);
    }

    // === Private Helper Methods ===

    private boolean hasKickPermission(UUID serverId, UUID userId) {
        // 서버 소유자는 항상 가능
        ChatServer server = chatServerRepository.findById(serverId).orElse(null);
        if (server != null && server.isOwner(userId)) {
            return true;
        }

        // 관리자 권한 확인
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, userId)
                .orElse(null);
        
        return member != null && member.getRole() == ServerMember.ServerRole.ADMIN;
    }
}