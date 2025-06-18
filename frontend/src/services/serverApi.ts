import { apiClient } from '@/lib/api';
import { ServerInfo } from './websocketService';

export interface CreateServerRequest {
  name: string;
  description?: string;
  password?: string;
  maxMembers: number;
}

export interface JoinServerRequest {
  serverId: string;
  password?: string;
}

export interface ServerListResponse {
  content: ServerInfo[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ChannelInfo {
  id: string;
  name: string;
  description?: string;
  type: 'TEXT' | 'VOICE' | 'BOTH';
  memberCount: number;
  maxMembers: number;
  serverId: string;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
  type: 'TEXT' | 'VOICE' | 'BOTH';
  maxMembers?: number;
}

export interface ServerDetailResponse extends ServerInfo {
  channels?: ChannelInfo[];
}

class ServerApiService {
  // 공개 서버 목록 조회
  async getPublicServers(page = 0, size = 20, search?: string): Promise<ServerListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }

    return apiClient.get<ServerListResponse>(`/servers/public?${params}`);
  }

  // 내가 참여한 서버 목록 조회
  async getMyServers(): Promise<ServerInfo[]> {
    return apiClient.get<ServerInfo[]>('/servers/my');
  }

  // 서버 상세 정보 조회
  async getServerById(serverId: string): Promise<ServerDetailResponse> {
    return apiClient.get<ServerDetailResponse>(`/servers/${serverId}`);
  }

  // 서버 생성
  async createServer(serverData: CreateServerRequest): Promise<ServerInfo> {
    return apiClient.post<ServerInfo>('/servers', serverData);
  }

  // 서버 참가
  async joinServer(joinData: JoinServerRequest): Promise<{ success: boolean; message?: string }> {
    return apiClient.post<{ success: boolean; message?: string }>(`/servers/${joinData.serverId}/join`, {
      password: joinData.password
    });
  }

  // 서버 탈퇴
  async leaveServer(serverId: string): Promise<{ success: boolean; message?: string }> {
    return apiClient.post<{ success: boolean; message?: string }>(`/servers/${serverId}/leave`);
  }

  // 서버 검색
  async searchServers(query: string, page = 0, size = 20): Promise<ServerListResponse> {
    return this.getPublicServers(page, size, query);
  }

  // 서버 채널 목록 조회
  async getServerChannels(serverId: string): Promise<ChannelInfo[]> {
    return apiClient.get<ChannelInfo[]>(`/servers/${serverId}/channels`);
  }

  // 채널 생성
  async createChannel(serverId: string, channelData: CreateChannelRequest): Promise<ChannelInfo> {
    return apiClient.post<ChannelInfo>(`/servers/${serverId}/channels`, channelData);
  }

  // 서버의 기본 채널 조회
  async getDefaultChannel(serverId: string): Promise<ChannelInfo> {
    const channels = await this.getServerChannels(serverId);
    // 첫 번째 채널을 기본 채널로 사용하거나, TEXT 타입 중 첫 번째
    return channels.find(c => c.type === 'TEXT') || channels[0];
  }

  // 서버 멤버 목록 조회
  async getServerMembers(serverId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/servers/${serverId}/members`);
  }
}

export const serverApiService = new ServerApiService();
export default serverApiService;