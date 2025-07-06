import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Music, Youtube, Volume2, Clock } from 'lucide-react';
import { musicApi, LocalMusicFile, YouTubeTrack } from '@/lib/api/music';

interface MusicSelection {
    trackId: string;
    source: 'youtube' | 'local';
    title: string;
    duration?: string;
    thumbnail?: string;
}

interface MusicSelectorProps {
    guildId: string;
    userId?: string;
    value?: MusicSelection;
    onChange?: (selection: MusicSelection) => void;
    placeholder?: string;
}

export const MusicSelector: React.FC<MusicSelectorProps> = ({
    guildId,
    userId,
    value,
    onChange,
    placeholder = "음악을 선택하세요"
}) => {
    const [source, setSource] = useState<'youtube' | 'local'>(value?.source || 'youtube');

    // YouTube 트랙 조회
    const { data: youtubeTracks, isLoading: isLoadingYoutube } = useQuery({
        queryKey: ['youtube-tracks', guildId],
        queryFn: () => musicApi.getYouTubeTracks(guildId),
        staleTime: 5 * 60 * 1000, // 5분 캐시
    });

    // 로컬 파일 조회
    const { data: localFiles, isLoading: isLoadingLocal } = useQuery({
        queryKey: ['local-files', guildId, userId],
        queryFn: () => {
            console.log('🎵 로컬 음악 API 호출:', { guildId, userId, source });
            return musicApi.getLocalFiles(guildId, userId || '');
        },
        enabled: !!userId && source === 'local',
        staleTime: 5 * 60 * 1000, // 5분 캐시
    });

    // 소스 변경 시 값 초기화
    useEffect(() => {
        if (value?.source !== source) {
            onChange?.(undefined as any);
        }
    }, [source]);

    // 현재 선택된 소스의 트랙 목록
    const tracks = source === 'youtube' ? youtubeTracks : localFiles;
    const isLoading = source === 'youtube' ? isLoadingYoutube : isLoadingLocal;

    // 선택 처리
    const handleSelection = (trackId: string) => {
        console.log('선택된 trackId:', trackId);
        console.log('현재 tracks:', tracks);
        
        const track = tracks?.find(track => track.id === trackId);
        
        if (track) {
            console.log('선택된 track:', track);
            const selection: MusicSelection = {
                trackId: track.id,
                source,
                title: track.title,
                duration: track.duration,
                thumbnail: source === 'youtube' ? (track as YouTubeTrack).thumbnail : undefined
            };
            console.log('생성된 selection:', selection);
            onChange?.(selection);
        } else {
            console.error('트랙을 찾을 수 없습니다:', trackId);
        }
    };

    // 파일 크기 포맷팅
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            <Tabs value={source} onValueChange={(value) => setSource(value as 'youtube' | 'local')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="youtube" className="flex items-center gap-2">
                        <Youtube className="w-4 h-4" />
                        YouTube
                        {youtubeTracks && (
                            <Badge variant="secondary" className="ml-1">
                                {youtubeTracks.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="local" className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        로컬 파일
                        {localFiles && (
                            <Badge variant="secondary" className="ml-1">
                                {localFiles.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={source} className="mt-4">
                    <Select 
                        value={value?.trackId || ''} 
                        onValueChange={handleSelection}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={
                                isLoading 
                                    ? `${source === 'youtube' ? 'YouTube' : '로컬'} 음악을 불러오는 중...`
                                    : placeholder
                            } />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {tracks?.map((track, index) => {
                                return (
                                    <SelectItem key={track.id} value={track.id}>
                                        <div className="flex items-center gap-3 py-2 w-full">
                                            {/* 썸네일 또는 아이콘 */}
                                            <div className="flex-shrink-0">
                                                {source === 'youtube' && (track as YouTubeTrack).thumbnail ? (
                                                    <img 
                                                        src={(track as YouTubeTrack).thumbnail} 
                                                        alt={track.title}
                                                        className="w-10 h-10 rounded object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
                                                        {source === 'youtube' ? (
                                                            <Youtube className="w-5 h-5 text-red-500" />
                                                        ) : (
                                                            <Music className="w-5 h-5 text-blue-500" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 트랙 정보 */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate text-sm">
                                                    {track.title}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    {track.duration && track.duration !== '00:00' && (
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {track.duration}
                                                        </div>
                                                    )}
                                                    {source === 'local' && (track as LocalMusicFile).size > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <Volume2 className="w-3 h-3" />
                                                            {formatFileSize((track as LocalMusicFile).size)}
                                                        </div>
                                                    )}
                                                    {source === 'local' && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {(track as LocalMusicFile).extension?.toUpperCase()}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>

                    {/* 빈 상태 메시지 */}
                    {!isLoading && tracks?.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <div className="mb-2">
                                {source === 'youtube' ? (
                                    <Youtube className="w-12 h-12 mx-auto text-gray-300" />
                                ) : (
                                    <Music className="w-12 h-12 mx-auto text-gray-300" />
                                )}
                            </div>
                            <div className="text-sm">
                                {source === 'youtube' 
                                    ? '등록된 YouTube 음악이 없습니다.'
                                    : '로컬 음악 파일이 없습니다.'
                                }
                            </div>
                            {source === 'local' && !userId && (
                                <div className="text-xs text-gray-400 mt-1">
                                    사용자 ID가 필요합니다.
                                </div>
                            )}
                        </div>
                    )}

                    {/* 선택된 음악 정보 표시 */}
                    {value && value.source === source && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="flex items-center gap-1 text-blue-600">
                                    {source === 'youtube' ? <Youtube className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                                    <span className="font-medium">선택됨:</span>
                                </div>
                                <span className="text-gray-700">{value.title}</span>
                                {value.duration && value.duration !== '00:00' && (
                                    <Badge variant="secondary" className="text-xs">
                                        {value.duration}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};