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
      if (
        isDropdownOpen &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };
    
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
