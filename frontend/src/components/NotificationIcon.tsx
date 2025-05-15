import React, { useRef, useEffect } from 'react';
import { Bell, BellDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBadge } from '@/components/NotificationBadge';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { useNotification } from '@/hooks/useNotification';
import { useAuth } from '@/hooks/useAuth';

export const NotificationIcon: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const {
    notificationCount,
    isDropdownOpen,
    toggleDropdown,
    closeDropdown,
  } = useNotification();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isDropdownOpen) return;
      
      // Select가 열려있는지 확인
      const selectContent = document.querySelector('[data-radix-select-content]');
      if (selectContent) {
        return;
      }
      
      const target = event.target as Node;
      
      // 드롭다운이 존재하지 않는 경우 바로 닫기
      if (!dropdownRef.current || !buttonRef.current) {
        closeDropdown();
        return;
      }
      
      // 타겟이 드롭다운 내부에 있는지 심화 검사
      let currentElement = target as Element;
      let isInsideDropdown = false;
      
      // DOM 트리를 거슬로 올라가며 확인
      while (currentElement && currentElement !== document.body) {
        if (currentElement === dropdownRef.current) {
          isInsideDropdown = true;
          break;
        }
        // 드롭다운 별마다 현재 사용하는 클래스명도 확인
        if (currentElement.matches && currentElement.matches('.notification-dropdown')) {
          isInsideDropdown = true;
          break;
        }
        currentElement = currentElement.parentElement!;
      }
      
      // 버튼 자체나 드롭다운 내부에 있으면 닫지 않기
      if (currentElement === buttonRef.current || isInsideDropdown) {
        return;
      }
      
      closeDropdown();
    };
    
    // 지연 실행 (이벤트 전파 후에 실행)
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, closeDropdown]);
  
  // 로그인하지 않은 사용자에게는 보여주지 않음
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={toggleDropdown}
        className="relative"
        aria-label="알림"
      >
        {notificationCount > 0 ? <BellDot className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        <NotificationBadge count={notificationCount} />
      </Button>
      
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 z-50"
        >
          <NotificationDropdown onClose={closeDropdown} />
        </div>
      )}
    </div>
  );
};
