import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useChat } from '../../hooks/useChat';

interface ChatInputProps {
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ className = '' }) => {
  const {
    currentServer,
    currentChannel,
    channels
  } = useAppStore();

  const { sendMessage, sendTyping } = useChat();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const currentChannelInfo = currentServer && currentChannel 
    ? channels[currentServer]?.find(c => c.id === currentChannel.channelId)
    : null;

  // 타이핑 상태 관리
  useEffect(() => {
    if (!currentServer || !currentChannel) return;

    if (message.trim() && !isTyping) {
      setIsTyping(true);
      sendTyping(currentServer, currentChannel.channelId, true);
    } else if (!message.trim() && isTyping) {
      setIsTyping(false);
      sendTyping(currentServer, currentChannel.channelId, false);
    }

    // 타이핑 타임아웃 관리
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (message.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (currentServer && currentChannel) {
          sendTyping(currentServer, currentChannel.channelId, false);
        }
      }, 3000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, currentServer, currentChannel, isTyping, sendTyping]);

  // 텍스트 영역 높이 자동 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentServer || !currentChannel) return;

    try {
      sendMessage(currentServer, currentChannel.channelId, message.trim());
      setMessage('');
      setIsTyping(false);
      sendTyping(currentServer, currentChannel.channelId, false);
      
      // 포커스 유지
      textareaRef.current?.focus();
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME 조합 중인지 확인 (한글 입력 처리)
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return; // 한글 조합 중이면 아무것도 하지 않음
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        // TODO: 파일 업로드 API 구현
        console.log('파일 업로드:', file.name);
        
        // 임시로 파일명을 메시지로 전송
        if (currentServer && currentChannel) {
          sendMessage(currentServer, currentChannel.channelId, `📎 ${file.name} (${formatFileSize(file.size)})`);
        }
      }
    } catch (error) {
      console.error('파일 업로드 실패:', error);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // 파일 입력 초기화
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!currentServer || !currentChannel) {
    return (
      <div className={`h-16 bg-gray-800 border-t border-gray-600 flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-sm">채널을 선택하여 메시지를 보내세요</div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 border-t border-gray-600 p-4 ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end space-x-3">
          {/* 파일 업로드 버튼 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-shrink-0 w-10 h-10 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-gray-400 hover:text-white disabled:text-gray-600 rounded-lg flex items-center justify-center transition-colors"
            title="파일 업로드"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>

          {/* 메시지 입력 영역 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${currentChannelInfo?.name || '채널'}에 메시지 보내기...`}
              rows={1}
              className="w-full px-4 py-3 pr-16 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />

            {/* 이모지 버튼 */}
            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-8 h-8 text-gray-400 hover:text-white rounded flex items-center justify-center transition-colors"
                title="이모지"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* GIF 버튼 */}
              <button
                type="button"
                className="w-8 h-8 text-gray-400 hover:text-white rounded flex items-center justify-center transition-colors"
                title="GIF"
              >
                <span className="text-xs font-bold">GIF</span>
              </button>
            </div>
          </div>

          {/* 전송 버튼 */}
          <button
            type="submit"
            disabled={!message.trim()}
            className="flex-shrink-0 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg flex items-center justify-center transition-colors"
            title="메시지 전송"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* 이모지 피커 */}
        {showEmojiPicker && (
          <EmojiPicker
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}

        {/* 파일 입력 (숨김) */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* 입력 제한 표시 */}
        <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
          <div className="flex space-x-4">
            <span>Enter로 전송, Shift+Enter로 줄바꿈</span>
            {isTyping && (
              <span className="text-green-400">입력 중...</span>
            )}
          </div>
          <div className={message.length > 1900 ? 'text-yellow-400' : ''}>
            {message.length}/2000
          </div>
        </div>
      </form>
    </div>
  );
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
    '👍', '👎', '👌', '🤞', '✌️', '🤟', '🤘', '👊', '✊', '🤛',
    '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕',
    '💖', '💗', '💘', '💝', '💞', '💟', '💔', '❣️', '💋', '💯'
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.emoji-picker')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="emoji-picker absolute bottom-full right-0 mb-2 w-80 h-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden">
      <div className="h-full flex flex-col">
        {/* 헤더 */}
        <div className="p-3 border-b border-gray-600 flex justify-between items-center">
          <h3 className="text-white text-sm font-medium">이모지 선택</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 이모지 그리드 */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-10 gap-1">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => onSelect(emoji)}
                className="w-8 h-8 text-lg hover:bg-gray-700 rounded flex items-center justify-center transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-2 border-t border-gray-600">
          <div className="flex space-x-1 justify-center">
            {['😀', '❤️', '👍', '🎉', '🔥', '💯'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSelect(emoji)}
                className="w-8 h-8 text-lg hover:bg-gray-700 rounded flex items-center justify-center transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};