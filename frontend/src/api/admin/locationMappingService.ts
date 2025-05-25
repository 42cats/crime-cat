import api from '@/lib/api';

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
  getMappings: async (page: number = 0, size: number = 20) => {
    const response = await api.get<LocationMappingResponse>('/api/v1/admin/location-mappings', {
      params: { page, size },
    });
    return response.data;
  },

  // 지역 매핑 상세 조회
  getMapping: async (id: string) => {
    const response = await api.get<LocationMapping>(`/api/v1/admin/location-mappings/${id}`);
    return response.data;
  },

  // 지역 매핑 생성
  createMapping: async (data: LocationMappingRequest) => {
    const response = await api.post<LocationMapping>('/api/v1/admin/location-mappings', data);
    return response.data;
  },

  // 지역 매핑 수정
  updateMapping: async (id: string, data: LocationMappingRequest) => {
    const response = await api.put<LocationMapping>(`/api/v1/admin/location-mappings/${id}`, data);
    return response.data;
  },

  // 지역 매핑 삭제
  deleteMapping: async (id: string) => {
    await api.delete(`/api/v1/admin/location-mappings/${id}`);
  },
};