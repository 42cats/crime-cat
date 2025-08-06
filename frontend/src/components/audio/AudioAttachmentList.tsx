import React, { useState, useEffect } from "react";
import { Music, Shield, Download, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SmartAudioPlayer from "./SmartAudioPlayer";

interface AudioAttachment {
  id: string;
  originalFilename: string;
  audioTitle: string;
  fileSize: number;
  durationSeconds?: number;
  accessPolicy: 'PRIVATE' | 'PUBLIC';
  sortOrder: number;
  streamingUrl: string;
  createdAt: string;
}

interface AudioAttachmentListProps {
  postId: string;
  editable?: boolean;
  onUpdate?: () => void;
}

/**
 * 게시글의 오디오 첨부파일 목록 컴포넌트
 * - 역할별 표시 제어
 * - 재생 및 관리 기능
 */
const AudioAttachmentList: React.FC<AudioAttachmentListProps> = ({
  postId,
  editable = false,
  onUpdate
}) => {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<AudioAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 첨부파일 목록 조회
  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/board/audio/attachments/${postId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('첨부파일을 불러올 수 없습니다.');
      }

      const data = await response.json();
      setAttachments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [postId]);

  // 첨부파일 삭제
  const handleDelete = async (attachmentId: string) => {
    if (!confirm('이 오디오 파일을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/v1/board/audio/attachment/${attachmentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.');
      }

      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      onUpdate?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 접근 가능 여부 확인
  const isAccessible = (attachment: AudioAttachment) => {
    if (attachment.accessPolicy === 'PUBLIC') return true;
    return !!user; // PRIVATE는 로그인된 사용자만
  };

  // 편집 권한 확인
  const canEdit = () => {
    return editable && user && (user.role === 'ADMIN' || user.role === 'MANAGER');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchAttachments}
          className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (attachments.length === 0) {
    return null; // 첨부파일이 없으면 아무것도 표시하지 않음
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Music className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">오디오 첨부파일</h3>
        <span className="text-sm text-gray-500">({attachments.length}개)</span>
      </div>

      {attachments.map((attachment) => {
        const accessible = isAccessible(attachment);
        
        return (
          <div
            key={attachment.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            {/* 첨부파일 정보 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {attachment.audioTitle}
                  </h4>
                  {attachment.accessPolicy === 'PRIVATE' && (
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4 text-amber-500" />
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        비공개
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{attachment.originalFilename}</span>
                  <span>{formatFileSize(attachment.fileSize)}</span>
                  {attachment.durationSeconds && (
                    <span>
                      {Math.floor(attachment.durationSeconds / 60)}:
                      {(attachment.durationSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>

              {/* 관리 버튼 */}
              {canEdit() && (
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 오디오 플레이어 */}
            {accessible ? (
              <SmartAudioPlayer
                src={attachment.streamingUrl}
                title={attachment.audioTitle}
                isPrivate={attachment.accessPolicy === 'PRIVATE'}
                duration={attachment.durationSeconds}
              />
            ) : (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
                <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  이 오디오는 로그인이 필요합니다.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AudioAttachmentList;