import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import EscapeRoomSearchHeader from '@/components/escape-room/list/EscapeRoomSearchHeader';
import EscapeRoomThemeGrid from '@/components/escape-room/list/EscapeRoomThemeGrid';
import { EscapeRoomLocation } from '@/lib/types';

interface EscapeRoomTheme {
    id: string;
    title: string;
    description: string;
    difficulty: number;
    minParticipants: number;
    maxParticipants: number;
    estimatedDuration: number;
    price: number;
    genreTags: string[];
    locations: EscapeRoomLocation[];
    thumbnail?: string;
    isActive: boolean;
    allowComments: boolean;
    allowGameHistory: boolean;
    homepageUrl?: string;
    reservationUrl?: string;
    createdAt: string;
    updatedAt: string;
    views?: number;
    commentCount?: number;
    gameHistoryCount?: number;
    averageRating?: number;
}

interface SearchFilters {
    query: string;
    difficulty: number[];
    priceRange: [number, number];
    participantRange: [number, number];
    durationRange: [number, number];
    genreTags: string[];
    location: string;
    sortBy: 'newest' | 'oldest' | 'popularity' | 'rating' | 'price_low' | 'price_high';
}

interface ApiResponse {
    themes: EscapeRoomTheme[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
}

const EscapeRoomListPage: React.FC = () => {
    const navigate = useNavigate();
    const [themes, setThemes] = useState<EscapeRoomTheme[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [canCreateTheme, setCanCreateTheme] = useState(false);
    
    const pageSize = 12;

    const [filters, setFilters] = useState<SearchFilters>({
        query: '',
        difficulty: [],
        priceRange: [0, 100000],
        participantRange: [1, 20],
        durationRange: [15, 180],
        genreTags: [],
        location: '',
        sortBy: 'newest'
    });

    // Mock data for demonstration
    const mockThemes: EscapeRoomTheme[] = [
        {
            id: '1',
            title: '미스터리 하우스: 사라진 상속자',
            description: '100년 된 저택에서 사라진 상속자의 비밀을 찾아라. 오래된 가족의 비밀과 숨겨진 유언장이 당신을 기다리고 있다.',
            difficulty: 4,
            minParticipants: 3,
            maxParticipants: 6,
            estimatedDuration: 75,
            price: 28000,
            genreTags: ['미스터리', '호러', '추리'],
            locations: [
                {
                    id: '1',
                    name: '강남 이스케이프룸',
                    roadAddress: '서울특별시 강남구 테헤란로 123',
                    jibunAddress: '서울특별시 강남구 역삼동 123-45',
                    x: '127.0276',
                    y: '37.4979',
                    phone: '02-1234-5678'
                }
            ],
            thumbnail: '/content/image/default_bar2.png',
            isActive: true,
            allowComments: true,
            allowGameHistory: true,
            homepageUrl: 'https://escape-room-gangnam.com',
            reservationUrl: 'https://booking.escape-room-gangnam.com/reserve',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
            views: 1250,
            commentCount: 23,
            gameHistoryCount: 87,
            averageRating: 4.2
        },
        {
            id: '2',
            title: '좀비 아포칼립스: 최후의 생존자',
            description: '좀비가 점령한 도시에서 탈출하라! 제한된 시간 안에 백신을 찾고 안전 구역으로 대피해야 한다.',
            difficulty: 5,
            minParticipants: 4,
            maxParticipants: 8,
            estimatedDuration: 90,
            price: 35000,
            genreTags: ['호러', '액션', '스릴러'],
            locations: [
                {
                    id: '2',
                    name: '홍대 어드벤처룸',
                    roadAddress: '서울특별시 마포구 홍익로 45',
                    jibunAddress: '서울특별시 마포구 홍대동 45-12',
                    x: '126.9223',
                    y: '37.5563',
                    phone: '02-2234-5678'
                }
            ],
            thumbnail: '/content/image/default_bar2.png',
            isActive: true,
            allowComments: true,
            allowGameHistory: true,
            homepageUrl: 'https://hongdae-adventure.co.kr',
            reservationUrl: 'https://naver.me/hongdae-adventure-booking',
            createdAt: '2024-01-20T14:30:00Z',
            updatedAt: '2024-01-20T14:30:00Z',
            views: 890,
            commentCount: 34,
            gameHistoryCount: 124,
            averageRating: 4.6
        },
        {
            id: '3',
            title: '해적선의 보물: 블랙펄의 저주',
            description: '저주받은 해적선에서 전설의 보물을 찾아라. 선장의 수수께끼를 풀고 함정을 피해 보물을 차지하라.',
            difficulty: 3,
            minParticipants: 2,
            maxParticipants: 5,
            estimatedDuration: 60,
            price: 22000,
            genreTags: ['어드벤처', '판타지', '퍼즐'],
            locations: [
                {
                    id: '3',
                    name: '부산 트레저룸',
                    roadAddress: '부산광역시 해운대구 해운대해변로 100',
                    jibunAddress: '부산광역시 해운대구 우동 100-1',
                    x: '129.1603',
                    y: '35.1595',
                    phone: '051-1234-5678'
                }
            ],
            thumbnail: '/content/image/default_bar2.png',
            isActive: true,
            allowComments: true,
            allowGameHistory: true,
            reservationUrl: 'https://booking.naver.com/busan-treasure-room',
            createdAt: '2024-02-01T09:00:00Z',
            updatedAt: '2024-02-01T09:00:00Z',
            views: 2100,
            commentCount: 45,
            gameHistoryCount: 203,
            averageRating: 4.1
        }
    ];

    // API 호출 시뮬레이션
    const fetchThemes = async () => {
        setIsLoading(true);
        
        // 실제 API 호출로 대체될 부분
        setTimeout(() => {
            // 필터링 로직 시뮬레이션
            let filteredThemes = mockThemes;
            
            if (filters.query) {
                const query = filters.query.toLowerCase();
                filteredThemes = filteredThemes.filter(theme =>
                    theme.title.toLowerCase().includes(query) ||
                    theme.description.toLowerCase().includes(query) ||
                    theme.genreTags.some(tag => tag.toLowerCase().includes(query)) ||
                    theme.locations.some(loc => loc.name.toLowerCase().includes(query))
                );
            }
            
            if (filters.difficulty.length > 0) {
                filteredThemes = filteredThemes.filter(theme =>
                    filters.difficulty.includes(theme.difficulty)
                );
            }
            
            if (filters.genreTags.length > 0) {
                filteredThemes = filteredThemes.filter(theme =>
                    filters.genreTags.some(tag => theme.genreTags.includes(tag))
                );
            }
            
            // 정렬
            switch (filters.sortBy) {
                case 'newest':
                    filteredThemes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    break;
                case 'oldest':
                    filteredThemes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    break;
                case 'popularity':
                    filteredThemes.sort((a, b) => (b.views || 0) - (a.views || 0));
                    break;
                case 'rating':
                    filteredThemes.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                    break;
                case 'price_low':
                    filteredThemes.sort((a, b) => a.price - b.price);
                    break;
                case 'price_high':
                    filteredThemes.sort((a, b) => b.price - a.price);
                    break;
            }
            
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedThemes = filteredThemes.slice(startIndex, endIndex);
            
            setThemes(paginatedThemes);
            setTotalCount(filteredThemes.length);
            setTotalPages(Math.ceil(filteredThemes.length / pageSize));
            setCanCreateTheme(true); // 권한 체크 로직으로 대체될 부분
            setIsLoading(false);
        }, 500);
    };

    useEffect(() => {
        fetchThemes();
    }, [filters, currentPage]);

    const handleFiltersChange = (newFilters: SearchFilters) => {
        setFilters(newFilters);
        setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
    };

    const handleCreateTheme = () => {
        navigate('/escape-room/create');
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* 검색 헤더 */}
            <EscapeRoomSearchHeader
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onCreateTheme={handleCreateTheme}
                canCreateTheme={canCreateTheme}
                totalCount={totalCount}
                isLoading={isLoading}
            />

            {/* 테마 그리드 */}
            <div className="mt-8">
                <EscapeRoomThemeGrid
                    themes={themes}
                    isLoading={isLoading}
                    pageSize={pageSize}
                    onCreateTheme={handleCreateTheme}
                    canCreateTheme={canCreateTheme}
                />
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && !isLoading && (
                <div className="mt-12 flex justify-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        showFirstLast
                        showPrevNext
                    />
                </div>
            )}

            {/* 하단 안내 */}
            {!isLoading && themes.length > 0 && (
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>
                        {currentPage}페이지 / 총 {totalPages}페이지
                        ({totalCount}개 테마 중 {Math.min((currentPage - 1) * pageSize + 1, totalCount)}-{Math.min(currentPage * pageSize, totalCount)}번째)
                    </p>
                </div>
            )}
        </div>
    );
};

export default EscapeRoomListPage;