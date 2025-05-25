import { apiClient } from '@/lib/api';

export interface LocationMapping {
  id: string;
  keyword: string;
  normalized: string;
  relatedKeywords: string[];
  typoVariants: string[];
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationMappingRequest {
  keyword: string;
  normalized: string;
  relatedKeywords: string[];
  typoVariants: string[];
  isActive: boolean;
  description?: string;
}

export interface LocationMappingResponse {
  mappings: LocationMapping[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const locationMappingService = {
  // 지역 매핑 목록 조회
  getMappings: async (page: number = 0, size: number = 20, search?: string) => {
    const params: any = { page, size };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    return await apiClient.get<LocationMappingResponse>('/admin/location-mappings', {
      params,
    });
  },

  // 지역 매핑 상세 조회
  getMapping: async (id: string) => {
    return await apiClient.get<LocationMapping>(`/admin/location-mappings/${id}`);
  },

  // 지역 매핑 생성
  createMapping: async (data: LocationMappingRequest) => {
    return await apiClient.post<LocationMapping>('/admin/location-mappings', data);
  },

  // 지역 매핑 수정
  updateMapping: async (id: string, data: LocationMappingRequest) => {
    return await apiClient.put<LocationMapping>(`/admin/location-mappings/${id}`, data);
  },

  // 지역 매핑 삭제
  deleteMapping: async (id: string) => {
    await apiClient.delete(`/admin/location-mappings/${id}`);
  },
};