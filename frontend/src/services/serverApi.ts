import { apiClient } from '@/lib/api';
import { ServerInfo } from './websocketService';

export interface CreateServerRequest {
  name: string;
  description?: string;
  password?: string;
  maxMembers: number;
}

export interface JoinServerRequest {
  serverId: number;
  password?: string;
}

export interface ServerListResponse {
  content: ServerInfo[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ServerDetailResponse extends ServerInfo {
  channels?: {
    id: number;
    name: string;
    description?: string;
    type: 'TEXT' | 'VOICE' | 'BOTH';
    memberCount: number;
    maxMembers: number;
  }[];
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
  async getServerById(serverId: number): Promise<ServerDetailResponse> {
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
  async leaveServer(serverId: number): Promise<{ success: boolean; message?: string }> {
    return apiClient.post<{ success: boolean; message?: string }>(`/servers/${serverId}/leave`);
  }

  // 서버 검색
  async searchServers(query: string, page = 0, size = 20): Promise<ServerListResponse> {
    return this.getPublicServers(page, size, query);
  }
}

export const serverApiService = new ServerApiService();
export default serverApiService;